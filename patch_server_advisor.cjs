const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf8');

const importGenAI = `import { GoogleGenAI } from '@google/genai';\n`;
if (!content.includes('GoogleGenAI')) {
    content = content.replace("import express from 'express';", importGenAI + "import express from 'express';");
}

const advisorEndpoint = `
  // --- AI ADVISOR ENDPOINT ---
  app.post('/api/advisor', requireRole(['GLOBAL_ADMIN', 'MIGRATION_OPERATOR']), async (req, res) => {
    try {
      const { jobContext, errorLogs } = req.body;
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(503).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
      }

      const ai = new GoogleGenAI({ apiKey });

      const prompt = \`
You are an expert M365 Tenant Migration Advisor.
Analyze the following migration job context and error logs, and provide context-aware suggestions for troubleshooting and optimization.

Migration Context:
\${JSON.stringify(jobContext, null, 2)}

Recent Error Logs:
\${JSON.stringify(errorLogs, null, 2)}

Provide your response in a clean, professional format (markdown supported) with specific, actionable steps.
\`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      res.json({ suggestion: response.text });
    } catch (err: any) {
      console.error('Advisor API Error:', err);
      res.status(500).json({ error: err.message || 'Failed to generate advice' });
    }
  });
`;

if (!content.includes('/api/advisor')) {
    content = content.replace("app.post('/api/jobs',", advisorEndpoint + "\n  app.post('/api/jobs',");
}

fs.writeFileSync('server.ts', content);
