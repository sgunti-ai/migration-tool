import React from 'react';
import {
  Users,
  HardDrive,
  Globe,
  MessageSquare,
  Mail,
  Layers,
  ListTree,
  ShieldCheck,
} from 'lucide-react';
import { DiscoverySummary } from '../../types';

interface WorkloadDiscoveryInventoryProps {
  summary: DiscoverySummary | null;
  isLoading: boolean;
  onWorkloadSelect: (workload: string) => void;
}

export const WorkloadDiscoveryInventory: React.FC<WorkloadDiscoveryInventoryProps> = ({
  summary,
  isLoading,
  onWorkloadSelect,
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
      <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800/80">
        <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white">Workload Discovery Inventory</h2>
            <p className="text-sm text-slate-400 mt-1">Final counts and coverage across all Microsoft 365 workloads. Click a workload to view detailed inventory.</p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-slate-400 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Graph API & PnP Validated</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {workloadProgress.map((item) => {
            const Icon = item.icon;
            // Calculate a visual representation percentage relative to an expected baseline
            const pct = Math.min(100, Math.max(15, Math.round((item.count / (item.quota || 1)) * 100)));
            return (
              <div
                key={item.name}
                id={`workload-progress-${item.workload}`}
                onClick={() => onWorkloadSelect(item.workload)}
                className="p-5 rounded-xl bg-slate-800/40 border border-slate-700/60 hover:border-blue-500/50 hover:bg-slate-800/80 hover:shadow-lg hover:shadow-blue-900/20 transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className={`p-2.5 rounded-lg ${item.color.replace('bg-', 'bg-').replace('-500', '-500/10')} ${item.color.replace('bg-', 'text-')}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors">{item.count.toLocaleString()}</span>
                  </div>
                  <div className="text-sm font-semibold text-slate-200 mb-1">
                    {item.name}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-700/50">
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-400 mt-2">
                    <span>Discovery Coverage</span>
                    <span className="font-medium text-slate-300">100%</span>
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
