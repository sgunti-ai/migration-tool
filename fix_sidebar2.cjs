const fs = require('fs');

let content = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

// Fix the hover:bg-white dark:bg-[#3a3a3a] mistake
content = content.replace(/hover:bg-white dark:bg-\[#3a3a3a\]/g, 'hover:bg-slate-200 dark:hover:bg-[#3a3a3a]');
content = content.replace(/hover:bg-slate-200 dark:bg-\[#404040\]/g, 'hover:bg-slate-200 dark:hover:bg-[#404040]');
content = content.replace(/hover:bg-slate-100 dark:bg-\[#454545\]/g, 'hover:bg-slate-100 dark:hover:bg-[#454545]');

// Also fix group-hover:bg-... if they exist
content = content.replace(/group-hover:bg-white dark:bg-\[#3a3a3a\]/g, 'group-hover:bg-slate-200 dark:group-hover:bg-[#3a3a3a]');
content = content.replace(/group-hover:text-slate-900 dark:hover:text-slate-200/g, 'group-hover:text-slate-900 dark:group-hover:text-slate-200');

fs.writeFileSync('src/components/Sidebar.tsx', content);
