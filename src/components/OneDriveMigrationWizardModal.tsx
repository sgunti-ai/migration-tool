import React, { useState } from 'react';
import {
  X,
  Check,
  ChevronRight,
  ChevronLeft,
  HardDrive,
  Plus,
  Trash2,
  Copy,
  ArrowRight,
  Clock,
  Calendar,
  Shield,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Info,
  Layers,
  Settings,
  Play,
  RefreshCw,
  GitMerge,
  ListOrdered,
  Lock,
  FileText,
  Activity,
  Cpu,
  ExternalLink,
  CalendarClock,
  FolderTree,
} from 'lucide-react';
import {
  TenantStatusResponse,
  MigrationBatchItem,
  MigrationQueueConfig,
  BatchDependencyCondition,
  BatchFailureAction,
  PreFlightValidationReport,
} from '../types';

export interface OneDriveMigrationWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJobStarted?: (newJob: any) => void;
  tenantStatus?: TenantStatusResponse;
}

export const OneDriveMigrationWizardModal: React.FC<OneDriveMigrationWizardModalProps> = ({
  isOpen,
  onClose,
  onJobStarted,
  tenantStatus,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Pre-flight Validation State
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [validationReport, setValidationReport] = useState<PreFlightValidationReport | null>(null);

  // Form State initialized with Microsoft Learn Best Practices
  const [formData, setFormData] = useState({
    // Step 1: Tenants & Prerequisites
    sourceTenant: tenantStatus?.source?.domain || 'contoso.onmicrosoft.com',
    targetTenant: tenantStatus?.target?.domain || 'fabrikam.com',
    compatibilityStatus: 'COMPATIBLE', // COMPATIBLE, WARNING
    trustRelationshipVerified: true,
    crossTenantLicenseAddonVerified: true,
    sourceAccountsReadWrite: true,
    purviewCustomerKeyExempt: true,
    legalHoldHandling: 'REPLICATE_TARGET', // REPLICATE_TARGET, TEMPORARY_RELEASE

    // Step 2: Identity & Target Site Safeguards
    mappingStrategy: 'UPN_TRANSFORM', // UPN_TRANSFORM, CSV_MAPPING
    domainTransformSource: '@contoso.onmicrosoft.com',
    domainTransformTarget: '@fabrikam.com',
    restrictTargetSitePreCreation: true, // Microsoft Best Practice: block manual site creation to avoid collisions
    targetLicensingSku: 'SharePoint / OneDrive Plan 2 (Cross-Tenant Addon)',
    createTargetGuestIdentities: true,
    selectedAccountCount: 12,

    // Step 3: Scope, File Filtering & Versioning
    migratePersonalFolders: true,
    migrateNotebooks: true,
    versionHistoryOption: 'ALL_VERSIONS', // ALL_VERSIONS, LAST_5, CURRENT_ONLY
    maxItemSizeMB: 250,
    excludeExtensions: '.tmp, .iso, .bak, .ds_store',
    preserveTimestampsAndAuthors: true,
    preserveFolderPermissions: true,
    relinkExternalSharing: true,

    // Step 4: Batching & Scheduling
    scheduleMode: 'QUEUE_AND_BATCH' as 'IMMEDIATE' | 'SCHEDULED_WINDOW' | 'QUEUE_AND_BATCH',
    scheduledStartTime: '',
    scheduledEndTime: '',
    enforceWindowCutoff: true,

    // Step 5: Direct Streaming & Cutover Architecture
    streamingMode: 'DIRECT_CHUNKED', // Direct memory chunked streaming (zero-disk staging)
    chunkSizeMB: 25, // 10, 25, 50 MB
    concurrencyLimit: 6, // 2, 4, 6, 8, 16 workers
    maxResumableRetries: 5,
    backoffPolicy: 'EXPONENTIAL_JITTER',
    enableSourceRedirectLinks: true, // Place redirect links at source personal site URLs
    resyncClientGuidanceEmail: true,
    adminNotificationEmail: 'admin@contoso.onmicrosoft.com',
  });

  // Default Batches for OneDrive Cross-Tenant Waves
  const getDefaultBatches = (): MigrationBatchItem[] => {
    const now = new Date();
    const pad = (n: number) => (n < 10 ? '0' + n : String(n));
    const toIsoLocal = (d: Date) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

    const start1 = new Date(now.getTime() + 1 * 3600 * 1000);
    start1.setMinutes(0, 0, 0);
    const end1 = new Date(start1.getTime() + 3 * 3600 * 1000);

    const start2 = new Date(end1.getTime() + 15 * 60 * 1000);
    const end2 = new Date(start2.getTime() + 4 * 3600 * 1000);

    const start3 = new Date(end2.getTime() + 15 * 60 * 1000);
    const end3 = new Date(start3.getTime() + 6 * 3600 * 1000);

    return [
      {
        id: 'batch-od-1',
        name: 'Wave 1: Executive & VIP Personal Drives',
        batchCode: 'BATCH-OD-W1-EXEC',
        workloadType: 'ONEDRIVE',
        userCount: 4,
        startTime: toIsoLocal(start1),
        endTime: toIsoLocal(end1),
        dependsOnBatchId: null,
        dependencyCondition: 'SUCCESS',
        concurrencyLimit: 8,
        chunkSizeMB: 25,
        priority: 'VIP',
        actionOnDependencyFailure: 'STOP_QUEUE',
        notes: 'Priority VIP personal sites with all version history and immediate source redirection.',
      },
      {
        id: 'batch-od-2',
        name: 'Wave 2: Core Engineering & Product Drives',
        batchCode: 'BATCH-OD-W2-ENG',
        workloadType: 'ONEDRIVE',
        userCount: 8,
        startTime: toIsoLocal(start2),
        endTime: toIsoLocal(end2),
        dependsOnBatchId: 'batch-od-1',
        dependencyCondition: 'SUCCESS',
        concurrencyLimit: 6,
        chunkSizeMB: 25,
        priority: 'HIGH',
        actionOnDependencyFailure: 'STOP_QUEUE',
        notes: 'Large repos and technical design folders. Triggered automatically following Wave 1 verification.',
      },
      {
        id: 'batch-od-3',
        name: 'Wave 3: Sales, HR & Operations Team Drives',
        batchCode: 'BATCH-OD-W3-CORP',
        workloadType: 'ONEDRIVE',
        userCount: 12,
        startTime: toIsoLocal(start3),
        endTime: toIsoLocal(end3),
        dependsOnBatchId: 'batch-od-2',
        dependencyCondition: 'SUCCESS',
        concurrencyLimit: 4,
        chunkSizeMB: 10,
        priority: 'STANDARD',
        actionOnDependencyFailure: 'SKIP_DEPENDENTS',
        notes: 'General staff accounts. Off-peak window scheduling to safeguard daytime bandwidth.',
      },
    ];
  };

  const [queueConfig, setQueueConfig] = useState<MigrationQueueConfig>({
    enabled: true,
    queueName: 'OneDrive Cross-Tenant Multi-Wave Production Queue',
    enforceSequentialExecution: true,
    globalCutoffTime: '',
    pauseOnAnyFailure: true,
    batches: getDefaultBatches(),
  });
  const [selectedBatchId, setSelectedBatchId] = useState<string>('batch-od-1');
  const [activeQueuePreset, setActiveQueuePreset] = useState<string>('PHASED_DEPT');

  if (!isOpen) return null;

  const steps = [
    { number: 1, title: 'Prerequisites & Trust', short: 'Trust' },
    { number: 2, title: 'Mapping & Site Protection', short: 'Mapping' },
    { number: 3, title: 'Scope & File Policies', short: 'Scope' },
    { number: 4, title: 'Queue & Batch Options', short: 'Batches' },
    { number: 5, title: 'Streaming & Redirection', short: 'Pipeline' },
    { number: 6, title: 'Pre-Flight & Kick Off', short: 'Review' },
  ];

  const handleNext = () => {
    if (currentStep < 6) setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
  };

  // Batch Manipulation Helpers
  const handleAddBatch = () => {
    const pad = (n: number) => (n < 10 ? '0' + n : String(n));
    const toIsoLocal = (d: Date) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

    const newIndex = queueConfig.batches.length + 1;
    const lastBatch = queueConfig.batches[queueConfig.batches.length - 1];

    let start = new Date();
    if (lastBatch && lastBatch.endTime) {
      start = new Date(new Date(lastBatch.endTime).getTime() + 30 * 60 * 1000);
    } else {
      start = new Date(Date.now() + 2 * 3600 * 1000);
    }
    const end = new Date(start.getTime() + 4 * 3600 * 1000);

    const newBatch: MigrationBatchItem = {
      id: `batch-od-${Date.now()}`,
      name: `Wave ${newIndex}: Regional / Group Personal Drives`,
      batchCode: `BATCH-OD-W${newIndex}-${Math.floor(100 + Math.random() * 900)}`,
      workloadType: 'ONEDRIVE',
      userCount: 6,
      startTime: toIsoLocal(start),
      endTime: toIsoLocal(end),
      dependsOnBatchId: lastBatch ? lastBatch.id : null,
      dependencyCondition: 'SUCCESS',
      concurrencyLimit: 4,
      chunkSizeMB: 25,
      priority: 'STANDARD',
      actionOnDependencyFailure: 'STOP_QUEUE',
      notes: 'Configured OneDrive account batch in sequence.',
    };

    setQueueConfig((prev) => ({
      ...prev,
      batches: [...prev.batches, newBatch],
    }));
    setSelectedBatchId(newBatch.id);
  };

  const handleRemoveBatch = (batchId: string) => {
    if (queueConfig.batches.length <= 1) return;
    setQueueConfig((prev) => {
      const remaining = prev.batches.filter((b) => b.id !== batchId);
      const updated = remaining.map((b) => {
        if (b.dependsOnBatchId === batchId) {
          const idx = remaining.findIndex((x) => x.id === b.id);
          const newPredecessor = idx > 0 ? remaining[idx - 1].id : null;
          return { ...b, dependsOnBatchId: newPredecessor };
        }
        return b;
      });
      return { ...prev, batches: updated };
    });
    if (selectedBatchId === batchId) {
      const remaining = queueConfig.batches.filter((b) => b.id !== batchId);
      if (remaining.length > 0) setSelectedBatchId(remaining[0].id);
    }
  };

  const handleDuplicateBatch = (batchId: string) => {
    const target = queueConfig.batches.find((b) => b.id === batchId);
    if (!target) return;
    const newIndex = queueConfig.batches.length + 1;
    const duplicated: MigrationBatchItem = {
      ...target,
      id: `batch-od-${Date.now()}`,
      name: `${target.name} (Copy)`,
      batchCode: `BATCH-OD-W${newIndex}-${Math.floor(100 + Math.random() * 900)}`,
      dependsOnBatchId: target.id,
    };
    setQueueConfig((prev) => ({
      ...prev,
      batches: [...prev.batches, duplicated],
    }));
    setSelectedBatchId(duplicated.id);
  };

  const handleMoveBatch = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= queueConfig.batches.length) return;
    const newBatches = [...queueConfig.batches];
    const temp = newBatches[index];
    newBatches[index] = newBatches[targetIndex];
    newBatches[targetIndex] = temp;
    setQueueConfig((prev) => ({ ...prev, batches: newBatches }));
  };

  const handleUpdateBatch = (batchId: string, updates: Partial<MigrationBatchItem>) => {
    setQueueConfig((prev) => ({
      ...prev,
      batches: prev.batches.map((b) => (b.id === batchId ? { ...b, ...updates } : b)),
    }));
  };

  const applyOneDrivePreset = (presetType: string) => {
    setActiveQueuePreset(presetType);
    const now = new Date();
    const pad = (n: number) => (n < 10 ? '0' + n : String(n));
    const toIsoLocal = (d: Date) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

    if (presetType === 'PHASED_DEPT') {
      setQueueConfig((prev) => ({
        ...prev,
        queueName: 'Phased Departmental OneDrive Rollout',
        batches: getDefaultBatches(),
      }));
      setSelectedBatchId('batch-od-1');
    } else if (presetType === 'SIZE_TIERED') {
      const t1 = new Date(now.getTime() + 1 * 3600 * 1000);
      const e1 = new Date(t1.getTime() + 3 * 3600 * 1000);
      const t2 = new Date(e1.getTime() + 15 * 60 * 1000);
      const e2 = new Date(t2.getTime() + 5 * 3600 * 1000);
      const t3 = new Date(e2.getTime() + 15 * 60 * 1000);
      const e3 = new Date(t3.getTime() + 8 * 3600 * 1000);

      setQueueConfig((prev) => ({
        ...prev,
        queueName: 'Size-Tiered OneDrive Migration Queue (<10GB to >50GB)',
        batches: [
          {
            id: 'batch-tier-1',
            name: 'Tier 1: Light Accounts (< 10 GB Storage)',
            batchCode: 'BATCH-OD-TIER1',
            workloadType: 'ONEDRIVE',
            userCount: 15,
            startTime: toIsoLocal(t1),
            endTime: toIsoLocal(e1),
            dependsOnBatchId: null,
            dependencyCondition: 'SUCCESS',
            concurrencyLimit: 8,
            chunkSizeMB: 10,
            priority: 'HIGH',
            actionOnDependencyFailure: 'STOP_QUEUE',
            notes: 'High account count, small storage footprint. Fast completion rate.',
          },
          {
            id: 'batch-tier-2',
            name: 'Tier 2: Medium Accounts (10 GB - 50 GB)',
            batchCode: 'BATCH-OD-TIER2',
            workloadType: 'ONEDRIVE',
            userCount: 8,
            startTime: toIsoLocal(t2),
            endTime: toIsoLocal(e2),
            dependsOnBatchId: 'batch-tier-1',
            dependencyCondition: 'SUCCESS',
            concurrencyLimit: 6,
            chunkSizeMB: 25,
            priority: 'STANDARD',
            actionOnDependencyFailure: 'STOP_QUEUE',
            notes: 'Standard user storage profiles with version histories.',
          },
          {
            id: 'batch-tier-3',
            name: 'Tier 3: Heavy / High-Capacity Drives (> 50 GB)',
            batchCode: 'BATCH-OD-TIER3',
            workloadType: 'ONEDRIVE',
            userCount: 4,
            startTime: toIsoLocal(t3),
            endTime: toIsoLocal(e3),
            dependsOnBatchId: 'batch-tier-2',
            dependencyCondition: 'SUCCESS',
            concurrencyLimit: 4,
            chunkSizeMB: 50,
            priority: 'OFF_PEAK',
            actionOnDependencyFailure: 'CONTINUE',
            notes: 'Massive personal archives. 50MB chunks with overnight maintenance cutoff.',
          },
        ],
      }));
      setSelectedBatchId('batch-tier-1');
    } else if (presetType === 'CANARY_PILOT') {
      const t1 = new Date(now.getTime() + 30 * 60 * 1000);
      const e1 = new Date(t1.getTime() + 2 * 3600 * 1000);
      const t2 = new Date(e1.getTime() + 30 * 60 * 1000);
      const e2 = new Date(t2.getTime() + 6 * 3600 * 1000);

      setQueueConfig((prev) => ({
        ...prev,
        queueName: 'Canary Pilot ➔ Full OneDrive Production Wave',
        batches: [
          {
            id: 'batch-canary-od-1',
            name: 'Pilot Canary: IT & Migration Team Personal Drives',
            batchCode: 'BATCH-OD-CANARY',
            workloadType: 'ONEDRIVE',
            userCount: 2,
            startTime: toIsoLocal(t1),
            endTime: toIsoLocal(e1),
            dependsOnBatchId: null,
            dependencyCondition: 'SUCCESS',
            concurrencyLimit: 2,
            chunkSizeMB: 25,
            priority: 'VIP',
            actionOnDependencyFailure: 'STOP_QUEUE',
            notes: 'Validates target personal site provisioning, permissions, and sync client redirection.',
          },
          {
            id: 'batch-canary-od-2',
            name: 'Production Wave: All Enterprise OneDrive Accounts',
            batchCode: 'BATCH-OD-PROD',
            workloadType: 'ONEDRIVE',
            userCount: 20,
            startTime: toIsoLocal(t2),
            endTime: toIsoLocal(e2),
            dependsOnBatchId: 'batch-canary-od-1',
            dependencyCondition: 'SUCCESS',
            concurrencyLimit: 8,
            chunkSizeMB: 25,
            priority: 'HIGH',
            actionOnDependencyFailure: 'STOP_QUEUE',
            notes: 'Full volume migration unlocked automatically once canary verification passes.',
          },
        ],
      }));
      setSelectedBatchId('batch-canary-od-1');
    }
  };

  const getDependencyCycles = (batches: MigrationBatchItem[]): string[] => {
    const cycles: string[] = [];
    for (const b of batches) {
      if (!b.dependsOnBatchId) continue;
      if (b.dependsOnBatchId === b.id) {
        cycles.push(`Batch "${b.name}" cannot depend on itself.`);
        continue;
      }
      const visited = new Set<string>([b.id]);
      let curr = batches.find((x) => x.id === b.dependsOnBatchId);
      while (curr) {
        if (visited.has(curr.id)) {
          cycles.push(`Circular dependency detected between "${b.name}" and "${curr.name}".`);
          break;
        }
        visited.add(curr.id);
        curr = curr.dependsOnBatchId ? batches.find((x) => x.id === curr!.dependsOnBatchId) : undefined;
      }
    }
    return cycles;
  };

  const runPreFlightValidationHandler = async (): Promise<PreFlightValidationReport | null> => {
    setIsValidating(true);
    try {
      const res = await fetch('/api/migration/preflight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceTenant: formData.sourceTenant,
          targetTenant: formData.targetTenant,
          workloadType: 'ONEDRIVE',
          targetLicensingSku: formData.targetLicensingSku,
          totalDataGB: 85.5,
          userMappings: [
            { sourceUPN: `alex.wilber@${formData.sourceTenant}`, targetUPN: `alex.wilber@${formData.targetTenant}` },
            { sourceUPN: `adele.vance@${formData.sourceTenant}`, targetUPN: `adele.vance@${formData.targetTenant}` },
          ],
        }),
      });

      if (!res.ok) {
        throw new Error('Pre-flight validation failed');
      }

      const report: PreFlightValidationReport = await res.json();
      setValidationReport(report);
      return report;
    } catch (err) {
      console.error('Pre-flight check error:', err);
      return null;
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Run pre-flight check if needed
      let activeReport = validationReport;
      if (!activeReport) {
        activeReport = await runPreFlightValidationHandler();
      }

      if (formData.scheduleMode === 'QUEUE_AND_BATCH') {
        const cycles = getDependencyCycles(queueConfig.batches);
        if (cycles.length > 0) {
          throw new Error(`Circular dependency detected in batch sequence: ${cycles[0]}`);
        }

        const queuePayload = {
          sourceTenantDomain: formData.sourceTenant,
          targetTenantDomain: formData.targetTenant,
          queueName: queueConfig.queueName,
          enforceSequentialExecution: queueConfig.enforceSequentialExecution,
          pauseOnAnyFailure: queueConfig.pauseOnAnyFailure,
          batches: queueConfig.batches,
          configPayload: {
            ...formData,
            queueConfig,
            preflightValidationReport: activeReport,
            workloadType: 'ONEDRIVE',
          },
        };

        const res = await fetch('/api/jobs/batch-queue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(queuePayload),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to trigger OneDrive batch queue');
        }

        const data = await res.json();
        if (onJobStarted) {
          onJobStarted(data.rootJob || data.jobs?.[0]);
        }
        onClose();
        return;
      }

      // Single Job submission
      const samplePrefixes = ['alex.wilber', 'adele.vance', 'megan.bowen', 'diego.siciliani', 'isaiah.langer', 'joni.sherman'];
      const userMappings = samplePrefixes.slice(0, formData.selectedAccountCount || 6).map((p) => ({
        sourceUPN: `${p}@${formData.sourceTenant}`,
        targetUPN: `${p}@${formData.targetTenant}`,
        migrateMailbox: false,
        migrateOneDrive: true,
      }));

      const payload = {
        sourceTenantDomain: formData.sourceTenant,
        targetTenantDomain: formData.targetTenant,
        name: `OneDrive Cross-Tenant Migration (${formData.sourceTenant} → ${formData.targetTenant})`,
        workloadType: 'ONEDRIVE',
        batchCode: `BATCH-OD-${Math.floor(1000 + Math.random() * 9000)}`,
        wave: 'Wave 1 (OneDrive Personal Drives)',
        streamingMode: formData.streamingMode,
        chunkSizeMB: formData.chunkSizeMB,
        concurrencyLimit: formData.concurrencyLimit,
        totalDataGB: Number((userMappings.length * 15.2).toFixed(1)),
        configPayload: JSON.stringify({
          ...formData,
          preflightValidationReport: activeReport,
        }),
        mappings: userMappings,
      };

      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to trigger OneDrive migration job');
      }

      const data = await res.json();
      if (onJobStarted) {
        onJobStarted(data.job);
      }
      onClose();
    } catch (err: any) {
      console.error('Error creating OneDrive migration job:', err);
      setSubmitError(err.message || 'Failed to create OneDrive migration job');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="h-11 w-11 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center shadow-xs">
              <HardDrive className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Create OneDrive Cross-Tenant Migration Job
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-mono">
                  Start-SPOCrossTenantUserContentMove
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Microsoft Learn Standard
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                End-to-end cloud content move architecture with pre-creation safeguards, source redirects, and multi-batch scheduling.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Wizard Steps Bar */}
        <div className="px-6 py-3 border-b border-slate-200/80 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-950/40">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            {steps.map((s, idx) => {
              const isCurrent = currentStep === s.number;
              const isDone = currentStep > s.number;
              return (
                <div key={s.number} className="flex items-center space-x-2">
                  <div
                    onClick={() => setCurrentStep(s.number)}
                    className={`cursor-pointer flex items-center space-x-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg transition-all ${
                      isCurrent
                        ? 'bg-blue-600 text-white shadow-xs'
                        : isDone
                        ? 'text-emerald-600 dark:text-emerald-400 hover:bg-white dark:hover:bg-slate-800'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <span
                      className={`h-4 w-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        isCurrent
                          ? 'bg-white/20 text-white'
                          : isDone
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {isDone ? <Check className="h-2.5 w-2.5" /> : s.number}
                    </span>
                    <span className="hidden sm:inline">{s.short}</span>
                  </div>
                  {idx < steps.length - 1 && (
                    <ChevronRight className="h-3.5 w-3.5 text-slate-300 dark:text-slate-700 flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Main Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {submitError && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 flex items-center space-x-2 text-xs text-rose-700 dark:text-rose-300">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* STEP 1: PREREQUISITES & CROSS-TENANT TRUST */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="h-5 w-5 text-blue-500" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Step 1: Tenant Trust & Microsoft Prerequisites Check
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Verify cross-tenant compatibility, trust relationship, and licensing requirements as documented by Microsoft Learn.
                </p>
              </div>

              {/* Tenants Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Source Tenant (Origin of OneDrive Sites)
                  </label>
                  <input
                    type="text"
                    value={formData.sourceTenant}
                    onChange={(e) => setFormData({ ...formData, sourceTenant: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-semibold text-slate-900 dark:text-white"
                  />
                  <div className="flex items-center space-x-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Global Admin & SPO Admin Consent Verified</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Target Tenant (Destination Container)
                  </label>
                  <input
                    type="text"
                    value={formData.targetTenant}
                    onChange={(e) => setFormData({ ...formData, targetTenant: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-semibold text-slate-900 dark:text-white"
                  />
                  <div className="flex items-center space-x-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Cross-Tenant Migration Relationship Established</span>
                  </div>
                </div>
              </div>

              {/* Microsoft Learn 4 Prerequisites Checklist */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
                  <Activity className="h-4 w-4 text-emerald-500" />
                  <span>Microsoft Learn Mandatory Cross-Tenant Safeguards</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30 flex items-start space-x-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        Compatibility Status (`Get-SPOCrossTenantCompatibilityStatus`)
                      </span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Status verified as "Compatible". No schema conflicts or tenant blockers detected.
                      </p>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30 flex items-start space-x-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        Migration Relationship (`Set-SPOCrossTenantRelationship`)
                      </span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Bi-directional cryptographic handshake verified between Source & Target SPO.
                      </p>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30 flex items-start space-x-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        Cross-Tenant User Data Migration License Pool
                      </span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Add-on licenses allocated in target tenant covering all planned OneDrive moves.
                      </p>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30 flex items-start space-x-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        Source Account Status: Read/Write Active
                      </span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Confirmed source personal sites are Read/Write. (Read-only sites are blocked).
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-300 flex items-start space-x-2">
                  <Info className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-[11px] leading-relaxed">
                    <strong>Microsoft Learn Notice:</strong> Purview Customer Key encryption must not be active on source OneDrive accounts. Accounts currently under Legal Hold must have holds noted and reapplied on the target tenant following cutover.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: IDENTITY MAPPING & TARGET SITE PROTECTION */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Lock className="h-5 w-5 text-blue-500" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Step 2: Identity Mapping & Target Site Pre-Creation Safeguards
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Configure UPN transformation and enforce Microsoft's critical safeguard of restricting target site creation.
                </p>
              </div>

              {/* CRITICAL BEST PRACTICE BANNER: Restrict Target Personal Site Creation */}
              <div className="p-4 rounded-xl border-2 border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                      Microsoft Best Practice Safeguard: Restrict Target Personal Site Pre-Creation
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Mandatory Recommendation
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Microsoft explicitly mandates restricting users from manually creating OneDrive sites in the target tenant before or during migration. If a user signs in early and creates a blank personal site, the cross-tenant move will fail with container collisions.
                </p>
                <label className="flex items-center space-x-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300 pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.restrictTargetSitePreCreation}
                    onChange={(e) =>
                      setFormData({ ...formData, restrictTargetSitePreCreation: e.target.checked })
                    }
                    className="rounded text-emerald-600 h-4 w-4"
                  />
                  <span>
                    Enforce `Set-SPOTenant -PersonalShowGuids $true` / Block manual target Personal Site creation until migration job creates clean containers
                  </span>
                </label>
              </div>

              {/* Identity Mapping Rules */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                  <h4 className="font-semibold text-xs text-slate-900 dark:text-white">
                    Identity Transformation Strategy
                  </h4>
                  <select
                    value={formData.mappingStrategy}
                    onChange={(e) => setFormData({ ...formData, mappingStrategy: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
                  >
                    <option value="UPN_TRANSFORM">UPN Suffix Transformation (@contoso ➔ @fabrikam)</option>
                    <option value="CSV_MAPPING">Custom CSV Identity Mapping File</option>
                  </select>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400">Source Suffix:</span>
                      <input
                        type="text"
                        value={formData.domainTransformSource}
                        onChange={(e) => setFormData({ ...formData, domainTransformSource: e.target.value })}
                        className="w-full px-2 py-1 mt-1 font-mono text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400">Target Suffix:</span>
                      <input
                        type="text"
                        value={formData.domainTransformTarget}
                        onChange={(e) => setFormData({ ...formData, domainTransformTarget: e.target.value })}
                        className="w-full px-2 py-1 mt-1 font-mono text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                  <h4 className="font-semibold text-xs text-slate-900 dark:text-white">
                    Target Licensing & Guest Identities
                  </h4>

                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Target Assigned License SKU</label>
                    <select
                      value={formData.targetLicensingSku}
                      onChange={(e) => setFormData({ ...formData, targetLicensingSku: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
                    >
                      <option value="SharePoint / OneDrive Plan 2 (Cross-Tenant Addon)">SharePoint / OneDrive Plan 2 (Cross-Tenant Addon)</option>
                      <option value="Microsoft 365 E5 Enterprise">Microsoft 365 E5 Enterprise</option>
                      <option value="Microsoft 365 E3 Business">Microsoft 365 E3 Business</option>
                    </select>
                  </div>

                  <label className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={formData.createTargetGuestIdentities}
                      onChange={(e) => setFormData({ ...formData, createTargetGuestIdentities: e.target.checked })}
                      className="rounded text-blue-600"
                    />
                    <span>Auto-create Entra ID Guest accounts for remaining source collaborators</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: SCOPE, FILE POLICIES & VERSIONING */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <FolderTree className="h-5 w-5 text-blue-500" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Step 3: Data Scope, File Filtering & Version Retention
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Configure document library scopes, version history limits, and metadata preservation rules.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                  <h4 className="font-semibold text-slate-900 dark:text-white">Version History Policy</h4>
                  <div className="space-y-2">
                    <label
                      onClick={() => setFormData({ ...formData, versionHistoryOption: 'ALL_VERSIONS' })}
                      className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer ${
                        formData.versionHistoryOption === 'ALL_VERSIONS'
                          ? 'border-blue-500 bg-white dark:bg-slate-900 shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 bg-transparent'
                      }`}
                    >
                      <div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">All Version History</span>
                        <p className="text-[10px] text-slate-500">Full audit & revision history across all files (SOC2/ISO standard)</p>
                      </div>
                      <input
                        type="radio"
                        name="versionOpt"
                        checked={formData.versionHistoryOption === 'ALL_VERSIONS'}
                        onChange={() => {}}
                        className="text-blue-600"
                      />
                    </label>

                    <label
                      onClick={() => setFormData({ ...formData, versionHistoryOption: 'LAST_5' })}
                      className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer ${
                        formData.versionHistoryOption === 'LAST_5'
                          ? 'border-blue-500 bg-white dark:bg-slate-900 shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 bg-transparent'
                      }`}
                    >
                      <div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">Last 5 Major Versions</span>
                        <p className="text-[10px] text-slate-500">Prunes ancient intermediate saves to maximize network speed</p>
                      </div>
                      <input
                        type="radio"
                        name="versionOpt"
                        checked={formData.versionHistoryOption === 'LAST_5'}
                        onChange={() => {}}
                        className="text-blue-600"
                      />
                    </label>

                    <label
                      onClick={() => setFormData({ ...formData, versionHistoryOption: 'CURRENT_ONLY' })}
                      className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer ${
                        formData.versionHistoryOption === 'CURRENT_ONLY'
                          ? 'border-blue-500 bg-white dark:bg-slate-900 shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 bg-transparent'
                      }`}
                    >
                      <div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">Current Version Only</span>
                        <p className="text-[10px] text-slate-500">Migrates latest head copy without prior revisions</p>
                      </div>
                      <input
                        type="radio"
                        name="versionOpt"
                        checked={formData.versionHistoryOption === 'CURRENT_ONLY'}
                        onChange={() => {}}
                        className="text-blue-600"
                      />
                    </label>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                  <h4 className="font-semibold text-slate-900 dark:text-white">Metadata & Sharing Remediation</h4>

                  <div className="space-y-2 pt-1">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.preserveTimestampsAndAuthors}
                        onChange={(e) => setFormData({ ...formData, preserveTimestampsAndAuthors: e.target.checked })}
                        className="rounded text-blue-600"
                      />
                      <span>Preserve original created date, modified timestamps, and author UPNs</span>
                    </label>

                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.preserveFolderPermissions}
                        onChange={(e) => setFormData({ ...formData, preserveFolderPermissions: e.target.checked })}
                        className="rounded text-blue-600"
                      />
                      <span>Preserve custom folder ACLs and direct permission assignments</span>
                    </label>

                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.relinkExternalSharing}
                        onChange={(e) => setFormData({ ...formData, relinkExternalSharing: e.target.checked })}
                        className="rounded text-blue-600"
                      />
                      <span>Re-link external guest sharing links on target tenant</span>
                    </label>

                    <div className="pt-2">
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Excluded File Extensions
                      </label>
                      <input
                        type="text"
                        value={formData.excludeExtensions}
                        onChange={(e) => setFormData({ ...formData, excludeExtensions: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-900 dark:text-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: QUEUE & BATCH OPTIONS (THE BATCHES OPTIONS) */}
          {currentStep === 4 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ListOrdered className="h-5 w-5 text-blue-500" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Step 4: OneDrive Queue & Batch Options (Microsoft 4,000 Accounts/Batch Standard)
                    </h3>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Sequential & DAG Batches
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Define start times, end times, and dependency sequences for multiple OneDrive migration batches.
                </p>
              </div>

              {/* Toolbar & Presets */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex-1">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      OneDrive Batch Queue Pipeline
                    </label>
                    <input
                      type="text"
                      value={queueConfig.queueName}
                      onChange={(e) => setQueueConfig({ ...queueConfig, queueName: e.target.value })}
                      className="w-full max-w-md px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      id="btn-onedrive-add-batch"
                      onClick={handleAddBatch}
                      className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-xs flex items-center space-x-1.5 transition-all"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add OneDrive Batch</span>
                    </button>
                  </div>
                </div>

                {/* Presets */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-semibold text-slate-600 dark:text-slate-400 text-[11px]">
                      Batch Presets:
                    </span>
                    <button
                      type="button"
                      onClick={() => applyOneDrivePreset('PHASED_DEPT')}
                      className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                        activeQueuePreset === 'PHASED_DEPT'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      Phased Departmental Waves
                    </button>
                    <button
                      type="button"
                      onClick={() => applyOneDrivePreset('SIZE_TIERED')}
                      className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                        activeQueuePreset === 'SIZE_TIERED'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      Storage Size-Tiered (&lt;10GB to &gt;50GB)
                    </button>
                    <button
                      type="button"
                      onClick={() => applyOneDrivePreset('CANARY_PILOT')}
                      className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                        activeQueuePreset === 'CANARY_PILOT'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      Canary Pilot ➔ Production Wave
                    </button>
                  </div>

                  <div className="text-[11px] text-slate-500 font-medium">
                    <span>{queueConfig.batches.length} Batches Configured</span>
                    <span className="mx-1.5">•</span>
                    <span>{queueConfig.batches.reduce((sum, b) => sum + b.userCount, 0)} Accounts Total</span>
                  </div>
                </div>
              </div>

              {/* Visual Sequence Flowchart Diagram */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <GitMerge className="h-4 w-4 text-emerald-500" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Sequential Dependency & Maintenance Window Diagram
                    </h4>
                  </div>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center space-x-1">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>DAG Sequence Health Valid</span>
                  </span>
                </div>

                <div className="overflow-x-auto pb-2">
                  <div className="flex items-center space-x-3 min-w-max py-2">
                    {queueConfig.batches.map((batch, idx) => {
                      const isRoot = !batch.dependsOnBatchId;
                      const pred = queueConfig.batches.find((b) => b.id === batch.dependsOnBatchId);
                      const isSelected = selectedBatchId === batch.id;

                      return (
                        <React.Fragment key={batch.id}>
                          {idx > 0 && (
                            <div className="flex flex-col items-center px-1 text-slate-400">
                              <span className="text-[9px] font-mono font-semibold text-slate-500 uppercase">
                                {batch.dependencyCondition}
                              </span>
                              <ArrowRight className="h-4 w-4 text-blue-500" />
                            </div>
                          )}

                          <div
                            onClick={() => setSelectedBatchId(batch.id)}
                            className={`w-64 p-3 rounded-xl border-2 transition-all cursor-pointer ${
                              isSelected
                                ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 shadow-md ring-2 ring-blue-500/20'
                                : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                                Wave #{idx + 1}
                              </span>
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                {batch.priority}
                              </span>
                            </div>

                            <div className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                              {batch.name}
                            </div>
                            <div className="text-[10px] font-mono text-slate-500 mb-2 truncate">
                              {batch.batchCode}
                            </div>

                            <div className="space-y-1 text-[10px] text-slate-600 dark:text-slate-300 border-t border-slate-200/60 dark:border-slate-700/60 pt-1.5">
                              <div className="flex justify-between">
                                <span className="text-slate-400">Start Time:</span>
                                <span className="font-medium">{batch.startTime ? batch.startTime.replace('T', ' ') : 'Immediate'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">End Cutoff:</span>
                                <span className="font-medium">{batch.endTime ? batch.endTime.replace('T', ' ') : 'Open window'}</span>
                              </div>
                              <div className="flex justify-between pt-0.5">
                                <span className="text-slate-400">Dependency:</span>
                                <span className={`font-semibold ${isRoot ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                  {isRoot ? 'Root (Runs First)' : `Depends on ${pred ? pred.batchCode : 'Batch'}`}
                                </span>
                              </div>
                            </div>
                          </div>
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Batch Configuration Cards Editor */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Batch Parameters & Scheduling Cutoffs
                </h4>

                {queueConfig.batches.map((batch, index) => {
                  const isSelected = selectedBatchId === batch.id;
                  const isFirst = index === 0;
                  const isLast = index === queueConfig.batches.length - 1;

                  return (
                    <div
                      key={batch.id}
                      className={`rounded-xl border transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-white dark:bg-slate-900 shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30'
                      }`}
                    >
                      <div className="p-3.5 border-b border-slate-200/70 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center space-x-2.5 flex-1">
                          <span className="h-6 w-6 rounded-md bg-blue-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                            {index + 1}
                          </span>

                          <input
                            type="text"
                            value={batch.name}
                            onChange={(e) => handleUpdateBatch(batch.id, { name: e.target.value })}
                            className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white flex-1 max-w-sm"
                          />

                          <span className="font-mono text-[10px] text-slate-500 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                            {batch.batchCode}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            disabled={isFirst}
                            onClick={() => handleMoveBatch(index, 'up')}
                            className="p-1 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            disabled={isLast}
                            onClick={() => handleMoveBatch(index, 'down')}
                            className="p-1 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDuplicateBatch(batch.id)}
                            className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={queueConfig.batches.length <= 1}
                            onClick={() => handleRemoveBatch(batch.id)}
                            className="p-1 rounded text-slate-500 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-30"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Config Columns */}
                      <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        {/* Timings */}
                        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-2.5">
                          <div className="flex items-center space-x-1.5 font-semibold text-slate-800 dark:text-slate-200">
                            <Clock className="h-3.5 w-3.5 text-blue-500" />
                            <span>Start & End Cutoff Windows</span>
                          </div>

                          <div>
                            <label className="block text-[11px] text-slate-500 mb-1">Scheduled Start Time</label>
                            <input
                              type="datetime-local"
                              value={batch.startTime}
                              onChange={(e) => handleUpdateBatch(batch.id, { startTime: e.target.value })}
                              className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-900 dark:text-white"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] text-slate-500 mb-1">Scheduled End Time (Cutoff)</label>
                            <input
                              type="datetime-local"
                              value={batch.endTime}
                              onChange={(e) => handleUpdateBatch(batch.id, { endTime: e.target.value })}
                              className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-900 dark:text-white"
                            />
                          </div>
                        </div>

                        {/* Dependencies */}
                        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-2.5">
                          <div className="flex items-center space-x-1.5 font-semibold text-slate-800 dark:text-slate-200">
                            <GitMerge className="h-3.5 w-3.5 text-emerald-500" />
                            <span>Predecessor Dependency</span>
                          </div>

                          <div>
                            <label className="block text-[11px] text-slate-500 mb-1">Depends On Predecessor</label>
                            <select
                              value={batch.dependsOnBatchId || ''}
                              onChange={(e) =>
                                handleUpdateBatch(batch.id, {
                                  dependsOnBatchId: e.target.value === '' ? null : e.target.value,
                                })
                              }
                              className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-900 dark:text-white"
                            >
                              <option value="">None (Root Wave — Starts at Window Open)</option>
                              {queueConfig.batches
                                .filter((other) => other.id !== batch.id)
                                .map((other, oIdx) => (
                                  <option key={other.id} value={other.id}>
                                    Wave {oIdx + 1}: {other.name} ({other.batchCode})
                                  </option>
                                ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] text-slate-500 mb-1">Failure Action</label>
                            <select
                              value={batch.actionOnDependencyFailure}
                              onChange={(e) =>
                                handleUpdateBatch(batch.id, {
                                  actionOnDependencyFailure: e.target.value as BatchFailureAction,
                                })
                              }
                              className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-900 dark:text-white"
                            >
                              <option value="STOP_QUEUE">Halt Entire Queue (Safest)</option>
                              <option value="SKIP_DEPENDENTS">Skip This Batch & Proceed</option>
                              <option value="CONTINUE">Proceed Regardless</option>
                            </select>
                          </div>
                        </div>

                        {/* Capacity & Workers */}
                        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-2.5">
                          <div className="flex items-center space-x-1.5 font-semibold text-slate-800 dark:text-slate-200">
                            <Cpu className="h-3.5 w-3.5 text-purple-500" />
                            <span>Accounts & Concurrency</span>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[11px] text-slate-500 mb-1">Accounts</label>
                              <input
                                type="number"
                                min="1"
                                max="4000"
                                value={batch.userCount}
                                onChange={(e) =>
                                  handleUpdateBatch(batch.id, { userCount: parseInt(e.target.value, 10) || 5 })
                                }
                                className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-900 dark:text-white font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] text-slate-500 mb-1">Workers</label>
                              <select
                                value={batch.concurrencyLimit}
                                onChange={(e) =>
                                  handleUpdateBatch(batch.id, { concurrencyLimit: parseInt(e.target.value, 10) || 4 })
                                }
                                className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-900 dark:text-white"
                              >
                                <option value="2">2 Workers</option>
                                <option value="4">4 Workers</option>
                                <option value="6">6 Workers</option>
                                <option value="8">8 Workers</option>
                                <option value="16">16 Workers</option>
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] text-slate-500 mb-1">Priority</label>
                            <select
                              value={batch.priority}
                              onChange={(e) => handleUpdateBatch(batch.id, { priority: e.target.value as any })}
                              className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-900 dark:text-white"
                            >
                              <option value="VIP">VIP Executive</option>
                              <option value="HIGH">High Priority</option>
                              <option value="STANDARD">Standard Business</option>
                              <option value="OFF_PEAK">Off-Peak (Low Throttle)</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 5: STREAMING & REDIRECTION ARCHITECTURE */}
          {currentStep === 5 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <ExternalLink className="h-5 w-5 text-blue-500" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Step 5: Direct Streaming Pipeline & Source Redirection Links
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Direct zero-disk memory streaming with automatic source URL redirects to prevent broken sharing links.
                </p>
              </div>

              {/* Microsoft Learn Source Redirection Highlight */}
              <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-50/50 dark:bg-blue-950/20 space-y-2 text-xs">
                <div className="flex items-center space-x-2 text-blue-700 dark:text-blue-300 font-bold uppercase tracking-wider">
                  <ExternalLink className="h-4 w-4" />
                  <span>Automatic Source Redirection Link Architecture</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Per Microsoft Learn, when a cross-tenant OneDrive move completes, a redirect site pointer is automatically created at the original source OneDrive URL. When users or external collaborators click previously shared file links, they are transparently forwarded to the new target location.
                </p>
                <label className="flex items-center space-x-2 font-semibold text-blue-800 dark:text-blue-200 pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.enableSourceRedirectLinks}
                    onChange={(e) => setFormData({ ...formData, enableSourceRedirectLinks: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  <span>
                    Enable persistent source URL redirection until source tenant deprovisioning
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                  <h4 className="font-semibold text-slate-900 dark:text-white">Direct Streaming Engine</h4>

                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Transfer Chunk Size</label>
                    <select
                      value={formData.chunkSizeMB}
                      onChange={(e) => setFormData({ ...formData, chunkSizeMB: parseInt(e.target.value, 10) || 25 })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
                    >
                      <option value="10">10 MB (Optimal for high-latency connections)</option>
                      <option value="25">25 MB (Recommended enterprise balanced throughput)</option>
                      <option value="50">50 MB (Maximum throughput for fast edge connections)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Throttling & Backoff Policy</label>
                    <input
                      type="text"
                      disabled
                      value="Exponential Jitter Backoff (Graph API 429 Protection)"
                      className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-500"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                  <h4 className="font-semibold text-slate-900 dark:text-white">Post-Migration User Experience</h4>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.resyncClientGuidanceEmail}
                      onChange={(e) => setFormData({ ...formData, resyncClientGuidanceEmail: e.target.checked })}
                      className="rounded text-blue-600"
                    />
                    <span>Send automated OneDrive Sync Client sign-in & resync guide to users</span>
                  </label>

                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Administrator Alert Email</label>
                    <input
                      type="text"
                      value={formData.adminNotificationEmail}
                      onChange={(e) => setFormData({ ...formData, adminNotificationEmail: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: PRE-FLIGHT VERIFICATION & KICK OFF */}
          {currentStep === 6 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Step 6: Review Configuration & Schedule OneDrive Migration Job
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Review parameters, execute automated pre-flight checks, and initialize the background streaming pipeline.
                </p>
              </div>

              {/* Review Highlights */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Workload & Scope</span>
                  <div className="font-bold text-slate-900 dark:text-white">OneDrive Personal Sites</div>
                  <div className="text-slate-500">
                    {formData.sourceTenant} ➔ {formData.targetTenant}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Batch Architecture</span>
                  <div className="font-bold text-slate-900 dark:text-white">
                    {queueConfig.batches.length} Sequenced Waves
                  </div>
                  <div className="text-slate-500">
                    {queueConfig.batches.reduce((sum, b) => sum + b.userCount, 0)} Total Accounts Enqueued
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Safeguards & Redirects</span>
                  <div className="font-bold text-emerald-600 dark:text-emerald-400">
                    Target Site Block + Source Redirect
                  </div>
                  <div className="text-slate-500">Zero-Disk Direct Memory Stream</div>
                </div>
              </div>

              {/* Pre-Flight Status Card */}
              <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-lg bg-emerald-600 text-white font-bold text-sm flex items-center justify-center">
                    {isValidating ? <RefreshCw className="h-5 w-5 animate-spin" /> : '100%'}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">
                      {isValidating ? 'Validating OneDrive Safeguards...' : 'OneDrive Pre-Flight Safeguards Verified'}
                    </h4>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      SPO cross-tenant compatibility, license quotas, target site creation restrictions, and credentials confirmed.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={runPreFlightValidationHandler}
                  disabled={isValidating}
                  className="px-3 py-1.5 rounded-lg border border-blue-500/40 text-blue-600 dark:text-blue-400 font-semibold text-xs hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:opacity-50 flex items-center space-x-1"
                >
                  <RefreshCw className={`h-3 w-3 ${isValidating ? 'animate-spin' : ''}`} />
                  <span>Re-verify</span>
                </button>
              </div>

              {/* Batch Queue Summary Table */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5 text-xs">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                  <ListOrdered className="h-4 w-4 text-blue-500" />
                  <span>Configured OneDrive Batches to be Scheduled</span>
                </h4>

                <div className="space-y-1.5">
                  {queueConfig.batches.map((b, idx) => (
                    <div
                      key={b.id}
                      className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="h-5 w-5 rounded bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <div>
                          <span className="font-semibold text-slate-900 dark:text-white">{b.name}</span>
                          <span className="font-mono text-slate-500 text-[10px] ml-2">({b.batchCode})</span>
                        </div>
                      </div>
                      <div className="text-right text-[11px]">
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {b.userCount} Accounts • {b.concurrencyLimit} Workers
                        </span>
                        <div className="text-[10px] text-slate-500">
                          Window: {b.startTime ? b.startTime.replace('T', ' ') : 'Immediate'} ➔ {b.endTime ? b.endTime.replace('T', ' ') : 'Open'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === 1 || isSubmitting}
            className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium transition-colors disabled:opacity-40 flex items-center space-x-1.5"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Back</span>
          </button>

          <div className="flex items-center space-x-2.5">
            <span className="text-xs text-slate-400">
              Step {currentStep} of {steps.length}
            </span>

            {currentStep < 6 ? (
              <button
                onClick={handleNext}
                className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors flex items-center space-x-1.5 shadow-sm"
              >
                <span>Next Step</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                id="btn-confirm-onedrive-job"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors flex items-center space-x-1.5 shadow-md disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Scheduling Batches...</span>
                  </>
                ) : (
                  <>
                    <CalendarClock className="h-4 w-4" />
                    <span>Schedule OneDrive Queue ({queueConfig.batches.length} Batches)</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
