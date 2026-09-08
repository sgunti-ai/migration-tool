import React, { useState } from 'react';
import { Download, X, FileText, Code2, Check, CheckCircle2 } from 'lucide-react';
import { DiscoveredUser } from '../../types';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedUsers?: DiscoveredUser[];
  totalFilteredCount: number;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  onClose,
  selectedUsers = [],
  totalFilteredCount,
}) => {
  const [format, setFormat] = useState<'csv' | 'json'>('csv');
  const [workload, setWorkload] = useState<string>('users');
  const [scope, setScope] = useState<'selected' | 'all'>(selectedUsers.length > 0 ? 'selected' : 'all');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportComplete, setExportComplete] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const body: any = {
        format,
        workload,
      };

      if (workload === 'users' && scope === 'selected' && selectedUsers.length > 0) {
        body.selectedIds = selectedUsers.map((u) => u.id);
      }

      const res = await fetch('/api/discovery/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('Export request failed');

      const blob = await res.blob();
      const disposition = res.headers.get('content-disposition');
      let filename = `m365_discovery_${workload}.${format}`;
      if (disposition && disposition.includes('filename=')) {
        const match = disposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) filename = match[1];
      }

      // Trigger download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setExportComplete(true);
      setTimeout(() => {
        setExportComplete(false);
        setIsExporting(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Export failed:', err);
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Export Discovery Inventory</h3>
              <p className="text-xs text-slate-400">Download discovered tenant data for offline auditing or migration planning</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Format Selection */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Export Format
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              id="opt-format-csv"
              onClick={() => setFormat('csv')}
              className={`p-3 rounded-xl border flex items-center space-x-3 text-left transition ${
                format === 'csv'
                  ? 'bg-blue-600/10 border-blue-500 text-white'
                  : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className={`w-5 h-5 ${format === 'csv' ? 'text-blue-400' : 'text-slate-500'}`} />
              <div>
                <div className="text-sm font-semibold">CSV Spreadsheet</div>
                <div className="text-[11px] text-slate-400">Excel / Table compatible</div>
              </div>
            </button>

            <button
              type="button"
              id="opt-format-json"
              onClick={() => setFormat('json')}
              className={`p-3 rounded-xl border flex items-center space-x-3 text-left transition ${
                format === 'json'
                  ? 'bg-blue-600/10 border-blue-500 text-white'
                  : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code2 className={`w-5 h-5 ${format === 'json' ? 'text-blue-400' : 'text-slate-500'}`} />
              <div>
                <div className="text-sm font-semibold">Structured JSON</div>
                <div className="text-[11px] text-slate-400">API & Scripting payload</div>
              </div>
            </button>
          </div>
        </div>

        {/* Workload Selection */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Target Workload
          </label>
          <select
            id="select-export-workload"
            value={workload}
            onChange={(e) => setWorkload(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-slate-800/80 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="users">Entra ID Users & Security Profiles</option>
            <option value="groups">M365 & Security Groups</option>
            <option value="onedrive">OneDrive for Business Sites</option>
            <option value="exchange">Exchange Online Mailboxes</option>
            <option value="sharepoint">SharePoint Online Site Collections</option>
            <option value="teams">Microsoft Teams & Channels</option>
            <option value="distributionlists">Distribution Lists</option>
          </select>
        </div>

        {/* Export Scope (Only if Workload is Users) */}
        {workload === 'users' && (
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Data Scope
            </label>
            <div className="space-y-1.5 text-xs text-slate-300">
              {selectedUsers.length > 0 && (
                <label className="flex items-center space-x-2.5 p-2 rounded-lg bg-slate-800/40 border border-slate-800 cursor-pointer">
                  <input
                    type="radio"
                    name="scope"
                    checked={scope === 'selected'}
                    onChange={() => setScope('selected')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span>
                    Selected items only (<strong className="text-white">{selectedUsers.length}</strong> users)
                  </span>
                </label>
              )}

              <label className="flex items-center space-x-2.5 p-2 rounded-lg bg-slate-800/40 border border-slate-800 cursor-pointer">
                <input
                  type="radio"
                  name="scope"
                  checked={scope === 'all'}
                  onChange={() => setScope('all')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span>
                  All filtered users (<strong className="text-white">{totalFilteredCount}</strong> users)
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition"
          >
            Cancel
          </button>

          <button
            id="btn-confirm-export"
            type="button"
            disabled={isExporting}
            onClick={handleExport}
            className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-sm transition flex items-center space-x-2 disabled:opacity-50"
          >
            {exportComplete ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>Downloaded!</span>
              </>
            ) : isExporting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download {format.toUpperCase()}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
