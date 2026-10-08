const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Imports
if (!content.includes('import { Sparkles')) {
    content = content.replace("import { Sun, Moon } from 'lucide-react';", "import { Sun, Moon, Sparkles } from 'lucide-react';");
}
if (!content.includes('MigrationAdvisorWidget')) {
    content = content.replace("import { MigrationToolDashboard } from './components/dashboard/MigrationToolDashboard';", "import { MigrationToolDashboard } from './components/dashboard/MigrationToolDashboard';\nimport { MigrationAdvisorWidget } from './components/advisor/MigrationAdvisorWidget';");
}

// State
if (!content.includes('const [isAdvisorOpen, setIsAdvisorOpen] = useState(false);')) {
    content = content.replace(
        "const [activeJob, setActiveJob] = useState<MigrationJob | null>(null);",
        "const [activeJob, setActiveJob] = useState<MigrationJob | null>(null);\n  const [isAdvisorOpen, setIsAdvisorOpen] = useState(false);"
    );
}

// Render FAB and Widget
const fabHtml = `
      {/* Global AI Advisor FAB */}
      <button
        onClick={() => setIsAdvisorOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full p-4 shadow-xl hover:shadow-2xl hover:scale-105 transition-all flex items-center justify-center group"
      >
        <Sparkles className="w-6 h-6 group-hover:animate-pulse" />
        <span className="absolute right-full mr-4 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity shadow-lg">
          AI Migration Advisor
        </span>
      </button>

      {/* Advisor Slide-out Widget */}
      {isAdvisorOpen && (
        <MigrationAdvisorWidget 
          activeJob={activeJob} 
          onClose={() => setIsAdvisorOpen(false)} 
        />
      )}
`;

if (!content.includes('Global AI Advisor FAB')) {
    content = content.replace("</div>\n    </div>\n  );\n}", fabHtml + "      </div>\n    </div>\n  );\n}");
}

fs.writeFileSync('src/App.tsx', content);
