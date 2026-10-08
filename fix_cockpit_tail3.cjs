const fs = require('fs');
let content = fs.readFileSync('src/components/LiveMonitoringCockpit.tsx', 'utf8');

const widgetHtml = `      {isAdvisorOpen && (
        <MigrationAdvisorWidget 
          activeJob={activeJob} 
          onClose={() => setIsAdvisorOpen(false)} 
        />
      )}`;

content = content.replace(/    <\/div>\n  \);\n};\n?$/, widgetHtml + "\n    </div>\n  );\n};\n");

fs.writeFileSync('src/components/LiveMonitoringCockpit.tsx', content);
