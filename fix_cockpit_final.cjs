const fs = require('fs');
let content = fs.readFileSync('src/components/LiveMonitoringCockpit.tsx', 'utf8');

// The file should end around where the diagnostic block is
const tailToReplace = `            </div>
          </div>
        </div>
      )}
            </div>
          </div>
        </div>
      )}

      {isAdvisorOpen && (
        <MigrationAdvisorWidget 
          activeJob={activeJob} 
          onClose={() => setIsAdvisorOpen(false)} 
        />
      )}
    </div>
  );
};
`;

const newTail = `            </div>
          </div>
        </div>
      )}

      {isAdvisorOpen && (
        <MigrationAdvisorWidget 
          activeJob={activeJob} 
          onClose={() => setIsAdvisorOpen(false)} 
        />
      )}
    </div>
  );
};
`;

content = content.replace(tailToReplace, newTail);
fs.writeFileSync('src/components/LiveMonitoringCockpit.tsx', content);
