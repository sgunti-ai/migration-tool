const fs = require('fs');
const path = require('path');

function processFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    
    // We only want to replace `text-white` when it's part of typography, NOT when it's on a button like bg-blue-600.
    // However, it's safer to replace `text-white` that is NOT preceded by `bg-blue-` or `bg-emerald-` or `bg-amber-` or `bg-red-` or `bg-indigo-`
    // Actually, maybe just replacing specific patterns is safer.
    content = content.replace(/text-white/g, (match, offset, fullText) => {
        // Look backwards a bit to see if there's a solid bg color
        const prefix = fullText.substring(Math.max(0, offset - 30), offset);
        if (prefix.match(/bg-(blue|emerald|amber|red|indigo|green|slate)-(500|600|700)/) || prefix.includes('dark:text-white')) {
            return 'text-white';
        }
        return 'text-slate-900 dark:text-white';
    });

    // Replace text-slate-300 and 400 similarly, avoiding existing dark:
    content = content.replace(/text-slate-300/g, (match, offset, fullText) => {
        if (fullText.substring(Math.max(0, offset - 20), offset).includes('dark:')) return match;
        return 'text-slate-600 dark:text-slate-300';
    });
    content = content.replace(/text-slate-400/g, (match, offset, fullText) => {
        if (fullText.substring(Math.max(0, offset - 20), offset).includes('dark:')) return match;
        return 'text-slate-500 dark:text-slate-400';
    });

    // Panels and Borders
    content = content.replace(/bg-slate-800/g, (match, offset, fullText) => {
        if (fullText.substring(Math.max(0, offset - 20), offset).includes('dark:')) return match;
        return 'bg-white dark:bg-slate-800';
    });
    content = content.replace(/bg-slate-800\/50/g, (match, offset, fullText) => {
        if (fullText.substring(Math.max(0, offset - 20), offset).includes('dark:')) return match;
        return 'bg-white/50 dark:bg-slate-800/50';
    });
    content = content.replace(/bg-slate-900\/50/g, (match, offset, fullText) => {
        if (fullText.substring(Math.max(0, offset - 20), offset).includes('dark:')) return match;
        return 'bg-slate-50/50 dark:bg-slate-900/50';
    });
    content = content.replace(/bg-slate-900/g, (match, offset, fullText) => {
        if (fullText.substring(Math.max(0, offset - 20), offset).includes('dark:')) return match;
        return 'bg-slate-50 dark:bg-slate-900';
    });
    content = content.replace(/bg-slate-700/g, (match, offset, fullText) => {
        if (fullText.substring(Math.max(0, offset - 20), offset).includes('dark:')) return match;
        return 'bg-slate-100 dark:bg-slate-700';
    });
    
    // Borders
    content = content.replace(/border-slate-700/g, (match, offset, fullText) => {
        if (fullText.substring(Math.max(0, offset - 20), offset).includes('dark:')) return match;
        return 'border-slate-200 dark:border-slate-700';
    });
    content = content.replace(/border-slate-800/g, (match, offset, fullText) => {
        if (fullText.substring(Math.max(0, offset - 20), offset).includes('dark:')) return match;
        return 'border-slate-200 dark:border-slate-800';
    });

    // Fix some double darks if any
    content = content.replace(/dark:dark:/g, 'dark:');
    
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
// Don't forget App.tsx
processFile('src/App.tsx');
