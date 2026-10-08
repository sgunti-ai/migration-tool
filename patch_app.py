import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Add Sun, Moon to imports
lucide_import = "import { Sun, Moon } from 'lucide-react';\n"
content = re.sub(r"(import React.*?;\n)", r"\1" + lucide_import, content)

# Add state and effect for dark mode
state_code = """
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return true; // Default to dark mode
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);
"""
content = content.replace("  const [activeTab, setActiveTab] = useState<PrimaryTab>('home');", state_code + "\n  const [activeTab, setActiveTab] = useState<PrimaryTab>('home');")

# Add header
header_code = """
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Application Header */}
        <header className="flex items-center justify-end px-6 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800/80 transition-colors">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Toggle Theme"
              aria-label="Toggle Theme"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* Main Container */}
"""

content = content.replace("""      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Main Container */}""", header_code)

with open('src/App.tsx', 'w') as f:
    f.write(content)
