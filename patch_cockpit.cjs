const fs = require('fs');

let content = fs.readFileSync('src/components/LiveMonitoringCockpit.tsx', 'utf8');

// Add import
const advisorImport = `import { MigrationAdvisorWidget } from './advisor/MigrationAdvisorWidget';\n`;
if (!content.includes('MigrationAdvisorWidget')) {
    content = content.replace("import { MigrationJob, UserMigrationStatus, AdminRole } from '../types';", advisorImport + "import { MigrationJob, UserMigrationStatus, AdminRole } from '../types';");
}

// Add state
if (!content.includes('isAdvisorOpen')) {
    content = content.replace(
        "const [selectedFailedUsers, setSelectedFailedUsers] = useState<Set<string>>(new Set());",
        "const [selectedFailedUsers, setSelectedFailedUsers] = useState<Set<string>>(new Set());\n  const [isAdvisorOpen, setIsAdvisorOpen] = useState(false);"
    );
}

// Add button near the top action buttons
const buttonHtml = `
            {/* AI Advisor Button */}
            <button
              onClick={() => setIsAdvisorOpen(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 rounded-lg text-sm font-semibold shadow-sm transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              <span>Migration Advisor</span>
            </button>
            <button
              onClick={handleExportLogs}
`;
if (!content.includes('Migration Advisor')) {
    content = content.replace("<button\n              onClick={handleExportLogs}", buttonHtml);
}

// Add widget at the end of the return statement
const widgetHtml = `
      {isAdvisorOpen && (
        <MigrationAdvisorWidget 
          activeJob={activeJob} 
          onClose={() => setIsAdvisorOpen(false)} 
        />
      )}
    </div>
  );
`;
content = content.replace(/    <\/div>\n  \);\n};\n?$/, widgetHtml + "};\n");

fs.writeFileSync('src/components/LiveMonitoringCockpit.tsx', content);
