import React, { useState, useEffect, useCallback } from 'react';
import { 
  DiscoverySummary, 
  DiscoveryScanStatus, 
  DiscoveredUser, 
  AdminRole 
} from '../../types';
import { DiscoveryStats } from './DiscoveryStats';
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
  const [internalWorkloadTab, setInternalWorkloadTab] = useState<string>('users');
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
          {/* View PowerShell Script Modal trigger */}
          <button
            id="btn-view-powershell-script"
            onClick={() => setIsPowerShellModalOpen(true)}
            className="px-3.5 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg border border-slate-700 transition flex items-center space-x-1.5"
            title="Inspect PowerShell automation script"
          >
            <Terminal className="w-3.5 h-3.5 text-blue-400" />
            <span>PowerShell Script</span>
          </button>

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

      {/* Summary KPI Cards & Workload Breakdown */}
      <DiscoveryStats
        summary={summary}
        isLoading={isLoading}
        onWorkloadSelect={(workload) => setActiveWorkloadTab(workload)}
        onOpenScanConfig={() => setIsScanConfigOpen(true)}
      />

      {/* Workload Tabs Navigation Bar */}
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
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  isActive ? 'bg-blue-800 text-blue-100' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Workload View Rendering */}
      {activeWorkloadTab === 'users' ? (
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
            onBackToOverview={() => setActiveWorkloadTab('users')}
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

      {/* PowerShell Script Inspector Modal */}
      {isPowerShellModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <Terminal className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="text-base font-bold text-white">Discover-SourceTenant.ps1</h3>
                  <p className="text-xs text-slate-400">Production PowerShell automation for Microsoft 365 tenant collection</p>
                </div>
              </div>
              <button
                onClick={() => setIsPowerShellModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-950 p-4 rounded-xl border border-slate-800/80 font-mono text-xs text-blue-300/90 leading-relaxed whitespace-pre">
              {`# Discover-SourceTenant.ps1
# Enterprise M365 Source Tenant Discovery Script
param(
    [string]$TenantId = "source-tenant.onmicrosoft.com",
    [string]$ClientId = "00000000-0000-0000-0000-000000000001",
    [string]$ClientSecret = "...",
    [string[]]$Workloads = @('Users', 'OneDrive', 'Exchange', 'SharePoint', 'Teams', 'Groups', 'DistributionLists'),
    [switch]$IncrementalScan,
    [datetime]$LastScanTimestamp = (Get-Date).AddDays(-7),
    [ValidateSet('JSON', 'CSV', 'API')][string]$OutputFormat = 'JSON'
)

Write-Host "Initializing Microsoft Graph API & Exchange Online Discovery..." -ForegroundColor Cyan

# 1. Acquire Microsoft Graph Application Token
$Body = @{
    client_id     = $ClientId
    client_secret = $ClientSecret
    scope         = "https://graph.microsoft.com/.default"
    grant_type    = "client_credentials"
}
$Token = (Invoke-RestMethod -Uri "https://login.microsoftonline.com/$TenantId/oauth2/v2.0/token" -Method Post -Body $Body).access_token

# 2. Discover Users via Graph API
# UPN, DisplayName, Department, Manager, Licenses, Groups, MFA Status
$Users = Invoke-RestMethod -Uri "https://graph.microsoft.com/v1.0/users?` + '\\$select=id,userPrincipalName,displayName,department,jobTitle,assignedLicenses' + `" -Headers @{ Authorization = "Bearer $Token" }

# 3. Discover OneDrive Sites via Graph API
# Site URL, Storage Quota, Storage Used, File Count, External Sharing Policy
$OneDrives = Get-PnPTenantSite -Detailed | Where-Object { $_.Template -eq "SPSPERS" }

# 4. Discover Exchange Mailboxes via Exchange Online PowerShell
# MailboxType, TotalItemSize, ItemCount, ArchiveStatus, Delegates, ForwardingRules
# Connect-ExchangeOnline -CertificateThumbprint $Cert -AppId $ClientId -Organization $TenantId
# Get-EXOMailbox -PropertySets All | Select-Object UserPrincipalName, MailboxType, ArchiveStatus

# 5. Discover SharePoint Online Collections via SharePoint PnP
# Connect-PnPOnline -Url "https://$TenantId-admin.sharepoint.com"
# Get-PnPTenantSite -Detailed

# 6. Discover Microsoft Teams via Graph API
# Teams, Channels, Members, Owners, Tabs, Files, Apps

# 7. Incremental Delta Tracking & Database Ingestion
# Output format: JSON or direct ingestion to http://localhost:3000/api/discovery/import`}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Script located at <code>/scripts/Discover-SourceTenant.ps1</code>
              </span>
              <button
                onClick={() => setIsPowerShellModalOpen(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
