import React, { useState, useEffect } from 'react';
import {
  Activity,
  Pause,
  Play,
  Download,
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertOctagon,
  AlertTriangle,
  Mail,
  HardDrive,
  User,
  ArrowRight,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react';
import { MigrationJob, UserMigrationStatus, AdminRole } from '../types';

interface LiveMonitoringCockpitProps {
  activeJob: MigrationJob | null;
  onRefreshJob: () => void;
  currentRole: AdminRole;
  wsConnected: boolean;
  onSelectJob: (jobId: string) => void;
  recentJobs: MigrationJob[];
}

export const LiveMonitoringCockpit: React.FC<LiveMonitoringCockpitProps> = ({
  activeJob,
  onRefreshJob,
  currentRole,
  wsConnected,
  onSelectJob,
  recentJobs,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isPausingOrResuming, setIsPausingOrResuming] = useState(false);
  const [selectedUserLogs, setSelectedUserLogs] = useState<UserMigrationStatus | null>(null);
  const [selectedFailedUsers, setSelectedFailedUsers] = useState<Set<string>>(new Set());

  const handleToggleFailedRow = (id: string, status: string) => {
    if (status !== 'FAILED') return;
    const newSet = new Set(selectedFailedUsers);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedFailedUsers(newSet);
  };

  const handleBulkRetry = () => {
    alert(`Queued ${selectedFailedUsers.size} failed items for retry.`);
    setSelectedFailedUsers(new Set());
  };

  const handleBulkCancel = () => {
    alert(`Cancelled ${selectedFailedUsers.size} failed items.`);
    setSelectedFailedUsers(new Set());
  };

  // 3-second polling fallback to ensure UI state matches SQLite database
  useEffect(() => {
    if (!activeJob?.id) return;
    const interval = setInterval(() => {
      onRefreshJob();
    }, 3000);

    return () => clearInterval(interval);
  }, [activeJob?.id, onRefreshJob]);

  if (!activeJob) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-12 text-center">
        <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto mb-4">
          <Activity className="h-6 w-6" />
        </div>
        <h3 className="text-base font-semibold text-white">No Active Migration Job</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-6">
          Initialize a migration job from the Pipeline Setup tab or select a previous migration job below to monitor progress in real-time.
        </p>

        {recentJobs.length > 0 && (
          <div className="max-w-lg mx-auto text-left bg-slate-800/60 rounded-xl border border-slate-700/80 p-4">
            <h4 className="text-xs font-semibold text-slate-300 mb-3 uppercase tracking-wider">
              Previous Migration Runs in SQLite
            </h4>
            <div className="space-y-2">
              {recentJobs.map((j) => (
                <div
                  key={j.id}
                  onClick={() => onSelectJob(j.id)}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 cursor-pointer transition-colors border border-slate-700/60 text-xs"
                >
                  <div>
                    <div className="font-semibold text-slate-200">
                      {j.sourceTenantDomain} → {j.targetTenantDomain}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Run ID: <code className="text-blue-400 font-mono">{j.id.slice(0, 10)}...</code> •{' '}
                      {new Date(j.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        j.status === 'COMPLETED'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : j.status === 'PROCESSING'
                          ? 'bg-blue-950 text-blue-300 border border-blue-800 animate-pulse'
                          : j.status === 'PAUSED'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {j.status}
                    </span>
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Handle Pause/Resume toggle with SQLite state persistence
  const handleTogglePause = async () => {
    if (currentRole === 'AUDITOR') {
      alert('Auditor accounts cannot alter pipeline execution state.');
      return;
    }

    setIsPausingOrResuming(true);
    try {
      const endpoint = activeJob.status === 'PAUSED' ? 'resume' : 'pause';
      const res = await fetch(`/api/jobs/${activeJob.id}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-role': currentRole,
        },
      });
      if (res.ok) {
        onRefreshJob();
      }
    } catch (err) {
      console.error('Failed to toggle pause/resume:', err);
    } finally {
      setIsPausingOrResuming(false);
    }
  };

  // Export Activity Logs as CSV
  const handleExportLogs = () => {
    window.open(`/api/jobs/${activeJob.id}/export-logs`, '_blank');
  };

  const userStatuses = activeJob.userStatuses || [];

  // Filtered users
  const filteredUsers = userStatuses.filter((u) => {
    const matchesSearch =
      u.targetUPN.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.sourceUPN.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.activeStep && u.activeStep.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === 'ALL' || u.status.toUpperCase() === statusFilter.toUpperCase();

    return matchesSearch && matchesStatus;
  });

  // Calculate overall metrics
  const totalUsers = userStatuses.length;
  const completedCount = userStatuses.filter((u) => u.status === 'COMPLETED').length;
  const processingCount = userStatuses.filter((u) => u.status === 'PROCESSING').length;
  const failedCount = userStatuses.filter((u) => u.status === 'FAILED').length;
  const queuedCount = userStatuses.filter((u) => u.status === 'PENDING').length;

  const overallProgress =
    totalUsers > 0
      ? Math.round(
          userStatuses.reduce((acc, u) => {
            if (u.status === 'COMPLETED') return acc + 100;
            if (u.status === 'FAILED') return acc + 100;
            return acc + (u.mailboxProgress * 0.5 + u.driveProgress * 0.5);
          }, 0) / totalUsers
        )
      : 0;

  const isPaused = activeJob.status === 'PAUSED';

  return (
    <div className="space-y-6">
      {/* Top Header Card with Job Meta, Pause/Resume, & Export */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5 mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                Pipeline Run #{activeJob.id.slice(0, 8)}
              </span>
              <span
                id="job-status-badge"
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  activeJob.status === 'COMPLETED'
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : activeJob.status === 'PROCESSING'
                    ? 'bg-blue-950 text-blue-300 border border-blue-800 animate-pulse'
                    : activeJob.status === 'PAUSED'
                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                    : 'bg-rose-950 text-rose-400 border border-rose-800'
                }`}
              >
                ● {activeJob.status}
              </span>
              <span className="text-xs text-slate-500 font-mono hidden sm:inline">
                SQLite State Synchronized
              </span>
            </div>

            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <span className="text-slate-200">{activeJob.sourceTenantDomain}</span>
              <ArrowRight className="h-4 w-4 text-slate-500" />
              <span className="text-blue-400">{activeJob.targetTenantDomain}</span>
            </h2>
          </div>

          {/* Action buttons */}
          <div className="flex items-center flex-wrap gap-2.5">
            {/* Pause / Resume button */}
            <button
              id="btn-pause-resume"
              onClick={handleTogglePause}
              disabled={
                isPausingOrResuming ||
                activeJob.status === 'COMPLETED' ||
                currentRole === 'AUDITOR'
              }
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer ${
                isPaused
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-amber-600 hover:bg-amber-500 text-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isPaused ? <Play className="h-3.5 w-3.5 fill-current" /> : <Pause className="h-3.5 w-3.5 fill-current" />}
              <span>
                {isPausingOrResuming
                  ? 'Updating...'
                  : isPaused
                  ? 'Resume Pipeline'
                  : 'Pause Pipeline'}
              </span>
            </button>

            {/* Export Activity Logs as CSV */}
            <button
              id="btn-export-logs"
              onClick={handleExportLogs}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 text-blue-400" />
              <span>Export Activity Logs (CSV)</span>
            </button>

            {/* Manual refresh button */}
            <button
              onClick={onRefreshJob}
              className="p-2 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
              title="Refresh State"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="mt-5 pt-4 border-t border-slate-800">
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="font-semibold text-slate-300">
              Aggregate Tenant Migration Throughput
            </span>
            <span className="font-mono font-bold text-blue-400">{overallProgress}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-2.5 rounded-full transition-all duration-500 ${
                activeJob.status === 'COMPLETED'
                  ? 'bg-emerald-500'
                  : activeJob.status === 'PAUSED'
                  ? 'bg-amber-500'
                  : 'bg-gradient-to-r from-blue-500 to-indigo-500'
              }`}
              style={{ width: `${overallProgress}%` }}
            />
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            <div className="bg-slate-800/50 p-2.5 rounded-lg border border-slate-700/50">
              <span className="text-[11px] text-slate-400 block">Total Identities</span>
              <span className="text-base font-bold text-white">{totalUsers}</span>
            </div>
            <div className="bg-slate-800/50 p-2.5 rounded-lg border border-slate-700/50">
              <span className="text-[11px] text-slate-400 block">Completed</span>
              <span className="text-base font-bold text-emerald-400">{completedCount}</span>
            </div>
            <div className="bg-slate-800/50 p-2.5 rounded-lg border border-slate-700/50">
              <span className="text-[11px] text-slate-400 block">In Progress</span>
              <span className="text-base font-bold text-blue-400">{processingCount}</span>
            </div>
            <div className="bg-slate-800/50 p-2.5 rounded-lg border border-slate-700/50">
              <span className="text-[11px] text-slate-400 block">Failed / Throttled</span>
              <span className="text-base font-bold text-rose-400">{failedCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Execution Tracking Grid & Filters */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-sm relative">
        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-slate-800 bg-slate-800/40 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search user identity or active stage..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center space-x-1.5 w-full sm:w-auto overflow-x-auto">
            {['ALL', 'PROCESSING', 'COMPLETED', 'PENDING', 'FAILED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  statusFilter === st
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {st === 'ALL' ? 'All Rows' : st}
              </button>
            ))}
          </div>
        </div>

        {/* User Rows Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 font-semibold border-b border-slate-700">
              <tr>
                <th className="py-3 px-4 w-12 text-center">
                  <input 
                    type="checkbox"
                    title="Select all failed items"
                    className="rounded border-slate-600 bg-slate-900 text-blue-500 focus:ring-blue-500 cursor-pointer"
                    onChange={(e) => {
                      const failedUsers = filteredUsers.filter(u => u.status === 'FAILED');
                      if (e.target.checked) {
                        setSelectedFailedUsers(new Set(failedUsers.map(u => u.id)));
                      } else {
                        setSelectedFailedUsers(new Set());
                      }
                    }}
                    checked={
                      filteredUsers.filter(u => u.status === 'FAILED').length > 0 &&
                      selectedFailedUsers.size === filteredUsers.filter(u => u.status === 'FAILED').length
                    }
                  />
                </th>
                <th className="py-3 px-4">User Target Identity</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 w-60">Transfer Progress</th>
                <th className="py-3 px-4">Active Real-Time Micro-Log</th>
                <th className="py-3 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No matching user records found in this view.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const combinedPercent =
                    user.status === 'COMPLETED'
                      ? 100
                      : Math.round(user.mailboxProgress * 0.5 + user.driveProgress * 0.5);

                  return (
                    <tr
                      key={user.id}
                      className={`hover:bg-slate-800/30 transition-colors ${
                        user.status === 'PROCESSING' ? 'bg-blue-950/10' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-4 text-center">
                        {user.status === 'FAILED' ? (
                          <input 
                            type="checkbox"
                            checked={selectedFailedUsers.has(user.id)}
                            onChange={() => handleToggleFailedRow(user.id, user.status)}
                            className="rounded border-slate-600 bg-slate-900 text-blue-500 focus:ring-blue-500 cursor-pointer"
                          />
                        ) : (
                          <input type="checkbox" disabled className="rounded border-slate-700 bg-slate-800 opacity-30 cursor-not-allowed" />
                        )}
                      </td>
                      {/* Target Identity */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2.5">
                          <div className="h-7 w-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0">
                            <User className="h-3.5 w-3.5" />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-100 font-mono">
                              {user.targetUPN}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              From: {user.sourceUPN}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Status Indicator Chip */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {user.status === 'COMPLETED' ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Success</span>
                          </span>
                        ) : user.status === 'PROCESSING' ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-950 text-blue-300 border border-blue-800 animate-pulse">
                            <Activity className="h-3 w-3" />
                            <span>Processing</span>
                          </span>
                        ) : user.status === 'FAILED' ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-950 text-rose-400 border border-rose-800">
                            <AlertOctagon className="h-3 w-3" />
                            <span>Failed</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
                            <Clock className="h-3 w-3" />
                            <span>Queued</span>
                          </span>
                        )}
                      </td>

                      {/* Progress Bar & Badges */}
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-slate-400 flex items-center gap-1">
                              <Mail className="h-3 w-3 text-blue-400" /> {user.mailboxProgress}%
                              <span className="text-slate-600">|</span>
                              <HardDrive className="h-3 w-3 text-indigo-400" /> {user.driveProgress}%
                            </span>
                            <span className="font-mono font-bold text-slate-200">
                              {combinedPercent}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${
                                user.status === 'COMPLETED'
                                  ? 'bg-emerald-500'
                                  : user.status === 'FAILED'
                                  ? 'bg-rose-500'
                                  : 'bg-blue-500'
                              }`}
                              style={{ width: `${combinedPercent}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Real-time Micro-Log Snippet */}
                      <td className="py-3 px-4 max-w-xs sm:max-w-md">
                        {user.errorMessage ? (
                          <div className="text-rose-400 font-mono text-[11px] truncate flex items-center gap-1.5" title={user.errorMessage}>
                            <AlertTriangle className="h-3 w-3 shrink-0" />
                            <span>{user.errorMessage}</span>
                          </div>
                        ) : (
                          <div className="text-slate-300 text-[11px] truncate flex items-center gap-1.5" title={user.activeStep || 'Pending execution'}>
                            {user.status === 'PROCESSING' && (
                              <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-ping shrink-0" />
                            )}
                            <span className={user.status === 'PROCESSING' ? 'text-blue-300 font-medium' : 'text-slate-400'}>
                              {user.activeStep || 'Pending queued start in background worker'}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Inspect details button */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => setSelectedUserLogs(user)}
                          className="px-2 py-1 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded text-[11px] transition-colors cursor-pointer"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Floating Batch Toolbar */}
        {selectedFailedUsers.size > 0 && (
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20 animate-fadeIn">
            <div className="bg-slate-800 border border-slate-600 shadow-2xl rounded-full px-6 py-3 flex items-center space-x-6">
              <div className="flex items-center space-x-2 border-r border-slate-600 pr-6">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
                  {selectedFailedUsers.size}
                </span>
                <span className="text-sm font-medium text-slate-300">Items Selected</span>
              </div>
              <div className="flex items-center space-x-3">
                <button 
                  onClick={handleBulkRetry}
                  className="flex items-center space-x-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-sm font-medium transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Retry Selected</span>
                </button>
                <button 
                  onClick={handleBulkCancel}
                  className="flex items-center space-x-2 px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-rose-400 hover:text-rose-300 rounded-full text-sm font-medium transition-colors"
                >
                  <AlertOctagon className="h-4 w-4" />
                  <span>Cancel Selected</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {selectedUserLogs && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">
                  User Execution Audit Detail
                </span>
                <h3 className="text-base font-semibold text-white mt-0.5">
                  {selectedUserLogs.targetUPN}
                </h3>
              </div>
              <button
                onClick={() => setSelectedUserLogs(null)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 bg-slate-800 rounded"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Source UPN:</span>
                  <span className="font-mono text-slate-200">{selectedUserLogs.sourceUPN}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Target UPN:</span>
                  <span className="font-mono text-slate-200">{selectedUserLogs.targetUPN}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Execution Status:</span>
                  <span className="font-semibold text-blue-400">{selectedUserLogs.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Mailbox Sync:</span>
                  <span className="text-slate-200">{selectedUserLogs.mailboxProgress}% Complete</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">OneDrive Transfer:</span>
                  <span className="text-slate-200">{selectedUserLogs.driveProgress}% Complete</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">HTTP 429 Retry Count:</span>
                  <span className="text-slate-200">{selectedUserLogs.retryCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Last Updated:</span>
                  <span className="text-slate-400">{new Date(selectedUserLogs.updatedAt).toLocaleString()}</span>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Active Real-Time Micro-Log:
                </span>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-[11px] text-emerald-400">
                  {selectedUserLogs.activeStep || 'None recorded'}
                </div>
              </div>

              {selectedUserLogs.errorMessage && (
                <div>
                  <span className="text-[11px] font-semibold text-rose-400 block mb-1">
                    Error Diagnostic:
                  </span>
                  <div className="p-3 bg-rose-950/40 rounded-lg border border-rose-800 font-mono text-[11px] text-rose-300">
                    {selectedUserLogs.errorMessage}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
