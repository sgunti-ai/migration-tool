import React, { useState, useEffect, useMemo } from 'react';
import {  
  Users,
  Activity,
  CheckCircle2,
  XCircle,
  HardDrive,
  TrendingUp,
  Clock,
  AlertTriangle,
  Play,
  Pause,
  ArrowUpRight,
  RefreshCw,
  Bell,
  ShieldCheck,
  FileWarning,
  ExternalLink,
  Layers,
  Sparkles,
  Database,
  ArrowRight,
  RotateCcw,
  Zap,
  Info,
  Check,
  Eye,
  Moon,
  Sun,
  Search,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {  
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {   MigrationJob, TenantStatusResponse, AdminRole } from '../../types';

interface MigrationToolDashboardProps {
  currentRole?: AdminRole;
  tenantStatus?: TenantStatusResponse;
  onNavigateTab?: (tab: any, subTab?: any) => void;
  onOpenAdvisor?: () => void;
}

type TimeRange = '24h' | '7d' | '30d';

// --- DATASETS FOR MIGRATION PROGRESS OVER TIME ---
const PROGRESS_DATA_24H = [
  { time: '00:00', completed: 120, inProgress: 18, scheduled: 45 },
  { time: '03:00', completed: 210, inProgress: 22, scheduled: 40 },
  { time: '06:00', completed: 340, inProgress: 35, scheduled: 32 },
  { time: '09:00', completed: 580, inProgress: 42, scheduled: 25 },
  { time: '12:00', completed: 820, inProgress: 38, scheduled: 20 },
  { time: '15:00', completed: 1050, inProgress: 40, scheduled: 15 },
  { time: '18:00', completed: 1240, inProgress: 36, scheduled: 10 },
  { time: '21:00', completed: 1392, inProgress: 34, scheduled: 8 },
];

const PROGRESS_DATA_7D = [
  { time: 'Mon', completed: 320, inProgress: 48, scheduled: 180 },
  { time: 'Tue', completed: 540, inProgress: 52, scheduled: 150 },
  { time: 'Wed', completed: 780, inProgress: 45, scheduled: 120 },
  { time: 'Thu', completed: 960, inProgress: 40, scheduled: 90 },
  { time: 'Fri', completed: 1150, inProgress: 38, scheduled: 60 },
  { time: 'Sat', completed: 1290, inProgress: 35, scheduled: 30 },
  { time: 'Sun', completed: 1392, inProgress: 34, scheduled: 15 },
];

const PROGRESS_DATA_30D = [
  { time: 'Week 1', completed: 240, inProgress: 60, scheduled: 450 },
  { time: 'Week 2', completed: 620, inProgress: 55, scheduled: 340 },
  { time: 'Week 3', completed: 1040, inProgress: 42, scheduled: 200 },
  { time: 'Week 4', completed: 1392, inProgress: 34, scheduled: 54 },
];

// --- WORKLOAD DISTRIBUTION DATA (Donut Chart) ---
const WORKLOAD_DATA = [
  { name: 'OneDrive', count: 540, dataGB: 676.3, color: '#0284c7', share: '36.5%' },
  { name: 'Exchange', count: 460, dataGB: 108.8, color: '#2563eb', share: '31.1%' },
  { name: 'SharePoint', count: 280, dataGB: 1101.5, color: '#0d9488', share: '18.9%' },
  { name: 'Teams', count: 200, dataGB: 42.8, color: '#6366f1', share: '13.5%' },
];

// --- DEPARTMENT STATUS DATA (Bar Chart) ---
const DEPARTMENT_DATA = [
  { department: 'Engineering', completed: 320, inProgress: 12, pending: 15, failed: 2 },
  { department: 'Sales & Mktg', completed: 280, inProgress: 8, pending: 10, failed: 1 },
  { department: 'Finance', completed: 190, inProgress: 5, pending: 4, failed: 1 },
  { department: 'HR & People', completed: 160, inProgress: 4, pending: 8, failed: 1 },
  { department: 'Operations', completed: 210, inProgress: 3, pending: 6, failed: 2 },
  { department: 'Legal & Exec', completed: 110, inProgress: 1, pending: 2, failed: 0 },
  { department: 'Support', completed: 122, inProgress: 1, pending: 3, failed: 1 },
];

// --- DATA THROUGHPUT OVER TIME (Area Chart) ---
const THROUGHPUT_DATA = [
  { time: '00:00', throughputMBs: 180, activeStreams: 14 },
  { time: '02:00', throughputMBs: 240, activeStreams: 18 },
  { time: '04:00', throughputMBs: 310, activeStreams: 24 },
  { time: '06:00', throughputMBs: 480, activeStreams: 32 },
  { time: '08:00', throughputMBs: 720, activeStreams: 44 },
  { time: '10:00', throughputMBs: 840, activeStreams: 48 }, // peak
  { time: '12:00', throughputMBs: 690, activeStreams: 42 },
  { time: '14:00', throughputMBs: 750, activeStreams: 46 },
  { time: '16:00', throughputMBs: 630, activeStreams: 38 },
  { time: '18:00', throughputMBs: 580, activeStreams: 35 },
  { time: '20:00', throughputMBs: 512, activeStreams: 34 },
  { time: '22:00', throughputMBs: 490, activeStreams: 32 },
];

// --- RECENT MIGRATION JOBS DATA ---
interface MigrationJobItem {
  id: string;
  name: string;
  workload: string;
  sourceTenant: string;
  targetTenant: string;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'PAUSED';
  totalUsers: number;
  completedUsers: number;
  dataTransferredGB: number;
  duration: string;
  startedAt: string;
}

const INITIAL_JOBS: MigrationJobItem[] = [
  {
    id: 'JOB-M365-8941',
    name: 'Wave 4 - Executive Mailboxes & OneDrive Sync',
    workload: 'Exchange & OneDrive',
    sourceTenant: 'contoso.onmicrosoft.com',
    targetTenant: 'fabrikam.com',
    status: 'PROCESSING',
    totalUsers: 50,
    completedUsers: 34,
    dataTransferredGB: 412.8,
    duration: '42m elapsed',
    startedAt: '12 mins ago',
  },
  {
    id: 'JOB-M365-8940',
    name: 'Wave 3 - Engineering & DevOps Mailboxes',
    workload: 'Exchange Online',
    sourceTenant: 'contoso.onmicrosoft.com',
    targetTenant: 'fabrikam.com',
    status: 'COMPLETED',
    totalUsers: 320,
    completedUsers: 320,
    dataTransferredGB: 2840.4,
    duration: '2h 14m',
    startedAt: '3 hours ago',
  },
  {
    id: 'JOB-M365-8939',
    name: 'SharePoint Document Libraries - Marketing Collateral',
    workload: 'SharePoint',
    sourceTenant: 'contoso.onmicrosoft.com',
    targetTenant: 'fabrikam.com',
    status: 'COMPLETED',
    totalUsers: 140,
    completedUsers: 140,
    dataTransferredGB: 1101.5,
    duration: '1h 48m',
    startedAt: '5 hours ago',
  },
  {
    id: 'JOB-M365-8938',
    name: 'Wave 2 - Sales Team Archives & Personal Sites',
    workload: 'OneDrive',
    sourceTenant: 'contoso.onmicrosoft.com',
    targetTenant: 'fabrikam.com',
    status: 'FAILED',
    totalUsers: 85,
    completedUsers: 77,
    dataTransferredGB: 680.2,
    duration: '1h 05m',
    startedAt: '8 hours ago',
  },
  {
    id: 'JOB-M365-8937',
    name: 'Teams Channel History & Tab Provisioning Batch A',
    workload: 'Teams',
    sourceTenant: 'contoso.onmicrosoft.com',
    targetTenant: 'fabrikam.com',
    status: 'PAUSED',
    totalUsers: 45,
    completedUsers: 28,
    dataTransferredGB: 38.6,
    duration: 'Paused by admin',
    startedAt: '11 hours ago',
  },
];

// --- ERROR ALERTS DATA WITH RESOLUTION ACTIONS ---
interface ErrorAlertItem {
  id: string;
  code: string;
  severity: 'CRITICAL' | 'HIGH' | 'WARNING';
  workload: string;
  affectedItem: string;
  message: string;
  actionLabel: string;
  resolved?: boolean;
  resolutionMessage?: string;
}

const INITIAL_ERRORS: ErrorAlertItem[] = [
  {
    id: 'ERR-THROTTLE-429',
    code: 'GraphAPI:Throttled:429',
    severity: 'CRITICAL',
    workload: 'Exchange Online',
    affectedItem: '14 Mailboxes (Batch 4-B)',
    message: 'Target tenant EWS/Graph API throughput rate limit exceeded. Batch queued for backoff retry.',
    actionLabel: 'Apply Exponential Backoff',
  },
  {
    id: 'ERR-LICENSE-SKU',
    code: 'Licensing:PlanMissing:501',
    severity: 'CRITICAL',
    workload: 'Entra ID & Exchange',
    affectedItem: 'enrico.catta@fabrikam.com + 3 others',
    message: 'Destination Exchange Plan 2 license quota depleted. Mailbox provisioning suspended.',
    actionLabel: 'Auto-Assign Spare E5 SKU',
  },
  {
    id: 'ERR-PATH-LIMIT',
    code: 'OneDrive:PathLengthExceeded',
    severity: 'HIGH',
    workload: 'OneDrive for Business',
    affectedItem: 'diego.siciliani@contoso.onmicrosoft.com/Archive',
    message: 'Deep folder nesting hierarchy exceeds 400 UTF-16 character limit during target creation.',
    actionLabel: 'Auto-Truncate & Retry',
  },
  {
    id: 'ERR-DELEGATE-ACL',
    code: 'Exchange:DelegateMappingMismatch',
    severity: 'WARNING',
    workload: 'Exchange Online',
    affectedItem: 'Leadership Shared Mailbox',
    message: 'Target delegate principal not yet provisioned in destination tenant directory.',
    actionLabel: 'Defer Delegate ACL & Proceed',
  },
];

// --- USER NOTIFICATIONS DATA ---
interface NotificationItem {
  id: string;
  title: string;
  category: 'CUTOVER' | 'SECURITY' | 'SYNC' | 'CONFIG';
  timestamp: string;
  read: boolean;
  message: string;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'NOTIF-101',
    title: 'Cutover Window Scheduled',
    category: 'CUTOVER',
    timestamp: '10 mins ago',
    read: false,
    message: 'Final cutover synchronization window approved for Wave 4 accounts on Friday at 22:00 UTC.',
  },
  {
    id: 'NOTIF-102',
    title: 'Tenant Admin Consent Validated',
    category: 'SECURITY',
    timestamp: '45 mins ago',
    read: false,
    message: 'Microsoft Graph multi-tenant permissions (Mail.ReadWrite, Files.ReadWrite.All) verified on fabrikam.com.',
  },
  {
    id: 'NOTIF-103',
    title: 'Pre-Migration Delta Sync Completed',
    category: 'SYNC',
    timestamp: '2 hours ago',
    read: true,
    message: 'Daily background delta sync scanned 1,392 mailboxes. 4,180 updated items transferred with 0 data loss.',
  },
  {
    id: 'NOTIF-104',
    title: 'Domain Rewrite MX Verification',
    category: 'CONFIG',
    timestamp: '5 hours ago',
    read: true,
    message: 'DNS MX record TTL reduced to 300 seconds across contoso.com in preparation for final cutover.',
  },
];

export const MigrationToolDashboard: React.FC<MigrationToolDashboardProps> = ({
  currentRole = 'GLOBAL_ADMIN',
  tenantStatus,
  onNavigateTab,
  onOpenAdvisor,
}) => {
  // --- STATE ---
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [jobs, setJobs] = useState<MigrationJobItem[]>(INITIAL_JOBS);
  const [errors, setErrors] = useState<ErrorAlertItem[]>(INITIAL_ERRORS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [activeWorkloadHover, setActiveWorkloadHover] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);

  // Fetch live jobs from API if available to supplement dashboard
  useEffect(() => {
    let isMounted = true;
    const loadLiveJobData = async () => {
      try {
        const res = await fetch('/api/jobs');
        if (res.ok) {
          const apiJobs = await res.json();
          if (Array.isArray(apiJobs) && apiJobs.length > 0 && isMounted) {
            // Map live database jobs to the dashboard structure
            const mappedLiveJobs: MigrationJobItem[] = apiJobs.map((j: any) => ({
              id: j.id.length > 15 ? `JOB-${j.id.slice(-6).toUpperCase()}` : j.id,
              name: `Tenant Migration: ${j.sourceTenantDomain} → ${j.targetTenantDomain}`,
              workload: 'Exchange & OneDrive',
              sourceTenant: j.sourceTenantDomain,
              targetTenant: j.targetTenantDomain,
              status: (j.status as any) || 'COMPLETED',
              totalUsers: j.totalUsers || 2,
              completedUsers: j.completedUsers || 2,
              dataTransferredGB: Number(((j.completedUsers || 2) * 14.5).toFixed(1)),
              duration: j.status === 'PROCESSING' ? 'In Progress' : '18m elapsed',
              startedAt: 'Recent',
            }));

            // Merge with default seed jobs
            setJobs((prev) => {
              const ids = new Set(mappedLiveJobs.map((item) => item.id));
              const remaining = prev.filter((item) => !ids.has(item.id));
              return [...mappedLiveJobs, ...remaining];
            });
          }
        }
      } catch (err) {
        // Fallback gracefully to default items
      }
    };

    loadLiveJobData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Quick action handler for resolving errors
  const handleResolveError = (errorId: string, actionName: string) => {
    setErrors((prev) =>
      prev.map((err) => {
        if (err.id === errorId) {
          return {
            ...err,
            resolved: true,
            resolutionMessage: `Action "${actionName}" executed successfully. Queued for validation.`,
          };
        }
        return err;
      })
    );

    setToastMessage(`Executed: ${actionName}`);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Quick action to mark all notifications as read
  const handleMarkAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setToastMessage('All notifications marked as read');
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setToastMessage('Dashboard telemetry refreshed');
      setTimeout(() => setToastMessage(null), 3000);
    }, 600);
  };

  // Progress dataset based on selected time range
  const currentProgressData = useMemo(() => {
    if (timeRange === '24h') return PROGRESS_DATA_24H;
    if (timeRange === '7d') return PROGRESS_DATA_7D;
    return PROGRESS_DATA_30D;
  }, [timeRange]);

  // Unresolved errors count
  const openErrorsCount = errors.filter((e) => !e.resolved).length;
  const unreadNotifCount = notifications.filter((n) => !n.read).length;

  const [searchQuery, setSearchQuery] = useState("");
  

  return (
    <div className="space-y-8 animate-fadeIn pb-8 text-slate-900 dark:text-white">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-slate-400" />
          <input
            type="text"
            placeholder="Search users, jobs, or workloads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:text-slate-200"
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (onOpenAdvisor) onOpenAdvisor();
              else {
                setToastMessage("AI Copilot analyzing migration risks...");
                setTimeout(() => setToastMessage(null), 3000);
              }
            }}
            className="px-3 py-2 text-xs font-semibold bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-lg transition border border-indigo-200 dark:border-indigo-500/20 flex items-center space-x-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Copilot Insights</span>
          </button>
        </div>
      </div>

      {/* Toast Alert Banner */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center space-x-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg shadow-xl text-xs font-semibold animate-slideDown">
          <Check className="w-4 h-4 text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header / Context Navigation Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wider">
              Control Center
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">v4.2 Enterprise Edition</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight mt-1">
            Microsoft 365 Migration Tool Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time cross-tenant telemetry, data migration pipeline velocity, and workload health across source & target tenants.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Tenant Pair Indicator */}
          <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-lg text-xs">
            <span className="text-slate-500 dark:text-slate-400">Pair:</span>
            <span className="text-blue-400 font-mono font-medium">
              {tenantStatus?.source?.domain || 'contoso.onmicrosoft.com'}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-emerald-400 font-mono font-medium">
              {tenantStatus?.target?.domain || 'fabrikam.com'}
            </span>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-800 hover:bg-slate-100 dark:bg-slate-700 hover:text-white rounded-lg border border-slate-200 dark:border-slate-700 transition flex items-center space-x-1.5"
            title="Refresh dashboard metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-400' : 'text-slate-500 dark:text-slate-400'}`} />
            <span>Refresh</span>
          </button>

          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('migrate', 'ad_express')}
              className="px-3.5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition shadow-sm flex items-center space-x-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Launch New Migration</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. TOP STATS CARDS (6 Distinct Key Metrics) */}
      {/* ========================================================================= */}
      <section aria-labelledby="top-stats-heading" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 id="top-stats-heading" className="text-sm font-semibold text-slate-600 dark:text-slate-300 tracking-wide uppercase">
            Key Migration Metrics
          </h2>
          <span className="text-xs text-slate-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Telemetry live
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* Card 1: Total Users to Migrate */}
          <div
            id="card-total-users"
            onClick={() => onNavigateTab && onNavigateTab('discovery')}
            className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-slate-200 dark:border-slate-700 transition-all flex flex-col justify-between shadow-sm cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Users to Migrate</span>
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">1,480</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1 truncate">
                <span className="text-emerald-400 font-medium">+128</span>
                <span>discovered this week</span>
              </div>
            </div>
          </div>

          {/* Card 2: Active Migrations */}
          <div
            id="card-active-migrations"
            onClick={() => onNavigateTab && onNavigateTab('migrate', 'projects')}
            className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-blue-500/30 hover:border-blue-500/50 transition-all flex flex-col justify-between shadow-sm bg-gradient-to-br from-blue-950/20 to-slate-900/80 cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Active Migrations</span>
              <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <Activity className="w-4 h-4 animate-pulse" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-sky-400 tracking-tight flex items-baseline gap-2">
                <span>34</span>
                <span className="text-xs font-normal text-sky-300/80">in-flight</span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                4 parallel worker waves
              </div>
            </div>
          </div>

          {/* Card 3: Completed Migrations */}
          <div
            id="card-completed-migrations"
            onClick={() => onNavigateTab && onNavigateTab('reports')}
            className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-slate-200 dark:border-slate-700 transition-all flex flex-col justify-between shadow-sm cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Completed Migrations</span>
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">1,392</div>
              <div className="text-[11px] text-emerald-400 font-medium mt-1 truncate">
                94.05% of tenant fleet
              </div>
            </div>
          </div>

          {/* Card 4: Failed Migrations */}
          <div
            id="card-failed-migrations"
            onClick={() => onNavigateTab && onNavigateTab('recover')}
            className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-rose-500/40 transition-all flex flex-col justify-between shadow-sm cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Failed Migrations</span>
              <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <XCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-rose-400 tracking-tight">8</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                {openErrorsCount > 0 ? `${openErrorsCount} critical alerts open` : 'Requires action'}
              </div>
            </div>
          </div>

          {/* Card 5: Data Transferred (GB) */}
          <div
            id="card-data-transferred"
            onClick={() => onNavigateTab && onNavigateTab('reports')}
            className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-slate-200 dark:border-slate-700 transition-all flex flex-col justify-between shadow-sm cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Data Transferred</span>
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <HardDrive className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                14,820.5 <span className="text-sm font-normal text-slate-500 dark:text-slate-400">GB</span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                ~14.82 TB migrated to target
              </div>
            </div>
          </div>

          {/* Card 6: Success Rate (%) */}
          <div
            id="card-success-rate"
            onClick={() => onNavigateTab && onNavigateTab('reports')}
            className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-slate-200 dark:border-slate-700 transition-all flex flex-col justify-between shadow-sm cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Success Rate</span>
              <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-emerald-400 tracking-tight">99.43%</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1 truncate">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>Exceeds 99.0% SLA target</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. INTERACTIVE CHARTS (4 Visualizations) */}
      {/* ========================================================================= */}
      <section aria-labelledby="interactive-charts-heading" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 id="interactive-charts-heading" className="text-sm font-semibold text-slate-600 dark:text-slate-300 tracking-wide uppercase">
            Performance & Workload Visualizations
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">Interactive charts with responsive breakdowns</span>
        </div>

        {/* Row 1: Line Chart (Progress over time) & Donut Chart (Workload Distribution) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart 1: Migration Progress Over Time (Line Chart) - Spans 2 columns */}
          <div className="lg:col-span-2 p-5 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">Migration Progress Over Time</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Cumulative accounts processed and actively scheduled across migration batches.
                </p>
              </div>

              {/* Time Range Selector */}
              <div className="flex items-center space-x-1 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                {(['24h', '7d', '30d'] as TimeRange[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => setTimeRange(r)}
                    className={`px-2.5 py-1 text-xs font-medium rounded transition ${
                      timeRange === r
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:bg-slate-100 dark:bg-slate-700/50'
                    }`}
                  >
                    {r === '24h' ? 'Last 24 hours' : r === '7d' ? 'Last 7 days' : 'Last 30 days'}
                  </button>
                ))}
              </div>
            </div>

            {/* Line Chart Visualizer */}
            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={currentProgressData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '0.5rem',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="completed"
                    name="Completed Users"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#10b981' }}
                    activeDot={{ r: 6, stroke: '#ecfdf5', strokeWidth: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="inProgress"
                    name="In Progress"
                    stroke="#0284c7"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={{ r: 3, fill: '#0284c7' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="scheduled"
                    name="Scheduled Backlog"
                    stroke="#64748b"
                    strokeWidth={1.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Current Velocity: <strong className="text-slate-900 dark:text-white">~48 users / hr</strong></span>
              <span className="text-emerald-400 font-medium">Estimated project completion: ~4.5 hours remaining</span>
            </div>
          </div>

          {/* Chart 2: Workload Distribution (Donut Chart) */}
          <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-sm">
            <div className="mb-2">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">Workload Distribution</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Breakdown of migration items by workload category.</p>
            </div>

            <div className="relative h-56 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={WORKLOAD_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="count"
                    onMouseEnter={(entry) => setActiveWorkloadHover(entry.name)}
                    onMouseLeave={() => setActiveWorkloadHover(null)}
                  >
                    {WORKLOAD_DATA.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={entry.color}
                        opacity={activeWorkloadHover && activeWorkloadHover !== entry.name ? 0.45 : 1}
                        stroke="#0f172a"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any, name: any, props: any) => [
                      `${value} items (${props.payload.dataGB} GB)`,
                      name,
                    ]}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '0.5rem',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Center Donut Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-mono text-[10px]">Total Items</span>
                <span className="text-xl font-bold text-slate-900 dark:text-white">1,480</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">4 Workloads</span>
              </div>
            </div>

            {/* Donut Legend */}
            <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800/80 text-xs">
              {WORKLOAD_DATA.map((item) => (
                <div
                  key={item.name}
                  onMouseEnter={() => setActiveWorkloadHover(item.name)}
                  onMouseLeave={() => setActiveWorkloadHover(null)}
                  className={`p-2 rounded-lg border transition cursor-pointer flex items-center justify-between ${
                    activeWorkloadHover === item.name
                      ? 'bg-white dark:bg-slate-800 border-slate-600'
                      : 'bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800/60 hover:bg-white dark:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-600 dark:text-slate-300 font-medium truncate">{item.name}</span>
                  </div>
                  <span className="font-mono text-slate-500 dark:text-slate-400 text-[11px] ml-1">{item.share}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Row 2: Bar Chart (Status by Department) & Area Chart (Transfer Throughput) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 3: Migration Status by Department (Bar Chart) */}
          <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">Migration Status by Department</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Comparison of completed, in-progress, pending, and failed states by business unit.
                </p>
              </div>
              <div className="flex items-center space-x-2 text-xs">
                <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                  <span className="w-2 h-2 rounded bg-emerald-500"></span> Done
                </span>
                <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                  <span className="w-2 h-2 rounded bg-sky-500"></span> Active
                </span>
                <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                  <span className="w-2 h-2 rounded bg-slate-500"></span> Pending
                </span>
                <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                  <span className="w-2 h-2 rounded bg-rose-500"></span> Failed
                </span>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={DEPARTMENT_DATA} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis dataKey="department" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '0.5rem',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="completed" name="Completed" stackId="a" fill="#10b981" />
                  <Bar dataKey="inProgress" name="In Progress" stackId="a" fill="#0284c7" />
                  <Bar dataKey="pending" name="Pending" stackId="a" fill="#64748b" />
                  <Bar dataKey="failed" name="Failed" stackId="a" fill="#f43f5e" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Top completion: <strong className="text-emerald-400">Legal & Exec (99.1%)</strong></span>
              <span>Needs follow-up: <strong className="text-amber-400">Engineering (2 failures)</strong></span>
            </div>
          </div>

          {/* Chart 4: Data Transfer Throughput (Area Chart) */}
          <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">Data Transfer Throughput</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Real-time pipeline data ingress and sustained egress rate over time.
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 dark:text-slate-400">Current Rate:</span>
                <div className="text-sm font-bold text-sky-400 font-mono">512 MB/s</div>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={THROUGHPUT_DATA} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="throughputGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0284c7" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#0284c7" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} unit=" MB/s" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '0.5rem',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [`${val} MB/s`, 'Throughput']}
                  />
                  <Area
                    type="monotone"
                    dataKey="throughputMBs"
                    name="Throughput"
                    stroke="#38bdf8"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#throughputGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Peak Sustained: <strong className="text-slate-900 dark:text-white">840 MB/s</strong></span>
              <span>Active Concurrent Streams: <strong className="text-sky-400">34 pipes</strong></span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. RECENT ACTIVITY FEED (Jobs, Error Alerts, Notifications) */}
      {/* ========================================================================= */}
      <section aria-labelledby="activity-feed-heading" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 id="activity-feed-heading" className="text-sm font-semibold text-slate-600 dark:text-slate-300 tracking-wide uppercase">
              Recent Activity Feed & Triage
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Latest pipeline runs, operational warnings, and key admin alerts.</p>
          </div>
          {openErrorsCount > 0 && (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              {openErrorsCount} Action Items Pending
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Feed Column 1: Latest Migration Jobs */}
          <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Latest Migration Jobs</h3>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">{jobs.length} tracked</span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto max-h-[420px] pr-1">
              {jobs.map((job) => {
                const pct = Math.round((job.completedUsers / (job.totalUsers || 1)) * 100);
                const isExpanded = expandedJobId === job.id;
                return (
                  <div
                    key={job.id}
                    className={`p-3 rounded-lg bg-white dark:bg-slate-800/50 border transition ${
                      isExpanded
                        ? 'border-blue-500/50 shadow-sm ring-1 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div 
                      onClick={() => setExpandedJobId(isExpanded ? null : job.id)}
                      className="flex items-start justify-between gap-2 cursor-pointer select-none"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-1.5">
                          {/* Status Icon */}
                          {job.status === 'COMPLETED' && (
                            <span title="Completed"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /></span>
                          )}
                          {job.status === 'PROCESSING' && (
                            <span title="Processing"><Activity className="w-4 h-4 text-sky-400 animate-spin shrink-0" /></span>
                          )}
                          {job.status === 'FAILED' && (
                            <span title="Failed"><XCircle className="w-4 h-4 text-rose-400 shrink-0" /></span>
                          )}
                          {job.status === 'PAUSED' && (
                            <span title="Paused"><Pause className="w-4 h-4 text-amber-400 shrink-0" /></span>
                          )}
                          <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">{job.name}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                          {job.workload} • {job.sourceTenant} → {job.targetTenant}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                            job.status === 'COMPLETED'
                              ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                              : job.status === 'PROCESSING'
                              ? 'bg-blue-500/10 text-blue-300 border border-blue-500/20'
                              : job.status === 'FAILED'
                              ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                              : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                          }`}
                        >
                          {job.status}
                        </span>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedJobId(isExpanded ? null : job.id);
                          }}
                          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                          title={isExpanded ? 'Collapse job details' : 'Expand job details'}
                          aria-expanded={isExpanded}
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar & Metrics */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mb-1">
                        <span>
                          {job.completedUsers} / {job.totalUsers} users ({pct}%)
                        </span>
                        <span className="font-mono text-slate-600 dark:text-slate-300">{job.dataTransferredGB} GB</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-700/60 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            job.status === 'COMPLETED'
                              ? 'bg-emerald-500'
                              : job.status === 'FAILED'
                              ? 'bg-rose-500'
                              : 'bg-blue-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-200 dark:border-slate-800/60">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {job.startedAt} ({job.duration})
                      </span>
                      {onNavigateTab && (
                        <button
                          onClick={() => onNavigateTab('migrate', 'active_directory')}
                          className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-0.5"
                        >
                          Cockpit <ArrowUpRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* Expandable Details Section */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700/60 space-y-2.5 text-xs animate-fadeIn">
                        <div className="bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded border border-slate-200 dark:border-slate-700/60 space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                            <span>Pipeline Execution Stages</span>
                            <span className="text-blue-500 dark:text-blue-400 font-mono">{pct}% Complete</span>
                          </div>
                          <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              Auth & Credentials
                            </span>
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              Target Provisioning
                            </span>
                            <span className="flex items-center gap-1">
                              <Activity className="w-3 h-3 text-blue-400 animate-spin" />
                              Workload Delta Sync
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              Cutover & Routing
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1 text-[11px]">
                          <span className="text-slate-500 dark:text-slate-400">
                            Workload: <strong>{job.workload}</strong>
                          </span>
                          {onNavigateTab && (
                            <button
                              onClick={() => onNavigateTab('migrate', 'projects')}
                              className="text-blue-500 hover:text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1"
                            >
                              <span>View in Projects</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('migrate', 'projects')}
                className="w-full py-2 text-center text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white bg-slate-800/40 hover:bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-800 transition"
              >
                View All Migration Projects
              </button>
            )}
          </div>

          {/* Feed Column 2: Critical Error Alerts with Quick Actions */}
          <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Error Alerts</h3>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                {openErrorsCount} Active
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto max-h-[420px] pr-1">
              {errors.map((err) => (
                <div
                  key={err.id}
                  className={`p-3.5 rounded-lg border transition ${
                    err.resolved
                      ? 'bg-emerald-950/20 border-emerald-800/40 opacity-75'
                      : err.severity === 'CRITICAL'
                      ? 'bg-rose-950/20 border-rose-800/40'
                      : 'bg-amber-950/20 border-amber-800/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                          err.severity === 'CRITICAL'
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {err.severity}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">{err.code}</span>
                    </div>

                    {err.resolved && (
                      <span className="text-[10px] font-medium text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Resolved
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-semibold text-slate-900 dark:text-white mt-1.5">{err.message}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                    Target: <span className="text-slate-600 dark:text-slate-300 font-mono">{err.affectedItem}</span>
                  </p>

                  {/* Resolution Feedback or Quick Action Button */}
                  <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800/80">
                    {err.resolved ? (
                      <p className="text-[11px] text-emerald-400/90 italic">
                        {err.resolutionMessage || 'Resolved successfully.'}
                      </p>
                    ) : (
                      <button
                        onClick={() => handleResolveError(err.id, err.actionLabel)}
                        className="w-full py-1.5 px-2.5 text-xs font-semibold rounded bg-white dark:bg-slate-800 hover:bg-slate-100 dark:bg-slate-700 text-slate-200 hover:text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 transition flex items-center justify-center space-x-1.5 group"
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-400 group-hover:animate-bounce" />
                        <span>{err.actionLabel}</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('migrate', 'error_management')}
                className="w-full py-2 text-center text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white bg-slate-800/40 hover:bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-800 transition"
              >
                Open Full Error Management Cockpit
              </button>
            )}
          </div>

          {/* Feed Column 3: User Notifications */}
          <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Bell className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">User Notifications</h3>
              </div>
              {unreadNotifCount > 0 ? (
                <button
                  onClick={handleMarkAllNotificationsRead}
                  className="text-[11px] text-blue-400 hover:text-blue-300 font-medium"
                >
                  Mark all read ({unreadNotifCount})
                </button>
              ) : (
                <span className="text-[11px] text-slate-500">All caught up</span>
              )}
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto max-h-[420px] pr-1">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-3 rounded-lg border transition ${
                    notif.read
                      ? 'bg-white dark:bg-slate-800/30 border-slate-200 dark:border-slate-800/60'
                      : 'bg-white dark:bg-slate-800/70 border-indigo-500/40 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          notif.read ? 'bg-slate-600' : 'bg-indigo-400 animate-pulse'
                        }`}
                      />
                      <span className="text-xs font-semibold text-slate-900 dark:text-white">{notif.title}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono shrink-0">{notif.timestamp}</span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">{notif.message}</p>

                  <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-500">
                    <span className="px-1.5 py-0.5 rounded bg-slate-50 dark:bg-slate-900 font-mono text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
                      {notif.category}
                    </span>
                    {!notif.read && (
                      <button
                        onClick={() =>
                          setNotifications((prev) =>
                            prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
                          )
                        }
                        className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white"
                      >
                        Dismiss
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Notification dispatcher active
              </span>
              <span className="text-slate-500 font-mono">MS Graph Webhooks</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
