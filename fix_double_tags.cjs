const fs = require('fs');
const path = require('path');

function processFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix double text-slate-900 dark:text-slate-900 dark:text-white
    content = content.replace(/text-slate-900 dark:text-slate-900 dark:text-white/g, 'text-slate-900 dark:text-white');
    content = content.replace(/bg-white dark:bg-white dark:bg-slate-800/g, 'bg-white dark:bg-slate-800');
    content = content.replace(/bg-slate-50 dark:bg-slate-50 dark:bg-slate-900/g, 'bg-slate-50 dark:bg-slate-900');
    content = content.replace(/border-slate-200 dark:border-slate-200 dark:border-slate-800/g, 'border-slate-200 dark:border-slate-800');
    content = content.replace(/border-slate-200 dark:border-slate-200 dark:border-slate-700/g, 'border-slate-200 dark:border-slate-700');
    
    fs.writeFileSync(filePath, content);
}

function walk(dir) {
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walk(fullPath);
        } else if (fullPath.endsWith('.tsx')) {
            processFile(fullPath);
        }
    });
}

walk('src/components');
