const fs = require('fs');
let content = fs.readFileSync('src/components/advisor/MigrationAdvisorWidget.tsx', 'utf8');

// Replace standard react-markdown usage
content = content.replace(
  '<div className="prose prose-sm dark:prose-invert prose-indigo">',
  '<div className="text-sm text-slate-800 dark:text-slate-300 space-y-2 leading-relaxed [&>h1]:text-lg [&>h1]:font-bold [&>h2]:text-base [&>h2]:font-bold [&>h3]:text-sm [&>h3]:font-bold [&>ul]:list-disc [&>ul]:pl-4 [&>ol]:list-decimal [&>ol]:pl-4 [&>li]:mb-1 [&>p]:mb-2 [&>pre]:bg-slate-100 [&>pre]:dark:bg-slate-800 [&>pre]:p-2 [&>pre]:rounded [&>code]:bg-slate-100 [&>code]:dark:bg-slate-800 [&>code]:px-1 [&>code]:rounded">'
);

fs.writeFileSync('src/components/advisor/MigrationAdvisorWidget.tsx', content);
