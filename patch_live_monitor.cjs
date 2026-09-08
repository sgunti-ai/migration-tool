const fs = require('fs');
const content = fs.readFileSync('src/components/LiveMonitoringCockpit.tsx', 'utf-8');

let newContent = content.replace(
  `  const [selectedUserLogs, setSelectedUserLogs] = useState<UserMigrationStatus | null>(null);`,
  `  const [selectedUserLogs, setSelectedUserLogs] = useState<UserMigrationStatus | null>(null);\n  const [selectedFailedUsers, setSelectedFailedUsers] = useState<Set<string>>(new Set());\n\n  const handleToggleFailedRow = (id: string, status: string) => {\n    if (status !== 'FAILED') return;\n    const newSet = new Set(selectedFailedUsers);\n    if (newSet.has(id)) newSet.delete(id);\n    else newSet.add(id);\n    setSelectedFailedUsers(newSet);\n  };\n\n  const handleBulkRetry = () => {\n    alert(\`Queued \${selectedFailedUsers.size} failed items for retry.\`);\n    setSelectedFailedUsers(new Set());\n  };\n\n  const handleBulkCancel = () => {\n    alert(\`Cancelled \${selectedFailedUsers.size} failed items.\`);\n    setSelectedFailedUsers(new Set());\n  };`
);

const thReplace = `<th className="py-3 px-4">User Target Identity</th>`;
newContent = newContent.replace(thReplace, `<th className="py-3 px-4 w-12 text-center">Select</th>\n                ` + thReplace);

const tdReplace = `                      {/* Target Identity */}\n                      <td className="py-3 px-4 whitespace-nowrap">`;
newContent = newContent.replace(new RegExp(`\\s*\\{\\/\\* Target Identity \\*\\/\\}\\s*<td className="py-3 px-4 whitespace-nowrap">`, 'g'), `
                      {/* Checkbox */}
                      <td className="py-3 px-4 text-center">
                        {user.status === 'FAILED' ? (
                          <input 
                            type="checkbox"
                            checked={selectedFailedUsers.has(user.id)}
                            onChange={() => handleToggleFailedRow(user.id, user.status)}
                            className="rounded border-slate-600 bg-slate-900 text-blue-500 focus:ring-blue-500 cursor-pointer"
                          />
                        ) : (
                          <input type="checkbox" disabled className="rounded border-slate-700 bg-slate-800 opacity-30 cursor-not-allowed" />
                        )}
                      </td>
                      {/* Target Identity */}
                      <td className="py-3 px-4 whitespace-nowrap">`);

const tableEndReplace = `          </table>\n        </div>\n      </div>`;
const toolbar = `          </table>
        </div>

        {/* Floating Batch Toolbar */}
        {selectedFailedUsers.size > 0 && (
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20 animate-fadeIn">
            <div className="bg-slate-800 border border-slate-600 shadow-2xl rounded-full px-6 py-3 flex items-center space-x-6">
              <div className="flex items-center space-x-2 border-r border-slate-600 pr-6">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
                  {selectedFailedUsers.size}
                </span>
                <span className="text-sm font-medium text-slate-300">Items Selected</span>
              </div>
              <div className="flex items-center space-x-3">
                <button 
                  onClick={handleBulkRetry}
                  className="flex items-center space-x-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-sm font-medium transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Retry Selected</span>
                </button>
                <button 
                  onClick={handleBulkCancel}
                  className="flex items-center space-x-2 px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-rose-400 hover:text-rose-300 rounded-full text-sm font-medium transition-colors"
                >
                  <AlertOctagon className="h-4 w-4" />
                  <span>Cancel Selected</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>`;

newContent = newContent.replace(tableEndReplace, toolbar);

// Add relative class to the container
newContent = newContent.replace(`<div className="bg-slate-900 border border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[400px]">`, `<div className="bg-slate-900 border border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[400px] relative">`);

fs.writeFileSync('src/components/LiveMonitoringCockpit.tsx', newContent);
