import re

with open('src/components/dashboard/MigrationToolDashboard.tsx', 'r') as f:
    content = f.read()

# Remove the state
content = re.sub(r'  const \[isDarkMode, setIsDarkMode\] = useState\(true\);\n', '', content)

# Remove the effect
effect_code = r'''  useEffect\(\(\) => \{
    if \(isDarkMode\) \{
      document.documentElement.classList.add\("dark"\);
    \} else \{
      document.documentElement.classList.remove\("dark"\);
    \}
  \}, \[isDarkMode\]\);\n'''
content = re.sub(effect_code, '', content)

# Remove the button
button_code = r'''          <button
            onClick=\{\(\) => setIsDarkMode\(!isDarkMode\)\}
            className="p-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition"
            title="Toggle Theme"
          >
            \{isDarkMode \? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />\}
          </button>\n'''
content = re.sub(button_code, '', content)

with open('src/components/dashboard/MigrationToolDashboard.tsx', 'w') as f:
    f.write(content)
