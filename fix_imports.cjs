const fs = require('fs');
let content = fs.readFileSync('src/components/dashboard/MigrationToolDashboard.tsx', 'utf8');

// Remove Moon, Sun, Search from anywhere they appear incorrectly in imports
content = content.replace(/import { Moon, Sun, /g, 'import { ');
content = content.replace(/import { Search, /g, 'import { ');

// Add Moon, Sun, Search to lucide-react specifically
content = content.replace(/import {\\n  Users,/g, 'import {\\n  Moon,\\n  Sun,\\n  Search,\\n  Users,');

fs.writeFileSync('src/components/dashboard/MigrationToolDashboard.tsx', content);
