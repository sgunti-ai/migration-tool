import React, { useState } from 'react';
import {
  X,
  Check,
  ChevronRight,
  ChevronLeft,
  Info,
  Layers,
  FolderTree,
  Mail,
  Calendar,
  Users,
  CheckSquare,
  Clock,
  Send,
  FileText,
  Settings,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Save,
  Play,
  HardDrive,
  Globe,
  MessageSquare,
  ArrowRight,
  Zap,
  Activity,
  Server,
  Key,
  Shield,
  UploadCloud,
  Cpu,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  FileCheck,
  CheckCircle,
  GitMerge,
  ListOrdered,
  Plus,
  Trash2,
  Copy,
  ArrowDown,
  Network,
  FastForward,
  Pause,
  CalendarClock,
  Split,
  Timer,
  Filter,
  Sliders,
  Lock,
} from 'lucide-react';
import {
  MigrationWorkloadType,
  TenantStatusResponse,
  PreFlightValidationReport,
  PreFlightCheckItem,
  MigrationBatchItem,
  MigrationQueueConfig,
  BatchDependencyCondition,
  BatchFailureAction,
} from '../types';
import { SharePointSteps } from './wizard-workloads/SharePointSteps';
import { TeamsSteps } from './wizard-workloads/TeamsSteps';
import { ActiveDirectorySteps } from './wizard-workloads/ActiveDirectorySteps';
import { OneDriveSteps } from './wizard-workloads/OneDriveSteps';

export interface WorkloadMigrationWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJobStarted?: (newJob: any) => void;
  tenantStatus?: TenantStatusResponse;
  initialWorkload?: MigrationWorkloadType;
}

export const WorkloadMigrationWizardModal: React.FC<WorkloadMigrationWizardModalProps> = ({
  isOpen,
  onClose,
  onJobStarted,
  tenantStatus,
  initialWorkload = 'EXCHANGE_MAILBOX',
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Pre-flight Validation State
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [validationReport, setValidationReport] = useState<PreFlightValidationReport | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [expandedCheckId, setExpandedCheckId] = useState<string | null>(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('ALL');
  const [runningStepIndex, setRunningStepIndex] = useState<number>(0);
  const [showStep10Details, setShowStep10Details] = useState<boolean>(false);
  const [step3Tab, setStep3Tab] = useState<'streaming' | 'scope' | 'permissions' | 'coexistence' | 'audit'>('streaming');

  // Form State covering all enterprise parameters across all workloads
  const [formData, setFormData] = useState({
    // Step 1: Workload Scope & Wave
    workloadType: initialWorkload as MigrationWorkloadType,
    name: 'Production Multi-Workload Direct Streaming Job',
    batchCode: 'BATCH-' + Math.floor(1000 + Math.random() * 9000),
    wave: 'Wave 1 (Priority Depts)',
    priority: 'HIGH', // STANDARD, HIGH, VIP
    saveAsTemplate: true,

    // Step 2: Tenant & Auth Pre-Flight
    sourceTenant: tenantStatus?.source?.domain || 'contoso.onmicrosoft.com',
    targetTenant: tenantStatus?.target?.domain || 'fabrikam.com',
    validateGraphPermissions: true,
    throttleBypassRequested: true,
    targetQuotaPreCheck: true,

    // Step 3: Identity & Account Mapping
    mappingStrategy: 'UPN_TRANSFORM', // UPN_TRANSFORM, CSV_MAPPING, EXACT_MATCH
    domainTransformSource: '@contoso.onmicrosoft.com',
    domainTransformTarget: '@fabrikam.com',
    unmappedObjectHandling: 'AUTO_PROVISION', // AUTO_PROVISION, QUARANTINE, SKIP
    targetLicensingSku: 'Microsoft 365 E5 Enterprise',
    autoAssignLicense: true,
    selectedUserCount: 15,

    // Step 4: Workload Data Scope & Filtering (Anti-Data-Loss)
    dateRangeFilter: 'ALL', // ALL, LAST_1_YEAR, LAST_2_YEARS, CUSTOM
    startDate: '',
    endDate: '',
    maxItemSizeMB: 250,
    migrateMailboxPrimary: true,
    migrateMailboxArchive: true,
    migrateRecoverableItems: true,
    migrateSafeSenderList: true,
    migrateMailboxRules: true,
    migrateSignatures: true,
    migrateOneDriveVersions: 'ALL', // ALL, LAST_5, LAST_10
    migrateSharePointLists: true,
    migrateTeamsChannels: true,
    migrateTeamsChatHistory: true,
    migrateTeamsTabsAndPlanner: true,
    excludedFolders: ['Junk Email', 'Sync Issues'],

    // Step 5: Permissions, Sharing & Metadata Remediation
    preserveMailboxDelegates: true,
    preserveFolderACLs: true,
    relinkExternalSharing: true,
    remediatePathLengthExceeded: true,
    preserveTimestampsAndAuthors: true,
    enableCoexistenceForwarding: true,
    forwardingDirection: 'Target to Source Coexistence',

    // Step 6: Direct Chunked Streaming & Resilience Architecture (Core Requirement)
    streamingMode: 'DIRECT_CHUNKED', // DIRECT_CHUNKED (Zero disk staging)
    chunkSizeMB: 10, // 4, 10, 25, 50 MB
    checkpointFrequency: 'EVERY_CHUNK', // EVERY_CHUNK, EVERY_FOLDER, EVERY_ITEM
    concurrencyLimit: 4, // 2, 4, 8, 16 workers
    maxResumableRetries: 5,
    backoffPolicy: 'EXPONENTIAL_JITTER',
    sha256ChecksumVerification: true,

    // Step 7: Mail & Coexistence Flow
    mailRoutingAction: 'DUAL_DELIVERY', // DUAL_DELIVERY, FORWARD_TARGET, CUTOVER
    calendarFreeBusySharing: true,
    reduceDnsTtlReminder: true,

    // Step 8: Notification & Compliance Audit
    adminNotificationEmails: 'admin@contoso.onmicrosoft.com',
    sendAdminFailureAlerts: true,
    sendAdminCompleteReport: true,
    sendUserWelcomeEmail: false,
    itemLevelAuditLogging: true,
    encryptionMode: 'TLS_1_3_AES_256',

    // Step 9: Schedule & Execution Mode
    scheduleType: 'QUEUE_AND_BATCH' as 'IMMEDIATE' | 'SCHEDULED_WINDOW' | 'QUEUE_AND_BATCH',
    scheduledWindowTime: '',
    scheduledWindowStartTime: '',
    scheduledWindowEndTime: '',
    enforceWindowCutoff: true,
    executionMode: 'FULL_MIGRATION', // PILOT_VALIDATION, FULL_MIGRATION
    autoCutoverOnCompletion: false,

    // SharePoint Specific
    sharePointAdminUrl: `https://${(tenantStatus?.source?.domain || 'contoso').split('.')[0]}-admin.sharepoint.com`,
    sharePointTargetAdminUrl: `https://${(tenantStatus?.target?.domain || 'fabrikam').split('.')[0]}-admin.sharepoint.com`,
    migrateHubSites: true,
    migrateCommunicationSites: true,
    migrateTeamSites: true,
    sharePointLargeListThresholdSafeguard: true,
    sharePointPreserveCustomPermissions: true,
    sharePointReadonlyLockDuringCutover: true,
    sharePointUrlRemappingStrategy: 'PREFIX_TARGET',

    // Teams Specific
    migrateStandardChannels: true,
    migratePrivateChannels: true,
    migrateOneOnOneChats: true,
    migrateGroupChats: true,
    teamsMessageFidelity: 'FULL_HTML_AND_REACTIONS',
    teamsWikiConversion: 'CONVERT_TO_ONENOTE',
    teamsPlannerTasksMigration: true,
    teamsAppsAndTabsRecreation: true,
    teamsArchiveSourceTeamOnCutover: true,
    teamsDirectConnectSharedChannels: true,

    // Active Directory Specific
    adForestTopology: 'HYBRID_ENTRA_CLOUD_SYNC',
    adObjectFilter: 'ALL_SYNCED_OBJECTS',
    adPasswordSyncMode: 'PASSWORD_HASH_SYNC',
    adSourceAnchorAttribute: 'objectGUID',
    adConflictResolution: 'SOFT_MATCH_PRIMARY_SMTP',
    adDeltaSyncIntervalMinutes: 15,

    // OneDrive Specific
    restrictTargetSitePreCreation: true,
    versionHistoryOption: 'ALL_VERSIONS',
    enableSourceRedirectLinks: true,
  });

  const getDefaultBatches = (): MigrationBatchItem[] => {
    const now = new Date();
    const pad = (n: number) => (n < 10 ? '0' + n : String(n));
    const toIsoLocal = (d: Date) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

    // Batch 1: Tonight / +2h
    const start1 = new Date(now.getTime() + 2 * 3600 * 1000);
    start1.setMinutes(0, 0, 0);
    const end1 = new Date(start1.getTime() + 4 * 3600 * 1000);

    // Batch 2: Follows Batch 1
    const start2 = new Date(end1.getTime() + 30 * 60 * 1000);
    const end2 = new Date(start2.getTime() + 4 * 3600 * 1000);

    // Batch 3: Follows Batch 2
    const start3 = new Date(end2.getTime() + 30 * 60 * 1000);
    const end3 = new Date(start3.getTime() + 6 * 3600 * 1000);

    return [
      {
        id: 'batch-1',
        name: 'Batch 1: Executive & VIP Mailboxes',
        batchCode: 'BATCH-W1-EXEC',
        workloadType: 'EXCHANGE_MAILBOX',
        userCount: 5,
        startTime: toIsoLocal(start1),
        endTime: toIsoLocal(end1),
        dependsOnBatchId: null,
        dependencyCondition: 'SUCCESS',
        concurrencyLimit: 8,
        chunkSizeMB: 10,
        priority: 'VIP',
        actionOnDependencyFailure: 'STOP_QUEUE',
        notes: 'Priority migration with live dual-delivery and zero-downtime calendar federation.',
      },
      {
        id: 'batch-2',
        name: 'Batch 2: Engineering & Finance OneDrive Sites',
        batchCode: 'BATCH-W2-DRIVE',
        workloadType: 'ONEDRIVE',
        userCount: 8,
        startTime: toIsoLocal(start2),
        endTime: toIsoLocal(end2),
        dependsOnBatchId: 'batch-1',
        dependencyCondition: 'SUCCESS',
        concurrencyLimit: 6,
        chunkSizeMB: 25,
        priority: 'HIGH',
        actionOnDependencyFailure: 'STOP_QUEUE',
        notes: 'OneDrive direct upload sessions, starts automatically once Batch 1 mailboxes complete.',
      },
      {
        id: 'batch-3',
        name: 'Batch 3: Operations & Teams Shared Repositories',
        batchCode: 'BATCH-W3-TEAMS',
        workloadType: 'TEAMS',
        userCount: 12,
        startTime: toIsoLocal(start3),
        endTime: toIsoLocal(end3),
        dependsOnBatchId: 'batch-2',
        dependencyCondition: 'SUCCESS',
        concurrencyLimit: 4,
        chunkSizeMB: 10,
        priority: 'STANDARD',
        actionOnDependencyFailure: 'SKIP_DEPENDENTS',
        notes: 'Channel posts, Tabs, Planner buckets, and SharePoint document libraries.',
      },
    ];
  };

  const [queueConfig, setQueueConfig] = useState<MigrationQueueConfig>({
    enabled: true,
    queueName: 'Enterprise Wave 1-3 Production Migration Queue',
    enforceSequentialExecution: true,
    globalCutoffTime: '',
    pauseOnAnyFailure: true,
    batches: getDefaultBatches(),
  });
  const [selectedBatchId, setSelectedBatchId] = useState<string>('batch-1');
  const [activeQueuePreset, setActiveQueuePreset] = useState<string>('PHASED_3_WAVE');

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
      id: `batch-${Date.now()}`,
      name: `Batch ${newIndex}: General Workload Batch`,
      batchCode: `BATCH-W${newIndex}-${Math.floor(100 + Math.random() * 900)}`,
      workloadType: 'HYBRID_CUTOVER',
      userCount: 6,
      startTime: toIsoLocal(start),
      endTime: toIsoLocal(end),
      dependsOnBatchId: lastBatch ? lastBatch.id : null,
      dependencyCondition: 'SUCCESS',
      concurrencyLimit: 4,
      chunkSizeMB: 10,
      priority: 'STANDARD',
      actionOnDependencyFailure: 'STOP_QUEUE',
      notes: 'New migration wave batch in sequence.',
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
      id: `batch-${Date.now()}`,
      name: `${target.name} (Copy)`,
      batchCode: `BATCH-W${newIndex}-${Math.floor(100 + Math.random() * 900)}`,
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

  const applyQueuePreset = (presetType: string) => {
    setActiveQueuePreset(presetType);
    const now = new Date();
    const pad = (n: number) => (n < 10 ? '0' + n : String(n));
    const toIsoLocal = (d: Date) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

    if (presetType === 'PHASED_3_WAVE') {
      setQueueConfig((prev) => ({
        ...prev,
        queueName: 'Enterprise 3-Phase Rollout Queue',
        batches: getDefaultBatches(),
      }));
      setSelectedBatchId('batch-1');
    } else if (presetType === 'WORKLOAD_SEQUENCED') {
      const t1 = new Date(now.getTime() + 1 * 3600 * 1000);
      t1.setMinutes(0, 0, 0);
      const e1 = new Date(t1.getTime() + 3 * 3600 * 1000);
      const t2 = new Date(e1.getTime() + 15 * 60 * 1000);
      const e2 = new Date(t2.getTime() + 4 * 3600 * 1000);
      const t3 = new Date(e2.getTime() + 15 * 60 * 1000);
      const e3 = new Date(t3.getTime() + 4 * 3600 * 1000);
      const t4 = new Date(e3.getTime() + 15 * 60 * 1000);
      const e4 = new Date(t4.getTime() + 4 * 3600 * 1000);

      setQueueConfig((prev) => ({
        ...prev,
        queueName: 'Workload-Sequenced Enterprise Pipeline',
        batches: [
          {
            id: 'batch-seq-1',
            name: 'Wave 1: Primary Exchange Mailboxes & Free/Busy',
            batchCode: 'BATCH-EXCHANGE-W1',
            workloadType: 'EXCHANGE_MAILBOX',
            userCount: 6,
            startTime: toIsoLocal(t1),
            endTime: toIsoLocal(e1),
            dependsOnBatchId: null,
            dependencyCondition: 'SUCCESS',
            concurrencyLimit: 8,
            chunkSizeMB: 10,
            priority: 'VIP',
            actionOnDependencyFailure: 'STOP_QUEUE',
            notes: 'Primary mailboxes migrated first to verify MX delivery.',
          },
          {
            id: 'batch-seq-2',
            name: 'Wave 2: OneDrive for Business Document Drives',
            batchCode: 'BATCH-DRIVE-W2',
            workloadType: 'ONEDRIVE',
            userCount: 6,
            startTime: toIsoLocal(t2),
            endTime: toIsoLocal(e2),
            dependsOnBatchId: 'batch-seq-1',
            dependencyCondition: 'SUCCESS',
            concurrencyLimit: 6,
            chunkSizeMB: 25,
            priority: 'HIGH',
            actionOnDependencyFailure: 'STOP_QUEUE',
            notes: 'Personal storage migrated once identities and mail are functional.',
          },
          {
            id: 'batch-seq-3',
            name: 'Wave 3: Microsoft Teams Channels & Chat Records',
            batchCode: 'BATCH-TEAMS-W3',
            workloadType: 'TEAMS',
            userCount: 8,
            startTime: toIsoLocal(t3),
            endTime: toIsoLocal(e3),
            dependsOnBatchId: 'batch-seq-2',
            dependencyCondition: 'SUCCESS',
            concurrencyLimit: 4,
            chunkSizeMB: 10,
            priority: 'STANDARD',
            actionOnDependencyFailure: 'SKIP_DEPENDENTS',
            notes: 'Chat history, channel tabs, and planner boards.',
          },
          {
            id: 'batch-seq-4',
            name: 'Wave 4: SharePoint Intranet & Shared Site Collections',
            batchCode: 'BATCH-SPO-W4',
            workloadType: 'SHAREPOINT',
            userCount: 10,
            startTime: toIsoLocal(t4),
            endTime: toIsoLocal(e4),
            dependsOnBatchId: 'batch-seq-3',
            dependencyCondition: 'SUCCESS',
            concurrencyLimit: 4,
            chunkSizeMB: 50,
            priority: 'OFF_PEAK',
            actionOnDependencyFailure: 'CONTINUE',
            notes: 'Large document libraries and team sites.',
          },
        ],
      }));
      setSelectedBatchId('batch-seq-1');
    } else if (presetType === 'CANARY_PILOT') {
      const t1 = new Date(now.getTime() + 30 * 60 * 1000);
      const e1 = new Date(t1.getTime() + 2 * 3600 * 1000);
      const t2 = new Date(e1.getTime() + 30 * 60 * 1000);
      const e2 = new Date(t2.getTime() + 5 * 3600 * 1000);

      setQueueConfig((prev) => ({
        ...prev,
        queueName: 'Canary Pilot ➔ Production Wave Queue',
        batches: [
          {
            id: 'batch-canary-1',
            name: 'Pilot Canary: IT & Migration Team Validation',
            batchCode: 'BATCH-CANARY-01',
            workloadType: 'HYBRID_CUTOVER',
            userCount: 2,
            startTime: toIsoLocal(t1),
            endTime: toIsoLocal(e1),
            dependsOnBatchId: null,
            dependencyCondition: 'SUCCESS',
            concurrencyLimit: 2,
            chunkSizeMB: 10,
            priority: 'VIP',
            actionOnDependencyFailure: 'STOP_QUEUE',
            notes: 'Ultra-small canary batch to prove Graph API tokens, throttling, and licenses.',
          },
          {
            id: 'batch-canary-2',
            name: 'Full Production Wave: General Business Units',
            batchCode: 'BATCH-PROD-02',
            workloadType: 'HYBRID_CUTOVER',
            userCount: 15,
            startTime: toIsoLocal(t2),
            endTime: toIsoLocal(e2),
            dependsOnBatchId: 'batch-canary-1',
            dependencyCondition: 'SUCCESS',
            concurrencyLimit: 8,
            chunkSizeMB: 10,
            priority: 'HIGH',
            actionOnDependencyFailure: 'STOP_QUEUE',
            notes: 'High-concurrency direct stream deployed automatically upon canary verification.',
          },
        ],
      }));
      setSelectedBatchId('batch-canary-1');
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

  const getWindowSequenceWarnings = (batches: MigrationBatchItem[]): string[] => {
    const warnings: string[] = [];
    for (const b of batches) {
      if (!b.dependsOnBatchId) continue;
      const pred = batches.find((x) => x.id === b.dependsOnBatchId);
      if (pred && pred.endTime && b.startTime) {
        if (new Date(b.startTime).getTime() < new Date(pred.endTime).getTime()) {
          warnings.push(
            `"${b.name}" start time is scheduled before predecessor "${pred.name}" end window cutoff.`
          );
        }
      }
    }
    return warnings;
  };

  if (!isOpen) return null;

  // Standardized 5-Step Unified Architecture for all workloads (eliminates fragmented 10 or 7 steps)
  const steps = [
    { number: 1, title: 'Workload Selection & Scope', short: 'Scope' },
    { number: 2, title: 'Identity & Resource Mapping', short: 'Mapping' },
    { number: 3, title: 'Workload Settings & Pipeline', short: 'Pipeline' },
    { number: 4, title: 'Multi-Batch Waves & Scheduling', short: 'Batches' },
    { number: 5, title: 'Review & Cutover Execution', short: 'Launch' },
  ];

  const isLastStep = currentStep === steps.length;
  const isQueueStep = currentStep === 4;

  const handleNext = () => {
    if (currentStep < steps.length) setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
  };

  const samplePrefixes = [
    'alex.wilber',
    'adele.vance',
    'megan.bowen',
    'diego.siciliani',
    'isaiah.langer',
    'joni.sherman',
    'lynne.robbins',
    'nestor.wilke',
    'patti.fernandez',
    'pradeep.gupta',
    'enrico.cataneo',
    'miriam.graham',
    'gradon.graham',
    'allan.deyoung',
    'debra.berger',
  ];

  const getComputedUserMappings = () => {
    return samplePrefixes.slice(0, formData.selectedUserCount || 6).map((prefix) => ({
      sourceUPN: `${prefix}@${formData.sourceTenant}`,
      targetUPN: `${prefix}@${formData.targetTenant}`,
      migrateMailbox: formData.workloadType === 'EXCHANGE_MAILBOX' || formData.workloadType === 'HYBRID_CUTOVER',
      migrateOneDrive: formData.workloadType === 'ONEDRIVE' || formData.workloadType === 'HYBRID_CUTOVER',
    }));
  };

  const runPreFlightValidationHandler = async (): Promise<PreFlightValidationReport | null> => {
    setIsValidating(true);
    setValidationError(null);
    setRunningStepIndex(0);

    const stepTimer = setInterval(() => {
      setRunningStepIndex((prev) => (prev < 7 ? prev + 1 : prev));
    }, 250);

    try {
      const userMappings = getComputedUserMappings();

      const payload = {
        workloadType: formData.workloadType,
        sourceTenant: formData.sourceTenant,
        targetTenant: formData.targetTenant,
        targetLicensingSku: formData.targetLicensingSku,
        selectedUserCount: formData.selectedUserCount,
        chunkSizeMB: formData.chunkSizeMB,
        concurrencyLimit: formData.concurrencyLimit,
        totalDataGB: Number((userMappings.length * 14.5).toFixed(1)),
        userMappings,
      };

      const res = await fetch('/api/migration/preflight-validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Pre-flight validation failed');
      }

      const report: PreFlightValidationReport = await res.json();
      // Allow user to see all automated verification steps completed
      await new Promise((r) => setTimeout(r, 450));
      clearInterval(stepTimer);
      setValidationReport(report);
      return report;
    } catch (err: any) {
      clearInterval(stepTimer);
      console.error('Failed to run pre-flight validation:', err);
      setValidationError(err.message || 'Pre-flight validation failed');
      return null;
    } finally {
      clearInterval(stepTimer);
      setIsValidating(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Automatically run Pre-Flight Validation if not performed yet
      let activeReport = validationReport;
      if (!activeReport) {
        activeReport = await runPreFlightValidationHandler();
      }

      if (activeReport && !activeReport.canProceed) {
        throw new Error(
          'Pre-flight validation failed critical safeguards (license availability or storage limits exceeded). Resolve validation warnings before initiating migration.'
        );
      }

      // If Queue & Multi-Batch mode is selected, post to batch-queue endpoint
      if (formData.scheduleType === 'QUEUE_AND_BATCH') {
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
          },
        };

        const res = await fetch('/api/jobs/batch-queue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(queuePayload),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to trigger batch queue');
        }

        const data = await res.json();
        if (onJobStarted) {
          onJobStarted(data.rootJob || data.jobs?.[0]);
        }
        onClose();
        return;
      }

      // Build sample user mappings matching the chosen workload
      const userMappings = getComputedUserMappings();

      const payload = {
        sourceTenantDomain: formData.sourceTenant,
        targetTenantDomain: formData.targetTenant,
        name: formData.name,
        workloadType: formData.workloadType,
        batchCode: formData.batchCode,
        wave: formData.wave,
        streamingMode: formData.streamingMode,
        chunkSizeMB: formData.chunkSizeMB,
        concurrencyLimit: formData.concurrencyLimit,
        totalDataGB: Number((userMappings.length * 14.5).toFixed(1)),
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
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to trigger migration job');
      }

      const data = await res.json();
      if (onJobStarted) {
        onJobStarted(data.job);
      }
      onClose();
    } catch (err: any) {
      console.error('Failed to trigger workload migration job:', err);
      setSubmitError(err.message || 'An unexpected error occurred while launching migration');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-lg bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Direct Streaming Workload Migration Wizard
                </h2>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Zero Disk Staging
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  Checkpoints & Resumable Retries
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                End-to-end memory pipeline with chunked streaming, pre-flight safeguards, and multi-workload batch concurrency.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              id="btn-header-preflight-validation"
              onClick={runPreFlightValidationHandler}
              disabled={isValidating}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                validationReport?.overallStatus === 'PASSED'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                  : validationReport?.overallStatus === 'WARNING'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm'
              }`}
              title="Automatically run comprehensive pre-flight checks (licenses, storage quotas, source object existence)"
            >
              {isValidating ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Running Pre-Flight ({runningStepIndex + 1}/8)...</span>
                </>
              ) : validationReport ? (
                <>
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Pre-Flight: {validationReport.readinessScore}% Validated</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Pre-flight Validation</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Wizard Step Progress Bar */}
        <div className="px-6 py-2.5 bg-slate-100/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
          <div className="flex items-center justify-between min-w-[700px]">
            {steps.map((step) => {
              const isDone = currentStep > step.number;
              const isCurrent = currentStep === step.number;
              return (
                <button
                  key={step.number}
                  onClick={() => setCurrentStep(step.number)}
                  className={`flex items-center space-x-1.5 py-1 px-2 rounded text-xs transition-colors ${
                    isCurrent
                      ? 'bg-blue-600 text-white font-medium shadow-sm'
                      : isDone
                      ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                >
                  <span
                    className={`h-4 w-4 rounded-full flex items-center justify-center text-[10px] ${
                      isCurrent
                        ? 'bg-white text-blue-600 font-bold'
                        : isDone
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                    }`}
                  >
                    {isDone ? <Check className="h-3 w-3" /> : step.number}
                  </span>
                  <span>{step.short}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {submitError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-600 dark:text-rose-400 text-xs flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* STEP 1: WORKLOAD SELECTION & SCOPE */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Step 1: Select Workload & Define Migration Scope
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Choose the specific workload to migrate or configure a unified multi-workload cutover wave.
                </p>
              </div>

              {/* Workload Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  {
                    id: 'EXCHANGE_MAILBOX',
                    name: 'Exchange Online Mailboxes',
                    desc: 'Primary, shared, room/equipment mailboxes, archive, dumpster, rules, delegates & mail flow.',
                    icon: Mail,
                    color: 'text-sky-500 bg-sky-500/10 border-sky-500/20',
                  },
                  {
                    id: 'ONEDRIVE',
                    name: 'OneDrive for Business',
                    desc: 'Personal sites, direct chunked streaming, target container protection safeguards, version history.',
                    icon: HardDrive,
                    color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
                  },
                  {
                    id: 'SHAREPOINT',
                    name: 'SharePoint Online Sites',
                    desc: 'Hub & communication sites, document libraries, custom lists (>5K threshold), metadata, permissions.',
                    icon: Globe,
                    color: 'text-teal-500 bg-teal-500/10 border-teal-500/20',
                  },
                  {
                    id: 'TEAMS',
                    name: 'Microsoft Teams',
                    desc: 'Standard/private channels, 1:1 chat history, channel files, tabs, planner boards & Graph Migration mode.',
                    icon: MessageSquare,
                    color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
                  },
                  {
                    id: 'ACTIVE_DIRECTORY',
                    name: 'Active Directory / Entra ID',
                    desc: 'User identity sync, password hash sync, security & distribution groups, OU filtering, source anchors.',
                    icon: Users,
                    color: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
                  },
                  {
                    id: 'HYBRID_CUTOVER',
                    name: 'Unified Multi-Workload Wave',
                    desc: 'All-in-one wave cutover orchestrating Entra ID + Mail + OneDrive + SharePoint + Teams.',
                    icon: Layers,
                    color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
                  },
                ].map((item) => {
                  const isSelected = formData.workloadType === item.id;
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        const nextWl = item.id as MigrationWorkloadType;
                        setFormData({ ...formData, workloadType: nextWl });
                      }}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 shadow-md ring-1 ring-blue-500'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className={`p-2 rounded-lg border ${item.color}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          {isSelected ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-600 text-white flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              <span>Selected</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                              Workload
                            </span>
                          )}
                        </div>
                        <h4 className="font-semibold text-sm text-slate-900 dark:text-white">
                          {item.name}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Job Identification */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Job / Project Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Batch Code
                  </label>
                  <input
                    type="text"
                    value={formData.batchCode}
                    onChange={(e) => setFormData({ ...formData, batchCode: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Cutover Wave
                  </label>
                  <select
                    value={formData.wave}
                    onChange={(e) => setFormData({ ...formData, wave: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Wave 1 (Pilot & Executive)">Wave 1 (Pilot & Executive)</option>
                    <option value="Wave 2 (Finance & Operations)">Wave 2 (Finance & Operations)</option>
                    <option value="Wave 3 (Engineering & Tech)">Wave 3 (Engineering & Tech)</option>
                    <option value="Wave 4 (Organization Wide Cutover)">Wave 4 (Organization Wide Cutover)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: TENANT PRE-FLIGHT & IDENTITY / RESOURCE MAPPING */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Step 2: Tenant Pre-Flight Health & Identity / Resource Mapping
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Verify source and target tenant Graph API endpoints, capacity quotas, and configure identity mapping rules.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                  <div className="flex items-center space-x-2 text-sm font-semibold text-slate-900 dark:text-white">
                    <Server className="h-4 w-4 text-blue-500" />
                    <span>Source Tenant</span>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400">Domain</label>
                    <input
                      type="text"
                      value={formData.sourceTenant}
                      onChange={(e) => setFormData({ ...formData, sourceTenant: e.target.value })}
                      className="w-full mt-1 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-sm text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-500">Graph Application Scope:</span>
                    <span className="text-emerald-500 font-semibold flex items-center">
                      <Check className="h-3 w-3 mr-1" /> Validated
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                  <div className="flex items-center space-x-2 text-sm font-semibold text-slate-900 dark:text-white">
                    <Server className="h-4 w-4 text-emerald-500" />
                    <span>Target Tenant</span>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400">Domain</label>
                    <input
                      type="text"
                      value={formData.targetTenant}
                      onChange={(e) => setFormData({ ...formData, targetTenant: e.target.value })}
                      className="w-full mt-1 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-sm text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-500">Mailbox & OneDrive Quota:</span>
                    <span className="text-emerald-500 font-semibold flex items-center">
                      <Check className="h-3 w-3 mr-1" /> 500 GB Available
                    </span>
                  </div>
                </div>
              </div>

              {/* Safeguard Checkboxes */}
              <div className="space-y-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.validateGraphPermissions}
                    onChange={(e) => setFormData({ ...formData, validateGraphPermissions: e.target.checked })}
                    className="h-4 w-4 text-blue-600 rounded border-slate-300"
                  />
                  <div>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      Enforce Pre-Flight Graph API & EWS Impersonation Permission Check
                    </span>
                    <p className="text-xs text-slate-500">
                      Verifies Mail.ReadWrite, Files.ReadWrite.All, Directory.ReadWrite.All, and Sites.FullControl.All before starting.
                    </p>
                  </div>
                </label>

                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.throttleBypassRequested}
                    onChange={(e) => setFormData({ ...formData, throttleBypassRequested: e.target.checked })}
                    className="h-4 w-4 text-blue-600 rounded border-slate-300"
                  />
                  <div>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      Enable Microsoft EWS Throttling Relaxation Header Policy
                    </span>
                    <p className="text-xs text-slate-500">
                      Applies optimal burst thresholds (EwsMaxBurst, EwsRechargeRate) to prevent 429 delays during data streaming.
                    </p>
                  </div>
                </label>

                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.targetQuotaPreCheck}
                    onChange={(e) => setFormData({ ...formData, targetQuotaPreCheck: e.target.checked })}
                    className="h-4 w-4 text-blue-600 rounded border-slate-300"
                  />
                  <div>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      Pre-Validate Target Mailbox & OneDrive Storage Quotas
                    </span>
                    <p className="text-xs text-slate-500">
                      Ensures target account provisioned storage exceeds source mailbox and OneDrive footprint before transferring data.
                    </p>
                  </div>
                </label>
              </div>

              {/* AUTOMATED PRE-FLIGHT VALIDATION ENGINE */}
              <div className="p-5 rounded-xl border border-blue-500/20 bg-blue-50/40 dark:bg-blue-950/20 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blue-200 dark:border-blue-900/60 pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-md">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                        <span>Automated Pre-Flight Validation Engine</span>
                        {validationReport && (
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              validationReport.overallStatus === 'PASSED'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                            }`}
                          >
                            {validationReport.readinessScore}% Ready
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Automatically verifies license availability, storage limits, source object existence, Graph API scopes, and memory buffers.
                      </p>
                    </div>
                  </div>

                  <button
                    id="btn-run-preflight-step2"
                    onClick={runPreFlightValidationHandler}
                    disabled={isValidating}
                    className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shadow-md hover:shadow-lg flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {isValidating ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Validating Safeguards...</span>
                      </>
                    ) : validationReport ? (
                      <>
                        <RefreshCw className="h-4 w-4" />
                        <span>Re-run Pre-flight Validation</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="h-4 w-4" />
                        <span>Run Pre-flight Validation</span>
                      </>
                    )}
                  </button>
                </div>

                {validationError && (
                  <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{validationError}</span>
                  </div>
                )}

                {/* Live Progress Bar when validating */}
                {isValidating && (
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-blue-500/30 space-y-3 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-blue-600 dark:text-blue-400 flex items-center space-x-2">
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        <span>
                          {[
                            '1. License Availability & SKU Pool (M365 E5)...',
                            '2. Target Storage Quotas (100 GB Mailbox & 18.2 TB Pool)...',
                            '3. Source Object Existence & Directory Provisioning State...',
                            '4. Target Namespace & Collision-Free Namespace Check...',
                            '5. Microsoft Graph & EWS Impersonation Permissions...',
                            '6. EWS MaxBurst & Throttling Relaxation Headers...',
                            '7. Direct In-Memory TLS 1.3 Streaming Pipeline & Buffer...',
                            '8. Coexistence & Free/Busy Address Space Federation...',
                          ][runningStepIndex] || 'Finalizing Pre-Flight Validation...'}
                        </span>
                      </span>
                      <span className="text-slate-400 font-mono">
                        Step {runningStepIndex + 1} of 8
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, ((runningStepIndex + 1) / 8) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Validation Results Report */}
                {validationReport && !isValidating && (
                  <div className="space-y-4 pt-1">
                    {/* Key Highlights Grid (License availability, storage limits, source object existence) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* 1. License Availability */}
                      <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center space-x-1.5">
                            <Key className="h-3.5 w-3.5 text-blue-500" />
                            <span>License Availability</span>
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            PASSED
                          </span>
                        </div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white">
                          52 Available / 15 Needed
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {formData.targetLicensingSku}: 37 unassigned licenses headroom remaining.
                        </p>
                      </div>

                      {/* 2. Storage Limits */}
                      <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center space-x-1.5">
                            <HardDrive className="h-3.5 w-3.5 text-emerald-500" />
                            <span>Storage Limits</span>
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            PASSED
                          </span>
                        </div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white">
                          18.2 TB Free Headroom
                        </div>
                        <p className="text-[11px] text-slate-500">
                          100 GB primary mailbox quota + 1.5 TB auto-expanding archive ready.
                        </p>
                      </div>

                      {/* 3. Source Object Existence */}
                      <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center space-x-1.5">
                            <Users className="h-3.5 w-3.5 text-purple-500" />
                            <span>Source Objects</span>
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            15/15 ACTIVE
                          </span>
                        </div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white">
                          Verified & Enabled
                        </div>
                        <p className="text-[11px] text-slate-500">
                          All source accounts resolved with healthy mailboxes and personal OneDrive sites.
                        </p>
                      </div>
                    </div>

                    {/* Category Filter Pills */}
                    <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
                      {[
                        { id: 'ALL', label: `All Checks (${validationReport.checks.length})` },
                        { id: 'LICENSING', label: 'License Availability' },
                        { id: 'STORAGE', label: 'Storage Limits' },
                        { id: 'IDENTITY', label: 'Source & Namespace' },
                        { id: 'PERMISSIONS', label: 'Graph & Permissions' },
                        { id: 'NETWORK', label: 'Direct Streaming' },
                      ].map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => setActiveCategoryFilter(cat.id)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                            activeCategoryFilter === cat.id
                              ? 'bg-blue-600 text-white font-semibold shadow-sm'
                              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>

                    {/* Detailed Checks Accordion List */}
                    <div className="space-y-2">
                      {validationReport.checks
                        .filter(
                          (c) =>
                            activeCategoryFilter === 'ALL' ||
                            c.category === activeCategoryFilter ||
                            (activeCategoryFilter === 'IDENTITY' && c.category === 'IDENTITY')
                        )
                        .map((check) => {
                          const isExpanded = expandedCheckId === check.id;
                          return (
                            <div
                              key={check.id}
                              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden text-xs transition-all"
                            >
                              <div
                                onClick={() => setExpandedCheckId(isExpanded ? null : check.id)}
                                className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                              >
                                <div className="flex items-center space-x-3">
                                  {check.status === 'PASSED' ? (
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                                  ) : check.status === 'WARNING' ? (
                                    <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-rose-500 flex-shrink-0" />
                                  )}
                                  <div>
                                    <div className="flex items-center space-x-2">
                                      <span className="font-semibold text-slate-900 dark:text-white">
                                        {check.title}
                                      </span>
                                      <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-500">
                                        {check.category}
                                      </span>
                                      {check.durationMs && (
                                        <span className="text-[10px] text-slate-400">
                                          {check.durationMs}ms
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                      {check.details}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center space-x-2">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      check.status === 'PASSED'
                                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                        : check.status === 'WARNING'
                                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                    }`}
                                  >
                                    {check.status}
                                  </span>
                                  {isExpanded ? (
                                    <ChevronUp className="h-4 w-4 text-slate-400" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4 text-slate-400" />
                                  )}
                                </div>
                              </div>

                              {isExpanded && (
                                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 space-y-2 text-[11px]">
                                  <p className="text-slate-600 dark:text-slate-300">
                                    {check.description}
                                  </p>

                                  {check.metrics && (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 font-mono text-[10px]">
                                      {Object.entries(check.metrics).map(([k, v]) => (
                                        <div
                                          key={k}
                                          className="p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                                        >
                                          <div className="text-slate-400">{k}:</div>
                                          <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                                            {String(v)}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {check.recommendation && (
                                    <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-[11px]">
                                      <strong>Recommendation:</strong> {check.recommendation}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>

              {/* Workload-Specific Mapping Subpanels */}
              {formData.workloadType === 'ONEDRIVE' && (
                <OneDriveSteps
                  currentStep={2}
                  formData={formData}
                  setFormData={setFormData}
                  queueConfig={queueConfig}
                  setQueueConfig={setQueueConfig}
                  selectedBatchId={selectedBatchId}
                  setSelectedBatchId={setSelectedBatchId}
                  handleAddBatch={handleAddBatch}
                  handleRemoveBatch={handleRemoveBatch}
                  handleUpdateBatch={handleUpdateBatch}
                  handleDuplicateBatch={handleDuplicateBatch}
                />
              )}

              {formData.workloadType === 'SHAREPOINT' && (
                <SharePointSteps
                  currentStep={2}
                  formData={formData}
                  setFormData={setFormData}
                  queueConfig={queueConfig}
                  setQueueConfig={setQueueConfig}
                  selectedBatchId={selectedBatchId}
                  setSelectedBatchId={setSelectedBatchId}
                  handleAddBatch={handleAddBatch}
                  handleRemoveBatch={handleRemoveBatch}
                  handleUpdateBatch={handleUpdateBatch}
                  handleDuplicateBatch={handleDuplicateBatch}
                />
              )}

              {formData.workloadType === 'TEAMS' && (
                <TeamsSteps
                  currentStep={2}
                  formData={formData}
                  setFormData={setFormData}
                  queueConfig={queueConfig}
                  setQueueConfig={setQueueConfig}
                  selectedBatchId={selectedBatchId}
                  setSelectedBatchId={setSelectedBatchId}
                  handleAddBatch={handleAddBatch}
                  handleRemoveBatch={handleRemoveBatch}
                  handleUpdateBatch={handleUpdateBatch}
                  handleDuplicateBatch={handleDuplicateBatch}
                />
              )}

              {formData.workloadType === 'ACTIVE_DIRECTORY' && (
                <ActiveDirectorySteps
                  currentStep={2}
                  formData={formData}
                  setFormData={setFormData}
                  queueConfig={queueConfig}
                  setQueueConfig={setQueueConfig}
                  selectedBatchId={selectedBatchId}
                  setSelectedBatchId={setSelectedBatchId}
                  handleAddBatch={handleAddBatch}
                  handleRemoveBatch={handleRemoveBatch}
                  handleUpdateBatch={handleUpdateBatch}
                  handleDuplicateBatch={handleDuplicateBatch}
                />
              )}

              {(formData.workloadType === 'EXCHANGE_MAILBOX' || formData.workloadType === 'HYBRID_CUTOVER') && (
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Mapping Strategy
                      </label>
                      <select
                        value={formData.mappingStrategy}
                        onChange={(e) => setFormData({ ...formData, mappingStrategy: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                      >
                        <option value="UPN_TRANSFORM">Domain Suffix Transform (@source.com → @target.com)</option>
                        <option value="EXACT_MATCH">Exact Match (Same UPN)</option>
                        <option value="CSV_MAPPING">Custom CSV User Mapping Table</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Unmapped Account Handling
                      </label>
                      <select
                        value={formData.unmappedObjectHandling}
                        onChange={(e) => setFormData({ ...formData, unmappedObjectHandling: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                      >
                        <option value="AUTO_PROVISION">Auto-Provision Target Entra ID Account</option>
                        <option value="QUARANTINE">Quarantine to Exception Management Queue</option>
                        <option value="SKIP">Skip Unmatched Accounts</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                          Target License SKU Allocation
                        </h4>
                        <p className="text-xs text-slate-500">
                          Auto-assign target license plan before streaming data to avoid Graph API 403 Forbidden errors.
                        </p>
                      </div>
                      <select
                        value={formData.targetLicensingSku}
                        onChange={(e) => setFormData({ ...formData, targetLicensingSku: e.target.value })}
                        className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-sm text-slate-900 dark:text-white"
                      >
                        <option value="Microsoft 365 E5 Enterprise">Microsoft 365 E5 Enterprise</option>
                        <option value="Microsoft 365 E3 Enterprise">Microsoft 365 E3 Enterprise</option>
                        <option value="Microsoft 365 Business Premium">Microsoft 365 Business Premium</option>
                        <option value="Exchange Online Plan 2">Exchange Online Plan 2</option>
                      </select>
                    </div>

                    <label className="flex items-center space-x-2 pt-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.autoAssignLicense}
                        onChange={(e) => setFormData({ ...formData, autoAssignLicense: e.target.checked })}
                        className="h-4 w-4 text-blue-600 rounded"
                      />
                      <span className="text-xs text-slate-700 dark:text-slate-300">
                        Automatically verify license availability pool and assign SKU to target user
                      </span>
                    </label>
                  </div>

                  {/* Scoped Identity Mapping Table Preview */}
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                    <div className="px-4 py-2.5 bg-slate-100/70 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <span>Sample Scoped Identity Remappings</span>
                      <span className="text-slate-500 font-normal">Showing {getComputedUserMappings().length} accounts</span>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                      {getComputedUserMappings().map((m, idx) => (
                        <div key={idx} className="px-4 py-2.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30">
                          <div className="flex items-center space-x-2 font-mono">
                            <span className="text-slate-700 dark:text-slate-300">{m.sourceUPN}</span>
                            <ArrowRight className="h-3 w-3 text-slate-400" />
                            <span className="text-blue-600 dark:text-blue-400 font-semibold">{m.targetUPN}</span>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            Pre-Matched
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: WORKLOAD SETTINGS & DIRECT STREAMING PIPELINE */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                    Step 3: Workload Settings & Direct Streaming Pipeline
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    {formData.workloadType}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Configure direct memory streaming throughput, data scope safeguards, coexistence routing, and workload-specific pipeline rules.
                </p>
              </div>

              {/* Workload-Specific Pipeline Renderers */}
              {formData.workloadType === 'ONEDRIVE' && (
                <div className="space-y-4">
                  <OneDriveSteps
                    currentStep={3}
                    formData={formData}
                    setFormData={setFormData}
                    queueConfig={queueConfig}
                    setQueueConfig={setQueueConfig}
                    selectedBatchId={selectedBatchId}
                    setSelectedBatchId={setSelectedBatchId}
                    handleAddBatch={handleAddBatch}
                    handleRemoveBatch={handleRemoveBatch}
                    handleUpdateBatch={handleUpdateBatch}
                    handleDuplicateBatch={handleDuplicateBatch}
                  />
                  <OneDriveSteps
                    currentStep={4}
                    formData={formData}
                    setFormData={setFormData}
                    queueConfig={queueConfig}
                    setQueueConfig={setQueueConfig}
                    selectedBatchId={selectedBatchId}
                    setSelectedBatchId={setSelectedBatchId}
                    handleAddBatch={handleAddBatch}
                    handleRemoveBatch={handleRemoveBatch}
                    handleUpdateBatch={handleUpdateBatch}
                    handleDuplicateBatch={handleDuplicateBatch}
                  />
                </div>
              )}

              {formData.workloadType === 'SHAREPOINT' && (
                <div className="space-y-4">
                  <SharePointSteps
                    currentStep={3}
                    formData={formData}
                    setFormData={setFormData}
                    queueConfig={queueConfig}
                    setQueueConfig={setQueueConfig}
                    selectedBatchId={selectedBatchId}
                    setSelectedBatchId={setSelectedBatchId}
                    handleAddBatch={handleAddBatch}
                    handleRemoveBatch={handleRemoveBatch}
                    handleUpdateBatch={handleUpdateBatch}
                    handleDuplicateBatch={handleDuplicateBatch}
                  />
                </div>
              )}

              {formData.workloadType === 'TEAMS' && (
                <div className="space-y-4">
                  <TeamsSteps
                    currentStep={3}
                    formData={formData}
                    setFormData={setFormData}
                    queueConfig={queueConfig}
                    setQueueConfig={setQueueConfig}
                    selectedBatchId={selectedBatchId}
                    setSelectedBatchId={setSelectedBatchId}
                    handleAddBatch={handleAddBatch}
                    handleRemoveBatch={handleRemoveBatch}
                    handleUpdateBatch={handleUpdateBatch}
                    handleDuplicateBatch={handleDuplicateBatch}
                  />
                </div>
              )}

              {formData.workloadType === 'ACTIVE_DIRECTORY' && (
                <div className="space-y-4">
                  <ActiveDirectorySteps
                    currentStep={3}
                    formData={formData}
                    setFormData={setFormData}
                    queueConfig={queueConfig}
                    setQueueConfig={setQueueConfig}
                    selectedBatchId={selectedBatchId}
                    setSelectedBatchId={setSelectedBatchId}
                    handleAddBatch={handleAddBatch}
                    handleRemoveBatch={handleRemoveBatch}
                    handleUpdateBatch={handleUpdateBatch}
                    handleDuplicateBatch={handleDuplicateBatch}
                  />
                </div>
              )}

              {/* Exchange / Hybrid Unified Pipeline with Subtabs */}
              {(formData.workloadType === 'EXCHANGE_MAILBOX' || formData.workloadType === 'HYBRID_CUTOVER') && (
                <div className="space-y-4">
                  {/* Step 3 Subtabs */}
                  <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg text-xs font-semibold">
                    {[
                      { id: 'streaming', label: 'Streaming Pipeline', icon: Zap },
                      { id: 'scope', label: 'Data Scope & Safeguards', icon: Mail },
                      { id: 'permissions', label: 'Permissions & Remediation', icon: Lock },
                      { id: 'coexistence', label: 'Mail Flow & Coexistence', icon: Sliders },
                      { id: 'audit', label: 'Security & Audit Logging', icon: ShieldCheck },
                    ].map((tab) => {
                      const Icon = tab.icon;
                      const isActive = step3Tab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setStep3Tab(tab.id as any)}
                          className={`px-3 py-1.5 rounded-md flex items-center space-x-1.5 transition-colors cursor-pointer ${
                            isActive
                              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Tab 1: Streaming Pipeline */}
                  {step3Tab === 'streaming' && (
                    <div className="space-y-4 animate-in fade-in duration-150">
                      <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-600 dark:text-blue-300 space-y-1">
                        <div className="flex items-center space-x-2 font-bold text-sm">
                          <Zap className="h-4 w-4" />
                          <span>Direct Memory Pipe Architecture (Zero Disk Staging)</span>
                        </div>
                        <p>
                          Data is streamed byte-for-byte in TLS 1.3 encrypted memory buffers without staging to local disks. Checkpoints are recorded after each chunk so failures resume instantly from the exact offset.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Chunk Size Configuration
                          </label>
                          <select
                            value={formData.chunkSizeMB}
                            onChange={(e) => setFormData({ ...formData, chunkSizeMB: Number(e.target.value) })}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                          >
                            <option value={4}>4 MB (High Network Jitter / Mobile)</option>
                            <option value={10}>10 MB (Recommended Optimal Graph Throughput)</option>
                            <option value={25}>25 MB (High Bandwidth Dedicated Pipe)</option>
                            <option value={50}>50 MB (Maximum Chunk Size)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Batch Concurrency Limit
                          </label>
                          <select
                            value={formData.concurrencyLimit}
                            onChange={(e) => setFormData({ ...formData, concurrencyLimit: Number(e.target.value) })}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                          >
                            <option value={2}>2 Parallel Workers (Gentle / Conservative)</option>
                            <option value={4}>4 Parallel Workers (Standard Enterprise)</option>
                            <option value={8}>8 Parallel Workers (High Concurrency)</option>
                            <option value={16}>16 Parallel Workers (Aggressive Cutover)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Max Resumable Retries
                          </label>
                          <select
                            value={formData.maxResumableRetries}
                            onChange={(e) => setFormData({ ...formData, maxResumableRetries: Number(e.target.value) })}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                          >
                            <option value={3}>3 Retries with Backoff</option>
                            <option value={5}>5 Retries (Recommended)</option>
                            <option value={10}>10 Retries (Unattended Overnight Run)</option>
                          </select>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.sha256ChecksumVerification}
                            onChange={(e) => setFormData({ ...formData, sha256ChecksumVerification: e.target.checked })}
                            className="h-4 w-4 text-blue-600 rounded"
                          />
                          <div>
                            <span className="text-sm font-medium text-slate-900 dark:text-white">
                              End-to-End SHA-256 Bit-Level Stream Checksum Verification
                            </span>
                            <p className="text-xs text-slate-500">
                              Calculates stream hashes on source read and compares against target write response to ensure 100% data integrity.
                            </p>
                          </div>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Tab 2: Scope & Safeguards */}
                  {step3Tab === 'scope' && (
                    <div className="space-y-4 animate-in fade-in duration-150">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                          <h4 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center space-x-2">
                            <Mail className="h-4 w-4 text-sky-500" />
                            <span>Mailbox Content Scope</span>
                          </h4>
                          <div className="space-y-2 text-xs">
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={formData.migrateMailboxPrimary}
                                onChange={(e) => setFormData({ ...formData, migrateMailboxPrimary: e.target.checked })}
                                className="rounded text-blue-600"
                              />
                              <span>Primary Mailbox (Inbox, Sent Items, Subfolders)</span>
                            </label>
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={formData.migrateMailboxArchive}
                                onChange={(e) => setFormData({ ...formData, migrateMailboxArchive: e.target.checked })}
                                className="rounded text-blue-600"
                              />
                              <span>In-Place / Online Archive Mailbox</span>
                            </label>
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={formData.migrateRecoverableItems}
                                onChange={(e) => setFormData({ ...formData, migrateRecoverableItems: e.target.checked })}
                                className="rounded text-blue-600"
                              />
                              <span>Recoverable Items (Dumpster & Purges for Compliance)</span>
                            </label>
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={formData.migrateMailboxRules}
                                onChange={(e) => setFormData({ ...formData, migrateMailboxRules: e.target.checked })}
                                className="rounded text-blue-600"
                              />
                              <span>Inbox Rules & Client-side Filters</span>
                            </label>
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={formData.migrateSafeSenderList}
                                onChange={(e) => setFormData({ ...formData, migrateSafeSenderList: e.target.checked })}
                                className="rounded text-blue-600"
                              />
                              <span>Safe Senders, Blocked Senders & Address Book Lists</span>
                            </label>
                          </div>
                        </div>

                        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                          <h4 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center space-x-2">
                            <HardDrive className="h-4 w-4 text-blue-500" />
                            <span>Additional Workload Scope (Hybrid)</span>
                          </h4>
                          <div className="space-y-2 text-xs">
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={formData.migrateSharePointLists}
                                onChange={(e) => setFormData({ ...formData, migrateSharePointLists: e.target.checked })}
                                className="rounded text-blue-600"
                              />
                              <span>SharePoint Document Libraries & Custom Lists</span>
                            </label>
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={formData.migrateTeamsChannels}
                                onChange={(e) => setFormData({ ...formData, migrateTeamsChannels: e.target.checked })}
                                className="rounded text-blue-600"
                              />
                              <span>Standard, Private & Shared Teams Channels</span>
                            </label>
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={formData.migrateTeamsChatHistory}
                                onChange={(e) => setFormData({ ...formData, migrateTeamsChatHistory: e.target.checked })}
                                className="rounded text-blue-600"
                              />
                              <span>Teams Chat Message History & Direct Streams</span>
                            </label>
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={formData.migrateTeamsTabsAndPlanner}
                                onChange={(e) => setFormData({ ...formData, migrateTeamsTabsAndPlanner: e.target.checked })}
                                className="rounded text-blue-600"
                              />
                              <span>Teams Tabs, Planner Boards & OneNote Notebooks</span>
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Item Size & Date Filter */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Date Range Filter
                          </label>
                          <select
                            value={formData.dateRangeFilter}
                            onChange={(e) => setFormData({ ...formData, dateRangeFilter: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                          >
                            <option value="ALL">Migrate All Historical Data (Zero Omission)</option>
                            <option value="LAST_1_YEAR">Past 1 Year (Archive Older Items)</option>
                            <option value="LAST_2_YEARS">Past 2 Years</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Max Item Size Threshold (MB)
                          </label>
                          <input
                            type="number"
                            value={formData.maxItemSizeMB}
                            onChange={(e) => setFormData({ ...formData, maxItemSizeMB: Number(e.target.value) })}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                          />
                          <span className="text-[10px] text-slate-500">Items exceeding 4MB automatically use chunked stream sessions.</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tab 3: Permissions & Remediation */}
                  {step3Tab === 'permissions' && (
                    <div className="space-y-4 animate-in fade-in duration-150">
                      <div className="space-y-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.preserveMailboxDelegates}
                            onChange={(e) => setFormData({ ...formData, preserveMailboxDelegates: e.target.checked })}
                            className="h-4 w-4 text-blue-600 rounded"
                          />
                          <div>
                            <span className="text-sm font-medium text-slate-900 dark:text-white">
                              Preserve Mailbox Delegation & Shared Permissions
                            </span>
                            <p className="text-xs text-slate-500">
                              Remaps FullAccess, SendAs, and SendOnBehalf rights between source and target identities.
                            </p>
                          </div>
                        </label>

                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.preserveFolderACLs}
                            onChange={(e) => setFormData({ ...formData, preserveFolderACLs: e.target.checked })}
                            className="h-4 w-4 text-blue-600 rounded"
                          />
                          <div>
                            <span className="text-sm font-medium text-slate-900 dark:text-white">
                              Preserve Folder-Level Access Control Lists (ACLs)
                            </span>
                            <p className="text-xs text-slate-500">
                              Re-applies custom folder permissions on user mailboxes and OneDrive directory trees.
                            </p>
                          </div>
                        </label>

                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.relinkExternalSharing}
                            onChange={(e) => setFormData({ ...formData, relinkExternalSharing: e.target.checked })}
                            className="h-4 w-4 text-blue-600 rounded"
                          />
                          <div>
                            <span className="text-sm font-medium text-slate-900 dark:text-white">
                              Remap External Sharing Links & Guest Access
                            </span>
                            <p className="text-xs text-slate-500">
                              Re-generates sharing links and maps external guest permissions to target tenant guest directory.
                            </p>
                          </div>
                        </label>

                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.remediatePathLengthExceeded}
                            onChange={(e) => setFormData({ ...formData, remediatePathLengthExceeded: e.target.checked })}
                            className="h-4 w-4 text-blue-600 rounded"
                          />
                          <div>
                            <span className="text-sm font-medium text-slate-900 dark:text-white">
                              Automated Path Length Normalization (&gt;400 UTF-16 Chars)
                            </span>
                            <p className="text-xs text-slate-500">
                              Safeguards deeply nested folder hierarchies from failing SharePoint URL character restrictions.
                            </p>
                          </div>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Tab 4: Mail Flow & Coexistence */}
                  {step3Tab === 'coexistence' && (
                    <div className="space-y-4 animate-in fade-in duration-150">
                      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Mail Routing Coexistence Strategy
                          </label>
                          <select
                            value={formData.mailRoutingAction}
                            onChange={(e) => setFormData({ ...formData, mailRoutingAction: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                          >
                            <option value="DUAL_DELIVERY">Dual Delivery (Forward Target to Source during Migration)</option>
                            <option value="FORWARD_TARGET">Forward Source to Target (Post-Cutover Routing)</option>
                            <option value="CUTOVER">Immediate MX Switch Routing</option>
                          </select>
                        </div>

                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.calendarFreeBusySharing}
                            onChange={(e) => setFormData({ ...formData, calendarFreeBusySharing: e.target.checked })}
                            className="rounded text-blue-600"
                          />
                          <span className="text-xs text-slate-700 dark:text-slate-300">
                            Enable Organization Relationship for Cross-Tenant Free/Busy Calendar Visibility
                          </span>
                        </label>

                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.reduceDnsTtlReminder}
                            onChange={(e) => setFormData({ ...formData, reduceDnsTtlReminder: e.target.checked })}
                            className="rounded text-blue-600"
                          />
                          <span className="text-xs text-slate-700 dark:text-slate-300">
                            Verify DNS MX & Autodiscover TTL reduced to 300 seconds prior to cutover
                          </span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Tab 5: Audit & Alerts */}
                  {step3Tab === 'audit' && (
                    <div className="space-y-4 animate-in fade-in duration-150">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Notification Recipient Email(s)
                          </label>
                          <input
                            type="text"
                            value={formData.adminNotificationEmails}
                            onChange={(e) => setFormData({ ...formData, adminNotificationEmails: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Encryption Protocol
                          </label>
                          <input
                            type="text"
                            disabled
                            value="TLS 1.3 / AES-256-GCM Hardware Accelerated"
                            className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-500"
                          />
                        </div>
                      </div>

                      <div className="space-y-2 text-xs">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={formData.sendAdminFailureAlerts}
                            onChange={(e) => setFormData({ ...formData, sendAdminFailureAlerts: e.target.checked })}
                            className="rounded text-blue-600"
                          />
                          <span>Send immediate alert to operators upon batch retries or throttling</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={formData.itemLevelAuditLogging}
                            onChange={(e) => setFormData({ ...formData, itemLevelAuditLogging: e.target.checked })}
                            className="rounded text-blue-600"
                          />
                          <span>Record immutable item-level audit log entry in SQLite for compliance audit</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* QUEUE & BATCH ORCHESTRATION STEP */}
          {isQueueStep && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                    Step {currentStep}: Scheduling & Multi-Batch Queue Architecture
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    Queue & Batch Orchestration
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Define start times, end times (maintenance cutoffs), and dependency sequences across multiple migration batches or configure a single wave.
                </p>
              </div>

              {/* Mode Selector Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                <div
                  id="mode-immediate"
                  onClick={() => setFormData({ ...formData, scheduleType: 'IMMEDIATE' })}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    formData.scheduleType === 'IMMEDIATE'
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-1.5">
                    <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      <Zap className="h-4 w-4" />
                    </div>
                    <h4 className="font-semibold text-sm text-slate-900 dark:text-white">
                      Immediate Execution
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Deploys concurrent direct memory streaming workers immediately upon job confirmation.
                  </p>
                </div>

                <div
                  id="mode-scheduled-window"
                  onClick={() => setFormData({ ...formData, scheduleType: 'SCHEDULED_WINDOW' })}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    formData.scheduleType === 'SCHEDULED_WINDOW'
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-1.5">
                    <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                      <Clock className="h-4 w-4" />
                    </div>
                    <h4 className="font-semibold text-sm text-slate-900 dark:text-white">
                      Single Maintenance Window
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Set a designated off-peak start time and maintenance cutoff deadline for a single workload wave.
                  </p>
                </div>

                <div
                  id="mode-queue-batch"
                  onClick={() => setFormData({ ...formData, scheduleType: 'QUEUE_AND_BATCH' })}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all relative overflow-hidden ${
                    formData.scheduleType === 'QUEUE_AND_BATCH'
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <GitMerge className="h-4 w-4" />
                      </div>
                      <h4 className="font-semibold text-sm text-slate-900 dark:text-white">
                        Queue and Batch Pipeline
                      </h4>
                    </div>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                      Advanced DAG
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Define start times, end times, and dependency sequences across multiple migration batches.
                  </p>
                </div>
              </div>

              {/* OPTION 1: IMMEDIATE RUN SUB-OPTIONS */}
              {formData.scheduleType === 'IMMEDIATE' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
                  <div
                    onClick={() => setFormData({ ...formData, executionMode: 'PILOT_VALIDATION' })}
                    className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                      formData.executionMode === 'PILOT_VALIDATION'
                        ? 'border-blue-500 bg-white dark:bg-slate-900 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700/60 bg-transparent'
                    }`}
                  >
                    <h5 className="font-semibold text-xs text-slate-900 dark:text-white mb-1">
                      Pilot Validation Run (Canary Batch)
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Runs migration against a small sample group first to verify Graph endpoints and license allocation before triggering full scale.
                    </p>
                  </div>

                  <div
                    onClick={() => setFormData({ ...formData, executionMode: 'FULL_MIGRATION' })}
                    className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                      formData.executionMode === 'FULL_MIGRATION'
                        ? 'border-blue-500 bg-white dark:bg-slate-900 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700/60 bg-transparent'
                    }`}
                  >
                    <h5 className="font-semibold text-xs text-slate-900 dark:text-white mb-1">
                      Full Wave Production Migration
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Immediately deploys all concurrent worker threads to process the entire workload batch directly to completion.
                    </p>
                  </div>
                </div>
              )}

              {/* OPTION 2: SCHEDULED SINGLE MAINTENANCE WINDOW */}
              {formData.scheduleType === 'SCHEDULED_WINDOW' && (
                <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 space-y-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-purple-500" />
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                      Single Off-Peak Maintenance Window
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Scheduled Start Time
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.scheduledWindowStartTime}
                        onChange={(e) =>
                          setFormData({ ...formData, scheduledWindowStartTime: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
                      />
                      <div className="flex items-center space-x-1.5 mt-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const now = new Date(Date.now() + 60 * 60 * 1000);
                            const pad = (n: number) => (n < 10 ? '0' + n : String(n));
                            setFormData({
                              ...formData,
                              scheduledWindowStartTime: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`,
                            });
                          }}
                          className="px-2 py-0.5 rounded text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300"
                        >
                          +1 Hour
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const tonight = new Date();
                            tonight.setHours(22, 0, 0, 0);
                            const pad = (n: number) => (n < 10 ? '0' + n : String(n));
                            setFormData({
                              ...formData,
                              scheduledWindowStartTime: `${tonight.getFullYear()}-${pad(tonight.getMonth() + 1)}-${pad(tonight.getDate())}T22:00`,
                            });
                          }}
                          className="px-2 py-0.5 rounded text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300"
                        >
                          Tonight 22:00 UTC
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Scheduled End Time (Window Cutoff)
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.scheduledWindowEndTime}
                        onChange={(e) =>
                          setFormData({ ...formData, scheduledWindowEndTime: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
                      />
                      <div className="flex items-center space-x-1.5 mt-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const base = formData.scheduledWindowStartTime
                              ? new Date(formData.scheduledWindowStartTime)
                              : new Date();
                            const end = new Date(base.getTime() + 4 * 3600 * 1000);
                            const pad = (n: number) => (n < 10 ? '0' + n : String(n));
                            setFormData({
                              ...formData,
                              scheduledWindowEndTime: `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}T${pad(end.getHours())}:${pad(end.getMinutes())}`,
                            });
                          }}
                          className="px-2 py-0.5 rounded text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300"
                        >
                          +4 Hours
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const base = formData.scheduledWindowStartTime
                              ? new Date(formData.scheduledWindowStartTime)
                              : new Date();
                            const end = new Date(base.getTime() + 8 * 3600 * 1000);
                            const pad = (n: number) => (n < 10 ? '0' + n : String(n));
                            setFormData({
                              ...formData,
                              scheduledWindowEndTime: `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}T${pad(end.getHours())}:${pad(end.getMinutes())}`,
                            });
                          }}
                          className="px-2 py-0.5 rounded text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300"
                        >
                          +8 Hours
                        </button>
                      </div>
                    </div>
                  </div>

                  <label className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300 pt-1">
                    <input
                      type="checkbox"
                      checked={formData.enforceWindowCutoff}
                      onChange={(e) =>
                        setFormData({ ...formData, enforceWindowCutoff: e.target.checked })
                      }
                      className="rounded text-blue-600"
                    />
                    <span>
                      Enforce strict maintenance window: automatically pause workers when End Time is reached to protect business hours
                    </span>
                  </label>
                </div>
              )}

              {/* OPTION 3: QUEUE AND BATCH FUNCTIONALITY */}
              {formData.scheduleType === 'QUEUE_AND_BATCH' && (
                <div className="space-y-5">
                  {/* Queue Toolbar & Presets */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex-1">
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Migration Queue Name
                        </label>
                        <input
                          type="text"
                          value={queueConfig.queueName}
                          onChange={(e) =>
                            setQueueConfig({ ...queueConfig, queueName: e.target.value })
                          }
                          className="w-full max-w-md px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          id="btn-add-batch"
                          onClick={handleAddBatch}
                          className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-sm flex items-center space-x-1.5 transition-all"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Add Migration Batch</span>
                        </button>
                      </div>
                    </div>

                    {/* Presets Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-slate-600 dark:text-slate-400 text-[11px]">
                          Sequence Presets:
                        </span>
                        <div className="flex items-center space-x-1.5">
                          <button
                            type="button"
                            onClick={() => applyQueuePreset('PHASED_3_WAVE')}
                            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                              activeQueuePreset === 'PHASED_3_WAVE'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            Enterprise 3-Phase Rollout
                          </button>
                          <button
                            type="button"
                            onClick={() => applyQueuePreset('WORKLOAD_SEQUENCED')}
                            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                              activeQueuePreset === 'WORKLOAD_SEQUENCED'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            Workload-Sequenced (Mail ➔ OneDrive ➔ Teams)
                          </button>
                          <button
                            type="button"
                            onClick={() => applyQueuePreset('CANARY_PILOT')}
                            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                              activeQueuePreset === 'CANARY_PILOT'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            Canary Pilot ➔ Dual Wave
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 text-[11px] text-slate-500">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {queueConfig.batches.length} Batches
                        </span>
                        <span>•</span>
                        <span>
                          {queueConfig.batches.reduce((sum, b) => sum + (b.userCount || 0), 0)} Accounts
                        </span>
                        <span>•</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center space-x-1">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>DAG Valid</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* VISUAL DEPENDENCY GRAPH & TIMELINE SEQUENCE (Interactive Diagram) */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Network className="h-4 w-4 text-blue-500" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                          Batch Dependency Sequence Flowchart
                        </h4>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        Orchestrator enforces predecessor completion before unlocking next batch
                      </span>
                    </div>

                    {/* Cycle warnings if any */}
                    {getDependencyCycles(queueConfig.batches).length > 0 && (
                      <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-800 flex items-center space-x-2 text-xs text-rose-700 dark:text-rose-300">
                        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                        <span>{getDependencyCycles(queueConfig.batches)[0]}</span>
                      </div>
                    )}

                    {/* Start before End warnings */}
                    {getWindowSequenceWarnings(queueConfig.batches).length > 0 && (
                      <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 flex items-center space-x-2 text-xs text-amber-700 dark:text-amber-300">
                        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                        <span>{getWindowSequenceWarnings(queueConfig.batches)[0]}</span>
                      </div>
                    )}

                    {/* Flow Diagram Nodes */}
                    <div className="overflow-x-auto pb-2">
                      <div className="flex items-center space-x-3 min-w-max py-2">
                        {queueConfig.batches.map((batch, idx) => {
                          const isRoot = !batch.dependsOnBatchId;
                          const predecessor = queueConfig.batches.find(
                            (b) => b.id === batch.dependsOnBatchId
                          );
                          const isSelected = selectedBatchId === batch.id;
                          const durationStr = (() => {
                            if (!batch.startTime || !batch.endTime) return null;
                            const s = new Date(batch.startTime).getTime();
                            const e = new Date(batch.endTime).getTime();
                            if (isNaN(s) || isNaN(e) || e <= s) return null;
                            const diffH = (e - s) / 3600000;
                            return diffH < 1
                              ? `${Math.round((e - s) / 60000)}m window`
                              : `${diffH.toFixed(1)}h window`;
                          })();

                          return (
                            <React.Fragment key={batch.id}>
                              {/* Connector Arrow before node (if dependent) */}
                              {idx > 0 && (
                                <div className="flex flex-col items-center px-1 text-slate-400">
                                  <div className="flex items-center space-x-1 font-mono text-[9px] font-semibold text-slate-500 uppercase tracking-tighter">
                                    <span>
                                      {batch.dependencyCondition === 'SUCCESS'
                                        ? 'On Success'
                                        : batch.dependencyCondition === 'START_PARALLEL'
                                        ? 'Parallel'
                                        : 'On Complete'}
                                    </span>
                                  </div>
                                  <ArrowRight className="h-4 w-4 text-blue-500" />
                                </div>
                              )}

                              {/* Batch Node Card */}
                              <div
                                onClick={() => setSelectedBatchId(batch.id)}
                                className={`w-64 p-3 rounded-xl border-2 transition-all cursor-pointer relative ${
                                  isSelected
                                    ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 shadow-md ring-2 ring-blue-500/20'
                                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:border-slate-300'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                                    #{idx + 1}
                                  </span>
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                      batch.priority === 'VIP'
                                        ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                                        : batch.priority === 'HIGH'
                                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                        : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                                    }`}
                                  >
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
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-400">Start Time:</span>
                                    <span className="font-medium text-slate-800 dark:text-slate-200">
                                      {batch.startTime ? batch.startTime.replace('T', ' ') : 'Immediate'}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-400">End Cutoff:</span>
                                    <span className="font-medium text-slate-800 dark:text-slate-200">
                                      {batch.endTime ? batch.endTime.replace('T', ' ') : 'Open window'}
                                    </span>
                                  </div>
                                  {durationStr && (
                                    <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 font-semibold">
                                      <span>Window Limit:</span>
                                      <span>{durationStr}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center justify-between pt-0.5">
                                    <span className="text-slate-400">Dependency:</span>
                                    <span
                                      className={`font-semibold ${
                                        isRoot
                                          ? 'text-emerald-600 dark:text-emerald-400'
                                          : 'text-amber-600 dark:text-amber-400'
                                      }`}
                                    >
                                      {isRoot
                                        ? 'Root (Initial)'
                                        : `Depends on ${predecessor ? predecessor.batchCode : 'Batch'}`}
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

                  {/* BATCH QUEUE CARDS LIST & DETAILED EDITOR */}
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                        <ListOrdered className="h-4 w-4 text-blue-500" />
                        <span>Configured Batch Pipeline Details ({queueConfig.batches.length} Batches)</span>
                      </h4>
                      <span className="text-[11px] text-slate-500">
                        Select a batch to adjust its Start Time, End Time, or Dependency Predecessor
                      </span>
                    </div>

                    {queueConfig.batches.map((batch, index) => {
                      const isSelected = selectedBatchId === batch.id;
                      const isFirst = index === 0;
                      const isLast = index === queueConfig.batches.length - 1;

                      return (
                        <div
                          key={batch.id}
                          className={`rounded-xl border transition-all ${
                            isSelected
                              ? 'border-blue-500 bg-white dark:bg-slate-900 shadow-md ring-1 ring-blue-500/20'
                              : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30'
                          }`}
                        >
                          {/* Card Header Row */}
                          <div className="p-3.5 border-b border-slate-200/70 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center space-x-2.5 flex-1">
                              <span className="h-6 w-6 rounded-md bg-blue-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                                {index + 1}
                              </span>

                              <input
                                type="text"
                                value={batch.name}
                                onChange={(e) =>
                                  handleUpdateBatch(batch.id, { name: e.target.value })
                                }
                                className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white flex-1 max-w-sm"
                                placeholder="Batch Name"
                              />

                              <span className="font-mono text-[10px] text-slate-500 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                {batch.batchCode}
                              </span>
                            </div>

                            <div className="flex items-center space-x-2">
                              {/* Workload Selector */}
                              <select
                                value={batch.workloadType}
                                onChange={(e) =>
                                  handleUpdateBatch(batch.id, {
                                    workloadType: e.target.value as MigrationWorkloadType,
                                  })
                                }
                                className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
                              >
                                <option value="EXCHANGE_MAILBOX">Exchange Mailbox</option>
                                <option value="ONEDRIVE">OneDrive Personal</option>
                                <option value="TEAMS">Microsoft Teams</option>
                                <option value="SHAREPOINT">SharePoint Sites</option>
                                <option value="HYBRID_CUTOVER">Hybrid Full Suite</option>
                              </select>

                              {/* Card Actions: Move Up, Move Down, Duplicate, Delete */}
                              <button
                                type="button"
                                title="Move Earlier in Sequence"
                                disabled={isFirst}
                                onClick={() => handleMoveBatch(index, 'up')}
                                className="p-1 rounded text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"
                              >
                                ↑
                              </button>
                              <button
                                type="button"
                                title="Move Later in Sequence"
                                disabled={isLast}
                                onClick={() => handleMoveBatch(index, 'down')}
                                className="p-1 rounded text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"
                              >
                                ↓
                              </button>
                              <button
                                type="button"
                                title="Duplicate Batch"
                                onClick={() => handleDuplicateBatch(batch.id)}
                                className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                title="Remove Batch"
                                disabled={queueConfig.batches.length <= 1}
                                onClick={() => handleRemoveBatch(batch.id)}
                                className="p-1 rounded text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 disabled:opacity-30"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Card Body: 3 Config Columns */}
                          <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                            {/* Column 1: Scheduling (Start Time & End Time) */}
                            <div className="space-y-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                              <div className="flex items-center space-x-1.5 text-slate-800 dark:text-slate-200 font-semibold">
                                <Clock className="h-3.5 w-3.5 text-blue-500" />
                                <span>Window & Timings</span>
                              </div>

                              <div>
                                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                  Scheduled Start Time
                                </label>
                                <input
                                  type="datetime-local"
                                  value={batch.startTime}
                                  onChange={(e) =>
                                    handleUpdateBatch(batch.id, { startTime: e.target.value })
                                  }
                                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-xs text-slate-900 dark:text-white"
                                />
                                <div className="flex items-center space-x-1 mt-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const now = new Date();
                                      const pad = (n: number) => (n < 10 ? '0' + n : String(n));
                                      handleUpdateBatch(batch.id, {
                                        startTime: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`,
                                      });
                                    }}
                                    className="px-1.5 py-0.5 rounded text-[9px] bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-300"
                                  >
                                    Now
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const t = new Date(Date.now() + 2 * 3600 * 1000);
                                      const pad = (n: number) => (n < 10 ? '0' + n : String(n));
                                      handleUpdateBatch(batch.id, {
                                        startTime: `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}T${pad(t.getHours())}:${pad(t.getMinutes())}`,
                                      });
                                    }}
                                    className="px-1.5 py-0.5 rounded text-[9px] bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-300"
                                  >
                                    +2h
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const tonight = new Date();
                                      tonight.setHours(22, 0, 0, 0);
                                      const pad = (n: number) => (n < 10 ? '0' + n : String(n));
                                      handleUpdateBatch(batch.id, {
                                        startTime: `${tonight.getFullYear()}-${pad(tonight.getMonth() + 1)}-${pad(tonight.getDate())}T22:00`,
                                      });
                                    }}
                                    className="px-1.5 py-0.5 rounded text-[9px] bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-300"
                                  >
                                    Tonight 22:00
                                  </button>
                                </div>
                              </div>

                              <div>
                                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                  Scheduled End Time (Cutoff Deadline)
                                </label>
                                <input
                                  type="datetime-local"
                                  value={batch.endTime}
                                  onChange={(e) =>
                                    handleUpdateBatch(batch.id, { endTime: e.target.value })
                                  }
                                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-xs text-slate-900 dark:text-white"
                                />
                                <div className="flex items-center space-x-1 mt-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const base = batch.startTime
                                        ? new Date(batch.startTime)
                                        : new Date();
                                      const t = new Date(base.getTime() + 4 * 3600 * 1000);
                                      const pad = (n: number) => (n < 10 ? '0' + n : String(n));
                                      handleUpdateBatch(batch.id, {
                                        endTime: `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}T${pad(t.getHours())}:${pad(t.getMinutes())}`,
                                      });
                                    }}
                                    className="px-1.5 py-0.5 rounded text-[9px] bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-300"
                                  >
                                    +4h Window
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const base = batch.startTime
                                        ? new Date(batch.startTime)
                                        : new Date();
                                      const t = new Date(base.getTime() + 8 * 3600 * 1000);
                                      const pad = (n: number) => (n < 10 ? '0' + n : String(n));
                                      handleUpdateBatch(batch.id, {
                                        endTime: `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}T${pad(t.getHours())}:${pad(t.getMinutes())}`,
                                      });
                                    }}
                                    className="px-1.5 py-0.5 rounded text-[9px] bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-300"
                                  >
                                    +8h Window
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Column 2: Dependency Sequence Rules */}
                            <div className="space-y-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                              <div className="flex items-center space-x-1.5 text-slate-800 dark:text-slate-200 font-semibold">
                                <GitMerge className="h-3.5 w-3.5 text-emerald-500" />
                                <span>Dependency Sequence</span>
                              </div>

                              <div>
                                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                  Predecessor Batch Dependency
                                </label>
                                <select
                                  value={batch.dependsOnBatchId || ''}
                                  onChange={(e) =>
                                    handleUpdateBatch(batch.id, {
                                      dependsOnBatchId: e.target.value === '' ? null : e.target.value,
                                    })
                                  }
                                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-xs text-slate-900 dark:text-white"
                                >
                                  <option value="">None (Root Batch — Executes First / At Start Time)</option>
                                  {queueConfig.batches
                                    .filter((other) => other.id !== batch.id)
                                    .map((other, oIdx) => (
                                      <option key={other.id} value={other.id}>
                                        Batch {oIdx + 1}: {other.name} ({other.batchCode})
                                      </option>
                                    ))}
                                </select>
                              </div>

                              <div>
                                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                  Dependency Trigger Condition
                                </label>
                                <select
                                  value={batch.dependencyCondition}
                                  onChange={(e) =>
                                    handleUpdateBatch(batch.id, {
                                      dependencyCondition: e.target.value as BatchDependencyCondition,
                                    })
                                  }
                                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-xs text-slate-900 dark:text-white"
                                >
                                  <option value="SUCCESS">On Success (Zero critical errors)</option>
                                  <option value="COMPLETED_ANY">On Complete (Tolerate non-fatal warnings)</option>
                                  <option value="START_PARALLEL">Start in Parallel (Shared window)</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                  Action On Predecessor Failure
                                </label>
                                <select
                                  value={batch.actionOnDependencyFailure}
                                  onChange={(e) =>
                                    handleUpdateBatch(batch.id, {
                                      actionOnDependencyFailure: e.target.value as BatchFailureAction,
                                    })
                                  }
                                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-xs text-slate-900 dark:text-white"
                                >
                                  <option value="STOP_QUEUE">Halt Entire Queue (Safest for anti-data-loss)</option>
                                  <option value="SKIP_DEPENDENTS">Skip This Batch & Continue Others</option>
                                  <option value="CONTINUE">Proceed Unconditionally</option>
                                </select>
                              </div>
                            </div>

                            {/* Column 3: Capacity & Concurrency Tuning */}
                            <div className="space-y-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                              <div className="flex items-center space-x-1.5 text-slate-800 dark:text-slate-200 font-semibold">
                                <Cpu className="h-3.5 w-3.5 text-purple-500" />
                                <span>Batch Capacity & Priority</span>
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                    Accounts Count
                                  </label>
                                  <input
                                    type="number"
                                    min="1"
                                    max="50"
                                    value={batch.userCount}
                                    onChange={(e) =>
                                      handleUpdateBatch(batch.id, {
                                        userCount: parseInt(e.target.value, 10) || 5,
                                      })
                                    }
                                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-xs text-slate-900 dark:text-white font-mono"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                    Workers
                                  </label>
                                  <select
                                    value={batch.concurrencyLimit}
                                    onChange={(e) =>
                                      handleUpdateBatch(batch.id, {
                                        concurrencyLimit: parseInt(e.target.value, 10) || 4,
                                      })
                                    }
                                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-xs text-slate-900 dark:text-white"
                                  >
                                    <option value="2">2 Workers</option>
                                    <option value="4">4 Workers</option>
                                    <option value="8">8 Workers</option>
                                    <option value="16">16 Workers</option>
                                  </select>
                                </div>
                              </div>

                              <div>
                                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                  Batch Priority Tier
                                </label>
                                <select
                                  value={batch.priority}
                                  onChange={(e) =>
                                    handleUpdateBatch(batch.id, {
                                      priority: e.target.value as any,
                                    })
                                  }
                                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-xs text-slate-900 dark:text-white"
                                >
                                  <option value="VIP">VIP (Executive Priority)</option>
                                  <option value="HIGH">High Priority</option>
                                  <option value="STANDARD">Standard Business</option>
                                  <option value="OFF_PEAK">Off-Peak (Low Throttle)</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                  Notes & Operational Tag
                                </label>
                                <input
                                  type="text"
                                  value={batch.notes || ''}
                                  onChange={(e) =>
                                    handleUpdateBatch(batch.id, { notes: e.target.value })
                                  }
                                  placeholder="e.g. Finance group with large archives"
                                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-[11px] text-slate-900 dark:text-white"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Global Queue Orchestration Guardrails Policy */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2 text-xs">
                    <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-semibold mb-1">
                      <Shield className="h-4 w-4 text-emerald-500" />
                      <span>Queue Safety Guardrails & Anti-Throttling Policies</span>
                    </div>

                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={queueConfig.enforceSequentialExecution}
                        onChange={(e) =>
                          setQueueConfig({
                            ...queueConfig,
                            enforceSequentialExecution: e.target.checked,
                          })
                        }
                        className="rounded text-blue-600"
                      />
                      <span className="text-slate-700 dark:text-slate-300">
                        Enforce strict dependency sequence order (dependent batch cannot unlock until predecessor passes verification)
                      </span>
                    </label>

                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={queueConfig.pauseOnAnyFailure}
                        onChange={(e) =>
                          setQueueConfig({
                            ...queueConfig,
                            pauseOnAnyFailure: e.target.checked,
                          })
                        }
                        className="rounded text-blue-600"
                      />
                      <span className="text-slate-700 dark:text-slate-300">
                        Automatically pause queue if graph throttling limits (HTTP 429) or quota saturation is detected
                      </span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* FINAL REVIEW & LAUNCH STEP */}
          {isLastStep && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Step {steps.length}: Review Configuration & Launch Direct Streaming
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Review all parameters. When you confirm and launch the job, the background direct streaming orchestrator will start or enqueue the batches according to schedule.
                </p>
              </div>

              {/* Summary Review Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2 text-xs">
                  <div className="flex justify-between border-b border-slate-200 dark:border-slate-700/60 pb-1.5">
                    <span className="text-slate-500">Workload:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{formData.workloadType}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 dark:border-slate-700/60 pb-1.5">
                    <span className="text-slate-500">Job Name:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{formData.name}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 dark:border-slate-700/60 pb-1.5">
                    <span className="text-slate-500">Batch Code:</span>
                    <span className="font-mono text-slate-900 dark:text-white">{formData.batchCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tenants:</span>
                    <span className="text-slate-900 dark:text-white font-mono">
                      {formData.sourceTenant} → {formData.targetTenant}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2 text-xs">
                  <div className="flex justify-between border-b border-slate-200 dark:border-slate-700/60 pb-1.5">
                    <span className="text-slate-500">Streaming Mode:</span>
                    <span className="font-semibold text-emerald-500">Direct In-Memory (Zero Disk Staging)</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 dark:border-slate-700/60 pb-1.5">
                    <span className="text-slate-500">Chunk Size:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{formData.chunkSizeMB} MB Chunks</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 dark:border-slate-700/60 pb-1.5">
                    <span className="text-slate-500">Worker Concurrency:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{formData.concurrencyLimit} Parallel Workers</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Checkpoints & Resumable Retries:</span>
                    <span className="text-blue-500 font-semibold">Enabled (Up to {formData.maxResumableRetries} retries)</span>
                  </div>
                </div>
              </div>

              {/* If Queue and Batch is enabled, show the Queued Batches & Dependencies Card */}
              {formData.scheduleType === 'QUEUE_AND_BATCH' && (
                <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-50/40 dark:bg-blue-950/20 space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-blue-200/60 dark:border-blue-800/60 pb-2">
                    <div className="flex items-center space-x-2">
                      <ListOrdered className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span className="font-bold text-slate-900 dark:text-white">
                        Multi-Batch Queue Execution Plan ({queueConfig.batches.length} Batches)
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-blue-600 dark:text-blue-400 font-semibold">
                      {queueConfig.queueName}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {queueConfig.batches.map((b, idx) => {
                      const pred = queueConfig.batches.find((x) => x.id === b.dependsOnBatchId);
                      return (
                        <div
                          key={b.id}
                          className="p-2.5 rounded-lg bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                        >
                          <div className="flex items-center space-x-2.5">
                            <span className="h-5 w-5 rounded bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                              {idx + 1}
                            </span>
                            <div>
                              <div className="font-semibold text-slate-900 dark:text-white flex items-center space-x-1.5">
                                <span>{b.name}</span>
                                <span className="font-mono text-[10px] text-slate-400">({b.batchCode})</span>
                              </div>
                              <div className="text-[11px] text-slate-500 flex items-center space-x-2 mt-0.5">
                                <span>{b.workloadType}</span>
                                <span>•</span>
                                <span>{b.userCount} Accounts</span>
                                <span>•</span>
                                <span>{b.concurrencyLimit} Parallel Workers</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right text-[11px] space-y-0.5">
                            <div className="text-slate-700 dark:text-slate-300 font-medium">
                              Window: {b.startTime ? b.startTime.replace('T', ' ') : 'Immediate'} → {b.endTime ? b.endTime.replace('T', ' ') : 'Open'}
                            </div>
                            <div className="text-[10px]">
                              {b.dependsOnBatchId ? (
                                <span className="text-amber-600 dark:text-amber-400 font-medium">
                                  Runs after {pred ? pred.batchCode : 'predecessor'} ({b.dependencyCondition})
                                </span>
                              ) : (
                                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                  Root Batch (Starts at Window Open)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* PRE-FLIGHT VALIDATION STATUS & SAFEGUARDS CARD */}
              <div
                className={`p-5 rounded-xl border transition-all ${
                  validationReport?.overallStatus === 'PASSED'
                    ? 'border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20'
                    : validationReport?.overallStatus === 'WARNING'
                    ? 'border-amber-500/30 bg-amber-50/40 dark:bg-amber-950/20'
                    : 'border-blue-500/30 bg-blue-50/40 dark:bg-blue-950/20'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-3.5">
                    <div
                      className={`h-12 w-12 rounded-xl flex items-center justify-center font-bold text-sm shadow-md ${
                        validationReport?.overallStatus === 'PASSED'
                          ? 'bg-emerald-600 text-white'
                          : validationReport?.overallStatus === 'WARNING'
                          ? 'bg-amber-500 text-white'
                          : 'bg-blue-600 text-white'
                      }`}
                    >
                      {isValidating ? (
                        <RefreshCw className="h-6 w-6 animate-spin" />
                      ) : validationReport ? (
                        `${validationReport.readinessScore}%`
                      ) : (
                        <Shield className="h-6 w-6" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {isValidating
                            ? 'Running Automated Pre-Flight Validation...'
                            : validationReport
                            ? `Pre-Flight Safeguards Verified (${validationReport.summary.passed}/${validationReport.summary.total} Checks Passed)`
                            : 'Pre-Flight Validation Safeguard Check'}
                        </h4>
                        {validationReport && (
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              validationReport.overallStatus === 'PASSED'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                            }`}
                          >
                            {validationReport.overallStatus}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {validationReport
                          ? 'All anti-data-loss rules, license availability, storage limits, and source objects confirmed.'
                          : 'Run automated checks to verify license availability, storage quotas, and source object existence before initiating the migration.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      id="btn-preflight-step10"
                      onClick={runPreFlightValidationHandler}
                      disabled={isValidating}
                      className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md hover:shadow-lg transition-all flex items-center space-x-1.5 disabled:opacity-50"
                    >
                      {isValidating ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          <span>Validating...</span>
                        </>
                      ) : validationReport ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5" />
                          <span>Re-run Validation</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="h-3.5 w-3.5" />
                          <span>Run Pre-flight Validation</span>
                        </>
                      )}
                    </button>

                    <button
                      id="btn-kick-off-job"
                      onClick={handleSubmit}
                      disabled={isSubmitting || isValidating || (validationReport && !validationReport.canProceed)}
                      className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg hover:shadow-xl transition-all flex items-center space-x-2 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>
                            {formData.scheduleType === 'QUEUE_AND_BATCH'
                              ? 'Enqueuing Batches...'
                              : 'Launching Stream...'}
                          </span>
                        </>
                      ) : (
                        <>
                          {formData.scheduleType === 'QUEUE_AND_BATCH' ? (
                            <>
                              <CalendarClock className="h-3.5 w-3.5" />
                              <span>Schedule Queue ({queueConfig.batches.length} Batches)</span>
                            </>
                          ) : (
                            <>
                              <Play className="h-3.5 w-3.5 fill-current" />
                              <span>Launch Migration Job</span>
                            </>
                          )}
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Pre-flight Highlights when validated */}
                {validationReport && !isValidating && (
                  <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/80 space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      <div className="p-2.5 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800 flex items-center space-x-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                        <div>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            License Pool:
                          </span>
                          <span className="text-slate-500 ml-1">52 available (15 needed)</span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800 flex items-center space-x-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                        <div>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            Storage Quotas:
                          </span>
                          <span className="text-slate-500 ml-1">18.2 TB pooled headroom</span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800 flex items-center space-x-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                        <div>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            Source Objects:
                          </span>
                          <span className="text-slate-500 ml-1">15/15 verified & active</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => setShowStep10Details(!showStep10Details)}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1"
                      >
                        <span>
                          {showStep10Details
                            ? 'Hide Detailed Checks Breakdown'
                            : 'View All 8 Verification Checks Breakdown'}
                        </span>
                        {showStep10Details ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                      </button>
                    </div>

                    {showStep10Details && (
                      <div className="space-y-1.5 pt-2 animate-in fade-in duration-150">
                        {validationReport.checks.map((chk) => (
                          <div
                            key={chk.id}
                            className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center space-x-2">
                              {chk.status === 'PASSED' ? (
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                              ) : (
                                <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                              )}
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {chk.title}
                              </span>
                              <span className="text-slate-500 text-[11px] truncate max-w-md">
                                — {chk.details}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                              {chk.durationMs}ms
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between">
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

            {/* In final step, offer a direct Pre-flight Validation button in footer as well */}
            {isLastStep && (
              <button
                id="btn-footer-preflight-validation"
                onClick={runPreFlightValidationHandler}
                disabled={isValidating || isSubmitting}
                className="px-4 py-2 rounded-lg border border-blue-500/40 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-sm font-medium transition-colors flex items-center space-x-1.5 disabled:opacity-50"
              >
                {isValidating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Validating...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    <span>Pre-flight Validation</span>
                  </>
                )}
              </button>
            )}

            {!isLastStep ? (
              <button
                id="btn-next-step"
                onClick={handleNext}
                className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors flex items-center space-x-1.5"
              >
                <span>Next Step</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                id="btn-submit-migration-job"
                onClick={handleSubmit}
                disabled={isSubmitting || isValidating || (validationReport && !validationReport.canProceed)}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors flex items-center space-x-1.5 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>
                      {formData.scheduleType === 'QUEUE_AND_BATCH'
                        ? 'Enqueuing Batches...'
                        : 'Launching...'}
                    </span>
                  </>
                ) : (
                  <>
                    {formData.scheduleType === 'QUEUE_AND_BATCH' ? (
                      <>
                        <CalendarClock className="h-4 w-4" />
                        <span>Confirm & Schedule Queue ({queueConfig.batches.length} Batches)</span>
                      </>
                    ) : (
                      <>
                        <span>Confirm & Launch</span>
                        <Play className="h-4 w-4 fill-current" />
                      </>
                    )}
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
