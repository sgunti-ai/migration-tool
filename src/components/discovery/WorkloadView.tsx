import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Layers, 
  HardDrive, 
  Mail, 
  Globe, 
  MessageSquare, 
  ListTree, 
  Search, 
  ExternalLink, 
  Shield, 
  Lock, 
  Share2, 
  Archive, 
  RefreshCw 
} from 'lucide-react';

interface WorkloadViewProps {
  workload: string;
  onBackToOverview: () => void;
  onExport: () => void;
}

export const WorkloadView: React.FC<WorkloadViewProps> = ({
  workload,
  onBackToOverview,
  onExport,
}) => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const fetchItems = () => {
    setLoading(true);
    fetch(`/api/discovery/workloads/${workload}`)
      .then((res) => res.json())
      .then((data) => {
        setItems(data.items || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load workload items:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchItems();
  }, [workload]);

  const workloadMeta: { [key: string]: { title: string; desc: string; icon: any } } = {
    groups: {
      title: 'Discovered Entra ID & M365 Groups',
      desc: 'Security groups, Unified Microsoft 365 groups, dynamic rosters & owners',
      icon: Layers,
    },
    onedrive: {
      title: 'Discovered OneDrive for Business Sites',
      desc: 'Personal site collections, storage consumed, files count & external sharing policies',
      icon: HardDrive,
    },
    exchange: {
      title: 'Discovered Exchange Online Mailboxes',
      desc: 'User mailboxes, shared mailboxes, room resources, archiving & forwarding rules',
      icon: Mail,
    },
    sharepoint: {
      title: 'Discovered SharePoint Online Collections',
      desc: 'Hubs, communication sites, team collaboration sites, lists & libraries',
      icon: Globe,
    },
    teams: {
      title: 'Discovered Microsoft Teams',
      desc: 'Teams workspaces, channels, tabs, apps, owners & member counts',
      icon: MessageSquare,
    },
    distributionlists: {
      title: 'Discovered Distribution Lists',
      desc: 'Distribution groups, moderation settings, delivery management & aliases',
      icon: ListTree,
    },
  };

  const meta = workloadMeta[workload.toLowerCase()] || {
    title: `Discovered ${workload}`,
    desc: 'Workload entities discovered via Graph API',
    icon: Globe,
  };

  const Icon = meta.icon;

  const filteredItems = items.filter((item) => {
    const jsonStr = JSON.stringify(item).toLowerCase();
    return jsonStr.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">{meta.title}</h2>
            <p className="text-xs text-slate-400">{meta.desc}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search items..."
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-800/80 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 w-48"
            />
          </div>

          <button
            onClick={fetchItems}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg border border-slate-700 transition"
            title="Refresh list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="rounded-xl bg-slate-900/60 border border-slate-800/80 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3 text-slate-400">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs">Loading workload data...</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20 text-slate-500 text-xs">
            No items discovered for this workload.
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* 1. GROUPS TABLE */}
            {workload.toLowerCase() === 'groups' && (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/60 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Group Name</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Members</th>
                    <th className="px-4 py-3">Owners</th>
                    <th className="px-4 py-3">Security</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {filteredItems.map((grp: any) => (
                    <tr key={grp.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-4 py-3 font-medium text-white">{grp.name}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-300 border border-blue-500/20">
                          {grp.groupType}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-400">{grp.email || '—'}</td>
                      <td className="px-4 py-3 font-mono font-semibold text-white">{grp.memberCount}</td>
                      <td className="px-4 py-3 text-slate-400 truncate max-w-xs">
                        {Array.isArray(grp.owners) ? grp.owners.join(', ') : grp.owners}
                      </td>
                      <td className="px-4 py-3">
                        {grp.isSecurityEnabled ? (
                          <span className="text-emerald-400 font-medium">Security Enabled</span>
                        ) : (
                          <span className="text-slate-500">Standard</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 2. ONEDRIVE TABLE */}
            {workload.toLowerCase() === 'onedrive' && (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/60 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">User Principal Name</th>
                    <th className="px-4 py-3">Site URL</th>
                    <th className="px-4 py-3">Storage Used</th>
                    <th className="px-4 py-3">Quota</th>
                    <th className="px-4 py-3">Files</th>
                    <th className="px-4 py-3">External Sharing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {filteredItems.map((od: any) => {
                    const usedGB = (od.storageUsedBytes / (1024 * 1024 * 1024)).toFixed(1);
                    const quotaGB = Math.round(od.storageQuotaBytes / (1024 * 1024 * 1024));
                    return (
                      <tr key={od.id} className="hover:bg-slate-800/40 transition">
                        <td className="px-4 py-3 font-medium text-white">{od.userPrincipalName}</td>
                        <td className="px-4 py-3 font-mono text-blue-400 truncate max-w-xs" title={od.siteUrl}>
                          {od.siteUrl}
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-emerald-400">{usedGB} GB</td>
                        <td className="px-4 py-3 font-mono text-slate-400">{quotaGB} GB</td>
                        <td className="px-4 py-3 font-mono text-white">{(od.fileCount ?? 0).toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
                            {od.externalSharing}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* 3. EXCHANGE TABLE */}
            {workload.toLowerCase() === 'exchange' && (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/60 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">User Principal Name</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Total Size</th>
                    <th className="px-4 py-3">Item Count</th>
                    <th className="px-4 py-3">Archive</th>
                    <th className="px-4 py-3">Delegates</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {filteredItems.map((mbx: any) => {
                    const sizeGB = (mbx.totalItemSizeMB / 1024).toFixed(2);
                    return (
                      <tr key={mbx.id} className="hover:bg-slate-800/40 transition">
                        <td className="px-4 py-3 font-medium text-white">{mbx.userPrincipalName}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-300 border border-blue-500/20">
                            {mbx.mailboxType}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-white">{sizeGB} GB</td>
                        <td className="px-4 py-3 font-mono text-slate-300">{(mbx.itemCount ?? 0).toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                              mbx.archiveStatus === 'Active'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {mbx.archiveStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-400 truncate max-w-xs">
                          {Array.isArray(mbx.delegates) && mbx.delegates.length > 0
                            ? mbx.delegates.join(', ')
                            : 'None'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* 4. SHAREPOINT TABLE */}
            {workload.toLowerCase() === 'sharepoint' && (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/60 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Site Collection Title</th>
                    <th className="px-4 py-3">Site URL</th>
                    <th className="px-4 py-3">Storage Used</th>
                    <th className="px-4 py-3">Subsites</th>
                    <th className="px-4 py-3">Libraries</th>
                    <th className="px-4 py-3">Primary Owner</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {filteredItems.map((sp: any) => {
                    const sizeGB = (sp.storageUsedMB / 1024).toFixed(1);
                    return (
                      <tr key={sp.id} className="hover:bg-slate-800/40 transition">
                        <td className="px-4 py-3 font-medium text-white">{sp.siteTitle}</td>
                        <td className="px-4 py-3 font-mono text-blue-400 truncate max-w-xs" title={sp.siteUrl}>
                          {sp.siteUrl}
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-indigo-400">{sizeGB} GB</td>
                        <td className="px-4 py-3 font-mono text-white">{sp.subsiteCount}</td>
                        <td className="px-4 py-3 font-mono text-white">{sp.libraryCount}</td>
                        <td className="px-4 py-3 text-slate-400">{sp.primaryOwner || 'Admin'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* 5. TEAMS TABLE */}
            {workload.toLowerCase() === 'teams' && (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/60 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Team Name</th>
                    <th className="px-4 py-3">Visibility</th>
                    <th className="px-4 py-3">Channels</th>
                    <th className="px-4 py-3">Members</th>
                    <th className="px-4 py-3">Owners</th>
                    <th className="px-4 py-3">Installed Apps</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {filteredItems.map((tm: any) => (
                    <tr key={tm.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-white">{tm.teamName}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-xs">{tm.description}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/10 text-purple-300 border border-purple-500/20">
                          {tm.visibility}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono font-semibold text-white">{tm.channelsCount}</td>
                      <td className="px-4 py-3 font-mono text-slate-300">{tm.membersCount}</td>
                      <td className="px-4 py-3 text-slate-400 truncate max-w-xs">
                        {Array.isArray(tm.owners) ? tm.owners.join(', ') : tm.owners}
                      </td>
                      <td className="px-4 py-3 text-slate-400 truncate max-w-xs">
                        {Array.isArray(tm.installedApps) ? tm.installedApps.join(', ') : 'Default'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 6. DISTRIBUTION LISTS TABLE */}
            {(workload.toLowerCase() === 'distributionlists' || workload.toLowerCase() === 'dl') && (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/60 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Display Name</th>
                    <th className="px-4 py-3">Primary SMTP</th>
                    <th className="px-4 py-3">Members</th>
                    <th className="px-4 py-3">Delivery Policy</th>
                    <th className="px-4 py-3">Moderation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {filteredItems.map((dl: any) => (
                    <tr key={dl.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-4 py-3 font-medium text-white">{dl.displayName}</td>
                      <td className="px-4 py-3 font-mono text-rose-400">{dl.primarySmtpAddress}</td>
                      <td className="px-4 py-3 font-mono font-semibold text-white">{dl.memberCount}</td>
                      <td className="px-4 py-3 text-slate-400">{dl.deliveryManagement}</td>
                      <td className="px-4 py-3">
                        {dl.moderationEnabled ? (
                          <span className="text-amber-400 font-medium">Moderated</span>
                        ) : (
                          <span className="text-slate-500">Unrestricted</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
