import React, { useState } from 'react';
import {
  AlertCircle, AlertTriangle, CheckCircle, Search, Filter, Download,
  RefreshCw, SkipForward, Edit3, ChevronDown, ChevronUp, Terminal,
  Clock, FileText, Mail, FileWarning, Key, XCircle, FileClock
} from 'lucide-react';
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from 'recharts';

// --- MOCK DATA ---
const SUMMARY_STATS = {
  total: 1248,
  critical: 42,
  warnings: 386,
  resolved: 820
};

const ERROR_TREND_DATA = [
  { time: '08:00', critical: 2, warning: 15 },
  { time: '09:00', critical: 1, warning: 12 },
  { time: '10:00', critical: 5, warning: 22 },
  { time: '11:00', critical: 12, warning: 45 },
  { time: '12:00', critical: 8, warning: 34 },
  { time: '13:00', critical: 14, warning: 58 },
  { time: '14:00', critical: 6, warning: 28 },
];

const ERROR_TYPES = [
  { type: 'AuthenticationFailed', label: 'Authentication', count: 18, color: '#ef4444' }, // red
  { type: 'ApiThrottled', label: 'API Throttling', count: 124, color: '#f59e0b' }, // amber
  { type: 'FileLocked', label: 'File Locked', count: 65, color: '#8b5cf6' }, // violet
  { type: 'PathTooLong', label: 'Path Too Long', count: 42, color: '#06b6d4' }, // cyan
  { type: 'InvalidChars', label: 'Invalid Characters', count: 21, color: '#f43f5e' }, // rose
];

const MOCK_ERRORS = [
  {
    id: 'ERR-9402',
    timestamp: '2026-09-07T14:22:15Z',
    item: 'john.doe@contoso.com/Documents/2025_Q1_Financials_Very_Long_Name_That_Exceeds_Limits.xlsx',
    type: 'PathTooLong',
    severity: 'WARNING',
    status: 'OPEN',
    message: 'The specified file or folder name is too long.',
    stackTrace: 'Error: PathLengthExceededException\n  at GraphServiceClient.uploadSession (graph.ts:402)\n  at processChunk (transfer.ts:182)\n  at async Worker.execute (worker.ts:55)',
    remediation: 'Rename the file or map it to a shorter destination path before retrying.'
  },
  {
    id: 'ERR-9401',
    timestamp: '2026-09-07T14:21:40Z',
    item: 'jane.smith@contoso.com/Mailbox',
    type: 'AuthenticationFailed',
    severity: 'CRITICAL',
    status: 'OPEN',
    message: 'Application authentication failed. Invalid client secret.',
    stackTrace: 'Error: AuthFailedException\n  at AuthProvider.getToken (auth.ts:114)\n  at ConnectionPool.acquire (pool.ts:45)\n  at async Task.start (task.ts:22)',
    remediation: 'Verify the Azure AD Application client secret in the tenant connection settings.'
  },
  {
    id: 'ERR-9398',
    timestamp: '2026-09-07T14:15:10Z',
    item: 'admin@contoso.com/Drive/Annual_Report_2025.docx',
    type: 'FileLocked',
    severity: 'WARNING',
    status: 'OPEN',
    message: 'The file is currently locked for editing by another user.',
    stackTrace: 'Error: FileLockedException\n  at SharePointAPI.getFile (sp.ts:88)\n  at TransferNode.read (node.ts:45)',
    remediation: 'Wait for the user to release the lock, or use the "Force Copy" action to grab the last saved version.'
  },
  {
    id: 'ERR-9380',
    timestamp: '2026-09-07T14:02:00Z',
    item: 'System/SharePoint_API_Batch',
    type: 'ApiThrottled',
    severity: 'WARNING',
    status: 'RESOLVED',
    message: 'Too many requests. 429 Too Many Requests.',
    stackTrace: 'Error: GraphThrottledException\n  at HttpHandler.execute (http.ts:502)',
    remediation: 'Automatic backoff applied. No manual action required.'
  },
  {
    id: 'ERR-9375',
    timestamp: '2026-09-07T13:50:42Z',
    item: 'sales@contoso.com/Drive/Budget<2025>.xlsx',
    type: 'InvalidChars',
    severity: 'CRITICAL',
    status: 'OPEN',
    message: 'The file name contains invalid characters (<, >).',
    stackTrace: 'Error: InvalidNameException\n  at Validator.checkName (validator.ts:33)',
    remediation: 'Rename the file to remove unsupported characters and retry the item.'
  }
];

const SeverityBadge = ({ severity }: { severity: string }) => {
  return severity === 'CRITICAL' ? (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 border border-red-200">
      <AlertCircle className="w-3 h-3 mr-1" /> Critical
    </span>
  ) : (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
      <AlertTriangle className="w-3 h-3 mr-1" /> Warning
    </span>
  );
};

const TypeIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'AuthenticationFailed': return <Key className="w-4 h-4 text-red-500" />;
    case 'ApiThrottled': return <FileClock className="w-4 h-4 text-amber-500" />;
    case 'FileLocked': return <FileWarning className="w-4 h-4 text-violet-500" />;
    case 'PathTooLong': return <Edit3 className="w-4 h-4 text-cyan-500" />;
    case 'InvalidChars': return <XCircle className="w-4 h-4 text-rose-500" />;
    default: return <FileText className="w-4 h-4 text-slate-500" />;
  }
};


export const ErrorManagementDashboard: React.FC = () => {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('ALL');

  const filteredErrors = MOCK_ERRORS.filter(err => {
    const matchesSearch = err.item.toLowerCase().includes(search.toLowerCase()) || err.id.toLowerCase().includes(search.toLowerCase());
    const matchesSeverity = filterSeverity === 'ALL' || err.severity === filterSeverity;
    return matchesSearch && matchesSeverity;
  });

  const toggleRow = (id: string) => {
    const newSet = new Set(selectedRows);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedRows(newSet);
  };

  const toggleAll = () => {
    if (selectedRows.size === filteredErrors.length) setSelectedRows(new Set());
    else setSelectedRows(new Set(filteredErrors.map(e => e.id)));
  };

  const handleBulkRetry = () => {
    alert(`Queued ${selectedRows.size} items for bulk retry with exponential backoff.`);
    setSelectedRows(new Set());
  };

  const handleAction = (e: React.MouseEvent, action: string, id: string) => {
    e.stopPropagation();
    alert(`Initiated "${action}" for error ${id}`);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 min-h-[800px] border border-slate-200 rounded-md shadow-sm">
      {/* Header */}
      <div className="px-6 py-5 bg-white border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Error Management & Remediation</h1>
          <p className="text-sm text-slate-500 mt-1">Identify, triage, and resolve migration failures gracefully.</p>
        </div>
        <div className="flex space-x-3">
          <button className="flex items-center space-x-2 px-3 py-2 bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-50 transition-colors text-sm font-medium">
            <Mail className="h-4 w-4" /> <span>Schedule Email</span>
          </button>
          <button className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm">
            <Download className="h-4 w-4" /> <span>Export Report</span>
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6 flex-1 overflow-y-auto">
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
            <p className="text-sm font-medium text-slate-500 mb-1">Total Issues</p>
            <div className="text-3xl font-bold text-slate-800">{SUMMARY_STATS.total.toLocaleString()}</div>
          </div>
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Critical</p>
              <div className="text-3xl font-bold text-red-600">{SUMMARY_STATS.critical}</div>
            </div>
            <div className="p-3 bg-red-50 rounded-full text-red-500">
              <AlertCircle className="h-6 w-6" />
            </div>
          </div>
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Warnings</p>
              <div className="text-3xl font-bold text-amber-500">{SUMMARY_STATS.warnings}</div>
            </div>
            <div className="p-3 bg-amber-50 rounded-full text-amber-500">
              <AlertTriangle className="h-6 w-6" />
            </div>
          </div>
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Resolved</p>
              <div className="text-3xl font-bold text-emerald-600">{SUMMARY_STATS.resolved}</div>
            </div>
            <div className="p-3 bg-emerald-50 rounded-full text-emerald-500">
              <CheckCircle className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Dashboards Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trend Chart */}
          <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 shadow-sm p-5">
            <h3 className="text-base font-semibold text-slate-800 mb-4">Error Trend (Last 12 Hours)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={ERROR_TREND_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCrit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorWarn" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="time" tick={{fontSize: 12}} stroke="#94a3b8" />
                  <YAxis tick={{fontSize: 12}} stroke="#94a3b8" />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Area type="monotone" dataKey="warning" stackId="1" stroke="#f59e0b" fill="url(#colorWarn)" name="Warnings" />
                  <Area type="monotone" dataKey="critical" stackId="1" stroke="#ef4444" fill="url(#colorCrit)" name="Critical" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Error Types */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
            <h3 className="text-base font-semibold text-slate-800 mb-4">Top Error Types</h3>
            <div className="space-y-4">
              {ERROR_TYPES.map((type, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-slate-700 flex items-center space-x-2">
                      <TypeIcon type={type.type} />
                      <span>{type.label}</span>
                    </span>
                    <span className="text-slate-500">{type.count}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="h-2 rounded-full" style={{ width: `${(type.count / ERROR_TYPES[1].count) * 100}%`, backgroundColor: type.color }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Error List & Workflows */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-3 w-full md:w-auto">
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search by ID, Item, or Message..." 
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <select 
                  className="pl-9 pr-8 py-2 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                  value={filterSeverity}
                  onChange={e => setFilterSeverity(e.target.value)}
                >
                  <option value="ALL">All Severities</option>
                  <option value="CRITICAL">Critical Only</option>
                  <option value="WARNING">Warnings Only</option>
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500 mr-2 font-medium">{selectedRows.size} Selected</span>
              <button 
                disabled={selectedRows.size === 0} 
                onClick={handleBulkRetry}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-sm hover:bg-blue-100 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className="h-4 w-4" /> <span>Bulk Retry</span>
              </button>
              <button 
                disabled={selectedRows.size === 0} 
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 border border-slate-200 rounded text-sm hover:bg-slate-200 disabled:opacity-50 transition-colors"
              >
                <SkipForward className="h-4 w-4" /> <span>Skip Selected</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-white">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left w-12">
                    <input 
                      type="checkbox" 
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      checked={selectedRows.size === filteredErrors.length && filteredErrors.length > 0}
                      onChange={toggleAll}
                    />
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Error ID</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Severity</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Type & Message</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white text-sm">
                {filteredErrors.map((err) => (
                  <React.Fragment key={err.id}>
                    <tr 
                      className={`hover:bg-slate-50 cursor-pointer transition-colors ${expandedRow === err.id ? 'bg-blue-50/30' : ''}`}
                      onClick={() => setExpandedRow(expandedRow === err.id ? null : err.id)}
                    >
                      <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          checked={selectedRows.has(err.id)}
                          onChange={() => toggleRow(err.id)}
                        />
                      </td>
                      <td className="px-4 py-4 font-medium text-slate-900 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {expandedRow === err.id ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                          <span>{err.id}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <SeverityBadge severity={err.severity} />
                      </td>
                      <td className="px-4 py-4 max-w-md">
                        <div className="flex items-start space-x-2">
                          <div className="mt-0.5"><TypeIcon type={err.type} /></div>
                          <div>
                            <p className="font-medium text-slate-800 truncate">{err.type}</p>
                            <p className="text-slate-500 truncate text-xs mt-0.5" title={err.item}>{err.item}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          err.status === 'OPEN' ? 'bg-slate-100 text-slate-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {err.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button onClick={(e) => handleAction(e, 'Retry', err.id)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Retry">
                            <RefreshCw className="h-4 w-4" />
                          </button>
                          {err.type === 'PathTooLong' || err.type === 'InvalidChars' ? (
                            <button onClick={(e) => handleAction(e, 'Rename', err.id)} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded" title="Resolve Conflict (Rename)">
                              <Edit3 className="h-4 w-4" />
                            </button>
                          ) : null}
                          <button onClick={(e) => handleAction(e, 'Skip', err.id)} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded" title="Skip">
                            <SkipForward className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Expandable Detail Row */}
                    {expandedRow === err.id && (
                      <tr>
                        <td colSpan={6} className="bg-slate-50 px-8 py-6 border-b border-slate-200 shadow-inner">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Error Details */}
                            <div>
                              <h4 className="text-sm font-semibold text-slate-800 mb-2">Error Message</h4>
                              <p className="text-sm text-red-600 mb-4 bg-red-50 p-3 rounded-md border border-red-100">
                                {err.message}
                              </p>
                              
                              <h4 className="text-sm font-semibold text-slate-800 mb-2">Suggested Remediation</h4>
                              <div className="bg-blue-50 p-3 rounded-md border border-blue-100 flex items-start space-x-3 mb-4">
                                <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-blue-800">{err.remediation}</p>
                              </div>

                              <div className="flex space-x-3 mt-4">
                                <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium transition-colors">
                                  Apply Fix & Retry
                                </button>
                                <button className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded hover:bg-slate-50 text-sm font-medium transition-colors">
                                  Mark as Resolved
                                </button>
                              </div>
                            </div>

                            {/* Stack Trace / Technical Details */}
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-semibold text-slate-800">Stack Trace</h4>
                                <span className="text-xs text-slate-400 font-mono">{err.timestamp}</span>
                              </div>
                              <div className="bg-slate-900 rounded-md p-4 overflow-x-auto">
                                <div className="flex items-center space-x-2 mb-2 text-slate-400 pb-2 border-b border-slate-700">
                                  <Terminal className="h-4 w-4" />
                                  <span className="text-xs font-mono">System Execution Context</span>
                                </div>
                                <pre className="text-xs font-mono text-emerald-400 leading-relaxed whitespace-pre-wrap">
                                  {err.stackTrace}
                                </pre>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};
