import React, { useState, useEffect } from 'react';
import { 
  Play, Pause, XCircle, RefreshCw, Download, Search, Filter, ArrowLeft, 
  AlertTriangle, CheckCircle2, Clock, MoreVertical, FileText, Activity
} from 'lucide-react';
import { 
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend 
} from 'recharts';

// --- MOCK DATA GENERATORS ---
const generateMockJobs = (count: number) => {
  const statuses = ['QUEUED', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'PARTIAL'];
  const users = ['john.doe@contoso.com', 'jane.smith@contoso.com', 'admin@contoso.com', 'sales@contoso.com'];
  const now = Date.now();

  return Array.from({ length: count }).map((_, i) => {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const isDone = status === 'COMPLETED' || status === 'FAILED' || status === 'PARTIAL';
    
    return {
      id: `OD-JOB-${1000 + i}`,
      user: users[i % users.length],
      source: 'Contoso Tenant',
      destination: 'Fabrikam Tenant',
      status,
      progress: status === 'COMPLETED' ? 100 : (status === 'QUEUED' ? 0 : Math.floor(Math.random() * 99)),
      dataSize: `${(Math.random() * 50 + 5).toFixed(1)} GB`,
      startTime: new Date(now - Math.random() * 86400000).toISOString(),
      duration: isDone ? `${Math.floor(Math.random() * 120 + 10)} min` : '-',
      
      // Detailed metrics for drill-down
      totalFiles: Math.floor(Math.random() * 50000 + 1000),
      completedFiles: Math.floor(Math.random() * 50000),
      failedFiles: status === 'FAILED' || status === 'PARTIAL' ? Math.floor(Math.random() * 500 + 1) : 0,
      skippedFiles: Math.floor(Math.random() * 100),
      transferSpeed: status === 'IN_PROGRESS' ? (Math.random() * 45 + 5).toFixed(1) : '0',
      timeRemaining: status === 'IN_PROGRESS' ? `${Math.floor(Math.random() * 45 + 5)} min` : '-',
      isThrottled: status === 'IN_PROGRESS' && Math.random() > 0.8,
      
      // Simulated transfer history for charts
      transferHistory: Array.from({ length: 20 }).map((_, idx) => ({
        time: `T-${20 - idx}m`,
        speed: status === 'IN_PROGRESS' ? Math.max(0, Math.random() * 50 - (Math.random() > 0.8 ? 40 : 0)) : 0, // Dips simulate throttling
        cpu: Math.random() * 60 + 20,
        memory: Math.random() * 40 + 40,
      })),
      
      errors: status === 'FAILED' || status === 'PARTIAL' ? [
        { time: new Date().toISOString(), code: 'Err429', message: 'Rate limit exceeded on SharePoint API.' },
        { time: new Date(now - 10000).toISOString(), code: 'Err404', message: 'Source file not found or deleted during sync.' },
      ] : [],
      
      timeline: [
        { stage: 'Discovery', status: 'completed', time: new Date(now - 80000000).toISOString() },
        { stage: 'Provisioning Target', status: 'completed', time: new Date(now - 70000000).toISOString() },
        { stage: 'Data Transfer', status: status === 'QUEUED' ? 'pending' : (isDone ? 'completed' : 'in_progress'), time: new Date(now - 60000000).toISOString() },
        { stage: 'Verification', status: isDone ? (status === 'FAILED' ? 'failed' : 'completed') : 'pending', time: isDone ? new Date().toISOString() : null },
      ]
    };
  });
};

const MOCK_JOBS = generateMockJobs(25);

// --- HELPER COMPONENTS ---

const StatusBadge = ({ status, pulse = false }: { status: string, pulse?: boolean }) => {
  const styles: Record<string, string> = {
    QUEUED: 'bg-blue-100 text-blue-700 border-blue-200',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    COMPLETED: 'bg-green-100 text-green-700 border-green-200',
    FAILED: 'bg-red-100 text-red-700 border-red-200',
    PARTIAL: 'bg-orange-100 text-orange-700 border-orange-200',
  };
  const labels: Record<string, string> = {
    QUEUED: 'Queued',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
    FAILED: 'Failed',
    PARTIAL: 'Partially Completed',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}>
      {pulse && status === 'IN_PROGRESS' && (
        <span className="mr-1.5 flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-500 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-600"></span>
        </span>
      )}
      {labels[status] || status}
    </span>
  );
};

export const OneDriveMonitoringDashboard: React.FC = () => {
  // State for List View
  const [jobs, setJobs] = useState(MOCK_JOBS);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // State for Drill-down View
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  // Derived filtered data
  const filteredJobs = jobs.filter(j => 
    (filterStatus === 'ALL' || j.status === filterStatus) &&
    (j.user.toLowerCase().includes(search.toLowerCase()) || j.id.toLowerCase().includes(search.toLowerCase()))
  );
  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);
  const paginatedJobs = filteredJobs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const selectedJob = selectedJobId ? jobs.find(j => j.id === selectedJobId) : null;

  // Handlers
  const handleRetryFailedItems = async () => {
    if (!selectedJob) return;
    setIsRetrying(true);
    try {
      // Backend API endpoint invocation (mocked for preview)
      const res = await fetch(`/api/jobs/${selectedJob.id}/retry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userUPN: selectedJob.user, retryOnlyFailed: true })
      });
      
      // We simulate a successful retry submission
      await new Promise(resolve => setTimeout(resolve, 800));
      
      alert(`Successfully queued retry for failed items of ${selectedJob.user}.`);
    } catch (err) {
      console.error(err);
      alert('Error invoking retry API.');
    } finally {
      setIsRetrying(false);
    }
  };

  const toggleRow = (id: string) => {
    const newSet = new Set(selectedRows);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedRows(newSet);
  };

  const toggleAll = () => {
    if (selectedRows.size === paginatedJobs.length) setSelectedRows(new Set());
    else setSelectedRows(new Set(paginatedJobs.map(j => j.id)));
  };

  const handleExport = () => {
    alert("Exporting visible rows to CSV...");
  };

  // Simulated WebSocket Live Updates
  useEffect(() => {
    const interval = setInterval(() => {
      setJobs(prevJobs => prevJobs.map(job => {
        if (job.status === 'IN_PROGRESS') {
          // Simulate progress increment
          const newProgress = Math.min(99, job.progress + Math.random() * 2);
          const newTransferHistory = [...job.transferHistory.slice(1), {
            time: new Date().toLocaleTimeString().split(' ')[0],
            speed: Math.max(0, parseFloat(job.transferSpeed) + (Math.random() * 10 - 5)),
            cpu: Math.max(10, Math.min(90, job.transferHistory[19].cpu + (Math.random() * 10 - 5))),
            memory: Math.max(20, Math.min(80, job.transferHistory[19].memory + (Math.random() * 5 - 2))),
          }];
          
          return {
            ...job,
            progress: newProgress,
            transferSpeed: (Math.random() * 45 + 5).toFixed(1),
            isThrottled: Math.random() > 0.85,
            transferHistory: newTransferHistory
          };
        }
        return job;
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);


  // === RENDER DRILL-DOWN VIEW ===
  if (selectedJobId && selectedJob) {
    return (
      <div className="w-full bg-slate-50 min-h-screen text-slate-800 font-sans border border-slate-200 rounded-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between px-6 py-4 bg-white border-b border-slate-200">
          <div className="flex items-center space-x-4 mb-4 md:mb-0">
            <button onClick={() => setSelectedJobId(null)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors text-slate-600">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <div className="flex items-center space-x-3">
                <h2 className="text-xl font-semibold text-slate-800">{selectedJob.id}</h2>
                <StatusBadge status={selectedJob.status} pulse />
              </div>
              <p className="text-sm text-slate-500">{selectedJob.user}</p>
            </div>
          </div>
          <div className="flex space-x-2">
            {selectedJob.status === 'IN_PROGRESS' && (
              <button className="flex items-center space-x-1 px-3 py-1.5 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded text-sm hover:bg-yellow-100 transition-colors">
                <Pause className="h-4 w-4" /> <span>Pause</span>
              </button>
            )}
            {(selectedJob.status === 'FAILED' || selectedJob.status === 'PARTIAL') && (
              <button className="flex items-center space-x-1 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-sm hover:bg-blue-100 transition-colors">
                <RefreshCw className="h-4 w-4" /> <span>Retry Failed</span>
              </button>
            )}
            {selectedJob.status !== 'COMPLETED' && selectedJob.status !== 'FAILED' && (
              <button className="flex items-center space-x-1 px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded text-sm hover:bg-red-100 transition-colors">
                <XCircle className="h-4 w-4" /> <span>Cancel</span>
              </button>
            )}
          </div>
        </div>

        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          {/* Top Performance Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Transfer Speed</p>
                <div className="flex items-end space-x-2">
                  <span className="text-2xl font-bold text-slate-800">{selectedJob.transferSpeed}</span>
                  <span className="text-sm font-medium text-slate-500 mb-1">MB/s</span>
                </div>
              </div>
              <div className="p-3 bg-blue-50 rounded-full text-blue-600">
                <Activity className="h-5 w-5" />
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Time Remaining</p>
                <div className="text-2xl font-bold text-slate-800">{selectedJob.timeRemaining}</div>
              </div>
              <div className="p-3 bg-indigo-50 rounded-full text-indigo-600">
                <Clock className="h-5 w-5" />
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex flex-col justify-center">
              <p className="text-sm font-medium text-slate-500 mb-2">Overall Progress</p>
              <div className="flex items-center justify-between mb-1 text-sm">
                <span className="font-bold text-slate-800">{selectedJob.progress.toFixed(1)}%</span>
                <span className="text-slate-500">{selectedJob.dataSize} Total</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full transition-all duration-500" style={{ width: `${selectedJob.progress}%` }}></div>
              </div>
            </div>
            <div className={`border rounded-lg p-4 shadow-sm flex items-center justify-between transition-colors ${selectedJob.isThrottled ? 'bg-orange-50 border-orange-200' : 'bg-white border-slate-200'}`}>
              <div>
                <p className={`text-sm font-medium mb-1 ${selectedJob.isThrottled ? 'text-orange-700' : 'text-slate-500'}`}>API Throttling</p>
                <div className={`text-xl font-bold ${selectedJob.isThrottled ? 'text-orange-800' : 'text-slate-800'}`}>
                  {selectedJob.isThrottled ? 'Active Backoff' : 'Optimal'}
                </div>
              </div>
              <div className={`p-3 rounded-full ${selectedJob.isThrottled ? 'bg-orange-100 text-orange-600' : 'bg-emerald-50 text-emerald-600'}`}>
                {selectedJob.isThrottled ? <AlertTriangle className="h-5 w-5 animate-pulse" /> : <CheckCircle2 className="h-5 w-5" />}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Charts and Logs */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Transfer Rate Chart */}
              <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-5">
                <h3 className="text-lg font-medium text-slate-800 mb-4">Transfer Rate</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={selectedJob.transferHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorSpeed" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="time" tick={{fontSize: 10}} stroke="#94a3b8" />
                      <YAxis tick={{fontSize: 10}} stroke="#94a3b8" />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Area type="monotone" dataKey="speed" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorSpeed)" name="MB/s" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Error Logs */}
              <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-5">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-medium text-slate-800">Error Log</h3>
                    <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full text-xs font-semibold">{selectedJob.errors.length} Issues</span>
                  </div>
                  {selectedJob.errors.length > 0 && (
                    <button 
                      onClick={handleRetryFailedItems}
                      disabled={isRetrying}
                      className="flex items-center space-x-1 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-sm hover:bg-blue-100 transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} /> 
                      <span>Retry Failed Items</span>
                    </button>
                  )}
                </div>
                {selectedJob.errors.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead>
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Time</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Code</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Message</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-sm">
                        {selectedJob.errors.map((err, i) => (
                          <tr key={i} className="hover:bg-slate-50 transition-colors">
                            <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{new Date(err.time).toLocaleTimeString()}</td>
                            <td className="px-3 py-2 font-mono text-xs text-red-600">{err.code}</td>
                            <td className="px-3 py-2 text-slate-700">{err.message}</td>
                            <td className="px-3 py-2 text-right">
                              <button className="text-blue-600 hover:text-blue-800 font-medium text-xs">Retry Item</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500 text-sm flex flex-col items-center">
                    <CheckCircle2 className="h-8 w-8 text-emerald-400 mb-2 opacity-50" />
                    No errors recorded for this job.
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: File Stats, Resource, Timeline */}
            <div className="space-y-6">
              
              {/* File-level Details */}
              <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-5">
                <h3 className="text-lg font-medium text-slate-800 mb-4">File Details</h3>
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="text-slate-500">Total Files</span>
                    <span className="font-semibold text-slate-800">{(selectedJob.totalFiles ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <div className="flex items-center text-emerald-600">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></div>
                      Completed
                    </div>
                    <span className="font-semibold text-slate-800">{(selectedJob.completedFiles ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <div className="flex items-center text-red-600">
                      <div className="w-2 h-2 rounded-full bg-red-500 mr-2"></div>
                      Failed
                    </div>
                    <span className="font-semibold text-slate-800">{(selectedJob.failedFiles ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center pb-1">
                    <div className="flex items-center text-slate-500">
                      <div className="w-2 h-2 rounded-full bg-slate-300 mr-2"></div>
                      Skipped
                    </div>
                    <span className="font-semibold text-slate-800">{(selectedJob.skippedFiles ?? 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Resource Utilization */}
              <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-5">
                <h3 className="text-lg font-medium text-slate-800 mb-4">Agent Resources</h3>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={selectedJob.transferHistory} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="time" tick={{fontSize: 10}} stroke="#94a3b8" />
                      <YAxis tick={{fontSize: 10}} stroke="#94a3b8" />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }} />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      <Line type="monotone" dataKey="cpu" name="CPU %" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="memory" name="Mem %" stroke="#10b981" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-5">
                <h3 className="text-lg font-medium text-slate-800 mb-4">Job Timeline</h3>
                <div className="relative border-l border-slate-200 ml-3 space-y-6">
                  {selectedJob.timeline.map((stage, idx) => (
                    <div key={idx} className="relative pl-6">
                      <div className={`absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full border-2 border-white ${
                        stage.status === 'completed' ? 'bg-emerald-500' : 
                        stage.status === 'in_progress' ? 'bg-blue-500 animate-pulse' : 
                        stage.status === 'failed' ? 'bg-red-500' : 'bg-slate-300'
                      }`}></div>
                      <p className="text-sm font-medium text-slate-800 leading-none">{stage.stage}</p>
                      {stage.time && (
                        <p className="text-xs text-slate-500 mt-1">{new Date(stage.time).toLocaleString()}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    );
  }

  // === RENDER LIST VIEW ===
  return (
    <div className="w-full bg-white min-h-[800px] text-slate-800 font-sans border border-slate-200 rounded-md shadow-sm flex flex-col">
      {/* Header & Controls */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">OneDrive Migration Monitor</h1>
            <p className="text-sm text-slate-500 mt-1">Real-time tracking and control for personal drive migrations.</p>
          </div>
          <div className="flex space-x-2">
            <button className="flex items-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-md transition-colors text-sm" onClick={handleExport}>
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
          <div className="flex items-center space-x-3 w-full md:w-auto">
            {/* Search */}
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search user or job ID..." 
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            {/* Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <select 
                className="pl-9 pr-8 py-2 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
              >
                <option value="ALL">All Statuses</option>
                <option value="QUEUED">Queued</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="FAILED">Failed</option>
                <option value="PARTIAL">Partially Completed</option>
              </select>
            </div>
          </div>
          
          {/* Bulk Actions */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500 mr-2 font-medium">{selectedRows.size} Selected</span>
            <button disabled={selectedRows.size === 0} className="p-2 border border-slate-300 rounded text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" title="Pause Selected">
              <Pause className="h-4 w-4" />
            </button>
            <button disabled={selectedRows.size === 0} className="p-2 border border-slate-300 rounded text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" title="Resume Selected">
              <Play className="h-4 w-4" />
            </button>
            <button disabled={selectedRows.size === 0} className="p-2 border border-slate-300 rounded text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" title="Cancel Selected">
              <XCircle className="h-4 w-4 text-red-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="flex-1 overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50 sticky top-0 z-10">
            <tr>
              <th scope="col" className="px-4 py-3 text-left">
                <input 
                  type="checkbox" 
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  checked={selectedRows.size === paginatedJobs.length && paginatedJobs.length > 0}
                  onChange={toggleAll}
                />
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Job ID</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">User</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[150px]">Progress</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Data Size</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Duration</th>
              <th scope="col" className="relative px-4 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {paginatedJobs.map((job) => (
              <tr key={job.id} className="hover:bg-blue-50/50 transition-colors group cursor-pointer" onClick={() => setSelectedJobId(job.id)}>
                <td className="px-4 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                  <input 
                    type="checkbox" 
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    checked={selectedRows.has(job.id)}
                    onChange={() => toggleRow(job.id)}
                  />
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{job.id}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-600">{job.user}</td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <StatusBadge status={job.status} pulse />
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <div className="w-full bg-slate-200 rounded-full h-1.5 w-24">
                      <div className={`h-1.5 rounded-full ${job.status === 'FAILED' ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${job.progress}%` }}></div>
                    </div>
                    <span className="text-xs text-slate-500 font-medium w-8">{job.progress.toFixed(0)}%</span>
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">{job.dataSize}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-500">{job.duration}</td>
                <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                  <button className="text-slate-400 hover:text-slate-600 p-1">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            {paginatedJobs.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center">
                    <Search className="h-8 w-8 text-slate-300 mb-3" />
                    <p className="text-base font-medium text-slate-800">No jobs found</p>
                    <p className="text-sm mt-1">Try adjusting your filters or search query.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between">
        <div className="text-sm text-slate-500">
          Showing <span className="font-medium text-slate-800">{filteredJobs.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium text-slate-800">{Math.min(currentPage * itemsPerPage, filteredJobs.length)}</span> of <span className="font-medium text-slate-800">{filteredJobs.length}</span> results
        </div>
        <div className="flex space-x-2">
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => p - 1)}
            className="px-3 py-1.5 border border-slate-300 rounded text-sm font-medium bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button 
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => setCurrentPage(p => p + 1)}
            className="px-3 py-1.5 border border-slate-300 rounded text-sm font-medium bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
