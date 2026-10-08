import React, { useState, useReducer, useEffect, useMemo, KeyboardEvent } from 'react';
import {
  AlertCircle, AlertTriangle, CheckCircle, Search, Filter, Download,
  RefreshCw, SkipForward, Edit3, ChevronDown, ChevronUp, Terminal,
  Clock, FileText, Mail, FileWarning, Key, XCircle, FileClock,
  Zap, Play, ArrowRight, X, Info
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';

// --- TYPES ---
type Severity = 'CRITICAL' | 'WARNING' | 'INFO';
type ErrorStatus = 'OPEN' | 'RESOLVED' | 'SKIPPED' | 'RETRYING';
type ErrorCategory = 'authentication' | 'throttling' | 'file_locked' | 'path_too_long' | 'unsupported_characters' | 'mapping_conflict';

interface MigrationError {
  id: string;
  timestamp: string;
  item: string;
  category: ErrorCategory;
  severity: Severity;
  status: ErrorStatus;
  message: string;
  stackTrace: string;
  remediation: string;
}

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
}

interface State {
  errors: MigrationError[];
  selectedIds: Set<string>;
  expandedId: string | null;
  searchQuery: string;
  categoryFilter: ErrorCategory | 'ALL';
  severityFilter: Severity | 'ALL';
  toasts: ToastMessage[];
}

type Action =
  | { type: 'SET_ERRORS'; payload: MigrationError[] }
  | { type: 'TOGGLE_SELECT'; payload: string }
  | { type: 'TOGGLE_SELECT_ALL' }
  | { type: 'TOGGLE_EXPAND'; payload: string }
  | { type: 'SET_SEARCH'; payload: string }
  | { type: 'SET_FILTER'; payload: { key: 'category' | 'severity'; value: any } }
  | { type: 'UPDATE_ERROR_STATUS'; payload: { ids: string[]; status: ErrorStatus } }
  | { type: 'ADD_TOAST'; payload: Omit<ToastMessage, 'id'> }
  | { type: 'REMOVE_TOAST'; payload: string };

// --- REDUCER ---
const initialState: State = {
  errors: [],
  selectedIds: new Set(),
  expandedId: null,
  searchQuery: '',
  categoryFilter: 'ALL',
  severityFilter: 'ALL',
  toasts: [],
};

function errorReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_ERRORS':
      return { ...state, errors: action.payload };
    case 'TOGGLE_SELECT': {
      const newSet = new Set(state.selectedIds);
      if (newSet.has(action.payload)) newSet.delete(action.payload);
      else newSet.add(action.payload);
      return { ...state, selectedIds: newSet };
    }
    case 'TOGGLE_SELECT_ALL': {
      if (state.selectedIds.size === state.errors.length) return { ...state, selectedIds: new Set() };
      return { ...state, selectedIds: new Set(state.errors.map(e => e.id)) };
    }
    case 'TOGGLE_EXPAND':
      return { ...state, expandedId: state.expandedId === action.payload ? null : action.payload };
    case 'SET_SEARCH':
      return { ...state, searchQuery: action.payload };
    case 'SET_FILTER':
      if (action.payload.key === 'category') return { ...state, categoryFilter: action.payload.value };
      if (action.payload.key === 'severity') return { ...state, severityFilter: action.payload.value };
      return state;
    case 'UPDATE_ERROR_STATUS':
      return {
        ...state,
        errors: state.errors.map(e =>
          action.payload.ids.includes(e.id) ? { ...e, status: action.payload.status } : e
        ),
        selectedIds: new Set(), // clear selection after action
      };
    case 'ADD_TOAST':
      return {
        ...state,
        toasts: [...state.toasts, { ...action.payload, id: Math.random().toString(36).substr(2, 9) }],
      };
    case 'REMOVE_TOAST':
      return { ...state, toasts: state.toasts.filter(t => t.id !== action.payload) };
    default:
      return state;
  }
}

// --- MOCK DATA SEED ---
const MOCK_ERRORS: MigrationError[] = [
  {
    id: 'ERR-9402', timestamp: '2026-09-17T06:22:15Z', item: 'john.doe@contoso.com/Documents/2025_Q1_Financials_Very_Long_Name_That_Exceeds_Limits.xlsx',
    category: 'path_too_long', severity: 'WARNING', status: 'OPEN',
    message: 'The specified file or folder name is too long.',
    stackTrace: 'Error: PathLengthExceededException\n  at GraphServiceClient.uploadSession (graph.ts:402)\n  at processChunk (transfer.ts:182)\n  at async Worker.execute (worker.ts:55)',
    remediation: 'Rename the file or map it to a shorter destination path before retrying.'
  },
  {
    id: 'ERR-9401', timestamp: '2026-09-17T06:21:40Z', item: 'jane.smith@contoso.com/Mailbox',
    category: 'authentication', severity: 'CRITICAL', status: 'OPEN',
    message: 'Application authentication failed. Invalid client secret.',
    stackTrace: 'Error: AuthFailedException\n  at AuthProvider.getToken (auth.ts:114)\n  at ConnectionPool.acquire (pool.ts:45)\n  at async Task.start (task.ts:22)',
    remediation: 'Verify the Azure AD Application client secret in the tenant connection settings.'
  },
  {
    id: 'ERR-9398', timestamp: '2026-09-17T06:15:10Z', item: 'admin@contoso.com/Drive/Annual_Report_2025.docx',
    category: 'file_locked', severity: 'WARNING', status: 'OPEN',
    message: 'The file is currently locked for editing by another user.',
    stackTrace: 'Error: FileLockedException\n  at SharePointAPI.getFile (sp.ts:88)\n  at TransferNode.read (node.ts:45)',
    remediation: 'Wait for the user to release the lock, or use the "Force Copy" action to grab the last saved version.'
  },
  {
    id: 'ERR-9380', timestamp: '2026-09-17T06:02:00Z', item: 'System/SharePoint_API_Batch',
    category: 'throttling', severity: 'WARNING', status: 'RESOLVED',
    message: 'Too many requests. 429 Too Many Requests.',
    stackTrace: 'Error: GraphThrottledException\n  at HttpHandler.execute (http.ts:502)',
    remediation: 'Automatic backoff applied. No manual action required.'
  },
  {
    id: 'ERR-9375', timestamp: '2026-09-17T05:50:42Z', item: 'sales@contoso.com/Drive/Budget<2025>.xlsx',
    category: 'unsupported_characters', severity: 'CRITICAL', status: 'OPEN',
    message: 'The file name contains invalid characters (<, >).',
    stackTrace: 'Error: InvalidNameException\n  at Validator.checkName (validator.ts:33)',
    remediation: 'Rename the file to remove unsupported characters and retry the item.'
  },
  {
    id: 'ERR-9366', timestamp: '2026-09-17T05:45:12Z', item: 'marketing_team@contoso.com',
    category: 'mapping_conflict', severity: 'CRITICAL', status: 'OPEN',
    message: 'Target email alias already exists on another user object in destination tenant.',
    stackTrace: 'Error: DuplicateTargetAliasException\n  at IdentityMapper.validate (mapper.ts:205)',
    remediation: 'Resolve conflict by manually mapping to a different target UPN or overwriting.'
  }
];

const TREND_DATA = [
  { time: '01:00', errors: 2 },
  { time: '02:00', errors: 5 },
  { time: '03:00', errors: 12 },
  { time: '04:00', errors: 8 },
  { time: '05:00', errors: 24 },
  { time: '06:00', errors: 14 },
];

const CATEGORY_COLORS: Record<ErrorCategory, string> = {
  authentication: '#ef4444',
  throttling: '#f59e0b',
  file_locked: '#8b5cf6',
  path_too_long: '#06b6d4',
  unsupported_characters: '#f43f5e',
  mapping_conflict: '#ec4899',
};

const CATEGORY_LABELS: Record<ErrorCategory, string> = {
  authentication: 'Authentication',
  throttling: 'API Throttling',
  file_locked: 'File Locked',
  path_too_long: 'Path Too Long',
  unsupported_characters: 'Invalid Chars',
  mapping_conflict: 'Mapping Conflict',
};

// --- COMPONENTS ---

const Badge = ({ children, colorClass }: { children: React.ReactNode; colorClass: string }) => (
  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold tracking-wide border uppercase ${colorClass}`}>
    {children}
  </span>
);

export const ErrorManagementDashboard: React.FC = () => {
  const [state, dispatch] = useReducer(errorReducer, initialState);

  useEffect(() => {
    dispatch({ type: 'SET_ERRORS', payload: MOCK_ERRORS });
    
    // Simulate initial critical error check
    const criticalCount = MOCK_ERRORS.filter(e => e.severity === 'CRITICAL' && e.status === 'OPEN').length;
    if (criticalCount > 0) {
      dispatch({
        type: 'ADD_TOAST',
        payload: { type: 'error', title: 'Critical Alerts Detected', message: `Found ${criticalCount} active critical migration errors requiring immediate action.` }
      });
    }
  }, []);

  // Filtered List
  const filteredErrors = useMemo(() => {
    return state.errors.filter(err => {
      const matchSearch = err.item.toLowerCase().includes(state.searchQuery.toLowerCase()) || err.message.toLowerCase().includes(state.searchQuery.toLowerCase());
      const matchCat = state.categoryFilter === 'ALL' || err.category === state.categoryFilter;
      const matchSev = state.severityFilter === 'ALL' || err.severity === state.severityFilter;
      return matchSearch && matchCat && matchSev;
    });
  }, [state.errors, state.searchQuery, state.categoryFilter, state.severityFilter]);

  // Derived Stats
  const stats = useMemo(() => {
    return {
      total: state.errors.length,
      critical: state.errors.filter(e => e.severity === 'CRITICAL' && e.status === 'OPEN').length,
      warnings: state.errors.filter(e => e.severity === 'WARNING' && e.status === 'OPEN').length,
      resolved: state.errors.filter(e => e.status === 'RESOLVED').length,
    };
  }, [state.errors]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    state.errors.forEach(e => {
      counts[e.category] = (counts[e.category] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({
      name: name as ErrorCategory,
      count
    })).sort((a, b) => b.count - a.count);
  }, [state.errors]);

  // Actions
  const handleBulkRetry = () => {
    if (state.selectedIds.size === 0) return;
    dispatch({ type: 'UPDATE_ERROR_STATUS', payload: { ids: Array.from(state.selectedIds), status: 'RETRYING' } });
    dispatch({
      type: 'ADD_TOAST',
      payload: { type: 'info', title: 'Bulk Retry Initiated', message: `Queued ${state.selectedIds.size} items with exponential backoff strategy.` }
    });
  };

  const handleAction = (id: string, actionType: 'RETRY' | 'RESOLVE' | 'SKIP', actionName: string) => {
    const newStatus = actionType === 'RETRY' ? 'RETRYING' : actionType === 'RESOLVE' ? 'RESOLVED' : 'SKIPPED';
    dispatch({ type: 'UPDATE_ERROR_STATUS', payload: { ids: [id], status: newStatus } });
    dispatch({
      type: 'ADD_TOAST',
      payload: { type: 'success', title: `Action Completed: ${actionName}`, message: `Successfully updated item status to ${newStatus}.` }
    });
  };

  const handleKeyDown = (e: KeyboardEvent, id: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      dispatch({ type: 'TOGGLE_EXPAND', payload: id });
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn relative text-slate-200">
      
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none w-80">
        {state.toasts.map(toast => (
          <div key={toast.id} className={`p-4 rounded-lg shadow-xl border pointer-events-auto transition-all animate-slideDown flex items-start gap-3 ${
            toast.type === 'error' ? 'bg-rose-950/90 border-rose-800/50 text-rose-200' :
            toast.type === 'success' ? 'bg-emerald-950/90 border-emerald-800/50 text-emerald-200' :
            toast.type === 'warning' ? 'bg-amber-950/90 border-amber-800/50 text-amber-200' :
            'bg-blue-950/90 border-blue-800/50 text-blue-200'
          }`}>
            {toast.type === 'error' && <XCircle className="w-5 h-5 shrink-0" />}
            {toast.type === 'success' && <CheckCircle className="w-5 h-5 shrink-0" />}
            {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 shrink-0" />}
            {toast.type === 'info' && <Info className="w-5 h-5 shrink-0" />}
            
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold truncate">{toast.title}</h4>
              <p className="text-xs opacity-90 mt-0.5">{toast.message}</p>
            </div>
            <button onClick={() => dispatch({ type: 'REMOVE_TOAST', payload: toast.id })} className="shrink-0 opacity-70 hover:opacity-100" aria-label="Close notification">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Recovery & Rollback Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Diagnose, remediate, and retry failed operations across the migration pipeline.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleBulkRetry}
            disabled={state.selectedIds.size === 0}
            className="px-4 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:bg-white dark:bg-slate-800 disabled:text-slate-500 text-slate-900 dark:text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Bulk Retry ({state.selectedIds.size})
          </button>
          <button className="px-4 py-2 text-sm font-medium bg-white dark:bg-slate-800 hover:bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors flex items-center gap-2 border border-slate-200 dark:border-slate-700">
            <Download className="w-4 h-4" /> Export Logs
          </button>
        </div>
      </div>

      {/* Summary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-sm font-medium">Total Errors logged</span>
            <FileWarning className="w-4 h-4" />
          </div>
          <div className="mt-4 text-3xl font-bold text-slate-900 dark:text-white">{stats.total}</div>
        </div>
        <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/30 flex flex-col justify-between">
          <div className="flex items-center justify-between text-rose-400">
            <span className="text-sm font-medium">Critical Failures</span>
            <XCircle className="w-4 h-4" />
          </div>
          <div className="mt-4 text-3xl font-bold text-rose-500">{stats.critical}</div>
        </div>
        <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-900/30 flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-sm font-medium">Warnings (Soft Failures)</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="mt-4 text-3xl font-bold text-amber-500">{stats.warnings}</div>
        </div>
        <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/30 flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-sm font-medium">Resolved / Recovered</span>
            <CheckCircle className="w-4 h-4" />
          </div>
          <div className="mt-4 text-3xl font-bold text-emerald-500">{stats.resolved}</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Chart */}
        <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Error Frequency (Last 6 hours)</h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={TREND_DATA} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorErrors" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', color: '#f8fafc', fontSize: '12px' }} />
                <Area type="monotone" dataKey="errors" stroke="#f43f5e" fillOpacity={1} fill="url(#colorErrors)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Categories Distribution */}
        <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Common Error Types</h3>
          <div className="space-y-4">
            {categoryCounts.map((cat) => (
              <div key={cat.name} className="flex items-center justify-between gap-4">
                <div className="w-36 truncate text-xs text-slate-600 dark:text-slate-300 font-medium">
                  {CATEGORY_LABELS[cat.name]}
                </div>
                <div className="flex-1 bg-white dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max((cat.count / stats.total) * 100, 2)}%`,
                      backgroundColor: CATEGORY_COLORS[cat.name]
                    }}
                  />
                </div>
                <div className="w-10 text-right text-xs font-mono text-slate-500 dark:text-slate-400">{cat.count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Error List Section */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 overflow-hidden">
        {/* Controls */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center gap-4 bg-slate-50 dark:bg-slate-900/80">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search errors by item path, message or ID..."
              value={state.searchQuery}
              onChange={e => dispatch({ type: 'SET_SEARCH', payload: e.target.value })}
              className="w-full bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <select
                value={state.categoryFilter}
                onChange={e => dispatch({ type: 'SET_FILTER', payload: { key: 'category', value: e.target.value } })}
                className="bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-600 dark:text-slate-300 focus:outline-none focus:border-blue-500"
                aria-label="Filter by category"
              >
                <option value="ALL">All Categories</option>
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <select
              value={state.severityFilter}
              onChange={e => dispatch({ type: 'SET_FILTER', payload: { key: 'severity', value: e.target.value } })}
              className="bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-600 dark:text-slate-300 focus:outline-none focus:border-blue-500"
              aria-label="Filter by severity"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="WARNING">Warning</option>
            </select>
          </div>
        </div>

        {/* List Header */}
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-900">
          <div className="col-span-1 flex items-center">
            <input
              type="checkbox"
              checked={state.selectedIds.size === filteredErrors.length && filteredErrors.length > 0}
              onChange={() => dispatch({ type: 'TOGGLE_SELECT_ALL' })}
              className="rounded border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-900"
              aria-label="Select all errors"
            />
          </div>
          <div className="col-span-2">ID & Time</div>
          <div className="col-span-4">Affected Item</div>
          <div className="col-span-2">Category</div>
          <div className="col-span-1">Severity</div>
          <div className="col-span-2">Status</div>
        </div>

        {/* List Body */}
        <div className="divide-y divide-slate-800/60 max-h-[600px] overflow-y-auto">
          {filteredErrors.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              No errors found matching the current filters.
            </div>
          ) : (
            filteredErrors.map((err) => {
              const isExpanded = state.expandedId === err.id;
              const isSelected = state.selectedIds.has(err.id);
              
              return (
                <div key={err.id} className={`transition-colors ${isExpanded ? 'bg-white dark:bg-slate-800/30' : 'hover:bg-white dark:bg-slate-800/20'}`}>
                  {/* Row Summary */}
                  <div 
                    className="grid grid-cols-12 gap-4 p-4 items-center cursor-pointer select-none"
                    onClick={() => dispatch({ type: 'TOGGLE_EXPAND', payload: err.id })}
                    onKeyDown={(e) => handleKeyDown(e, err.id)}
                    tabIndex={0}
                    role="button"
                    aria-expanded={isExpanded}
                  >
                    <div className="col-span-1 flex items-center" onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => dispatch({ type: 'TOGGLE_SELECT', payload: err.id })}
                        className="rounded border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-900"
                        aria-label={`Select error ${err.id}`}
                      />
                    </div>
                    <div className="col-span-2">
                      <div className="text-sm font-mono text-slate-600 dark:text-slate-300">{err.id}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{new Date(err.timestamp).toLocaleTimeString()}</div>
                    </div>
                    <div className="col-span-4 pr-4">
                      <div className="text-sm text-slate-200 truncate" title={err.item}>{err.item}</div>
                      <div className="text-xs text-slate-500 truncate mt-0.5" title={err.message}>{err.message}</div>
                    </div>
                    <div className="col-span-2">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[err.category] }} />
                        {CATEGORY_LABELS[err.category]}
                      </div>
                    </div>
                    <div className="col-span-1">
                      {err.severity === 'CRITICAL' ? (
                        <Badge colorClass="bg-rose-500/10 text-rose-400 border-rose-500/20">Critical</Badge>
                      ) : (
                        <Badge colorClass="bg-amber-500/10 text-amber-400 border-amber-500/20">Warning</Badge>
                      )}
                    </div>
                    <div className="col-span-2 flex items-center justify-between">
                      {err.status === 'OPEN' && <Badge colorClass="bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-700">Open</Badge>}
                      {err.status === 'RESOLVED' && <Badge colorClass="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Resolved</Badge>}
                      {err.status === 'SKIPPED' && <Badge colorClass="bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20">Skipped</Badge>}
                      {err.status === 'RETRYING' && <Badge colorClass="bg-blue-500/10 text-blue-400 border-blue-500/20 flex gap-1 items-center"><RefreshCw className="w-3 h-3 animate-spin"/> Retrying</Badge>}
                      
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="p-4 pt-0 pl-[calc(8.333%+1rem)] pr-4 animate-slideDown border-t border-slate-200 dark:border-slate-800/40 mt-2">
                      <div className="bg-slate-950 rounded-lg p-5 border border-slate-200 dark:border-slate-800 grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4 shadow-inner">
                        
                        {/* Left Col: Details & Stack trace */}
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                              <AlertCircle className="w-4 h-4" /> Diagnostic Information
                            </h4>
                            <p className="text-sm text-slate-600 dark:text-slate-300">{err.message}</p>
                          </div>
                          <div>
                            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                              <Terminal className="w-4 h-4" /> Stack Trace
                            </h4>
                            <pre className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded text-xs font-mono text-slate-500 dark:text-slate-400 whitespace-pre-wrap overflow-x-auto shadow-inner">
                              {err.stackTrace}
                            </pre>
                          </div>
                        </div>

                        {/* Right Col: Remediation & Actions */}
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                              <Play className="w-4 h-4" /> Guided Troubleshooting
                            </h4>
                            <div className="bg-blue-950/20 border border-blue-900/30 p-4 rounded-lg text-sm text-blue-200">
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 mt-0.5">
                                  <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-bold">1</div>
                                </div>
                                <div>
                                  <span className="font-semibold text-blue-300">Diagnosis:</span> {err.message}
                                </div>
                              </div>
                              <div className="flex items-start gap-3 mt-3">
                                <div className="flex-shrink-0 mt-0.5">
                                  <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-bold">2</div>
                                </div>
                                <div>
                                  <span className="font-semibold text-blue-300">Suggested Action:</span> {err.remediation}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Quick Actions</h4>
                            <div className="flex flex-wrap gap-2">
                              {err.status === 'OPEN' ? (
                                <>
                                  <button 
                                    onClick={() => handleAction(err.id, 'RETRY', 'Exponential Retry')}
                                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium flex items-center gap-1.5 transition-colors"
                                  >
                                    <RefreshCw className="w-3.5 h-3.5" /> Exponential Retry
                                  </button>
                                  
                                  {err.category === 'mapping_conflict' && (
                                    <button 
                                      onClick={() => handleAction(err.id, 'RESOLVE', 'Manual Remap')}
                                      className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium flex items-center gap-1.5 transition-colors"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" /> Manual Remap
                                    </button>
                                  )}
                                  
                                  {(err.category === 'path_too_long' || err.category === 'unsupported_characters') && (
                                    <button 
                                      onClick={() => handleAction(err.id, 'RESOLVE', 'Auto-Rename & Resolve')}
                                      className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium flex items-center gap-1.5 transition-colors"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" /> Auto-Rename
                                    </button>
                                  )}
                                  
                                  {err.category === 'file_locked' && (
                                    <button 
                                      onClick={() => handleAction(err.id, 'RESOLVE', 'Force Overwrite')}
                                      className="px-3 py-2 bg-rose-600 hover:bg-rose-500 text-slate-900 dark:text-white rounded text-xs font-medium flex items-center gap-1.5 transition-colors"
                                    >
                                      <Zap className="w-3.5 h-3.5" /> Force Overwrite
                                    </button>
                                  )}
                                  
                                  <button 
                                    onClick={() => handleAction(err.id, 'SKIP', 'Skip Item')}
                                    className="px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-200 dark:border-slate-700"
                                  >
                                    <SkipForward className="w-3.5 h-3.5" /> Skip
                                  </button>
                                </>
                              ) : (
                                <span className="text-sm text-slate-500 italic">No further actions required. Item is {err.status.toLowerCase()}.</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
