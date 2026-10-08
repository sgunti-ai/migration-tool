import React, { useState } from 'react';
import { Play, X, Shield, RefreshCw, Layers, CheckSquare, Square, Settings2 } from 'lucide-react';

interface ScanConfigDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onStartScan: (config: { scanType: 'FULL' | 'INCREMENTAL'; workloads: string[] }) => Promise<void>;
  isStarting: boolean;
}

export const ScanConfigDialog: React.FC<ScanConfigDialogProps> = ({
  isOpen,
  onClose,
  onStartScan,
  isStarting,
}) => {
  const [scanType, setScanType] = useState<'FULL' | 'INCREMENTAL'>('FULL');
  const [workloads, setWorkloads] = useState<{ [key: string]: boolean }>({
    Users: true,
    Groups: true,
    OneDrive: true,
    Exchange: true,
    SharePoint: true,
    Teams: true,
    DistributionLists: true,
  });

  if (!isOpen) return null;

  const workloadItems = [
    {
      id: 'Users',
      label: 'Users & Entra ID Security',
      desc: 'UPN, display name, department, manager, licenses, groups, MFA status',
      iconColor: 'text-blue-400',
    },
    {
      id: 'Groups',
      label: 'Entra ID & M365 Groups',
      desc: 'Security groups, Unified M365 groups, owners, member rosters',
      iconColor: 'text-cyan-400',
    },
    {
      id: 'OneDrive',
      label: 'OneDrive for Business',
      desc: 'Site URL, storage used, file count, last modified, external sharing',
      iconColor: 'text-emerald-400',
    },
    {
      id: 'Exchange',
      label: 'Exchange Online Mailboxes',
      desc: 'Mailbox type, size, item count, archive status, delegates, forwarding rules',
      iconColor: 'text-amber-400',
    },
    {
      id: 'SharePoint',
      label: 'SharePoint Online Sites',
      desc: 'Site collections, subsites, lists, libraries, permissions, storage used',
      iconColor: 'text-indigo-400',
    },
    {
      id: 'Teams',
      label: 'Microsoft Teams',
      desc: 'Teams, channels, members, owners, tabs, files, apps, chat history',
      iconColor: 'text-purple-400',
    },
    {
      id: 'DistributionLists',
      label: 'Distribution Lists',
      desc: 'Primary SMTP, aliases, members, owners, delivery management restrictions',
      iconColor: 'text-rose-400',
    },
  ];

  const handleToggleWorkload = (id: string) => {
    setWorkloads((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSelectAll = (select: boolean) => {
    const updated: any = {};
    workloadItems.forEach((w) => {
      updated[w.id] = select;
    });
    setWorkloads(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const selected = Object.keys(workloads).filter((k) => workloads[k]);
    if (selected.length === 0) return;
    await onStartScan({ scanType, workloads: selected });
    onClose();
  };

  const selectedCount = Object.values(workloads).filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Settings2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Configure Source Tenant Scan</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Microsoft Graph API, SharePoint PnP & Exchange PowerShell</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:bg-white dark:bg-slate-800 rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Scan Type Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              Scan Mode
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                id="opt-scan-full"
                onClick={() => setScanType('FULL')}
                className={`p-3 rounded-xl border text-left transition ${
                  scanType === 'FULL'
                    ? 'bg-blue-600/10 border-blue-500 text-slate-900 dark:text-white'
                    : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="text-sm font-semibold flex items-center justify-between">
                  <span>Full Comprehensive</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">Default</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Full re-index of all tenant workload objects, attributes, and permissions.
                </div>
              </button>

              <button
                type="button"
                id="opt-scan-incremental"
                onClick={() => setScanType('INCREMENTAL')}
                className={`p-3 rounded-xl border text-left transition ${
                  scanType === 'INCREMENTAL'
                    ? 'bg-blue-600/10 border-blue-500 text-slate-900 dark:text-white'
                    : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="text-sm font-semibold flex items-center justify-between">
                  <span>Incremental Delta</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">Fast</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Uses Microsoft Graph delta tokens; updates only modified or newly created entities.
                </div>
              </button>
            </div>
          </div>

          {/* Workload Checkboxes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Workloads to Scan ({selectedCount}/{workloadItems.length})
              </label>
              <div className="flex items-center space-x-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleSelectAll(true)}
                  className="text-blue-400 hover:underline"
                >
                  Select All
                </button>
                <span className="text-slate-600">•</span>
                <button
                  type="button"
                  onClick={() => handleSelectAll(false)}
                  className="text-slate-500 dark:text-slate-400 hover:underline"
                >
                  Clear All
                </button>
              </div>
            </div>

            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {workloadItems.map((item) => {
                const isChecked = !!workloads[item.id];
                return (
                  <div
                    key={item.id}
                    id={`checkbox-workload-${item.id}`}
                    onClick={() => handleToggleWorkload(item.id)}
                    className={`p-2.5 rounded-lg border cursor-pointer flex items-start space-x-3 transition ${
                      isChecked
                        ? 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
                        : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/60 opacity-60 hover:opacity-80'
                    }`}
                  >
                    <div className="pt-0.5">
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-blue-400 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-600 shrink-0" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-900 dark:text-white">{item.label}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{item.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Auto-retry on HTTP 429 Enabled
            </span>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white transition"
              >
                Cancel
              </button>

              <button
                id="btn-trigger-scan"
                type="submit"
                disabled={isStarting || selectedCount === 0}
                className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-sm transition flex items-center space-x-1.5 disabled:opacity-50"
              >
                {isStarting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Initializing Scan...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Run Discovery Scan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
