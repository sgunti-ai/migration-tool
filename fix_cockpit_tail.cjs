const fs = require('fs');
let content = fs.readFileSync('src/components/LiveMonitoringCockpit.tsx', 'utf8');

const doubleWidget = `      {isAdvisorOpen && (
        <MigrationAdvisorWidget 
          activeJob={activeJob} 
          onClose={() => setIsAdvisorOpen(false)} 
        />
      )}
      {isAdvisorOpen && (
        <MigrationAdvisorWidget 
          activeJob={activeJob} 
          onClose={() => setIsAdvisorOpen(false)} 
        />
      )}`;

const singleWidget = `      {isAdvisorOpen && (
        <MigrationAdvisorWidget 
          activeJob={activeJob} 
          onClose={() => setIsAdvisorOpen(false)} 
        />
      )}`;

content = content.replace(doubleWidget, singleWidget);
fs.writeFileSync('src/components/LiveMonitoringCockpit.tsx', content);
