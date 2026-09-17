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
  CheckCircle2
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
  const [internalWorkloadTab, setInternalWorkloadTab] = useState<string>('overview');
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
          if (msg.type === 'DISCOVERY_PROGRESS_UPDATE') {
            setScanStatus(msg.data);
          } else if (msg.type === 'DISCOVERY_COMPLETED') {
            setScanStatus(msg.data);
            fetchSummary();
            fetchUsers();
          }
        } catch {
          // ignore
        }
      };
    } catch {
      // Fallback
    }

    // Polling fallback when scan is RUNNING
    if (scanStatus?.status === 'RUNNING') {
      fallbackPoll = setInterval(() => {
        fetchStatus();
      }, 2000);
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
    { id: 'overview', label: 'Inventory Dashboard', icon: Compass, count: null },
    { id: 'users', label: 'Users', icon: Users, count: summary?.workloadCounts?.users ?? 0 },
    { id: 'groups', label: 'Groups', icon: Layers, count: summary?.workloadCounts?.groups ?? 0 },
    { id: 'onedrive', label: 'OneDrive', icon: HardDrive, count: summary?.workloadCounts?.onedrive ?? 0 },
    { id: 'exchange', label: 'Exchange', icon: Mail, count: summary?.workloadCounts?.exchange ?? 0 },
    { id: 'sharepoint', label: 'SharePoint', icon: Globe, count: summary?.workloadCounts?.sharepoint ?? 0 },
    { id: 'teams', label: 'Teams', icon: MessageSquare, count: summary?.workloadCounts?.teams ?? 0 },
    { id: 'distributionlists', label: 'Distribution Lists', icon: ListTree, count: summary?.workloadCounts?.distributionLists ?? 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Source Tenant Discovery</h1>
              <p className="text-xs text-slate-400">
                Microsoft Graph API & Exchange Online engine discovering identity, files, mailboxes, and collaboration
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Export button */}
          <button
            id="btn-open-export-dialog"
            onClick={() => setIsExportOpen(true)}
            className="px-3.5 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg border border-slate-700 transition flex items-center space-x-1.5"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export Data</span>
          </button>

          {/* Trigger Scan button */}
          <button
            id="btn-open-scan-dialog"
            disabled={scanStatus?.status === 'RUNNING'}
            onClick={() => setIsScanConfigOpen(true)}
            className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-sm transition flex items-center space-x-1.5 disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{scanStatus?.status === 'RUNNING' ? 'Scan Active...' : 'Run Discovery Scan'}</span>
          </button>
        </div>
      </div>

      {/* Real-time Scan Progress Bar */}
      <ScanProgressIndicator scanStatus={scanStatus} onRefresh={fetchStatus} />

      {/* Workload Tabs Navigation Bar */}
      {activeWorkloadTab !== 'overview' && (
        <div className="border-b border-slate-800 bg-slate-900/50 p-1.5 rounded-xl border flex items-center space-x-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeWorkloadTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-workload-${tab.id}`}
                onClick={() => setActiveWorkloadTab(tab.id)}
                className={`px-3.5 py-2 rounded-lg text-xs font-medium transition flex items-center space-x-2 whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      isActive ? 'bg-blue-800 text-blue-100' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Workload View Rendering */}
      {activeWorkloadTab === 'overview' ? (
        <div className="animate-fadeIn">
          <WorkloadDiscoveryInventory
            summary={summary}
            isLoading={isLoading}
            onWorkloadSelect={(workload) => setActiveWorkloadTab(workload)}
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
              // Direct batch export
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
            onBackToOverview={() => setActiveWorkloadTab('overview')}
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

