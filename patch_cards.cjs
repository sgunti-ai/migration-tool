const fs = require('fs');

let content = fs.readFileSync('src/components/dashboard/MigrationToolDashboard.tsx', 'utf8');

content = content.replace(
  'id="card-total-users"\n            className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-slate-200 dark:border-slate-700 transition-all flex flex-col justify-between shadow-sm"',
  'id="card-total-users"\n            onClick={() => onNavigateTab && onNavigateTab(\'discovery\')}\n            className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-slate-200 dark:border-slate-700 transition-all flex flex-col justify-between shadow-sm cursor-pointer"'
);

content = content.replace(
  'id="card-active-migrations"\n            className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-blue-500/30 hover:border-blue-500/50 transition-all flex flex-col justify-between shadow-sm bg-gradient-to-br from-blue-950/20 to-slate-900/80"',
  'id="card-active-migrations"\n            onClick={() => onNavigateTab && onNavigateTab(\'migrate\', \'projects\')}\n            className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-blue-500/30 hover:border-blue-500/50 transition-all flex flex-col justify-between shadow-sm bg-gradient-to-br from-blue-950/20 to-slate-900/80 cursor-pointer"'
);

content = content.replace(
  'id="card-completed-migrations"\n            className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-slate-200 dark:border-slate-700 transition-all flex flex-col justify-between shadow-sm"',
  'id="card-completed-migrations"\n            onClick={() => onNavigateTab && onNavigateTab(\'reports\')}\n            className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-slate-200 dark:border-slate-700 transition-all flex flex-col justify-between shadow-sm cursor-pointer"'
);

content = content.replace(
  'id="card-failed-migrations"\n            className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-rose-500/40 transition-all flex flex-col justify-between shadow-sm"',
  'id="card-failed-migrations"\n            onClick={() => onNavigateTab && onNavigateTab(\'recover\')}\n            className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-rose-500/40 transition-all flex flex-col justify-between shadow-sm cursor-pointer"'
);

content = content.replace(
  'id="card-data-transferred"\n            className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-slate-200 dark:border-slate-700 transition-all flex flex-col justify-between shadow-sm"',
  'id="card-data-transferred"\n            onClick={() => onNavigateTab && onNavigateTab(\'reports\')}\n            className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-slate-200 dark:border-slate-700 transition-all flex flex-col justify-between shadow-sm cursor-pointer"'
);

content = content.replace(
  'id="card-success-rate"\n            className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-slate-200 dark:border-slate-700 transition-all flex flex-col justify-between shadow-sm"',
  'id="card-success-rate"\n            onClick={() => onNavigateTab && onNavigateTab(\'reports\')}\n            className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-slate-200 dark:border-slate-700 transition-all flex flex-col justify-between shadow-sm cursor-pointer"'
);

fs.writeFileSync('src/components/dashboard/MigrationToolDashboard.tsx', content);
