const fs = require('fs');

let content = fs.readFileSync('src/components/LiveMonitoringCockpit.tsx', 'utf8');

// Remove the AI Advisor button from cockpit
content = content.replace(/\{\/\* AI Advisor Button \*\/\}\s*<button[\s\S]*?<\/button>\s*\{\/\* Export Activity Logs as CSV \*\/\}/g, '{/* Export Activity Logs as CSV */}');

// Remove the widget from cockpit
content = content.replace(/\{isAdvisorOpen && \([\s\S]*?\}\)\}/g, '');
// Remove state
content = content.replace(/const \[isAdvisorOpen, setIsAdvisorOpen\] = useState\(false\);\s*/g, '');
// Remove import
content = content.replace(/import \{ MigrationAdvisorWidget \} from '\.\/advisor\/MigrationAdvisorWidget';\n/g, '');

fs.writeFileSync('src/components/LiveMonitoringCockpit.tsx', content);
