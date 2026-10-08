#!/bin/bash
sed -i 's/import {/import { Moon, Sun, Search, /' src/components/dashboard/MigrationToolDashboard.tsx

# Replace the beginning of the render
sed -i '/<div className="space-y-8 animate-fadeIn pb-8">/c\
  const [isDarkMode, setIsDarkMode] = useState(true);\
  const [searchQuery, setSearchQuery] = useState("");\
  \
  useEffect(() => {\
    if (isDarkMode) {\
      document.documentElement.classList.add("dark");\
    } else {\
      document.documentElement.classList.remove("dark");\
    }\
  }, [isDarkMode]);\
\
  return (\
    <div className="space-y-8 animate-fadeIn pb-8 text-slate-900 dark:text-white">\
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">\
        <div className="relative w-full max-w-md">\
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />\
          <input\
            type="text"\
            placeholder="Search users, jobs, or workloads..."\
            value={searchQuery}\
            onChange={(e) => setSearchQuery(e.target.value)}\
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:text-slate-200"\
          />\
        </div>\
        <div className="flex items-center gap-3">\
          <button\
            onClick={() => setIsDarkMode(!isDarkMode)}\
            className="p-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition"\
            title="Toggle Theme"\
          >\
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}\
          </button>\
          <button\
            onClick={() => {\
              setToastMessage("AI Copilot analyzing migration risks...");\
              setTimeout(() => setToastMessage(null), 3000);\
            }}\
            className="px-3 py-2 text-xs font-semibold bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-lg transition border border-indigo-200 dark:border-indigo-500/20 flex items-center space-x-1.5"\
          >\
            <Sparkles className="w-3.5 h-3.5" />\
            <span>AI Copilot Insights</span>\
          </button>\
        </div>\
      </div>\
' src/components/dashboard/MigrationToolDashboard.tsx
