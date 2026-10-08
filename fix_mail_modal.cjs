const fs = require('fs');
let content = fs.readFileSync('src/components/mailboxes/MailMigrationWizardModal.tsx', 'utf8');

// Replace backgrounds
content = content.replace(/bg-\[#161821\]/g, 'bg-white dark:bg-[#161821]');
content = content.replace(/bg-\[#1e222d\]/g, 'bg-slate-50 dark:bg-[#1e222d]');
content = content.replace(/bg-\[#222736\]/g, 'bg-blue-50 dark:bg-[#222736]');
content = content.replace(/bg-\[#181b24\]/g, 'bg-white dark:bg-[#181b24]');

// Text colors
content = content.replace(/text-white/g, 'text-slate-900 dark:text-white');
content = content.replace(/text-slate-300/g, 'text-slate-600 dark:text-slate-300');
content = content.replace(/text-slate-400/g, 'text-slate-500 dark:text-slate-400');

// Fix border colors
content = content.replace(/border-slate-700/g, 'border-slate-300 dark:border-slate-700');
content = content.replace(/border-slate-800/g, 'border-slate-200 dark:border-slate-800');

fs.writeFileSync('src/components/mailboxes/MailMigrationWizardModal.tsx', content);
