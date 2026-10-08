import re

with open('index.html', 'r') as f:
    content = f.read()

theme_script = """
    <script>
      (function() {
        try {
          var theme = localStorage.getItem('theme');
          if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        } catch (e) {}
      })();
    </script>
  </head>"""

content = content.replace("  </head>", theme_script)

with open('index.html', 'w') as f:
    f.write(content)
