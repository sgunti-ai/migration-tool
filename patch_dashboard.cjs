const fs = require('fs');

let content = fs.readFileSync('src/components/dashboard/MigrationToolDashboard.tsx', 'utf8');

// Add prop
content = content.replace(
  "onNavigateTab?: (tab: any, subTab?: any) => void;",
  "onNavigateTab?: (tab: any, subTab?: any) => void;\n  onOpenAdvisor?: () => void;"
);

// Destructure prop
content = content.replace(
  "export const MigrationToolDashboard: React.FC<MigrationToolDashboardProps> = ({ currentRole, tenantStatus, onNavigateTab }) => {",
  "export const MigrationToolDashboard: React.FC<MigrationToolDashboardProps> = ({ currentRole, tenantStatus, onNavigateTab, onOpenAdvisor }) => {"
);

// Update button onClick
content = content.replace(
  `onClick={() => {
              setToastMessage("AI Copilot analyzing migration risks...");
              setTimeout(() => setToastMessage(null), 3000);
            }}`,
  `onClick={() => {
              if (onOpenAdvisor) onOpenAdvisor();
              else {
                setToastMessage("AI Copilot analyzing migration risks...");
                setTimeout(() => setToastMessage(null), 3000);
              }
            }}`
);

fs.writeFileSync('src/components/dashboard/MigrationToolDashboard.tsx', content);
