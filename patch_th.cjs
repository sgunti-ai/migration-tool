const fs = require('fs');
let content = fs.readFileSync('src/components/LiveMonitoringCockpit.tsx', 'utf-8');

const thReplace = `<th className="py-3 px-4 w-12 text-center">Select</th>`;
const newTh = `<th className="py-3 px-4 w-12 text-center">
                  <input 
                    type="checkbox"
                    title="Select all failed items"
                    className="rounded border-slate-600 bg-slate-900 text-blue-500 focus:ring-blue-500 cursor-pointer"
                    onChange={(e) => {
                      const failedUsers = filteredUsers.filter(u => u.status === 'FAILED');
                      if (e.target.checked) {
                        setSelectedFailedUsers(new Set(failedUsers.map(u => u.id)));
                      } else {
                        setSelectedFailedUsers(new Set());
                      }
                    }}
                    checked={
                      filteredUsers.filter(u => u.status === 'FAILED').length > 0 &&
                      selectedFailedUsers.size === filteredUsers.filter(u => u.status === 'FAILED').length
                    }
                  />
                </th>`;

content = content.replace(thReplace, newTh);
fs.writeFileSync('src/components/LiveMonitoringCockpit.tsx', content);
