import React, { useState, useEffect, useCallback } from 'react';
import { 
  DiscoverySummary, 
  DiscoveryScanStatus, 
  DiscoveredUser, 
  AdminRole 
} from '../../types';
import { WorkloadDiscoveryInventory } from './WorkloadDiscoveryInventory';
import { FilterPanel, FilterState } from './FilterPanel';
import { UserListTable } from './UserListTable';
import { DiscoveryDetailDrawer } from './DiscoveryDetailDrawer';
import { ScanProgressIndicator } from './ScanProgressIndicator';
import { ExportDialog } from './ExportDialog';
import { ScanConfigDialog } from './ScanConfigDialog';
import { WorkloadView } from './WorkloadView';
import { DiscoveryReportsView } from './DiscoveryReportsView';
import { TenantAssessmentView } from './TenantAssessmentView';
import { 
  Compass, 
  Play, 
  Download, 
  Terminal, 
  Users, 
  Layers, 
  HardDrive, 
  Mail, 
  Globe, 
  MessageSquare, 
  ListTree, 
  RefreshCw,
  FileCode,
  Shield,
  ShieldCheck,
  CheckCircle2,
  LayoutDashboard,
  FileText
} from 'lucide-react';

interface DiscoveryDashboardProps {
  currentRole?: AdminRole;
  onNavigateToMigrate?: (selectedUsers?: DiscoveredUser[]) => void;
  selectedWorkloadTab?: string;
  onSelectWorkloadTab?: (tab: string) => void;
}

export const DiscoveryDashboard: React.FC<DiscoveryDashboardProps> = ({
  currentRole = 'GLOBAL_ADMIN',
  onNavigateToMigrate,
  selectedWorkloadTab: externalWorkloadTab,
  onSelectWorkloadTab: setExternalWorkloadTab,
}) => {
  // Navigation & State
  const [internalWorkloadTab, setInternalWorkloadTab] = useState<string>('dashboard');
  const activeWorkloadTab = externalWorkloadTab || internalWorkloadTab;
  const setActiveWorkloadTab = (tab: string) => {
    if (setExternalWorkloadTab) {
      setExternalWorkloadTab(tab);
    }
    setInternalWorkloadTab(tab);
  };

  // Data states
  const [summary, setSummary] = useState<DiscoverySummary | null>(null);
  const [scanStatus, setScanStatus] = useState<DiscoveryScanStatus | null>(null);
  const [users, setUsers] = useState<DiscoveredUser[]>([]);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    department: 'ALL',
    mfaStatus: 'ALL',
    license: 'ALL',
    accountEnabled: 'ALL',
  });

  // Modal / Drawer states
  const [selectedUser, setSelectedUser] = useState<DiscoveredUser | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isScanConfigOpen, setIsScanConfigOpen] = useState<boolean>(false);
  const [isPowerShellModalOpen, setIsPowerShellModalOpen] = useState<boolean>(false);
  const [isStartingScan, setIsStartingScan] = useState<boolean>(false);

  // Derived unique lists for dropdown filters
  const [departments, setDepartments] = useState<string[]>([]);
  const [licenses, setLicenses] = useState<string[]>([]);

  // 1. Fetch Summary
  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch('/api/discovery/summary');
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } catch (err) {
      console.error('Failed to fetch summary:', err);
    }
  }, []);

  // 2. Fetch Scan Status
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/discovery/status');
      if (res.ok) {
        const data = await res.json();
        setScanStatus(data);
      }
    } catch (err) {
      console.error('Failed to fetch scan status:', err);
    }
  }, []);

  // 3. Fetch Discovered Users with filters
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.department !== 'ALL') params.append('department', filters.department);
      if (filters.mfaStatus !== 'ALL') params.append('mfaStatus', filters.mfaStatus);
      if (filters.license !== 'ALL') params.append('license', filters.license);
      if (filters.accountEnabled !== 'ALL') params.append('accountEnabled', filters.accountEnabled);
      params.append('limit', '100');

      const res = await fetch(`/api/discovery/users?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setTotalUsers(data.total || 0);

        // Populate dynamic department and license lists
        if (data.users && data.users.length > 0) {
          const deptSet = new Set<string>();
          const licSet = new Set<string>();
          data.users.forEach((u: DiscoveredUser) => {
            if (u.department) deptSet.add(u.department);
            if (u.licenses && Array.isArray(u.licenses)) {
              u.licenses.forEach((lic: string) => licSet.add(lic));
            }
          });
          setDepartments(Array.from(deptSet));
          setLicenses(Array.from(licSet));
        }
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  // Initial fetch
  useEffect(() => {
    fetchSummary();
    fetchStatus();
    fetchUsers();
  }, [fetchSummary, fetchStatus, fetchUsers]);

  // WebSocket / Polling for live scan status
  useEffect(() => {
    let ws: WebSocket | null = null;
    let fallbackPoll: any = null;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'DISCOVERY_PROGRESS_UPDATE' || msg.type === 'DISCOVERY_RETRYING') {
            setScanStatus(msg.data);
          } else if (msg.type === 'DISCOVERY_COMPLETED') {
            setScanStatus(msg.data);
            fetchSummary();
            fetchUsers();
          } else if (msg.type === 'DISCOVERY_FAILED') {
            setScanStatus(msg.data);
          }
        } catch {
          // ignore
        }
      };
    } catch {
      // Fallback
    }

    // Polling fallback when scan is RUNNING or RETRYING
    if (scanStatus?.status === 'RUNNING' || scanStatus?.status === 'RETRYING') {
      fallbackPoll = setInterval(() => {
        fetchStatus();
      }, 1500);
    }

    return () => {
      if (ws) ws.close();
      if (fallbackPoll) clearInterval(fallbackPoll);
    };
  }, [scanStatus?.status, fetchStatus, fetchSummary, fetchUsers]);

  // Start discovery scan
  const handleStartScan = async (config: { scanType: 'FULL' | 'INCREMENTAL'; workloads: string[] }) => {
    setIsStartingScan(true);
    try {
      const res = await fetch('/api/discovery/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        const data = await res.json();
        setScanStatus(data.scan);
      }
    } catch (err) {
      console.error('Failed to start scan:', err);
    } finally {
      setIsStartingScan(false);
    }
  };

  // Filter Handlers
  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      department: 'ALL',
      mfaStatus: 'ALL',
      license: 'ALL',
      accountEnabled: 'ALL',
    });
  };

  // User detail drawer handler
  const handleOpenDetail = (user: DiscoveredUser) => {
    setSelectedUser(user);
    setIsDrawerOpen(true);
  };

  // Batch stage user for migration
  const handleStageUser = (user: DiscoveredUser) => {
    if (onNavigateToMigrate) {
      onNavigateToMigrate([user]);
    }
  };

  const handleBatchStageUsers = (batch: DiscoveredUser[]) => {
    if (onNavigateToMigrate) {
      onNavigateToMigrate(batch);
    }
  };

  const tabs = [
    { id: 'assessment', label: 'T2T Assessment (8 Pillars)', icon: ShieldCheck, count: '8/8' },
    { id: 'dashboard', label: 'Workloads Overview', icon: LayoutDashboard, count: summary?.totalItems ?? 432 },
    { id: 'exchange', label: 'Mailboxes', icon: Mail, count: summary?.workloadCounts?.exchange ?? 50 },
    { id: 'users', label: 'User Accounts', icon: Users, count: summary?.workloadCounts?.users ?? 50 },
    { id: 'groups', label: 'Groups', icon: Layers, count: summary?.workloadCounts?.groups ?? 20 },
    { id: 'distributionlists', label: 'Distribution Lists', icon: ListTree, count: summary?.workloadCounts?.distributionLists ?? 10 },
    { id: 'onedrive', label: 'OneDrive Accounts', icon: HardDrive, count: summary?.workloadCounts?.onedrive ?? 50 },
    { id: 'sharepoint', label: 'SharePoint Sites', icon: Globe, count: summary?.workloadCounts?.sharepoint ?? 15 },
    { id: 'teams', label: 'Teams Data', icon: MessageSquare, count: summary?.workloadCounts?.teams ?? 10 },
    { id: 'reports', label: 'Reports', icon: FileText, count: null },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Source Tenant Discovery</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Microsoft Graph API & Exchange Online engine discovering identity, files, mailboxes, and collaboration
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* T2T Assessment Button */}
          <button
            id="btn-open-assessment-view"
            onClick={() => setActiveWorkloadTab('assessment')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition flex items-center space-x-1.5 shadow-sm ${
              activeWorkloadTab === 'assessment'
                ? 'bg-blue-600 text-white border-blue-500'
                : 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 border-blue-300 dark:border-blue-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>T2T Assessment (8 Pillars)</span>
          </button>

          {/* Reports section button */}
          <button
            id="btn-open-reports-view"
            onClick={() => setActiveWorkloadTab('reports')}
            className={`px-3.5 py-2 text-xs font-medium rounded-lg border transition flex items-center space-x-1.5 ${
              activeWorkloadTab === 'reports'
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                : 'text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-300 dark:border-slate-700'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span>Reports & Exports</span>
          </button>

          {/* Trigger Scan button */}
          <button
            id="btn-open-scan-dialog"
            disabled={scanStatus?.status === 'RUNNING' || scanStatus?.status === 'RETRYING'}
            onClick={() => setIsScanConfigOpen(true)}
            className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-sm transition flex items-center space-x-1.5 disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>
              {scanStatus?.status === 'RUNNING'
                ? 'Scan Active...'
                : scanStatus?.status === 'RETRYING'
                ? 'Reconnecting...'
                : 'Run Discovery Scan'}
            </span>
          </button>
        </div>
      </div>

      {/* Real-time Scan Progress Bar */}
      <ScanProgressIndicator scanStatus={scanStatus} onRefresh={fetchStatus} />

      {/* Workload Tabs Navigation Bar */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-1.5 rounded-xl border flex items-center space-x-1 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            activeWorkloadTab === tab.id ||
            (tab.id === 'dashboard' && activeWorkloadTab === 'overview');
          return (
            <button
              key={tab.id}
              id={`tab-workload-${tab.id}`}
              onClick={() => setActiveWorkloadTab(tab.id)}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium transition flex items-center space-x-2 whitespace-nowrap ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    isActive ? 'bg-blue-800 text-blue-100' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Workload View Rendering */}
      {activeWorkloadTab === 'assessment' ? (
        <div className="animate-fadeIn">
          <TenantAssessmentView
            onNavigateToWorkloadTab={(tab) => setActiveWorkloadTab(tab)}
            onNavigateToScan={() => setIsScanConfigOpen(true)}
          />
        </div>
      ) : activeWorkloadTab === 'dashboard' || activeWorkloadTab === 'overview' ? (
        <div className="animate-fadeIn">
          <WorkloadDiscoveryInventory
            summary={summary}
            isLoading={isLoading}
            onWorkloadSelect={(workload) => setActiveWorkloadTab(workload)}
            onOpenScanDialog={() => setIsScanConfigOpen(true)}
            onNavigateToReports={() => setActiveWorkloadTab('reports')}
          />
        </div>
      ) : activeWorkloadTab === 'reports' ? (
        <div className="animate-fadeIn">
          <DiscoveryReportsView
            summary={summary}
            onRefreshSummary={fetchSummary}
            onNavigateToScan={() => setIsScanConfigOpen(true)}
          />
        </div>
      ) : activeWorkloadTab === 'users' ? (
        <div className="space-y-4 animate-fadeIn">
          {/* Filter Panel */}
          <FilterPanel
            filters={filters}
            onFilterChange={handleFilterChange}
            onReset={handleResetFilters}
            totalFiltered={users.length}
            totalAll={totalUsers}
            departments={departments}
            licenses={licenses}
          />

          {/* User List Table with AG Grid */}
          <UserListTable
            users={users}
            isLoading={isLoading}
            onSelectUser={handleOpenDetail}
            onExportSelected={(selected, format) => {
              fetch('/api/discovery/export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  format,
                  workload: 'users',
                  selectedIds: selected.map((u) => u.id),
                }),
              })
                .then((r) => r.blob())
                .then((blob) => {
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `m365_discovery_users_selected.${format}`;
                  document.body.appendChild(a);
                  a.click();
                  window.URL.revokeObjectURL(url);
                  document.body.removeChild(a);
                });
            }}
            onStageMigrationWave={handleBatchStageUsers}
          />
        </div>
      ) : (
        <div className="animate-fadeIn">
          <WorkloadView
            workload={activeWorkloadTab}
            onBackToOverview={() => setActiveWorkloadTab('dashboard')}
            onExport={() => setIsExportOpen(true)}
          />
        </div>
      )}

      {/* Drill-down Detail Drawer */}
      <DiscoveryDetailDrawer
        user={selectedUser}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onStageMigration={handleStageUser}
      />

      {/* Export Dialog */}
      <ExportDialog
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        totalFilteredCount={totalUsers}
      />

      {/* Scan Config Dialog */}
      <ScanConfigDialog
        isOpen={isScanConfigOpen}
        onClose={() => setIsScanConfigOpen(false)}
        onStartScan={handleStartScan}
        isStarting={isStartingScan}
      />

    </div>
  );
};

