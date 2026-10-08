const fs = require('fs');

let content = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

// Replace standard colors
content = content.replace(/bg-slate-800/g, 'bg-slate-50 dark:bg-slate-900');
content = content.replace(/bg-\[#323232\]/g, 'bg-slate-100 dark:bg-[#323232]');
content = content.replace(/bg-\[#3a3a3a\]/g, 'bg-white dark:bg-[#3a3a3a]');
content = content.replace(/bg-\[#2b2b2b\]/g, 'bg-blue-50 dark:bg-[#2b2b2b]');
content = content.replace(/bg-\[#404040\]/g, 'bg-slate-200 dark:bg-[#404040]');
content = content.replace(/bg-\[#454545\]/g, 'bg-slate-100 dark:bg-[#454545]');

// Replace borders
content = content.replace(/border-\[#404040\]/g, 'border-slate-200 dark:border-[#404040]');
content = content.replace(/border-\[#454545\]/g, 'border-slate-200 dark:border-[#454545]');
content = content.replace(/border-\[#2b2b2b\]/g, 'border-slate-200 dark:border-[#2b2b2b]');

// Replace text colors
content = content.replace(/text-white/g, 'text-slate-900 dark:text-white');
content = content.replace(/text-slate-300/g, 'text-slate-600 dark:text-slate-300');
content = content.replace(/text-slate-400/g, 'text-slate-500 dark:text-slate-400');

// Replace hover states
content = content.replace(/hover:bg-\[#3a3a3a\]/g, 'hover:bg-slate-200 dark:hover:bg-[#3a3a3a]');
content = content.replace(/hover:bg-\[#404040\]/g, 'hover:bg-slate-200 dark:hover:bg-[#404040]');
content = content.replace(/hover:bg-\[#454545\]/g, 'hover:bg-slate-100 dark:hover:bg-[#454545]');
content = content.replace(/hover:text-slate-200/g, 'hover:text-slate-900 dark:hover:text-slate-200');
content = content.replace(/hover:text-white/g, 'hover:text-slate-900 dark:hover:text-white');

fs.writeFileSync('src/components/Sidebar.tsx', content);
