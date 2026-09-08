import React from 'react';
import { 
  Users, 
  HardDrive, 
  Globe, 
  MessageSquare, 
  Mail, 
  Layers, 
  ListTree, 
  Clock, 
  CheckCircle2, 
  ShieldCheck, 
  Activity,
  ArrowUpRight
} from 'lucide-react';
import { DiscoverySummary } from '../../types';

interface DiscoveryStatsProps {
  summary: DiscoverySummary | null;
  isLoading: boolean;
  onWorkloadSelect?: (workload: string) => void;
  onOpenScanConfig?: () => void;
}

export const DiscoveryStats: React.FC<DiscoveryStatsProps> = ({
  summary,
  isLoading,
  onWorkloadSelect,
  onOpenScanConfig,
}) => {
  if (isLoading && !summary) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
            <div className="h-4 bg-slate-800 rounded w-1/3"></div>
            <div className="h-8 bg-slate-800 rounded w-1/2"></div>
            <div className="h-3 bg-slate-800 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  const counts = summary?.workloadCounts || {
    users: 0,
    groups: 0,
    onedrive: 0,
    exchange: 0,
    sharepoint: 0,
    teams: 0,
    distributionLists: 0,
  };

  const totalStorage = summary?.storage?.totalStorageGB ?? 0;
  const mfaRate = summary?.security?.mfaEnforcedRate ?? 0;

  // Format date helper
  const formattedLastScan = summary?.lastScanTimestamp
    ? new Date(summary.lastScanTimestamp).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Never';

  // Primary top summary metrics
  const primaryCards = [
    {
      id: 'users',
      title: 'Discovered Users',
      value: (counts?.users ?? 0).toLocaleString(),
      subtitle: `${summary?.security?.mfaEnforced ?? 0} MFA Enforced (${mfaRate}%)`,
      icon: Users,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      workload: 'users',
    },
    {
      id: 'storage',
      title: 'Total Storage Discovered',
      value: `${(totalStorage ?? 0).toLocaleString()} GB`,
      subtitle: `OD: ${summary?.storage?.oneDriveStorageGB ?? 0}GB • SP: ${summary?.storage?.sharePointStorageGB ?? 0}GB`,
      icon: HardDrive,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
      workload: 'onedrive',
    },
    {
      id: 'sharepoint',
      title: 'SharePoint Sites',
      value: (counts?.sharepoint ?? 0).toLocaleString(),
      subtitle: `${counts?.onedrive ?? 0} OneDrive accounts active`,
      icon: Globe,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10',
      borderColor: 'border-indigo-500/20',
      workload: 'sharepoint',
    },
    {
      id: 'collaboration',
      title: 'Teams & Groups',
      value: `${counts?.teams ?? 0} Teams / ${counts?.groups ?? 0} Groups`,
      subtitle: `${counts?.distributionLists ?? 0} Distribution Lists found`,
      icon: MessageSquare,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20',
      workload: 'teams',
    },
  ];

  // Workload progress breakdown items
  const workloadProgress = [
    { name: 'Entra ID Users', count: counts?.users ?? 0, quota: 50, icon: Users, color: 'bg-blue-500', workload: 'users' },
    { name: 'M365 & Security Groups', count: counts?.groups ?? 0, quota: 20, icon: Layers, color: 'bg-cyan-500', workload: 'groups' },
    { name: 'OneDrive Personal Sites', count: counts?.onedrive ?? 0, quota: 50, icon: HardDrive, color: 'bg-emerald-500', workload: 'onedrive' },
    { name: 'Exchange Mailboxes', count: counts?.exchange ?? 0, quota: 50, icon: Mail, color: 'bg-amber-500', workload: 'exchange' },
    { name: 'SharePoint Collections', count: counts?.sharepoint ?? 0, quota: 15, icon: Globe, color: 'bg-indigo-500', workload: 'sharepoint' },
    { name: 'Microsoft Teams', count: counts?.teams ?? 0, quota: 10, icon: MessageSquare, color: 'bg-purple-500', workload: 'teams' },
    { name: 'Distribution Lists', count: counts?.distributionLists ?? 0, quota: 10, icon: ListTree, color: 'bg-rose-500', workload: 'distributionlists' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner with Last Scan Metadata */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/70 border border-slate-800/90 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-semibold text-white">Discovery Status: Operational</span>
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                {summary?.status || 'READY'}
              </span>
              <span className="px-2 py-0.5 text-xs font-mono rounded bg-slate-800 text-slate-300 border border-slate-700">
                {summary?.scanType || 'FULL'} SCAN
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              Last scanned: <span className="text-slate-300 font-medium">{formattedLastScan}</span>
              <span>•</span>
              <span>{summary?.totalItems || 0} total tenant entities indexed</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            id="btn-scan-settings-stats"
            onClick={onOpenScanConfig}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg border border-slate-700 transition flex items-center space-x-1.5"
          >
            <Activity className="w-3.5 h-3.5 text-blue-400" />
            <span>Configure Scan</span>
          </button>
        </div>
      </div>

      {/* 4 Hero KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {primaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              id={`card-stat-${card.id}`}
              onClick={() => onWorkloadSelect && onWorkloadSelect(card.workload)}
              className={`p-4 rounded-xl bg-slate-900/60 border ${card.borderColor} hover:border-slate-600 transition-all cursor-pointer group shadow-sm flex flex-col justify-between`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-medium text-slate-400">{card.title}</span>
                  <div className="text-2xl font-bold text-white mt-1 group-hover:text-blue-300 transition">
                    {card.value}
                  </div>
                </div>
                <div className={`p-2 rounded-lg ${card.bgColor} ${card.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400 truncate">{card.subtitle}</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition shrink-0" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Workload-Specific Progress Bars & Final Counts */}
      <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/80">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Workload Discovery Inventory</h3>
            <p className="text-xs text-slate-400">Final counts and coverage across all 7 Microsoft 365 workloads</p>
          </div>
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Graph API & PnP Validated</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
          {workloadProgress.map((item) => {
            const Icon = item.icon;
            // Calculate a visual representation percentage relative to an expected baseline
            const pct = Math.min(100, Math.max(15, Math.round((item.count / (item.quota || 1)) * 100)));
            return (
              <div
                key={item.name}
                id={`workload-progress-${item.workload}`}
                onClick={() => onWorkloadSelect && onWorkloadSelect(item.workload)}
                className="p-3 rounded-lg bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <Icon className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-mono font-bold text-white">{item.count}</span>
                  </div>
                  <div className="text-xs font-medium text-slate-300 truncate" title={item.name}>
                    {item.name}
                  </div>
                </div>

                <div className="mt-3">
                  <div className="w-full bg-slate-700/60 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1">
                    <span>Discovered</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
