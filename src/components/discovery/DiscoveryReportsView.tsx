import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  CheckCircle2,
  Calendar,
  Layers,
  Users,
  HardDrive,
  Mail,
  Globe,
  MessageSquare,
  ListTree,
  FileSpreadsheet,
  FileCode,
  ArrowDownToLine,
  RefreshCw,
  Clock,
  Sparkles,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { DiscoverySummary } from '../../types';

interface DiscoveryReportsViewProps {
  summary: DiscoverySummary | null;
  onRefreshSummary?: () => void;
  onNavigateToScan?: () => void;
}

interface HistoricalScan {
  id: string;
  scanType: string;
  status: string;
  progress: number;
  currentStage: string;
  totalItemsDiscovered: number;
  totalStorageGB: number;
  usersDiscovered: number;
  groupsDiscovered: number;
  oneDrivesDiscovered: number;
  mailboxesDiscovered: number;
  sharePointSitesDiscovered: number;
  teamsDiscovered: number;
  dlDiscovered: number;
  startedAt: string;
  completedAt: string | null;
}

export const DiscoveryReportsView: React.FC<DiscoveryReportsViewProps> = ({
  summary,
  onRefreshSummary,
  onNavigateToScan,
}) => {
  const [history, setHistory] = useState<HistoricalScan[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [exportSuccessNotice, setExportSuccessNotice] = useState<string | null>(null);

  const sourceTenantDomain =
    typeof summary?.sourceTenant === 'object' && summary?.sourceTenant !== null
      ? summary.sourceTenant.domain
      : typeof summary?.sourceTenant === 'string'
      ? summary.sourceTenant
      : 'contoso.onmicrosoft.com';

  const fetchScanHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await fetch('/api/discovery/scans/history');
      if (res.ok) {
        const data = await res.json();
        setHistory(data || []);
      }
    } catch (err) {
      console.error('Failed to fetch scan history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchScanHistory();
  }, []);

  const triggerDownload = async (workload: string, format: 'csv' | 'json', label: string) => {
    setIsExporting(`${workload}-${format}`);
    try {
      const res = await fetch('/api/discovery/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format,
          workload,
        }),
      });

      if (!res.ok) throw new Error('Download failed');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const ext = format === 'csv' ? 'csv' : 'json';
      a.download = `M365_${workload.toUpperCase()}_Discovery_${sourceTenantDomain}_${Date.now()}.${ext}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setExportSuccessNotice(`Successfully exported ${label} as .${ext.toUpperCase()}`);
      setTimeout(() => setExportSuccessNotice(null), 4000);
    } catch (err: any) {
      console.error('Export error:', err);
      alert(`Export failed: ${err.message}`);
    } finally {
      setIsExporting(null);
    }
  };

  const workloadReportCards = [
    {
      key: 'exchange',
      name: 'Mailboxes Inventory',
      desc: 'Exchange Online user & shared mailboxes, total item counts, archive status, and mail routing',
      count: summary?.workloadCounts?.exchange ?? 50,
      icon: Mail,
      accent: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      badge: 'Exchange Online',
    },
    {
      key: 'users',
      name: 'User Accounts & Identity',
      desc: 'Entra ID user profiles, job titles, departments, assigned M365 licenses, and MFA enrollment status',
      count: summary?.workloadCounts?.users ?? 50,
      icon: Users,
      accent: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
      badge: 'Entra ID Users',
    },
    {
      key: 'groups',
      name: 'Security & M365 Groups',
      desc: 'Microsoft 365 unified groups, security groups, owner rosters, and membership counts',
      count: summary?.workloadCounts?.groups ?? 20,
      icon: Layers,
      accent: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
      badge: 'Groups',
    },
    {
      key: 'distributionlists',
      name: 'Distribution Lists',
      desc: 'Distribution groups, delivery restrictions, sender authentication rules, and moderation policies',
      count: summary?.workloadCounts?.distributionLists ?? 10,
      icon: ListTree,
      accent: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
      badge: 'DLs & Routing',
    },
    {
      key: 'onedrive',
      name: 'OneDrive Personal Accounts',
      desc: 'OneDrive for Business personal sites, provisioned quotas, used bytes, and external sharing policies',
      count: summary?.workloadCounts?.onedrive ?? 50,
      icon: HardDrive,
      accent: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      badge: 'OneDrive Sites',
    },
    {
      key: 'sharepoint',
      name: 'SharePoint Online Sites',
      desc: 'Site collections, templates, storage consumption MB, document libraries, and hub associations',
      count: summary?.workloadCounts?.sharepoint ?? 15,
      icon: Globe,
      accent: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
      badge: 'SharePoint Sites',
    },
    {
      key: 'teams',
      name: 'Teams Collaboration Data',
      desc: 'Microsoft Teams ecosystems, channel counts, membership rosters, guest access, and installed apps',
      count: summary?.workloadCounts?.teams ?? 10,
      icon: MessageSquare,
      accent: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      badge: 'Microsoft Teams',
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 border border-slate-700/70 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start space-x-4">
            <div className="p-3.5 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 shrink-0">
              <FileText className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-white tracking-tight">Discovery Inventory Reports</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Tenant: {sourceTenantDomain}
                </span>
              </div>
              <p className="text-sm text-slate-300 mt-1 max-w-3xl">
                Download complete inventories and workload audit extracts of your source Microsoft 365 tenant.
                Extract all identified mailboxes, user accounts, groups, distribution lists, OneDrive accounts, SharePoint sites, and Teams data.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={() => {
                fetchScanHistory();
                if (onRefreshSummary) onRefreshSummary();
              }}
              className="p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg transition"
              title="Refresh Reports & History"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              id="btn-download-master-csv"
              disabled={isExporting !== null}
              onClick={() => triggerDownload('full_inventory', 'csv', 'Full Master Inventory (CSV)')}
              className="px-4 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-950/40 transition flex items-center space-x-2 disabled:opacity-50"
            >
              <ArrowDownToLine className="w-4 h-4" />
              <span>Download Full Inventory (.CSV)</span>
            </button>
            <button
              id="btn-download-master-json"
              disabled={isExporting !== null}
              onClick={() => triggerDownload('full_inventory', 'json', 'Full Master Inventory (JSON)')}
              className="px-4 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-950/40 transition flex items-center space-x-2 disabled:opacity-50"
            >
              <FileCode className="w-4 h-4" />
              <span>Download Full Inventory (.JSON)</span>
            </button>
            <a
              id="btn-download-t2t-assessment-report"
              href="/api/discovery/tenant-assessment/export?format=json"
              download
              className="px-4 py-2.5 text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white rounded-xl shadow-lg shadow-purple-950/40 transition flex items-center space-x-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>T2T 8-Workstream Assessment (.JSON)</span>
            </a>
          </div>
        </div>

        {/* Success Toast */}
        {exportSuccessNotice && (
          <div className="mt-4 p-3 bg-emerald-950/70 border border-emerald-500/40 rounded-xl flex items-center space-x-2 text-emerald-300 text-xs animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{exportSuccessNotice}</span>
          </div>
        )}
      </div>

      {/* Master Inventory Overview Hero Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Master Discovery Inventory Archive
            </span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
              Full Tenant Discovery Snapshot
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Consolidated master extract combining all 7 workloads into a standardized tabular format for cutover planning and audits.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 text-center">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-medium">Workloads</span>
              <p className="text-base font-bold text-slate-900 dark:text-white">7 Core</p>
            </div>
            <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 text-center">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-medium">Discovered</span>
              <p className="text-base font-bold text-blue-600 dark:text-blue-400">
                {summary?.totalItems ? summary.totalItems.toLocaleString() : '432'} Items
              </p>
            </div>
            <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 text-center">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-medium">Storage Volume</span>
              <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                {summary?.storage?.totalStorageGB || 1824} GB
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Includes Mailboxes, Users, Groups, DLs, OneDrive, SharePoint & Teams</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>
              Last scanned:{' '}
              {summary?.lastScanTimestamp
                ? new Date(summary.lastScanTimestamp).toLocaleString()
                : 'Just now'}
            </span>
          </div>
        </div>
      </div>

      {/* Workload-Specific Reports Grid */}
      <div>
        <div className="mb-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Workload-Specific Inventory Reports</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Download individual CSV or JSON inventory extracts tailored to each identified workload.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {workloadReportCards.map((card) => {
            const Icon = card.icon;
            const isCsvLoading = isExporting === `${card.key}-csv`;
            const isJsonLoading = isExporting === `${card.key}-json`;

            return (
              <div
                key={card.key}
                id={`report-card-${card.key}`}
                className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 hover:border-blue-500/50 hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div className={`p-2 rounded-lg border ${card.accent}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {card.count} items
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{card.name}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {card.desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center space-x-2">
                  <button
                    disabled={isExporting !== null}
                    onClick={() => triggerDownload(card.key, 'csv', `${card.name} (CSV)`)}
                    className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1 transition disabled:opacity-50"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{isCsvLoading ? 'Exporting...' : 'CSV'}</span>
                  </button>

                  <button
                    disabled={isExporting !== null}
                    onClick={() => triggerDownload(card.key, 'json', `${card.name} (JSON)`)}
                    className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1 transition disabled:opacity-50"
                  >
                    <FileCode className="w-3.5 h-3.5 text-blue-500" />
                    <span>{isJsonLoading ? 'Exporting...' : 'JSON'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Historical Discovery Scans Table */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Discovery Scan History & Snapshots</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Audit log of previous discovery runs on source tenant {sourceTenantDomain}.
            </p>
          </div>
          <button
            onClick={fetchScanHistory}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Refresh History</span>
          </button>
        </div>

        {isLoadingHistory ? (
          <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
            Loading discovery scan logs...
          </div>
        ) : history.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
            No discovery scans recorded yet. Trigger a discovery scan to generate reports.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/60 uppercase text-[10px] text-slate-500 font-mono border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-3">Scan ID & Type</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Discovered Items</th>
                  <th className="py-3 px-3">Storage</th>
                  <th className="py-3 px-3">Workload Breakdown</th>
                  <th className="py-3 px-3">Timestamp</th>
                  <th className="py-3 px-3 text-right">Download</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {history.map((scan) => (
                  <tr key={scan.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {scan.id.slice(0, 8)}...
                      </div>
                      <span className="text-[10px] text-blue-500">{scan.scanType} SCAN</span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          scan.status === 'COMPLETED'
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                            : scan.status === 'RUNNING'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse'
                            : scan.status === 'RETRYING'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                            : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                        }`}
                      >
                        {scan.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-900 dark:text-white font-bold">
                      {scan.totalItemsDiscovered || 0} items
                    </td>
                    <td className="py-3 px-3 text-emerald-500 font-semibold">
                      {scan.totalStorageGB || 0} GB
                    </td>
                    <td className="py-3 px-3 text-[11px] text-slate-500 dark:text-slate-400">
                      Mbx: {scan.mailboxesDiscovered} • Usr: {scan.usersDiscovered} • Grp: {scan.groupsDiscovered} • DL: {scan.dlDiscovered} • OD: {scan.oneDrivesDiscovered} • SP: {scan.sharePointSitesDiscovered} • Teams: {scan.teamsDiscovered}
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {new Date(scan.completedAt || scan.startedAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => triggerDownload('full_inventory', 'csv', `Scan ${scan.id.slice(0, 8)} CSV`)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded hover:text-white transition"
                        title="Download full inventory CSV"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
