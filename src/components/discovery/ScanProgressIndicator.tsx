import React, { useState, useEffect } from 'react';
import { DiscoveryScanStatus } from '../../types';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  XCircle,
  WifiOff,
  Wifi,
  RotateCw,
  Play,
  ShieldCheck,
  Mail,
  Users,
  Layers,
  ListTree,
  HardDrive,
  Globe,
  MessageSquare
} from 'lucide-react';

interface ScanProgressIndicatorProps {
  scanStatus: DiscoveryScanStatus | null;
  onRefresh?: () => void;
}

export const ScanProgressIndicator: React.FC<ScanProgressIndicatorProps> = ({
  scanStatus,
  onRefresh,
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isSimulatingDisconnect, setIsSimulatingDisconnect] = useState<boolean>(false);
  const [isRetryingManual, setIsRetryingManual] = useState<boolean>(false);

  useEffect(() => {
    if (scanStatus && (scanStatus.status === 'RUNNING' || scanStatus.status === 'RETRYING')) {
      const timer = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    } else {
      setElapsedSeconds(0);
    }
  }, [scanStatus?.status]);

  if (!scanStatus || (scanStatus.status !== 'RUNNING' && scanStatus.status !== 'RETRYING' && scanStatus.status !== 'FAILED')) {
    return null;
  }

  const progress = scanStatus.progress || 0;
  const currentStage = scanStatus.currentStage || 'Initializing discovery scan...';
  const retryCount = scanStatus.retryCount || 0;
  const maxRetries = scanStatus.maxRetries || 3;
  const isRetrying = scanStatus.status === 'RETRYING';
  const isFailed = scanStatus.status === 'FAILED';

  const formatElapsed = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remaining = sec % 60;
    return `${mins}:${remaining < 10 ? '0' : ''}${remaining}`;
  };

  const workloadStages = [
    { key: 'exchange', label: 'Mailboxes', icon: Mail },
    { key: 'users', label: 'Users', icon: Users },
    { key: 'groups', label: 'Groups', icon: Layers },
    { key: 'distributionlists', label: 'Distribution Lists', icon: ListTree },
    { key: 'onedrive', label: 'OneDrive', icon: HardDrive },
    { key: 'sharepoint', label: 'SharePoint', icon: Globe },
    { key: 'teams', label: 'Teams', icon: MessageSquare },
  ];

  const handleSimulateDisconnect = async () => {
    setIsSimulatingDisconnect(true);
    try {
      await fetch('/api/discovery/simulate-disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Simulated network drop / token expiry' }),
      });
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to trigger disconnect simulation:', err);
    } finally {
      setIsSimulatingDisconnect(false);
    }
  };

  const handleResumeScan = async () => {
    setIsRetryingManual(true);
    try {
      await fetch('/api/discovery/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromCheckpoint: true }),
      });
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to resume discovery scan:', err);
    } finally {
      setIsRetryingManual(false);
    }
  };

  const handleRestartScan = async () => {
    setIsRetryingManual(true);
    try {
      await fetch('/api/discovery/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromCheckpoint: false }),
      });
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to restart discovery scan:', err);
    } finally {
      setIsRetryingManual(false);
    }
  };

  return (
    <div
      className={`p-5 rounded-2xl border shadow-xl space-y-4 animate-fadeIn transition-colors ${
        isRetrying
          ? 'bg-gradient-to-r from-amber-950/70 via-slate-900 to-amber-950/40 border-amber-500/50 shadow-amber-950/30'
          : isFailed
          ? 'bg-gradient-to-r from-rose-950/70 via-slate-900 to-rose-950/40 border-rose-500/50 shadow-rose-950/30'
          : 'bg-gradient-to-r from-slate-900 via-blue-950/60 to-slate-900 border-blue-500/30 shadow-blue-950/20'
      }`}
    >
      {/* Retrying Banner if disconnected */}
      {isRetrying && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-200 text-xs">
          <div className="flex items-center space-x-2.5">
            <WifiOff className="w-5 h-5 text-amber-400 animate-pulse shrink-0" />
            <div>
              <div className="flex items-center space-x-2">
                <strong className="font-bold text-amber-300">Disconnected from Source Tenant</strong>
                <span className="px-2 py-0.5 rounded-full font-mono text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  RETRY ATTEMPT {retryCount} OF {maxRetries}
                </span>
              </div>
              <p className="text-[11px] text-amber-300/80 mt-0.5">
                {scanStatus.disconnectReason || 'Connection interrupted.'} Retrying connection in 3 seconds. Preserving checkpoint at{' '}
                <span className="underline font-semibold">{scanStatus.lastCompletedWorkload || 'current stage'}</span> ({progress}%). The scan will resume exactly from where it paused.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-amber-950/80 border border-amber-600/40 text-amber-300 font-mono text-[10px]">
              <RotateCw className="w-3 h-3 animate-spin" />
              <span>Resuming checkpoint...</span>
            </span>
          </div>
        </div>
      )}

      {/* Failed Banner if exhausted retries with interactive Recovery Controls */}
      {isFailed && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/40 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-rose-200 text-xs shadow-lg">
          <div className="flex items-start sm:items-center space-x-3">
            <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <div className="flex items-center space-x-2">
                <strong className="font-bold text-rose-300">Discovery Scan Stopped (3 Retries Exhausted)</strong>
                <span className="px-2 py-0.5 rounded-full font-mono text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  {maxRetries}/{maxRetries} ATTEMPTS FAILED
                </span>
              </div>
              <p className="text-[11px] text-rose-300/80 mt-1">
                {scanStatus.disconnectReason || `Automatic auto-recovery stopped after ${maxRetries} consecutive interruptions to protect tenant API quotas. Checkpoint is safely preserved at ${progress}%.`}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-rose-500/20">
            <button
              onClick={handleResumeScan}
              disabled={isRetryingManual}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold text-xs transition flex items-center space-x-1.5 shadow-sm disabled:opacity-50"
              title="Resume discovery scan directly from preserved checkpoint stage into RUNNING progress"
            >
              {isRetryingManual ? (
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current" />
              )}
              <span>Resume & Move into Progress ({progress}%)</span>
            </button>
            <button
              onClick={handleRestartScan}
              disabled={isRetryingManual}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 rounded-lg text-xs font-medium transition flex items-center space-x-1 disabled:opacity-50"
              title="Restart discovery scan from 0%"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Restart Clean</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="relative shrink-0">
            {isRetrying ? (
              <div className="w-3.5 h-3.5 bg-amber-500 rounded-full animate-ping"></div>
            ) : isFailed ? (
              <div className="w-3.5 h-3.5 bg-rose-500 rounded-full"></div>
            ) : (
              <>
                <div className="w-3.5 h-3.5 bg-blue-500 rounded-full animate-ping absolute inset-0"></div>
                <div className="w-3.5 h-3.5 bg-blue-500 rounded-full relative"></div>
              </>
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold text-white">
                {isRetrying
                  ? 'Reconnecting to Source Tenant...'
                  : isFailed
                  ? 'Source Tenant Discovery Stopped'
                  : 'Source Tenant Workload Discovery in Progress'}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {scanStatus.scanType || 'FULL'} SCAN
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono text-emerald-300 bg-emerald-950/60 border border-emerald-500/30">
                Source: contoso.onmicrosoft.com
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5 font-mono">{currentStage}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs font-mono shrink-0">
          <span className="text-slate-400">
            Elapsed: <strong className="text-white">{formatElapsed(elapsedSeconds)}</strong>
          </span>
          <span
            className={`font-bold text-base ${
              isRetrying ? 'text-amber-400' : isFailed ? 'text-rose-400' : 'text-blue-400'
            }`}
          >
            {progress}%
          </span>

          {/* Test Disconnect Button to verify retry & resume behavior */}
          {scanStatus.status === 'RUNNING' && (
            <button
              onClick={handleSimulateDisconnect}
              disabled={isSimulatingDisconnect}
              className="px-2 py-1 text-[10px] font-mono text-amber-300 hover:text-white bg-amber-950/50 hover:bg-amber-800/80 border border-amber-500/40 rounded transition flex items-center space-x-1"
              title="Test disconnecting to verify 3-retry checkpoint resumption"
            >
              <WifiOff className="w-3 h-3 text-amber-400" />
              <span>Simulate Disconnect</span>
            </button>
          )}

          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800 hover:bg-slate-700 transition"
              title="Refresh status"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-800/80 h-3 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            isRetrying
              ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 animate-pulse'
              : isFailed
              ? 'bg-rose-500'
              : 'bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400'
          }`}
          style={{ width: `${Math.max(5, progress)}%` }}
        ></div>
      </div>

      {/* 7 Workload Pipeline Stages Indicator */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-1">
        {workloadStages.map((stage, idx) => {
          const Icon = stage.icon;
          // Approximate stage index by progress (each ~14%)
          const stageThreshold = ((idx + 1) / 7) * 100;
          const stagePrevThreshold = (idx / 7) * 100;
          const isDone = progress >= stageThreshold;
          const isCurrent = progress >= stagePrevThreshold && progress < stageThreshold;

          return (
            <div
              key={stage.key}
              className={`p-2 rounded-xl border text-[11px] flex items-center space-x-2 transition ${
                isDone
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : isCurrent
                  ? isRetrying
                    ? 'bg-amber-950/50 border-amber-500 text-amber-300 ring-1 ring-amber-500'
                    : 'bg-blue-950/50 border-blue-400 text-blue-200 ring-1 ring-blue-400/50 animate-pulse'
                  : 'bg-slate-800/40 border-slate-800 text-slate-500'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate font-medium">{stage.label}</span>
              {isDone && <CheckCircle2 className="w-3 h-3 text-emerald-400 ml-auto shrink-0" />}
            </div>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80 gap-2">
        <span className="flex items-center space-x-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Graph API v1.0 • Exchange Online • SharePoint PnP Pipeline</span>
        </span>
        <span className="font-mono text-slate-400">
          Auto-Retry Protection: Enabled (3 Retries with Checkpoint Resumption)
        </span>
      </div>
    </div>
  );
};
