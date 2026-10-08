const fs = require('fs');
let content = fs.readFileSync('src/components/LiveMonitoringCockpit.tsx', 'utf8');

const advisorImport = `import { MigrationAdvisorWidget } from './advisor/MigrationAdvisorWidget';\n`;
if (!content.includes('MigrationAdvisorWidget')) {
    content = content.replace("import { MigrationJob, UserMigrationStatus, AdminRole } from '../types';", advisorImport + "import { MigrationJob, UserMigrationStatus, AdminRole } from '../types';");
}

if (!content.includes('isAdvisorOpen')) {
    content = content.replace(
        "const [selectedFailedUsers, setSelectedFailedUsers] = useState<Set<string>>(new Set());",
        "const [selectedFailedUsers, setSelectedFailedUsers] = useState<Set<string>>(new Set());\n  const [isAdvisorOpen, setIsAdvisorOpen] = useState(false);"
    );
}

const buttonHtml = `
            {/* AI Advisor Button */}
            <button
              onClick={() => setIsAdvisorOpen(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 shadow-sm transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Migration Advisor</span>
            </button>
            {/* Export Activity Logs as CSV */}
`;
if (!content.includes('Migration Advisor')) {
    content = content.replace("{/* Export Activity Logs as CSV */}", buttonHtml);
}

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
