import React, { useState, useEffect } from 'react';
import { DiscoveryScanStatus } from '../../types';
import { Activity, CheckCircle2, AlertCircle, RefreshCw, XCircle } from 'lucide-react';

interface ScanProgressIndicatorProps {
  scanStatus: DiscoveryScanStatus | null;
  onRefresh?: () => void;
}

export const ScanProgressIndicator: React.FC<ScanProgressIndicatorProps> = ({
  scanStatus,
  onRefresh,
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  useEffect(() => {
    if (scanStatus && scanStatus.status === 'RUNNING') {
      const timer = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    } else {
      setElapsedSeconds(0);
    }
  }, [scanStatus?.status]);

  if (!scanStatus || scanStatus.status !== 'RUNNING') {
    return null;
  }

  const progress = scanStatus.progress || 0;
  const currentStage = scanStatus.currentStage || 'Initializing discovery scan...';

  const formatElapsed = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remaining = sec % 60;
    return `${mins}:${remaining < 10 ? '0' : ''}${remaining}`;
  };

  return (
    <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/40 to-slate-900/90 border border-blue-500/30 shadow-lg space-y-3 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-ping absolute inset-0"></div>
            <div className="w-3 h-3 bg-blue-500 rounded-full relative"></div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-semibold text-white">Source Tenant Discovery in Progress</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {scanStatus.scanType} SCAN
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">{currentStage}</p>
          </div>
        </div>

        <div className="flex items-center space-x-4 text-xs font-mono">
          <span className="text-slate-400">
            Elapsed: <strong className="text-white">{formatElapsed(elapsedSeconds)}</strong>
          </span>
          <span className="text-blue-400 font-bold text-sm">{progress}%</span>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
              title="Refresh status"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
        <div
          className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400">
        <span>Microsoft Graph API v1.0 • Exchange Online PowerShell • SharePoint PnP</span>
        <span>Scanning 7 core workloads asynchronously</span>
      </div>
    </div>
  );
};
