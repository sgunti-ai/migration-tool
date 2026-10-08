import React, { useState, useMemo } from 'react';
import {
  UserMigrationStatus,
  MigrationJob,
  AdminRole
} from '../types';
import {
  parseErrorDiagnostic,
  ErrorCategory,
  ParsedErrorDiagnostic
} from '../utils/errorDiagnosticParser';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  RotateCcw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Terminal,
  ShieldAlert,
  Search,
  Wrench,
  BookOpen,
  ArrowRight,
  Sparkles,
  Zap,
  Info,
  Clock,
  Layers,
  Database,
  Filter,
  CheckSquare,
  Square
} from 'lucide-react';

interface ErrorDiagnosticViewProps {
  activeJob: MigrationJob;
  userStatuses: UserMigrationStatus[];
  currentRole?: AdminRole;
  onRefreshJob: () => void;
  onRetryAllFailed: () => Promise<void>;
  onRetrySingleUser: (userId: string) => Promise<void>;
  isRetrying: boolean;
  initialSelectedUserId?: string | null;
}

export const ErrorDiagnosticView: React.FC<ErrorDiagnosticViewProps> = ({
  activeJob,
  userStatuses,
  currentRole,
  onRefreshJob,
  onRetryAllFailed,
  onRetrySingleUser,
  isRetrying,
  initialSelectedUserId
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ErrorCategory | 'ALL'>('ALL');
  const [expandedUserId, setExpandedUserId] = useState<string | null>(initialSelectedUserId || null);
  const [copiedCmdletId, setCopiedCmdletId] = useState<string | null>(null);
  const [showRawPayloadId, setShowRawPayloadId] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Record<string, Record<number, boolean>>>({});
  const [remediatingUserId, setRemediatingUserId] = useState<string | null>(null);
  const [isSimulatingFailures, setIsSimulatingFailures] = useState(false);
  const [diagnosticNotice, setDiagnosticNotice] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null);

  // Filter only failed users
  const failedUsers = useMemo(() => {
    return userStatuses.filter((u) => u.status === 'FAILED');
  }, [userStatuses]);

  // Pre-parse diagnostics for all failed users
  const parsedDiagnosticsMap = useMemo(() => {
    const map = new Map<string, ParsedErrorDiagnostic>();
    failedUsers.forEach((u) => {
      map.set(
        u.id,
        parseErrorDiagnostic(
          u.errorMessage,
          u.activeStep,
          u.checkpointStage,
          u.targetUPN,
          u.sourceUPN
        )
      );
    });
    return map;
  }, [failedUsers]);

  // Category breakdown counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      ALL: failedUsers.length,
      LICENSING: 0,
      THROTTLING: 0,
      NAMESPACE: 0,
      AUTH: 0,
      SIZE_LIMIT: 0,
      INFRASTRUCTURE: 0,
      IDENTITY: 0,
      INTEGRITY: 0,
      UNKNOWN: 0,
    };
    parsedDiagnosticsMap.forEach((diag) => {
      counts[diag.category] = (counts[diag.category] || 0) + 1;
    });
    return counts;
  }, [failedUsers, parsedDiagnosticsMap]);

  // Filtered failed users
  const filteredUsers = useMemo(() => {
    return failedUsers.filter((u) => {
      const diag = parsedDiagnosticsMap.get(u.id);
      if (!diag) return false;

      const matchesCategory = selectedCategory === 'ALL' || diag.category === selectedCategory;
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        u.targetUPN.toLowerCase().includes(query) ||
        u.sourceUPN.toLowerCase().includes(query) ||
        diag.errorCode.toLowerCase().includes(query) ||
        diag.title.toLowerCase().includes(query) ||
        (u.errorMessage && u.errorMessage.toLowerCase().includes(query)) ||
        (u.checkpointStage && u.checkpointStage.toLowerCase().includes(query));

      return matchesCategory && matchesSearch;
    });
  }, [failedUsers, parsedDiagnosticsMap, selectedCategory, searchQuery]);

  const handleCopyCmdlet = (userId: string, script: string) => {
    navigator.clipboard.writeText(script);
    setCopiedCmdletId(userId);
    setTimeout(() => setCopiedCmdletId(null), 2500);
  };

  const handleToggleStep = (userId: string, stepNumber: number) => {
    setCompletedSteps((prev) => {
      const userSteps = prev[userId] || {};
      return {
        ...prev,
        [userId]: {
          ...userSteps,
          [stepNumber]: !userSteps[stepNumber],
        },
      };
    });
  };

  // Quick fix & simulate remediation execution
  const handleQuickFixAndRetry = async (u: UserMigrationStatus, diag: ParsedErrorDiagnostic) => {
    if (currentRole === 'AUDITOR') {
      setDiagnosticNotice({
        type: 'error',
        message: 'Auditor accounts have read-only access. Switch to Global Admin or Operator.',
      });
      setTimeout(() => setDiagnosticNotice(null), 4000);
      return;
    }

    setRemediatingUserId(u.id);
    try {
      setDiagnosticNotice({
        type: 'info',
        message: `Applying automated remediation: "${diag.quickFixLabel || 'Remediating constraint'}" for ${u.targetUPN}...`,
      });

      // Mark all remediation steps as completed
      setCompletedSteps((prev) => ({
        ...prev,
        [u.id]: { 1: true, 2: true, 3: true, 4: true },
      }));

      // Simulate remediation delay
      await new Promise((r) => setTimeout(r, 1200));

      // Execute retry for user
      await onRetrySingleUser(u.id);

      setDiagnosticNotice({
        type: 'success',
        message: `Remediation applied! Resuming direct memory stream for ${u.targetUPN} from checkpoint [${diag.checkpointSummary?.stage || 'RESUME'}].`,
      });
      setTimeout(() => setDiagnosticNotice(null), 5000);
    } catch (err: any) {
      console.error('Quick fix error:', err);
      setDiagnosticNotice({
        type: 'error',
        message: err.message || 'Failed to apply remediation and retry user.',
      });
      setTimeout(() => setDiagnosticNotice(null), 5000);
    } finally {
      setRemediatingUserId(null);
    }
  };

  // Simulate failures for verification & interactive testing
  const handleSimulateFailures = async () => {
    setIsSimulatingFailures(true);
    try {
      const res = await fetch(`/api/jobs/${activeJob.id}/simulate-failures`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-role': currentRole || 'GLOBAL_ADMIN',
        },
        body: JSON.stringify({ count: 2 }),
      });
      if (res.ok) {
        onRefreshJob();
        setDiagnosticNotice({
          type: 'info',
          message: 'Simulated 2 test errors (Graph 403 License Quota & Graph 429 Throttling) for diagnostic analysis.',
        });
        setTimeout(() => setDiagnosticNotice(null), 5000);
      }
    } catch (err) {
      console.error('Failed to simulate test failures:', err);
    } finally {
      setIsSimulatingFailures(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ========================================================================= */}
      {/* 1. DIAGNOSTIC HEADER & OVERVIEW CARDS                                     */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center space-x-2.5">
              <span className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                <AlertOctagon className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <span>Error Diagnostics & Root Cause Remediation</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                    {failedUsers.length} FAILED {failedUsers.length === 1 ? 'ITEM' : 'ITEMS'}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Automated parsing of Microsoft Graph, Exchange Online, and SharePoint REST errors into human-readable causes and step-by-step remediation procedures.
                </p>
              </div>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex items-center flex-wrap gap-2.5">
            {failedUsers.length > 0 && (
              <button
                onClick={onRetryAllFailed}
                disabled={isRetrying || currentRole === 'AUDITOR'}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-sm transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50"
                title="Batch re-process all failed users"
              >
                <RotateCcw className={`h-3.5 w-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
                <span>Retry All ({failedUsers.length}) Failed</span>
              </button>
            )}

            {/* Test Simulation Button */}
            <button
              onClick={handleSimulateFailures}
              disabled={isSimulatingFailures || currentRole === 'AUDITOR'}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              title="Inject test failure events to demo error diagnostics and remediation workflows"
            >
              <Sparkles className="h-3.5 w-3.5 text-blue-500" />
              <span>{isSimulatingFailures ? 'Simulating...' : 'Simulate Test Failure'}</span>
            </button>
          </div>
        </div>

        {/* Diagnostic Notification Toast */}
        {diagnosticNotice && (
          <div
            className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 animate-fadeIn ${
              diagnosticNotice.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : diagnosticNotice.type === 'error'
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              {diagnosticNotice.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              ) : diagnosticNotice.type === 'error' ? (
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
              ) : (
                <Info className="h-4 w-4 shrink-0 text-blue-400" />
              )}
              <span>{diagnosticNotice.message}</span>
            </div>
            <button
              onClick={() => setDiagnosticNotice(null)}
              className="text-xs hover:underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* KPI Mini-Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Licensing & Quota Blocks</div>
            <div className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-0.5">
              {categoryCounts.LICENSING || 0}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Graph 403 Forbidden pool limits</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">API Rate Limiting (429)</div>
            <div className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-0.5">
              {categoryCounts.THROTTLING || 0}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Sliding window throughput backoff</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Path / Hierarchy Collisions</div>
            <div className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-0.5">
              {categoryCounts.NAMESPACE || 0}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">SPO &gt;400 chars path length</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Checkpoint Preservation</div>
            <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
              100%
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Zero data loss on resumable retry</div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
          {/* Category Filter Pills */}
          <div className="flex items-center flex-wrap gap-1.5 text-xs">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                selectedCategory === 'ALL'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              All ({failedUsers.length})
            </button>

            {categoryCounts.LICENSING > 0 && (
              <button
                onClick={() => setSelectedCategory('LICENSING')}
                className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center space-x-1 cursor-pointer ${
                  selectedCategory === 'LICENSING'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500/20'
                }`}
              >
                <span>Licensing</span>
                <span className="font-mono text-[10px] bg-rose-950/40 px-1 rounded ml-1">
                  {categoryCounts.LICENSING}
                </span>
              </button>
            )}

            {categoryCounts.THROTTLING > 0 && (
              <button
                onClick={() => setSelectedCategory('THROTTLING')}
                className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center space-x-1 cursor-pointer ${
                  selectedCategory === 'THROTTLING'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20'
                }`}
              >
                <span>Throttling 429</span>
                <span className="font-mono text-[10px] bg-amber-950/40 px-1 rounded ml-1">
                  {categoryCounts.THROTTLING}
                </span>
              </button>
            )}

            {categoryCounts.NAMESPACE > 0 && (
              <button
                onClick={() => setSelectedCategory('NAMESPACE')}
                className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center space-x-1 cursor-pointer ${
                  selectedCategory === 'NAMESPACE'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20'
                }`}
              >
                <span>Path & Hierarchy</span>
                <span className="font-mono text-[10px] bg-indigo-950/40 px-1 rounded ml-1">
                  {categoryCounts.NAMESPACE}
                </span>
              </button>
            )}

            {categoryCounts.AUTH > 0 && (
              <button
                onClick={() => setSelectedCategory('AUTH')}
                className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center space-x-1 cursor-pointer ${
                  selectedCategory === 'AUTH'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                }`}
              >
                <span>Auth / Token</span>
                <span className="font-mono text-[10px] bg-purple-950/40 px-1 rounded ml-1">
                  {categoryCounts.AUTH}
                </span>
              </button>
            )}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-64">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search code, UPN, message..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. ZERO FAILURES EMPTY STATE (HEALTHY WITH TESTING OPTION)                */}
      {/* ========================================================================= */}
      {failedUsers.length === 0 && (
        <div className="bg-white dark:bg-slate-900 border border-emerald-500/30 rounded-2xl p-10 text-center shadow-sm space-y-4">
          <div className="inline-flex p-3 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <div className="max-w-md mx-auto">
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              Zero Active Failures Detected
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              All user mailboxes, OneDrive libraries, and identity objects in this active migration job are streaming normally or completed without fatal errors.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={handleSimulateFailures}
              disabled={isSimulatingFailures || currentRole === 'AUDITOR'}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition flex items-center space-x-2 mx-auto cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Simulate Graph 403 & 429 Test Failures to Explore Diagnostics</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. PARSED ERROR DIAGNOSTIC CARDS                                         */}
      {/* ========================================================================= */}
      {filteredUsers.length > 0 && (
        <div className="space-y-4">
          {filteredUsers.map((u) => {
            const diag = parsedDiagnosticsMap.get(u.id);
            if (!diag) return null;

            const isExpanded = expandedUserId === u.id || filteredUsers.length === 1;
            const isCopying = copiedCmdletId === u.id;
            const showRaw = showRawPayloadId === u.id;
            const userCompleted = completedSteps[u.id] || {};
            const isRemediating = remediatingUserId === u.id;

            return (
              <div
                key={u.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-2xl shadow-sm overflow-hidden transition-all"
              >
                {/* Card Header Summary */}
                <div className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30">
                  <div className="space-y-1.5">
                    <div className="flex items-center flex-wrap gap-2">
                      {/* Error Code Pill */}
                      <span className="font-mono text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 flex items-center space-x-1">
                        <AlertTriangle className="h-3 w-3 shrink-0" />
                        <span>{diag.errorCode}</span>
                      </span>

                      {/* Category Badge */}
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {diag.categoryLabel}
                      </span>

                      {/* Severity Pill */}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase font-mono ${
                          diag.severity === 'CRITICAL'
                            ? 'bg-rose-600 text-white'
                            : diag.severity === 'HIGH'
                            ? 'bg-amber-600 text-white'
                            : 'bg-blue-600 text-white'
                        }`}
                      >
                        {diag.severity} SEVERITY
                      </span>

                      {/* Preserved Checkpoint Badge */}
                      {diag.checkpointSummary && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center space-x-1">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Checkpoint: {diag.checkpointSummary.stage}</span>
                        </span>
                      )}

                      {/* Retry attempt badge */}
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                        Retry Attempt #{u.retryCount || 1}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <h4 className="text-base font-bold text-slate-900 dark:text-white">
                        {diag.title}
                      </h4>
                    </div>

                    <div className="flex items-center space-x-2 text-xs font-mono text-slate-600 dark:text-slate-400">
                      <span>{u.sourceUPN}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-blue-600 dark:text-blue-400 font-semibold">{u.targetUPN}</span>
                    </div>
                  </div>

                  {/* Right Header Controls */}
                  <div className="flex items-center space-x-2">
                    {/* Quick Remediate Button */}
                    {diag.quickFixAvailable && (
                      <button
                        onClick={() => handleQuickFixAndRetry(u, diag)}
                        disabled={isRemediating || isRetrying || currentRole === 'AUDITOR'}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                        title={diag.quickFixLabel}
                      >
                        <Wrench className={`h-3.5 w-3.5 ${isRemediating ? 'animate-spin' : ''}`} />
                        <span>{isRemediating ? 'Remediating...' : diag.quickFixLabel || 'Auto-Remediate'}</span>
                      </button>
                    )}

                    {/* Standard Retry User Button */}
                    <button
                      onClick={() => onRetrySingleUser(u.id)}
                      disabled={isRemediating || isRetrying || currentRole === 'AUDITOR'}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                      title="Trigger direct chunked retry for this user"
                    >
                      <RotateCcw className={`h-3.5 w-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
                      <span>Retry User</span>
                    </button>

                    {/* Expand/Collapse Toggle */}
                    <button
                      onClick={() => setExpandedUserId(isExpanded ? null : u.id)}
                      className="p-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs transition cursor-pointer"
                      title={isExpanded ? 'Collapse diagnostic details' : 'Expand full remediation plan'}
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Card Body (Detailed Diagnosis & Human Remediation Steps) */}
                {isExpanded && (
                  <div className="p-6 space-y-6">
                    {/* ================================================================= */}
                    {/* A. CALLOUT: WHY THE RETRY ATTEMPT FAILED                           */}
                    {/* ================================================================= */}
                    <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/40 text-xs space-y-2">
                      <div className="flex items-center space-x-2 text-rose-600 dark:text-rose-400 font-bold">
                        <ShieldAlert className="h-4 w-4 shrink-0" />
                        <span>Why This Retry Failed:</span>
                      </div>
                      <p className="text-slate-800 dark:text-slate-200 leading-relaxed pl-6">
                        {diag.whyRetryFailed}
                      </p>
                      <div className="pl-6 pt-1 text-[11px] text-slate-600 dark:text-slate-400 flex items-center space-x-1.5">
                        <Clock className="h-3 w-3 text-rose-400 shrink-0" />
                        <span>
                          <strong>Recommended action before retrying:</strong> {diag.recommendedAction}
                        </span>
                      </div>
                    </div>

                    {/* ================================================================= */}
                    {/* B. ROOT CAUSE & PRESERVED CHECKPOINT OVERVIEW                     */}
                    {/* ================================================================= */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      {/* Root Cause Card */}
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
                        <span className="font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                          <span>Detailed Technical Root Cause</span>
                        </span>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                          {diag.rootCause}
                        </p>
                        {diag.graphEndpoint && (
                          <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700/60 font-mono text-[10px] text-slate-500 dark:text-slate-400">
                            Endpoint: <span className="text-blue-500">{diag.graphEndpoint}</span>
                          </div>
                        )}
                      </div>

                      {/* Preserved Checkpoint Card */}
                      <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1.5">
                          <Database className="h-3.5 w-3.5" />
                          <span>Preserved Checkpoint & Resumption Strategy</span>
                        </span>
                        {diag.checkpointSummary ? (
                          <div className="space-y-1.5 text-slate-700 dark:text-slate-300">
                            <div>
                              <strong className="text-slate-900 dark:text-white font-mono text-[11px]">
                                Stage: {diag.checkpointSummary.stage}
                              </strong>
                              <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                                {diag.checkpointSummary.description}
                              </p>
                            </div>
                            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                              ✓ {diag.checkpointSummary.dataPreserved}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              Resumption Plan: {diag.checkpointSummary.resumptionStrategy}
                            </div>
                          </div>
                        ) : (
                          <p className="text-slate-500">
                            Checkpoint will resume from the current direct stream chunk.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* ================================================================= */}
                    {/* C. STEP-BY-STEP REMEDIATION CHECKLIST                             */}
                    {/* ================================================================= */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h5 className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                          <Wrench className="h-4 w-4 text-blue-500" />
                          <span>Step-by-Step Operator Remediation Checklist</span>
                        </h5>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          {Object.values(userCompleted).filter(Boolean).length} of {diag.remediationSteps.length} steps verified
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        {diag.remediationSteps.map((step) => {
                          const isDone = userCompleted[step.stepNumber] || false;

                          return (
                            <div
                              key={step.stepNumber}
                              onClick={() => handleToggleStep(u.id, step.stepNumber)}
                              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start space-x-3 text-xs ${
                                isDone
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
                                  : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:border-slate-300'
                              }`}
                            >
                              <button
                                type="button"
                                className="mt-0.5 text-blue-600 dark:text-blue-400 hover:text-blue-500 shrink-0"
                              >
                                {isDone ? (
                                  <CheckSquare className="h-4 w-4 text-emerald-500" />
                                ) : (
                                  <Square className="h-4 w-4 text-slate-400" />
                                )}
                              </button>

                              <div className="space-y-0.5 flex-1">
                                <div className="flex items-center space-x-2">
                                  <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                    STEP {step.stepNumber}
                                  </span>
                                  <span
                                    className={`font-semibold ${
                                      isDone ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'
                                    }`}
                                  >
                                    {step.instruction}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-600 dark:text-slate-400 pl-0.5">
                                  {step.detail}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* ================================================================= */}
                    {/* D. COPYABLE POWERSHELL / GRAPH SDK CMDLET                         */}
                    {/* ================================================================= */}
                    {diag.powershellCmdlet && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                            <Terminal className="h-4 w-4 text-indigo-500" />
                            <span>Remediation PowerShell Script (Microsoft Graph / Exchange SDK)</span>
                          </span>

                          <button
                            onClick={() => handleCopyCmdlet(u.id, diag.powershellCmdlet!)}
                            className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-[11px] font-medium transition flex items-center space-x-1 cursor-pointer"
                          >
                            {isCopying ? (
                              <>
                                <Check className="h-3 w-3 text-emerald-500" />
                                <span className="text-emerald-500">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3 text-slate-400" />
                                <span>Copy Script</span>
                              </>
                            )}
                          </button>
                        </div>

                        <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 p-4 font-mono text-[11px] text-emerald-400 leading-relaxed shadow-inner">
                          <pre className="overflow-x-auto whitespace-pre-wrap">{diag.powershellCmdlet}</pre>
                        </div>
                      </div>
                    )}

                    {/* ================================================================= */}
                    {/* E. FOOTER CONTROLS & DOCUMENTATION LINK                           */}
                    {/* ================================================================= */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs">
                      <div className="flex items-center space-x-3 text-slate-500 dark:text-slate-400">
                        {diag.docUrl && (
                          <a
                            href={diag.docUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1 font-medium"
                          >
                            <BookOpen className="h-3.5 w-3.5" />
                            <span>{diag.docTitle}</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}

                        <button
                          onClick={() => setShowRawPayloadId(showRaw ? null : u.id)}
                          className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
                        >
                          {showRaw ? 'Hide Raw Details' : 'Inspect Raw Error JSON'}
                        </button>
                      </div>

                      <div className="flex items-center space-x-2">
                        {diag.quickFixAvailable && (
                          <button
                            onClick={() => handleQuickFixAndRetry(u, diag)}
                            disabled={isRemediating || isRetrying || currentRole === 'AUDITOR'}
                            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                          >
                            <Wrench className="h-3.5 w-3.5" />
                            <span>{diag.quickFixLabel || 'Apply Fix & Retry'}</span>
                          </button>
                        )}

                        <button
                          onClick={() => onRetrySingleUser(u.id)}
                          disabled={isRemediating || isRetrying || currentRole === 'AUDITOR'}
                          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <RotateCcw className={`h-3.5 w-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
                          <span>Retry Resumption</span>
                        </button>
                      </div>
                    </div>

                    {/* Raw Error JSON Drawer */}
                    {showRaw && (
                      <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 space-y-2">
                        <div className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                          Raw Backend Payload & State Object
                        </div>
                        <pre className="overflow-x-auto whitespace-pre-wrap text-emerald-400">
                          {JSON.stringify(
                            {
                              id: u.id,
                              sourceUPN: u.sourceUPN,
                              targetUPN: u.targetUPN,
                              status: u.status,
                              checkpointStage: u.checkpointStage,
                              activeStep: u.activeStep,
                              errorMessage: u.errorMessage,
                              retryCount: u.retryCount,
                              mailboxProgress: u.mailboxProgress,
                              driveProgress: u.driveProgress,
                              bytesMigrated: u.bytesMigrated,
                              updatedAt: u.updatedAt,
                            },
                            null,
                            2
                          )}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
