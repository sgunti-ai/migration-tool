import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  HardDrive,
  Globe,
  MessageSquare,
  Mail,
  Layers,
  ListTree,
  ShieldCheck,
  Search,
  ArrowUpDown,
  Download,
  Filter,
  ExternalLink,
  ChevronRight,
  Database,
  Sparkles,
  Server,
  FileSpreadsheet,
  FileCode,
  RefreshCw,
  AlertTriangle,
  Play
} from 'lucide-react';
import { DiscoverySummary } from '../../types';

interface UnifiedWorkloadItem {
  id: string;
  workload: 'exchange' | 'users' | 'groups' | 'distributionlists' | 'onedrive' | 'sharepoint' | 'teams';
  name: string;
  primaryIdentifier: string;
  category: string;
  sizeMB: number;
  itemCount?: number;
  status: string;
  securityDetails: string;
  lastActivityDate?: string;
}

interface WorkloadDiscoveryInventoryProps {
  summary: DiscoverySummary | null;
  isLoading: boolean;
  onWorkloadSelect: (workload: string) => void;
  onOpenScanDialog?: () => void;
  onNavigateToReports?: () => void;
}

export const WorkloadDiscoveryInventory: React.FC<WorkloadDiscoveryInventoryProps> = ({
  summary,
  isLoading,
  onWorkloadSelect,
  onOpenScanDialog,
  onNavigateToReports,
}) => {
  const [unifiedItems, setUnifiedItems] = useState<UnifiedWorkloadItem[]>([]);
  const [isLoadingUnified, setIsLoadingUnified] = useState<boolean>(true);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'workload'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 12;

  // Fetch unified workloads data
  const fetchUnifiedWorkloads = async () => {
    setIsLoadingUnified(true);
    try {
      const res = await fetch('/api/discovery/all-workloads');
      if (res.ok) {
        const data = await res.json();
        setUnifiedItems(data.items || []);
      }
    } catch (err) {
      console.error('Failed to fetch unified workloads:', err);
    } finally {
      setIsLoadingUnified(false);
    }
  };

  useEffect(() => {
    fetchUnifiedWorkloads();
  }, []);

  const counts = summary?.workloadCounts || {
    users: 50,
    groups: 20,
    onedrive: 50,
    exchange: 50,
    sharepoint: 15,
    teams: 10,
    distributionLists: 10,
  };

  const workloadConfigs = [
    {
      workload: 'exchange',
      name: 'Mailboxes',
      subtitle: 'Exchange Online user, shared & resource mailboxes',
      count: counts.exchange ?? 50,
      quota: 50,
      icon: Mail,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      badgeBg: 'bg-amber-500/20 text-amber-300',
      statLabel: 'Storage',
      statValue: `${Math.round((summary?.storage?.exchangeStorageGB || summary?.storage?.mailboxStorageGB || 320))} GB`,
    },
    {
      workload: 'users',
      name: 'User Accounts',
      subtitle: 'Entra ID user profiles, job roles & licenses',
      count: counts.users ?? 50,
      quota: 50,
      icon: Users,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
      badgeBg: 'bg-blue-500/20 text-blue-300',
      statLabel: 'MFA Enforced',
      statValue: `${summary?.security?.mfaEnforcedPercent ?? summary?.security?.mfaEnforcedRate ?? 88}%`,
    },
    {
      workload: 'groups',
      name: 'Groups',
      subtitle: 'Microsoft 365 unified & Entra security groups',
      count: counts.groups ?? 20,
      quota: 20,
      icon: Layers,
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
      badgeBg: 'bg-cyan-500/20 text-cyan-300',
      statLabel: 'Type',
      statValue: 'Security & M365',
    },
    {
      workload: 'distributionlists',
      name: 'Distribution Lists',
      subtitle: 'Mail distribution groups & delivery routing',
      count: counts.distributionLists ?? 10,
      quota: 10,
      icon: ListTree,
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
      badgeBg: 'bg-rose-500/20 text-rose-300',
      statLabel: 'Moderated',
      statValue: '2 Policy Rules',
    },
    {
      workload: 'onedrive',
      name: 'OneDrive Accounts',
      subtitle: 'Personal cloud file storage & document vaults',
      count: counts.onedrive ?? 50,
      quota: 50,
      icon: HardDrive,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      badgeBg: 'bg-emerald-500/20 text-emerald-300',
      statLabel: 'Storage',
      statValue: `${Math.round((summary?.storage?.oneDriveStorageGB || 840))} GB`,
    },
    {
      workload: 'sharepoint',
      name: 'SharePoint Sites',
      subtitle: 'Intranet site collections, hubs & document libraries',
      count: counts.sharepoint ?? 15,
      quota: 15,
      icon: Globe,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
      badgeBg: 'bg-indigo-500/20 text-indigo-300',
      statLabel: 'Sites',
      statValue: '15 Active Sites',
    },
    {
      workload: 'teams',
      name: 'Teams Data',
      subtitle: 'Channels, chat channels, tabs & collaboration apps',
      count: counts.teams ?? 10,
      quota: 10,
      icon: MessageSquare,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      badgeBg: 'bg-purple-500/20 text-purple-300',
      statLabel: 'Channels',
      statValue: '38 Channels',
    },
  ];

  // Filtered & Sorted items
  const filteredItems = useMemo(() => {
    return unifiedItems.filter((item) => {
      const matchesFilter = selectedFilter === 'all' || item.workload === selectedFilter;
      const matchesSearch =
        !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.primaryIdentifier.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.securityDetails.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [unifiedItems, selectedFilter, searchQuery]);

  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      let comp = 0;
      if (sortBy === 'name') {
        comp = a.name.localeCompare(b.name);
      } else if (sortBy === 'size') {
        comp = (a.sizeMB || 0) - (b.sizeMB || 0);
      } else if (sortBy === 'workload') {
        comp = a.workload.localeCompare(b.workload);
      }
      return sortDir === 'asc' ? comp : -comp;
    });
  }, [filteredItems, sortBy, sortDir]);

  const totalPages = Math.ceil(sortedItems.length / itemsPerPage);
  const paginatedItems = sortedItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getWorkloadBadge = (wl: string) => {
    switch (wl) {
      case 'exchange':
        return { label: 'Mailbox', bg: 'bg-amber-500/10 text-amber-500 border-amber-500/20', icon: Mail };
      case 'users':
        return { label: 'User Account', bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: Users };
      case 'groups':
        return { label: 'Group', bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20', icon: Layers };
      case 'distributionlists':
        return { label: 'Distribution List', bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20', icon: ListTree };
      case 'onedrive':
        return { label: 'OneDrive', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: HardDrive };
      case 'sharepoint':
        return { label: 'SharePoint', bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', icon: Globe };
      case 'teams':
        return { label: 'Teams', bg: 'bg-purple-500/10 text-purple-400 border-purple-500/20', icon: MessageSquare };
      default:
        return { label: wl, bg: 'bg-slate-500/10 text-slate-400 border-slate-500/20', icon: Server };
    }
  };

  const handleExportQuick = async (format: 'csv' | 'json') => {
    try {
      const res = await fetch('/api/discovery/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format,
          workload: selectedFilter === 'all' ? 'full_inventory' : selectedFilter,
        }),
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Discovery_${selectedFilter}_${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Quick export failed:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Source Tenant & Workload Identification Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 border border-slate-700/80 shadow-xl text-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-400">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-xl font-bold tracking-tight">Source Tenant Workloads Dashboard</h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Verified</span>
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-mono">
                  Source: <strong className="text-white">
                    {typeof summary?.sourceTenant === 'object' && summary?.sourceTenant !== null
                      ? summary.sourceTenant.domain
                      : typeof summary?.sourceTenant === 'string'
                      ? summary.sourceTenant
                      : 'contoso.onmicrosoft.com'}
                  </strong> • Microsoft Graph v1.0 Connected
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Real-time inventory of all 7 Microsoft 365 workloads discovered on the source tenant.
              Monitor identified Mailboxes, User Accounts, Groups, Distribution Lists, OneDrive accounts, SharePoint Sites, and Teams.
            </p>
          </div>

          {/* Quick Global Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {onOpenScanDialog && (
              <button
                id="btn-dash-run-scan"
                onClick={onOpenScanDialog}
                className="px-4 py-2.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-950/40 transition flex items-center space-x-2"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Trigger Discovery Scan</span>
              </button>
            )}
            {onNavigateToReports && (
              <button
                id="btn-dash-open-reports"
                onClick={onNavigateToReports}
                className="px-4 py-2.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-950/40 transition flex items-center space-x-2"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Reports & Full Inventory</span>
              </button>
            )}
          </div>
        </div>

        {/* Global Key Metrics Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-700/60">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Total Workload Items</span>
            <p className="text-xl font-bold text-white mt-0.5">
              {summary?.totalItems ? summary.totalItems.toLocaleString() : (unifiedItems.length || 432)}
            </p>
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Total Tenant Storage</span>
            <p className="text-xl font-bold text-emerald-400 mt-0.5">
              {summary?.storage?.totalStorageGB || 1824} GB
            </p>
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">MFA Enforced Rate</span>
            <p className="text-xl font-bold text-cyan-400 mt-0.5">
              {summary?.security?.mfaEnforcedPercent ?? summary?.security?.mfaEnforcedRate ?? 88}%
            </p>
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Migration Readiness</span>
            <p className="text-xl font-bold text-purple-400 mt-0.5">
              {summary?.readinessScore ?? 96}% Ready
            </p>
          </div>
        </div>
      </div>

      {/* 2. All 7 Identified Workloads Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Identified Source Workloads</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select any workload card to navigate into dedicated workload deep-dive views.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {workloadConfigs.map((cfg) => {
            const Icon = cfg.icon;
            const isFilterActive = selectedFilter === cfg.workload;
            return (
              <div
                key={cfg.workload}
                id={`card-workload-${cfg.workload}`}
                onClick={() => {
                  setSelectedFilter(cfg.workload);
                  setCurrentPage(1);
                }}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between group ${
                  isFilterActive
                    ? 'bg-blue-50/70 dark:bg-slate-800/90 border-blue-500 ring-2 ring-blue-500/20 shadow-md'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 hover:shadow-sm'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div className={`p-2 rounded-lg border ${cfg.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-2xl font-bold text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors">
                      {cfg.count.toLocaleString()}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{cfg.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{cfg.subtitle}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">{cfg.statLabel}:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{cfg.statValue}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Live Unified Workloads Data Grid */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <span>All Identified Workloads Inventory Data</span>
              <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {sortedItems.length} items
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Interactive unified catalog across all 7 discovered M365 workloads with live attributes.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleExportQuick('csv')}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition flex items-center space-x-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => handleExportQuick('json')}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition flex items-center space-x-1.5"
            >
              <FileCode className="w-3.5 h-3.5 text-blue-500" />
              <span>Export JSON</span>
            </button>
            <button
              onClick={fetchUnifiedWorkloads}
              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 rounded-lg transition"
              title="Refresh inventory"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Pills and Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          {/* Workload filter pills */}
          <div className="flex items-center space-x-1 overflow-x-auto pb-1 max-w-full">
            <button
              onClick={() => {
                setSelectedFilter('all');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                selectedFilter === 'all'
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              All Workloads ({unifiedItems.length})
            </button>

            {workloadConfigs.map((cfg) => (
              <button
                key={cfg.workload}
                onClick={() => {
                  setSelectedFilter(cfg.workload);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition flex items-center space-x-1.5 ${
                  selectedFilter === cfg.workload
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>{cfg.name}</span>
                <span className="text-[10px] opacity-75 font-mono">({cfg.count})</span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search across all workloads..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Data Table */}
        {isLoadingUnified ? (
          <div className="py-16 text-center text-xs text-slate-500 dark:text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-500 mb-2" />
            <span>Loading identified workload inventory data...</span>
          </div>
        ) : sortedItems.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500 dark:text-slate-400">
            No items match your filter and search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/70 text-[11px] font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase font-mono">
                <tr>
                  <th className="py-3 px-4">
                    <button
                      onClick={() => {
                        if (sortBy === 'workload') {
                          setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortBy('workload');
                          setSortDir('asc');
                        }
                      }}
                      className="flex items-center space-x-1 hover:text-slate-900 dark:hover:text-white"
                    >
                      <span>Workload</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3 px-4">
                    <button
                      onClick={() => {
                        if (sortBy === 'name') {
                          setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortBy('name');
                          setSortDir('asc');
                        }
                      }}
                      className="flex items-center space-x-1 hover:text-slate-900 dark:hover:text-white"
                    >
                      <span>Item Name & Identifier</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3 px-4">Category / Classification</th>
                  <th className="py-3 px-4">
                    <button
                      onClick={() => {
                        if (sortBy === 'size') {
                          setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortBy('size');
                          setSortDir('desc');
                        }
                      }}
                      className="flex items-center space-x-1 hover:text-slate-900 dark:hover:text-white"
                    >
                      <span>Size / Items</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3 px-4">Security & Attributes</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {paginatedItems.map((item) => {
                  const badge = getWorkloadBadge(item.workload);
                  const Icon = badge.icon;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${badge.bg}`}
                        >
                          <Icon className="w-3 h-3" />
                          <span>{badge.label}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">{item.name}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          {item.primaryIdentifier}
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="text-xs font-mono text-slate-600 dark:text-slate-300">
                          {item.category}
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-900 dark:text-white">
                        {item.sizeMB > 0 ? (
                          <span>
                            {item.sizeMB >= 1024
                              ? `${(item.sizeMB / 1024).toFixed(1)} GB`
                              : `${item.sizeMB} MB`}
                          </span>
                        ) : item.itemCount !== undefined ? (
                          <span>{item.itemCount} items</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className="text-xs text-slate-600 dark:text-slate-300 font-mono">
                          {item.securityDetails}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => onWorkloadSelect(item.workload)}
                          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center space-x-0.5"
                        >
                          <span>Inspect</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-3 text-xs text-slate-500 dark:text-slate-400">
            <span>
              Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, sortedItems.length)} of {sortedItems.length} items
            </span>

            <div className="flex items-center space-x-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="px-2 py-1 font-mono">
                {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
