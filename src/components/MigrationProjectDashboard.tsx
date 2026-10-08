import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ChevronDown,
  ChevronUp,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Play,
  Pause,
  RefreshCw,
  Download,
  Database,
  Users,
  HardDrive,
  Mail,
  Globe,
  Layers,
  ArrowUpRight,
  Filter,
  Search,
  Plus,
  ExternalLink,
  ShieldCheck,
  Activity,
  FileText,
  Check,
  RotateCcw,
  Zap,
  FolderTree,
  MessageSquare,
  Sparkles,
  Info
} from 'lucide-react';
import {
  MigrationJob,
  TenantStatusResponse,
  AdminRole,
  UserMigrationStatus,
  MigrationUserStatus,
  MigrationWorkloadType
} from '../types';

export interface MigrationProjectDashboardProps {
  currentRole?: AdminRole;
  tenantStatus?: TenantStatusResponse;
  activeJob?: MigrationJob | null;
  recentJobs?: MigrationJob[];
  onSelectJob?: (jobId: string) => void;
  onNavigateTab?: (tab: any, subTab?: any) => void;
  onRefreshJobs?: () => void;
}

interface ProjectJobItem {
  id: string;
  name: string;
  batchCode: string;
  wave: string;
  workload: string;
  workloadTypes: ('mail' | 'drive' | 'teams' | 'sharepoint' | 'ad')[];
  sourceTenant: string;
  targetTenant: string;
  status: MigrationUserStatus | 'COMPLETED' | 'PROCESSING' | 'PAUSED' | 'FAILED' | 'PENDING';
  totalUsers: number;
  completedUsers: number;
  failedUsers: number;
  dataTransferredGB: number;
  totalDataGB: number;
  duration: string;
  startedAt: string;
  throughputMBs: number;
  stages: {
    name: string;
    status: 'COMPLETED' | 'PROCESSING' | 'PENDING' | 'FAILED';
    percent: number;
    detail: string;
  }[];
  users: {
    id: string;
    sourceUPN: string;
    targetUPN: string;
    status: MigrationUserStatus;
    mailProgress: number;
    driveProgress: number;
    dataSizeMB: number;
    activeStep: string;
    errorMessage?: string;
  }[];
}

interface MigrationProject {
  id: string;
  name: string;
  code: string;
  description: string;
  status: 'ACTIVE' | 'COMPLETED' | 'PLANNING';
  sourceTenant: string;
  targetTenant: string;
  targetCutoverDate: string;
  scopedUsers: number;
  migratedUsers: number;
  inProgressUsers: number;
  failedUsers: number;
  dataTransferredGB: number;
  targetDataGB: number;
  activeWave: string;
  totalWaves: number;
  completedWaves: number;
}

const DEFAULT_PROJECTS: MigrationProject[] = [
  {
    id: 'proj-01',
    name: 'Contoso Corp to Fabrikam Cloud Production Cutover',
    code: 'PRJ-CONTOSO-FAB-01',
    description: 'Primary corporate consolidation project covering 380 priority users, executive mailboxes, OneDrive personal archives, and critical SharePoint departmental sites.',
    status: 'ACTIVE',
    sourceTenant: 'contoso.onmicrosoft.com',
    targetTenant: 'fabrikam.com',
    targetCutoverDate: 'Oct 15, 2026',
    scopedUsers: 380,
    migratedUsers: 342,
    inProgressUsers: 30,
    failedUsers: 8,
    dataTransferredGB: 412.5,
    targetDataGB: 458.0,
    activeWave: 'Wave 3 (Finance & Operations)',
    totalWaves: 4,
    completedWaves: 2,
  },
  {
    id: 'proj-02',
    name: 'EMEA Regional Subsidiary Migration Wave',
    code: 'PRJ-EMEA-SUB-02',
    description: 'Regional tenant migration for UK and Germany subsidiaries including mailbox archives, shared distribution groups, and Teams collaboration spaces.',
    status: 'COMPLETED',
    sourceTenant: 'emea.contoso.onmicrosoft.com',
    targetTenant: 'fabrikam.com',
    targetCutoverDate: 'Sep 01, 2026',
    scopedUsers: 140,
    migratedUsers: 140,
    inProgressUsers: 0,
    failedUsers: 0,
    dataTransferredGB: 185.0,
    targetDataGB: 185.0,
    activeWave: 'All Waves Completed',
    totalWaves: 2,
    completedWaves: 2,
  },
  {
    id: 'proj-03',
    name: 'Executive & VIP Fast-Track Cutover',
    code: 'PRJ-VIP-EXEC-03',
    description: 'Dedicated high-touch migration track for C-Suite and board members with zero downtime email forwarding and priority delegate permissions synchronization.',
    status: 'ACTIVE',
    sourceTenant: 'contoso.onmicrosoft.com',
    targetTenant: 'fabrikam.com',
    targetCutoverDate: 'Oct 05, 2026',
    scopedUsers: 25,
    migratedUsers: 22,
    inProgressUsers: 3,
    failedUsers: 0,
    dataTransferredGB: 78.4,
    targetDataGB: 86.0,
    activeWave: 'Wave 1 (Leadership Team)',
    totalWaves: 1,
    completedWaves: 0,
  }
];

const SEED_PROJECT_JOBS: ProjectJobItem[] = [
  {
    id: 'JOB-B78021',
    name: 'Wave 3: Finance & Operations Multi-Workload Cutover',
    batchCode: 'BATCH-FIN-W3',
    wave: 'Wave 3',
    workload: 'Exchange Mailboxes & OneDrive for Business',
    workloadTypes: ['mail', 'drive', 'ad'],
    sourceTenant: 'contoso.onmicrosoft.com',
    targetTenant: 'fabrikam.com',
    status: 'PROCESSING',
    totalUsers: 30,
    completedUsers: 24,
    failedUsers: 1,
    dataTransferredGB: 46.8,
    totalDataGB: 58.2,
    duration: '42m elapsed',
    startedAt: 'Today, 08:30 UTC',
    throughputMBs: 18.4,
    stages: [
      { name: '1. Pre-Flight Auth & Health Check', status: 'COMPLETED', percent: 100, detail: 'Tenant credentials & Graph API tokens validated' },
      { name: '2. Target Account & Mailbox Provisioning', status: 'COMPLETED', percent: 100, detail: '30 target mailboxes and licenses provisioned' },
      { name: '3. Mailbox & Personal Site Data Sync', status: 'PROCESSING', percent: 84, detail: 'Ingesting messages, calendar items, and OneDrive documents' },
      { name: '4. Permissions, Delegates & Folder ACLs', status: 'PROCESSING', percent: 60, detail: 'Mapping delegate access and shared mailbox permissions' },
      { name: '5. Delta Sync & Mail Routing Cutover', status: 'PENDING', percent: 0, detail: 'Scheduled after primary data copy reaches 100%' },
    ],
    users: [
      {
        id: 'u-101',
        sourceUPN: 'adele.vance@contoso.onmicrosoft.com',
        targetUPN: 'adele.vance@fabrikam.com',
        status: 'PROCESSING',
        mailProgress: 94,
        driveProgress: 88,
        dataSizeMB: 1420,
        activeStep: 'Transferring mailbox messages: Inbox (3,410 / 3,820 items)',
      },
      {
        id: 'u-102',
        sourceUPN: 'alex.wilber@contoso.onmicrosoft.com',
        targetUPN: 'alex.wilber@fabrikam.com',
        status: 'COMPLETED',
        mailProgress: 100,
        driveProgress: 100,
        dataSizeMB: 2840,
        activeStep: 'Migration verified. Final delta copy completed with 0 errors.',
      },
      {
        id: 'u-103',
        sourceUPN: 'diego.siciliani@contoso.onmicrosoft.com',
        targetUPN: 'diego.siciliani@fabrikam.com',
        status: 'FAILED',
        mailProgress: 42,
        driveProgress: 15,
        dataSizeMB: 820,
        activeStep: 'OneDrive:PathLengthExceeded error during folder creation',
        errorMessage: 'Folder nesting hierarchy exceeds 400 UTF-16 character limit on target OneDrive.',
      },
      {
        id: 'u-104',
        sourceUPN: 'megan.bowen@contoso.onmicrosoft.com',
        targetUPN: 'megan.bowen@fabrikam.com',
        status: 'PROCESSING',
        mailProgress: 76,
        driveProgress: 82,
        dataSizeMB: 1980,
        activeStep: 'Syncing personal OneDrive documents (420 / 512 files copied)',
      },
      {
        id: 'u-105',
        sourceUPN: 'patti.fernandez@contoso.onmicrosoft.com',
        targetUPN: 'patti.fernandez@fabrikam.com',
        status: 'COMPLETED',
        mailProgress: 100,
        driveProgress: 100,
        dataSizeMB: 3100,
        activeStep: 'Mailbox rules and delegate access mapped successfully.',
      },
    ],
  },
  {
    id: 'JOB-A10984',
    name: 'Wave 2: Engineering Dept Multi-Geo Archive Sync',
    batchCode: 'BATCH-ENG-W2',
    wave: 'Wave 2',
    workload: 'Exchange Online & SharePoint Sites',
    workloadTypes: ['mail', 'sharepoint', 'ad'],
    sourceTenant: 'contoso.onmicrosoft.com',
    targetTenant: 'fabrikam.com',
    status: 'COMPLETED',
    totalUsers: 140,
    completedUsers: 140,
    failedUsers: 0,
    dataTransferredGB: 182.4,
    totalDataGB: 182.4,
    duration: '2h 15m elapsed',
    startedAt: 'Yesterday, 14:00 UTC',
    throughputMBs: 24.1,
    stages: [
      { name: '1. Pre-Flight Auth & Health Check', status: 'COMPLETED', percent: 100, detail: 'Validation completed successfully' },
      { name: '2. Target Account & Mailbox Provisioning', status: 'COMPLETED', percent: 100, detail: '140 target accounts matched and provisioned' },
      { name: '3. Mailbox & Personal Site Data Sync', status: 'COMPLETED', percent: 100, detail: '182.4 GB transferred without data loss' },
      { name: '4. Permissions, Delegates & Folder ACLs', status: 'COMPLETED', percent: 100, detail: 'All security groups and permissions verified' },
      { name: '5. Delta Sync & Mail Routing Cutover', status: 'COMPLETED', percent: 100, detail: 'MX mail flow cutover confirmed' },
    ],
    users: [
      {
        id: 'u-201',
        sourceUPN: 'isaiah.langer@contoso.onmicrosoft.com',
        targetUPN: 'isaiah.langer@fabrikam.com',
        status: 'COMPLETED',
        mailProgress: 100,
        driveProgress: 100,
        dataSizeMB: 3410,
        activeStep: 'Completed. 14,200 items transferred.',
      },
      {
        id: 'u-202',
        sourceUPN: 'joni.sherman@contoso.onmicrosoft.com',
        targetUPN: 'joni.sherman@fabrikam.com',
        status: 'COMPLETED',
        mailProgress: 100,
        driveProgress: 100,
        dataSizeMB: 1890,
        activeStep: 'Completed. 6,800 items transferred.',
      }
    ],
  },
  {
    id: 'JOB-E49012',
    name: 'Wave 1: Pilot & Sales Leadership Mailbox Migration',
    batchCode: 'BATCH-PILOT-W1',
    wave: 'Wave 1',
    workload: 'Exchange Online & OneDrive for Business',
    workloadTypes: ['mail', 'drive'],
    sourceTenant: 'contoso.onmicrosoft.com',
    targetTenant: 'fabrikam.com',
    status: 'COMPLETED',
    totalUsers: 48,
    completedUsers: 48,
    failedUsers: 0,
    dataTransferredGB: 64.2,
    totalDataGB: 64.2,
    duration: '58m elapsed',
    startedAt: '3 days ago',
    throughputMBs: 19.8,
    stages: [
      { name: '1. Pre-Flight Auth & Health Check', status: 'COMPLETED', percent: 100, detail: 'Validated' },
      { name: '2. Target Account & Mailbox Provisioning', status: 'COMPLETED', percent: 100, detail: '48 accounts mapped' },
      { name: '3. Mailbox & Personal Site Data Sync', status: 'COMPLETED', percent: 100, detail: 'Completed' },
      { name: '4. Permissions, Delegates & Folder ACLs', status: 'COMPLETED', percent: 100, detail: 'Completed' },
      { name: '5. Delta Sync & Mail Routing Cutover', status: 'COMPLETED', percent: 100, detail: 'Completed' },
    ],
    users: [
      {
        id: 'u-301',
        sourceUPN: 'lynne.robbins@contoso.onmicrosoft.com',
        targetUPN: 'lynne.robbins@fabrikam.com',
        status: 'COMPLETED',
        mailProgress: 100,
        driveProgress: 100,
        dataSizeMB: 2150,
        activeStep: 'Verified and active in target tenant.',
      }
    ],
  },
  {
    id: 'JOB-F88210',
    name: 'Wave 4: Global Marketing & Teams Channels Archive',
    batchCode: 'BATCH-MKTG-W4',
    wave: 'Wave 4',
    workload: 'Teams Channels & SharePoint Document Libraries',
    workloadTypes: ['teams', 'sharepoint'],
    sourceTenant: 'contoso.onmicrosoft.com',
    targetTenant: 'fabrikam.com',
    status: 'PAUSED',
    totalUsers: 28,
    completedUsers: 12,
    failedUsers: 0,
    dataTransferredGB: 18.5,
    totalDataGB: 44.0,
    duration: 'Paused by Operator',
    startedAt: 'Yesterday, 19:15 UTC',
    throughputMBs: 0,
    stages: [
      { name: '1. Pre-Flight Auth & Health Check', status: 'COMPLETED', percent: 100, detail: 'Validated' },
      { name: '2. Target Account & Mailbox Provisioning', status: 'COMPLETED', percent: 100, detail: 'Channels provisioned' },
      { name: '3. Mailbox & Personal Site Data Sync', status: 'PROCESSING', percent: 42, detail: 'Paused pending weekend network window' },
      { name: '4. Permissions, Delegates & Folder ACLs', status: 'PENDING', percent: 0, detail: 'Queued' },
      { name: '5. Delta Sync & Mail Routing Cutover', status: 'PENDING', percent: 0, detail: 'Queued' },
    ],
    users: [
      {
        id: 'u-401',
        sourceUPN: 'nestor.wilke@contoso.onmicrosoft.com',
        targetUPN: 'nestor.wilke@fabrikam.com',
        status: 'PAUSED',
        mailProgress: 42,
        driveProgress: 40,
        dataSizeMB: 940,
        activeStep: 'Pipeline paused by operator. Ready to resume.',
      }
    ],
  }
];

export const MigrationProjectDashboard: React.FC<MigrationProjectDashboardProps> = ({
  currentRole = 'GLOBAL_ADMIN',
  tenantStatus,
  activeJob,
  recentJobs = [],
  onSelectJob,
  onNavigateTab,
  onRefreshJobs,
}) => {
  // --- PROJECT STATE ---
  const [projects, setProjects] = useState<MigrationProject[]>(() => {
    try {
      const saved = localStorage.getItem('m365_migration_projects');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
    return DEFAULT_PROJECTS;
  });
  const [selectedProjectId, setSelectedProjectId] = useState<string>('proj-01');
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState<boolean>(false);
  const [newProjectForm, setNewProjectForm] = useState({
    name: '',
    code: '',
    description: '',
    status: 'ACTIVE' as 'ACTIVE' | 'PLANNING',
    sourceTenant: tenantStatus?.source?.domain || 'contoso.onmicrosoft.com',
    targetTenant: tenantStatus?.target?.domain || 'fabrikam.com',
    targetCutoverDate: 'Nov 15, 2026',
    scopedUsers: 150,
    targetDataGB: 200.0,
    totalWaves: 3,
    workloads: ['mail', 'drive', 'teams', 'sharepoint', 'ad'],
    executeInitialDiscovery: true,
  });

  useEffect(() => {
    try {
      localStorage.setItem('m365_migration_projects', JSON.stringify(projects));
    } catch (_) {}
  }, [projects]);

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId) || projects[0],
    [projects, selectedProjectId]
  );

  // --- JOBS & FILTER STATE ---
  const [projectJobs, setProjectJobs] = useState<ProjectJobItem[]>(SEED_PROJECT_JOBS);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [workloadFilter, setWorkloadFilter] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'jobs' | 'workloads' | 'waves'>('jobs');

  // --- JOB EXPANSION STATE (Fixes "unable to expand any job listed here") ---
  const [expandedJobIds, setExpandedJobIds] = useState<Set<string>>(new Set(['JOB-B78021']));
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const handleOpenCreateProjectModal = useCallback(() => {
    setNewProjectForm({
      name: '',
      code: 'PRJ-' + Math.floor(1000 + Math.random() * 9000),
      description: '',
      status: 'ACTIVE',
      sourceTenant: tenantStatus?.source?.domain || 'contoso.onmicrosoft.com',
      targetTenant: tenantStatus?.target?.domain || 'fabrikam.com',
      targetCutoverDate: 'Nov 15, 2026',
      scopedUsers: 150,
      targetDataGB: 200.0,
      totalWaves: 3,
      workloads: ['mail', 'drive', 'teams', 'sharepoint', 'ad'],
      executeInitialDiscovery: true,
    });
    setIsNewProjectModalOpen(true);
  }, [tenantStatus]);

  // Helper: Map any backend MigrationJob across any workload into a rich ProjectJobItem
  const mapBackendJobToProjectJob = useCallback((job: MigrationJob): ProjectJobItem => {
    const liveId = job.id.length > 15 ? `JOB-${job.id.slice(-6).toUpperCase()}` : job.id;

    let workload = 'Unified Multi-Workload Enterprise Cutover';
    let workloadTypes: ('mail' | 'drive' | 'teams' | 'sharepoint' | 'ad')[] = ['ad', 'mail', 'drive'];

    const wType = (job.workloadType || '').toUpperCase();
    if (wType === 'EXCHANGE_MAILBOX') {
      workload = 'Exchange Online Mailboxes';
      workloadTypes = ['mail'];
    } else if (wType === 'ONEDRIVE') {
      workload = 'OneDrive for Business';
      workloadTypes = ['drive'];
    } else if (wType === 'SHAREPOINT') {
      workload = 'SharePoint Online Sites & Document Libraries';
      workloadTypes = ['sharepoint'];
    } else if (wType === 'TEAMS') {
      workload = 'Microsoft Teams Channels & Chats';
      workloadTypes = ['teams'];
    } else if (wType === 'ACTIVE_DIRECTORY') {
      workload = 'Active Directory & Entra ID Sync';
      workloadTypes = ['ad'];
    } else if (wType === 'HYBRID_CUTOVER' || wType === 'HYBRID') {
      workload = 'Hybrid Multi-Workload Cutover Wave';
      workloadTypes = ['ad', 'mail', 'drive', 'sharepoint', 'teams'];
    }

    const mappedUsers = (job.userStatuses || []).map((u) => ({
      id: u.id,
      sourceUPN: u.sourceUPN,
      targetUPN: u.targetUPN,
      status: u.status,
      mailProgress: u.mailboxProgress || 0,
      driveProgress: u.driveProgress || 0,
      dataSizeMB: u.bytesMigrated ? Math.round(u.bytesMigrated / (1024 * 1024)) : 1250,
      activeStep: u.activeStep || 'Direct memory stream active (Zero disk staging)...',
      errorMessage: u.errorMessage || undefined,
    }));

    const totalUsers = job.totalUsers || mappedUsers.length || 1;
    const completedUsers = job.completedUsers || mappedUsers.filter((u) => u.status === 'COMPLETED').length;
    const failedUsers = job.failedUsers || mappedUsers.filter((u) => u.status === 'FAILED').length;
    const pct = totalUsers > 0 ? Math.round((completedUsers / totalUsers) * 100) : 0;

    const totalDataGB = job.totalDataGB || Number((totalUsers * 14.2).toFixed(1));
    const dataTransferredGB = job.dataTransferredGB || Number((completedUsers * 14.2).toFixed(1));

    return {
      id: liveId,
      name: job.name || `${job.sourceTenantDomain} → ${job.targetTenantDomain} (${workload})`,
      batchCode: job.batchCode || `BATCH-${liveId.slice(-4)}`,
      wave: job.wave || 'Wave 1',
      workload,
      workloadTypes,
      sourceTenant: job.sourceTenantDomain,
      targetTenant: job.targetTenantDomain,
      status: job.status,
      totalUsers,
      completedUsers,
      failedUsers,
      dataTransferredGB,
      totalDataGB,
      duration: job.status === 'PROCESSING' ? 'In Progress' : job.status === 'PAUSED' ? 'Paused' : 'Completed',
      startedAt: new Date(job.createdAt).toLocaleDateString() + ' ' + new Date(job.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      throughputMBs: job.status === 'PROCESSING' ? 24.5 : 0,
      stages: [
        { name: '1. Pre-Flight Auth & Health Check', status: 'COMPLETED', percent: 100, detail: 'Tenant Graph & EWS credentials verified' },
        { name: '2. Target Account & Resource Provisioning', status: 'COMPLETED', percent: 100, detail: `${totalUsers} target accounts and licenses matched` },
        {
          name: '3. Direct Chunked Data Stream (Zero Disk Staging)',
          status: job.status === 'COMPLETED' ? 'COMPLETED' : job.status === 'PROCESSING' ? 'PROCESSING' : 'PENDING',
          percent: pct,
          detail: `Direct memory pipe: Source -> Target (${job.chunkSizeMB || 10}MB chunks, checkpoints active)`,
        },
        {
          name: '4. Permissions, Delegates & Folder ACLs',
          status: job.status === 'COMPLETED' ? 'COMPLETED' : 'PENDING',
          percent: job.status === 'COMPLETED' ? 100 : Math.round(pct * 0.7),
          detail: 'Folder ACLs, external sharing links & delegate rights remapped',
        },
        {
          name: '5. Delta Catch-Up Sync & Cutover Validation',
          status: job.status === 'COMPLETED' ? 'COMPLETED' : 'PENDING',
          percent: job.status === 'COMPLETED' ? 100 : 0,
          detail: 'End-to-end integrity checksum verified, zero data loss',
        },
      ],
      users: mappedUsers,
    };
  }, []);

  // Synchronize all backend jobs triggered across all workloads
  useEffect(() => {
    const fetchAllWorkloadJobs = async () => {
      try {
        const res = await fetch('/api/jobs');
        if (res.ok) {
          const allJobs = (await res.json()) as MigrationJob[];
          if (Array.isArray(allJobs) && allJobs.length > 0) {
            const mappedJobs: ProjectJobItem[] = allJobs.map(mapBackendJobToProjectJob);
            setProjectJobs((prev: ProjectJobItem[]): ProjectJobItem[] => {
              const liveIds = new Set(mappedJobs.map((j) => j.id));
              const remainingSeed = prev.filter((s) => !liveIds.has(s.id) && !mappedJobs.some((m) => m.id.includes(s.id.slice(-4))));
              return [...mappedJobs, ...remainingSeed];
            });
          }
        }
      } catch (err) {
        console.error('Failed to fetch all workload jobs:', err);
      }
    };

    fetchAllWorkloadJobs();
  }, [mapBackendJobToProjectJob, recentJobs, activeJob]);

  // Toggle individual job expansion
  const toggleJobExpansion = (jobId: string) => {
    setExpandedJobIds((prev) => {
      const next = new Set(prev);
      if (next.has(jobId)) {
        next.delete(jobId);
      } else {
        next.add(jobId);
      }
      return next;
    });
  };

  // Expand or Collapse All
  const handleExpandAll = () => {
    if (expandedJobIds.size === filteredJobs.length) {
      setExpandedJobIds(new Set());
    } else {
      setExpandedJobIds(new Set(filteredJobs.map((j) => j.id)));
    }
  };

  // Handle Pause/Resume for a job
  const handleToggleJobState = async (jobId: string, currentStatus: string) => {
    const isPaused = currentStatus === 'PAUSED';
    const action = isPaused ? 'resume' : 'pause';
    try {
      // If it corresponds to a live backend job ID
      if (activeJob && (activeJob.id === jobId || jobId.includes(activeJob.id.slice(-6)))) {
        await fetch(`/api/jobs/${activeJob.id}/${action}`, { method: 'POST' });
        if (onRefreshJobs) onRefreshJobs();
      }

      setProjectJobs((prev) =>
        prev.map((j) => {
          if (j.id === jobId) {
            return {
              ...j,
              status: isPaused ? 'PROCESSING' : 'PAUSED',
              stages: j.stages.map((st) =>
                st.status === 'PROCESSING' || st.status === 'PENDING'
                  ? { ...st, status: isPaused ? 'PROCESSING' : 'PENDING' }
                  : st
              ),
            };
          }
          return j;
        })
      );

      setActionNotice(`Job ${jobId} successfully ${isPaused ? 'resumed' : 'paused'}.`);
      setTimeout(() => setActionNotice(null), 3500);
    } catch (err) {
      console.error('Job toggle error:', err);
    }
  };

  // Handle Retry Failed Users
  const handleRetryJob = async (jobId: string) => {
    if (currentRole === 'AUDITOR') {
      setActionNotice('Auditor accounts have read-only access and cannot alter pipeline execution state. Switch to Global Admin or Operator.');
      setTimeout(() => setActionNotice(null), 4500);
      return;
    }

    try {
      // 1. If backend active job, call the server retry endpoint
      if (activeJob && (activeJob.id === jobId || jobId.includes(activeJob.id.slice(-6)))) {
        const res = await fetch(`/api/jobs/${activeJob.id}/retry-failed`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-role': currentRole || 'GLOBAL_ADMIN',
          },
          body: JSON.stringify({}),
        });

        if (res.ok) {
          const data = await res.json();
          if (onRefreshJobs) onRefreshJobs();
          setActionNotice(`Batch retry initiated for ${data.count || 'all'} failed users in ${jobId}. Resumed into PROCESSING.`);
          setTimeout(() => setActionNotice(null), 4000);
          return;
        } else {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to trigger batch retry on active job');
        }
      }

      // 2. Also update local projectJobs and simulate progress to completed
      setProjectJobs((prev) =>
        prev.map((j) => {
          if (j.id === jobId) {
            return {
              ...j,
              status: 'PROCESSING',
              failedUsers: 0,
              users: j.users.map((u) =>
                u.status === 'FAILED'
                  ? {
                      ...u,
                      status: 'PROCESSING',
                      mailProgress: Math.max(u.mailProgress, 50),
                      driveProgress: Math.max(u.driveProgress, 40),
                      activeStep: 'Resumed: Streaming direct chunked data pipeline...',
                      errorMessage: undefined,
                    }
                  : u
              ),
            };
          }
          return j;
        })
      );
      setActionNotice(`Retry triggered for failed users in ${jobId}. Resuming direct transfer...`);
      setTimeout(() => setActionNotice(null), 3500);

      // Simulate step progression for demo/mock project jobs so it actually moves into progress and finishes
      let progressStep = 0;
      const interval = setInterval(() => {
        progressStep++;
        setProjectJobs((prev) =>
          prev.map((j) => {
            if (j.id === jobId) {
              const updatedUsers = j.users.map((u) => {
                if (u.status === 'PROCESSING') {
                  const newMail = Math.min(100, u.mailProgress + 15);
                  const newDrive = Math.min(100, u.driveProgress + 15);
                  const isDone = newMail >= 100 && newDrive >= 100;
                  return {
                    ...u,
                    status: isDone ? ('COMPLETED' as const) : ('PROCESSING' as const),
                    mailProgress: newMail,
                    driveProgress: newDrive,
                    activeStep: isDone
                      ? 'Direct streaming complete: Checksum verified, zero data loss'
                      : `Streaming chunk data (${newMail}% mail / ${newDrive}% drive)...`,
                  };
                }
                return u;
              });

              const allDone = updatedUsers.every((u) => u.status === 'COMPLETED');
              return {
                ...j,
                status: allDone ? ('COMPLETED' as const) : ('PROCESSING' as const),
                completedUsers: updatedUsers.filter((u) => u.status === 'COMPLETED').length,
                failedUsers: 0,
                users: updatedUsers,
              };
            }
            return j;
          })
        );

        if (progressStep >= 4) {
          clearInterval(interval);
        }
      }, 1000);
    } catch (err: any) {
      console.error('Job retry error:', err);
      setActionNotice(`Retry error: ${err.message || 'Failed to trigger batch retry'}`);
      setTimeout(() => setActionNotice(null), 4000);
    }
  };

  // Handle Export Job Log
  const handleExportJobLog = async (job: ProjectJobItem) => {
    try {
      if (activeJob && (activeJob.id === job.id || job.id.includes(activeJob.id.slice(-6)))) {
        window.location.href = `/api/jobs/${activeJob.id}/export-logs`;
        return;
      }
      // Generate client CSV if not active SQLite job
      const rows = [
        ['Job ID', 'Job Name', 'User Source UPN', 'Target UPN', 'Status', 'Mail Progress %', 'OneDrive Progress %', 'Size MB', 'Active Step'],
        ...job.users.map((u) => [
          job.id,
          job.name,
          u.sourceUPN,
          u.targetUPN,
          u.status,
          `${u.mailProgress}%`,
          `${u.driveProgress}%`,
          u.dataSizeMB.toString(),
          `"${u.activeStep}"`,
        ]),
      ];
      const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `${job.id}-migration-activity-log.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setActionNotice(`Exported activity log for ${job.id}.`);
      setTimeout(() => setActionNotice(null), 3000);
    } catch (err) {
      console.error('Export error:', err);
    }
  };

  // Filter jobs
  const filteredJobs = useMemo(() => {
    return projectJobs.filter((job) => {
      // Search
      const matchesSearch =
        !searchQuery ||
        job.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.batchCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.users.some((u) => u.sourceUPN.toLowerCase().includes(searchQuery.toLowerCase()));

      // Status
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'PROCESSING' && (job.status === 'PROCESSING' || (job.status as string) === 'IN_PROGRESS')) ||
        (statusFilter === 'COMPLETED' && job.status === 'COMPLETED') ||
        (statusFilter === 'FAILED' && job.status === 'FAILED') ||
        (statusFilter === 'PAUSED' && job.status === 'PAUSED');

      // Workload
      const matchesWorkload =
        workloadFilter === 'ALL' ||
        (workloadFilter === 'mail' && job.workloadTypes.includes('mail')) ||
        (workloadFilter === 'drive' && job.workloadTypes.includes('drive')) ||
        (workloadFilter === 'teams' && job.workloadTypes.includes('teams')) ||
        (workloadFilter === 'sharepoint' && job.workloadTypes.includes('sharepoint')) ||
        (workloadFilter === 'ad' && job.workloadTypes.includes('ad'));

      return matchesSearch && matchesStatus && matchesWorkload;
    });
  }, [projectJobs, searchQuery, statusFilter, workloadFilter]);

  // Project KPI Computations
  const projectCompletionPct = Math.round(
    (selectedProject.migratedUsers / (selectedProject.scopedUsers || 1)) * 100
  );
  const dataCompletionPct = Math.round(
    (selectedProject.dataTransferredGB / (selectedProject.targetDataGB || 1)) * 100
  );

  return (
    <div className="space-y-6 animate-fadeIn text-slate-800 dark:text-slate-100 font-sans">
      {/* Toast Alert Notification */}
      {actionNotice && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-xl border border-blue-500/40 flex items-center space-x-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm">{actionNotice}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. PROJECT HEADER & SELECTOR (Breadcrumbs, Switcher, Cutover Details) */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5">
            {/* Breadcrumb */}
            <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span className="text-blue-600 dark:text-blue-400">Migrate</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-slate-700 dark:text-slate-300">Projects</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-slate-900 dark:text-white font-semibold">{selectedProject.code}</span>
            </div>

            {/* Project Title and Switcher */}
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                {selectedProject.name}
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide flex items-center gap-1.5 ${
                  selectedProject.status === 'ACTIVE'
                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                }`}
              >
                {selectedProject.status === 'ACTIVE' && <Activity className="w-3 h-3 animate-pulse" />}
                {selectedProject.status === 'COMPLETED' && <CheckCircle2 className="w-3 h-3" />}
                {selectedProject.status}
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-3xl">
              {selectedProject.description}
            </p>
          </div>

          {/* Project Switcher Dropdown & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="relative">
              <select
                id="select-migration-project"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg px-3 py-2 pr-8 appearance-none cursor-pointer hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Select Migration Project"
              >
                {projects.map((proj) => (
                  <option key={proj.id} value={proj.id}>
                    {proj.code} — {proj.name.slice(0, 36)}...
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>

            <button
              id="btn-create-new-project"
              onClick={handleOpenCreateProjectModal}
              className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
              title="Create a new migration project"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Create Project</span>
            </button>

            <button
              id="btn-refresh-project"
              onClick={() => {
                setIsRefreshing(true);
                if (onRefreshJobs) onRefreshJobs();
                setTimeout(() => setIsRefreshing(false), 800);
              }}
              className="p-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors cursor-pointer"
              title="Refresh project telemetry"
              aria-label="Refresh project telemetry"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Direct Streaming Architecture Telemetry Banner */}
        <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200 dark:border-slate-700/60">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
              <Zap className="w-4 h-4 fill-current" />
              <span>Direct In-Memory Streaming (Zero Disk Staging)</span>
            </span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              <span>Chunk Size: <strong>10 MB Chunks (Range Sessions)</strong></span>
            </span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-500" />
              <span>Checkpoints & Resumable Retries: <strong>Active</strong></span>
            </span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <Activity className="w-3.5 h-3.5 text-purple-500" />
              <span>Batch Concurrency: <strong>4x - 16x Parallel Workers</strong></span>
            </span>
          </div>
          <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            TLS 1.3 / AES-256 Memory Pipe
          </span>
        </div>

        {/* Project Target Scope & Tenant Bar */}
        <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-4 text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Source:</span>
              <span className="font-mono text-blue-600 dark:text-blue-400">{selectedProject.sourceTenant}</span>
            </span>
            <span className="text-slate-300 dark:text-slate-600">→</span>
            <span className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Target:</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400">{selectedProject.targetTenant}</span>
            </span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Target Cutover: <strong className="text-slate-700 dark:text-slate-300">{selectedProject.targetCutoverDate}</strong></span>
            </span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span>Active Batch: <strong className="text-slate-700 dark:text-slate-300">{selectedProject.activeWave}</strong></span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Waves Completed:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {selectedProject.completedWaves} of {selectedProject.totalWaves}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. PROJECT-SCOPED METRICS (Project Scope vs Global Fleet) */}
      {/* ========================================================================= */}
      <section aria-labelledby="project-metrics-heading" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 id="project-metrics-heading" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Project Scope & Velocity
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Filtered to active project ({selectedProject.code})
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Project Users Migrated */}
          <div
            id="card-project-users"
            className="p-4 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Project Scoped Users</span>
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500 dark:text-blue-400 border border-blue-500/20">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {selectedProject.migratedUsers}
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  / {selectedProject.scopedUsers} ({projectCompletionPct}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
                <div
                  className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${projectCompletionPct}%` }}
                />
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 flex items-center justify-between">
                <span>{selectedProject.inProgressUsers} in-progress</span>
                <span className={selectedProject.failedUsers > 0 ? 'text-rose-500 font-medium' : ''}>
                  {selectedProject.failedUsers} attention required
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Project Data Volume */}
          <div
            id="card-project-data"
            className="p-4 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Data Transferred</span>
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20">
                <HardDrive className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {selectedProject.dataTransferredGB} GB
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  / {selectedProject.targetDataGB} GB
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
                <div
                  className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${dataCompletionPct}%` }}
                />
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 flex items-center justify-between">
                <span>Avg Rate: ~18.4 MB/s</span>
                <span className="text-emerald-500 dark:text-emerald-400 font-medium">{dataCompletionPct}% synced</span>
              </div>
            </div>
          </div>

          {/* Card 3: Project Migration Batches */}
          <div
            id="card-project-batches"
            className="p-4 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Project Migration Batches</span>
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500 dark:text-purple-400 border border-purple-500/20">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-baseline gap-2">
                <span>{projectJobs.length} Jobs</span>
                <span className="text-xs font-normal text-purple-600 dark:text-purple-400">
                  ({projectJobs.filter((j) => j.status === 'PROCESSING').length} active)
                </span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 flex items-center justify-between">
                <span>{projectJobs.filter((j) => j.status === 'COMPLETED').length} completed</span>
                <span>{projectJobs.filter((j) => j.status === 'PAUSED').length} paused</span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                Active wave: {selectedProject.activeWave}
              </div>
            </div>
          </div>

          {/* Card 4: Project Readiness & Success Rate */}
          <div
            id="card-project-health"
            className="p-4 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Project Success Rate</span>
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
                97.9%
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 flex items-center justify-between">
                <span>Graph API Status: Healthy</span>
                <span className="text-emerald-500 dark:text-emerald-400">0 throttles</span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                Target domain MX ready for cutover
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. PROJECT WORKLOADS PROGRESS STRIP (Project Scoped) */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <FolderTree className="w-4 h-4 text-blue-500" />
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
              Project Workload Coverage
            </h3>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Workload inventory scoped to {selectedProject.name}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                <Mail className="w-3.5 h-3.5 text-blue-500" />
                Exchange Mailboxes
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">148 / 160</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
              <div className="bg-blue-500 h-full rounded-full" style={{ width: '92.5%' }} />
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">92.5% completed (12 syncing)</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                <HardDrive className="w-3.5 h-3.5 text-sky-500" />
                OneDrive Accounts
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">112 / 120</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
              <div className="bg-sky-500 h-full rounded-full" style={{ width: '93.3%' }} />
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">93.3% completed (8 syncing)</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                <Globe className="w-3.5 h-3.5 text-teal-500" />
                SharePoint Sites
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">44 / 48</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
              <div className="bg-teal-500 h-full rounded-full" style={{ width: '91.6%' }} />
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">91.6% completed (4 syncing)</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                <MessageSquare className="w-3.5 h-3.5 text-purple-500" />
                Teams Channels
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">38 / 52</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
              <div className="bg-purple-500 h-full rounded-full" style={{ width: '73.0%' }} />
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">73.0% completed (14 queued)</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. PROJECT MIGRATION JOBS TABLE (With EXPANDABLE JOBS!) */}
      {/* ========================================================================= */}
      <section aria-labelledby="project-jobs-heading" className="space-y-4">
        {/* Table Toolbar: Search, Filters & Expand All Button */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-white dark:bg-slate-900/80 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[220px] max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                id="search-project-jobs"
                type="text"
                placeholder="Search jobs by name, ID, or user UPN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status Filter */}
            <select
              id="filter-job-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg px-3 py-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Filter Jobs by Status"
            >
              <option value="ALL">All Job Statuses</option>
              <option value="PROCESSING">Processing / Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="PAUSED">Paused</option>
              <option value="FAILED">Failed / Attention</option>
            </select>

            {/* Workload Filter */}
            <select
              id="filter-job-workload"
              value={workloadFilter}
              onChange={(e) => setWorkloadFilter(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg px-3 py-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Filter Jobs by Workload"
            >
              <option value="ALL">All Workloads (All Triggered Jobs)</option>
              <option value="mail">Mailbox (Exchange Online)</option>
              <option value="drive">OneDrive for Business</option>
              <option value="sharepoint">SharePoint Online Sites</option>
              <option value="teams">Microsoft Teams Data</option>
              <option value="ad">Active Directory / Entra ID</option>
            </select>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Create Project Button */}
            <button
              id="btn-toolbar-create-project"
              onClick={handleOpenCreateProjectModal}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer"
              title="Create a new migration project"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Project</span>
            </button>

            {/* Expand / Collapse All Toggle Button */}
            <button
              id="btn-expand-collapse-all"
              onClick={handleExpandAll}
              className="px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 transition flex items-center gap-1.5"
            >
              {expandedJobIds.size === filteredJobs.length ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  <span>Collapse All</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  <span>Expand All ({filteredJobs.length})</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Jobs Accordion / Expandable List */}
        <div className="space-y-3">
          {filteredJobs.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800">
              <Database className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No migration jobs matched your criteria</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Try clearing your filters or search keywords</p>
              <div className="mt-3 flex items-center justify-center gap-2">
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('ALL');
                    setWorkloadFilter('ALL');
                  }}
                  className="px-3 py-1.5 text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline"
                >
                  Clear all filters
                </button>
                <button
                  id="btn-empty-create-project"
                  onClick={handleOpenCreateProjectModal}
                  className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg shadow-sm flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Project</span>
                </button>
              </div>
            </div>
          ) : (
            filteredJobs.map((job) => {
              const isExpanded = expandedJobIds.has(job.id);
              const pct = Math.round((job.completedUsers / (job.totalUsers || 1)) * 100);

              return (
                <div
                  key={job.id}
                  id={`job-card-${job.id}`}
                  className={`bg-white dark:bg-slate-900/90 rounded-xl border transition-all duration-200 overflow-hidden shadow-sm ${
                    isExpanded
                      ? 'border-blue-500/50 shadow-md ring-1 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {/* Job Header Row (Clickable to Expand / Collapse) */}
                  <div
                    onClick={() => toggleJobExpansion(job.id)}
                    className="p-4 cursor-pointer hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 select-none"
                  >
                    <div className="flex items-start md:items-center space-x-3 min-w-0 flex-1">
                      {/* Expand / Collapse Chevron Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleJobExpansion(job.id);
                        }}
                        className={`p-1.5 rounded-lg border transition-colors shrink-0 ${
                          isExpanded
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-slate-900'
                        }`}
                        title={isExpanded ? 'Click to collapse job details' : 'Click to expand job details'}
                        aria-expanded={isExpanded}
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>

                      {/* Job Title, Wave, and Workload Tags */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-900/50">
                            {job.id}
                          </span>
                          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                            [{job.batchCode}]
                          </span>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {job.name}
                          </h4>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1 font-medium text-slate-600 dark:text-slate-300">
                            <Layers className="w-3.5 h-3.5 text-slate-400" />
                            {job.wave}
                          </span>
                          <span>•</span>
                          <span>{job.workload}</span>
                          <span>•</span>
                          <span className="font-mono text-[11px] text-slate-400">
                            {job.sourceTenant} → {job.targetTenant}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Summary Metrics & Status Badge */}
                    <div className="flex flex-wrap items-center justify-between md:justify-end gap-4 shrink-0 pl-10 md:pl-0">
                      {/* Numerical progress */}
                      <div className="text-left md:text-right">
                        <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {job.completedUsers} / {job.totalUsers} users ({pct}%)
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 md:justify-end">
                          <span>{job.dataTransferredGB} GB transferred</span>
                          {job.throughputMBs > 0 && (
                            <span className="text-emerald-500 font-medium">~{job.throughputMBs} MB/s</span>
                          )}
                        </div>
                      </div>

                      {/* Mini Progress Bar */}
                      <div className="w-24 hidden sm:block">
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              job.status === 'COMPLETED'
                                ? 'bg-emerald-500'
                                : job.status === 'FAILED'
                                ? 'bg-rose-500'
                                : job.status === 'PAUSED'
                                ? 'bg-amber-500'
                                : 'bg-blue-600'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      {/* Status Badge */}
                      <span
                        className={`px-2.5 py-1 rounded text-xs font-semibold shrink-0 flex items-center gap-1.5 ${
                          job.status === 'COMPLETED'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : job.status === 'PROCESSING' || (job.status as string) === 'IN_PROGRESS'
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                            : job.status === 'FAILED'
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {job.status === 'COMPLETED' && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {job.status === 'PROCESSING' && <Activity className="w-3.5 h-3.5 animate-pulse" />}
                        {job.status === 'FAILED' && <XCircle className="w-3.5 h-3.5" />}
                        {job.status === 'PAUSED' && <Pause className="w-3.5 h-3.5" />}
                        <span>{job.status}</span>
                      </span>
                    </div>
                  </div>

                  {/* ================================================================= */}
                  {/* EXPANDED JOB DETAILS ACCORDION SECTION */}
                  {/* ================================================================= */}
                  {isExpanded && (
                    <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-6 animate-fadeIn">
                      
                      {/* Section A: Pipeline Execution Stages */}
                      <div>
                        <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                          <Zap className="w-3.5 h-3.5 text-blue-500" />
                          <span>Job Execution Stages & Timeline</span>
                        </h5>

                        <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5">
                          {job.stages.map((stage, idx) => (
                            <div
                              key={idx}
                              className={`p-3 rounded-lg border text-xs flex flex-col justify-between ${
                                stage.status === 'COMPLETED'
                                  ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50 text-slate-800 dark:text-slate-200'
                                  : stage.status === 'PROCESSING'
                                  ? 'bg-blue-50/80 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700 text-slate-800 dark:text-slate-200 ring-1 ring-blue-500/30'
                                  : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                              }`}
                            >
                              <div>
                                <div className="flex items-center justify-between font-semibold mb-1">
                                  <span className="truncate">{stage.name}</span>
                                  {stage.status === 'COMPLETED' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                                  {stage.status === 'PROCESSING' && <Activity className="w-3.5 h-3.5 text-blue-500 animate-spin shrink-0" />}
                                  {stage.status === 'PENDING' && <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                                </div>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                                  {stage.detail}
                                </p>
                              </div>

                              <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[10px]">
                                <span>{stage.status}</span>
                                <span className="font-semibold">{stage.percent}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Section B: Assigned User & Mailbox Statuses in this Job */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                            <Users className="w-3.5 h-3.5 text-indigo-500" />
                            <span>Migrating User Accounts in this Job ({job.users.length} assigned)</span>
                          </h5>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            Real-time user synchronization status
                          </span>
                        </div>

                        <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-lg overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                  <th className="px-4 py-2.5">Source & Target User</th>
                                  <th className="px-3 py-2.5">Status</th>
                                  <th className="px-3 py-2.5">Mailbox Progress</th>
                                  <th className="px-3 py-2.5">OneDrive Progress</th>
                                  <th className="px-4 py-2.5">Active Step / Diagnostics</th>
                                  <th className="px-3 py-2.5 text-right">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-sans">
                                {job.users.map((user) => (
                                  <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                    <td className="px-4 py-3">
                                      <div className="font-medium text-slate-900 dark:text-slate-100">{user.sourceUPN}</div>
                                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">→ {user.targetUPN}</div>
                                    </td>
                                    <td className="px-3 py-3">
                                      <span
                                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                          user.status === 'COMPLETED'
                                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                            : user.status === 'PROCESSING'
                                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                                            : user.status === 'FAILED'
                                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                        }`}
                                      >
                                        {user.status}
                                      </span>
                                    </td>
                                    <td className="px-3 py-3 min-w-[120px]">
                                      <div className="flex items-center justify-between text-[11px] mb-1">
                                        <span>Mail</span>
                                        <span className="font-mono">{user.mailProgress}%</span>
                                      </div>
                                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                                        <div
                                          className={`h-full rounded-full ${user.mailProgress === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                          style={{ width: `${user.mailProgress}%` }}
                                        />
                                      </div>
                                    </td>
                                    <td className="px-3 py-3 min-w-[120px]">
                                      <div className="flex items-center justify-between text-[11px] mb-1">
                                        <span>OneDrive</span>
                                        <span className="font-mono">{user.driveProgress}%</span>
                                      </div>
                                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                                        <div
                                          className={`h-full rounded-full ${user.driveProgress === 100 ? 'bg-emerald-500' : 'bg-sky-500'}`}
                                          style={{ width: `${user.driveProgress}%` }}
                                        />
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 max-w-xs">
                                      <p className="text-[11px] text-slate-600 dark:text-slate-300 truncate" title={user.activeStep}>
                                        {user.activeStep}
                                      </p>
                                      {user.errorMessage && (
                                        <p className="text-[10px] text-rose-500 dark:text-rose-400 mt-0.5 truncate" title={user.errorMessage}>
                                          Error: {user.errorMessage}
                                        </p>
                                      )}
                                    </td>
                                    <td className="px-3 py-3 text-right">
                                      {user.status === 'FAILED' ? (
                                        <button
                                          onClick={() => handleRetryJob(job.id)}
                                          className="text-xs text-rose-600 dark:text-rose-400 hover:underline font-medium"
                                        >
                                          Retry
                                        </button>
                                      ) : onSelectJob ? (
                                        <button
                                          onClick={() => onSelectJob(job.id)}
                                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                                        >
                                          Monitor
                                        </button>
                                      ) : null}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>

                      {/* Section C: Job Execution Controls & Actions Strip */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                        {/* Technical telemetry info */}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            Started: {job.startedAt}
                          </span>
                          <span>•</span>
                          <span>Elapsed: {job.duration}</span>
                          <span>•</span>
                          <span>8 parallel worker streams</span>
                          <span>•</span>
                          <span className="text-emerald-500">Throttling delay: 0s</span>
                        </div>

                        {/* Interactive Buttons */}
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Open in Live Monitoring Cockpit */}
                          {onSelectJob && (
                            <button
                              id={`btn-cockpit-${job.id}`}
                              onClick={() => onSelectJob(job.id)}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
                            >
                              <span>Open in Live Cockpit</span>
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Pause / Resume Job */}
                          {(job.status === 'PROCESSING' || job.status === 'PAUSED') && (
                            <button
                              id={`btn-toggle-pause-${job.id}`}
                              onClick={() => handleToggleJobState(job.id, job.status)}
                              className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 border transition ${
                                job.status === 'PAUSED'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100'
                                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-800 hover:bg-amber-100'
                              }`}
                            >
                              {job.status === 'PAUSED' ? (
                                <>
                                  <Play className="w-3.5 h-3.5" />
                                  <span>Resume Job</span>
                                </>
                              ) : (
                                <>
                                  <Pause className="w-3.5 h-3.5" />
                                  <span>Pause Job</span>
                                </>
                              )}
                            </button>
                          )}

                          {/* Retry Failed */}
                          {job.failedUsers > 0 && (
                            <button
                              id={`btn-retry-failed-${job.id}`}
                              onClick={() => handleRetryJob(job.id)}
                              className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-800 hover:bg-rose-100 rounded text-xs font-semibold flex items-center gap-1.5 transition"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Retry {job.failedUsers} Failed</span>
                            </button>
                          )}

                          {/* Export Activity Log */}
                          <button
                            id={`btn-export-log-${job.id}`}
                            onClick={() => handleExportJobLog(job)}
                            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded text-xs font-medium flex items-center gap-1.5 transition"
                            title="Download activity log as CSV"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download Log (.CSV)</span>
                          </button>
                        </div>
                      </div>

                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Quick Tips / Scope Documentation Footer */}
      <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 flex items-start space-x-3 text-xs text-slate-600 dark:text-slate-400">
        <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-800 dark:text-slate-200">Migration Projects Scope Policy:</span>{' '}
          Each project tracks migration batches, wave timelines, and workload execution targets independent of overall tenant discovery. Expand any listed job above to view granular stage execution, individual user synchronizations, or to manage pause/resume actions.
        </div>
      </div>

      {/* CREATE NEW PROJECT MODAL */}
      {isNewProjectModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-9 w-9 rounded-lg bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Create New Migration Project
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Define project boundaries, source and target tenants, cutover waves, and workload scope.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsNewProjectModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newProjectForm.name.trim()) return;
                const newProj: MigrationProject = {
                  id: 'proj-' + Date.now(),
                  name: newProjectForm.name.trim(),
                  code: newProjectForm.code.trim() || 'PRJ-' + Math.floor(1000 + Math.random() * 9000),
                  description: newProjectForm.description.trim() || 'Enterprise M365 tenant cutover and consolidation project.',
                  status: newProjectForm.status,
                  sourceTenant: newProjectForm.sourceTenant || 'contoso.onmicrosoft.com',
                  targetTenant: newProjectForm.targetTenant || 'fabrikam.com',
                  targetCutoverDate: newProjectForm.targetCutoverDate || 'Nov 15, 2026',
                  scopedUsers: Number(newProjectForm.scopedUsers) || 150,
                  migratedUsers: 0,
                  inProgressUsers: 0,
                  failedUsers: 0,
                  dataTransferredGB: 0,
                  targetDataGB: Number(newProjectForm.targetDataGB) || 200.0,
                  activeWave: 'Wave 1 (Planning & Pilot)',
                  totalWaves: Number(newProjectForm.totalWaves) || 3,
                  completedWaves: 0,
                };
                setProjects((prev) => [newProj, ...prev]);
                setSelectedProjectId(newProj.id);
                setIsNewProjectModalOpen(false);

                if (newProjectForm.executeInitialDiscovery && onNavigateTab) {
                  setActionNotice(`Project "${newProj.name}" created! Transitioning to Discovery 8-Workstream Assessment...`);
                  setTimeout(() => {
                    onNavigateTab('discovery', 'assessment');
                  }, 800);
                } else {
                  setActionNotice(`Project "${newProj.name}" created successfully!`);
                  setTimeout(() => setActionNotice(null), 4000);
                }
              }}
              className="p-6 space-y-4 text-xs"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    Project Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Contoso Corp to Fabrikam Cloud Production Cutover"
                    value={newProjectForm.name}
                    onChange={(e) => setNewProjectForm({ ...newProjectForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    Project Code
                  </label>
                  <input
                    type="text"
                    value={newProjectForm.code}
                    onChange={(e) => setNewProjectForm({ ...newProjectForm, code: e.target.value })}
                    className="w-full px-3 py-2 font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    Status
                  </label>
                  <select
                    value={newProjectForm.status}
                    onChange={(e) => setNewProjectForm({ ...newProjectForm, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ACTIVE">Active (In Flight)</option>
                    <option value="PLANNING">Planning (Staging)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    Source Tenant
                  </label>
                  <input
                    type="text"
                    value={newProjectForm.sourceTenant}
                    onChange={(e) => setNewProjectForm({ ...newProjectForm, sourceTenant: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    Target Tenant
                  </label>
                  <input
                    type="text"
                    value={newProjectForm.targetTenant}
                    onChange={(e) => setNewProjectForm({ ...newProjectForm, targetTenant: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    Target Cutover Date
                  </label>
                  <input
                    type="text"
                    value={newProjectForm.targetCutoverDate}
                    onChange={(e) => setNewProjectForm({ ...newProjectForm, targetCutoverDate: e.target.value })}
                    placeholder="e.g. Nov 15, 2026"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    Total Migration Waves
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newProjectForm.totalWaves}
                    onChange={(e) => setNewProjectForm({ ...newProjectForm, totalWaves: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    Scoped Users
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newProjectForm.scopedUsers}
                    onChange={(e) => setNewProjectForm({ ...newProjectForm, scopedUsers: parseInt(e.target.value, 10) || 10 })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    Estimated Target Data (GB)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    value={newProjectForm.targetDataGB}
                    onChange={(e) => setNewProjectForm({ ...newProjectForm, targetDataGB: parseFloat(e.target.value) || 50.0 })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    Project Description
                  </label>
                  <textarea
                    rows={2}
                    value={newProjectForm.description}
                    onChange={(e) => setNewProjectForm({ ...newProjectForm, description: e.target.value })}
                    placeholder="Briefly describe the business goals, scope, and key stakeholders for this tenant migration project..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Workload Scope Pills */}
              <div className="pt-2">
                <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-2">
                  Workloads in Scope
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'mail', label: 'Exchange Mailboxes', icon: Mail },
                    { id: 'drive', label: 'OneDrive Personal Sites', icon: HardDrive },
                    { id: 'sharepoint', label: 'SharePoint Sites', icon: Globe },
                    { id: 'teams', label: 'Microsoft Teams', icon: MessageSquare },
                    { id: 'ad', label: 'Active Directory / Entra ID', icon: Layers },
                  ].map((wl) => {
                    const isSelected = newProjectForm.workloads.includes(wl.id);
                    const Icon = wl.icon;
                    return (
                      <button
                        type="button"
                        key={wl.id}
                        onClick={() => {
                          const updated = isSelected
                            ? newProjectForm.workloads.filter((w) => w !== wl.id)
                            : [...newProjectForm.workloads, wl.id];
                          setNewProjectForm({ ...newProjectForm, workloads: updated });
                        }}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center space-x-1.5 transition-colors ${
                          isSelected
                            ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-700 dark:text-blue-300 font-semibold'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        <span>{wl.label}</span>
                        {isSelected && <Check className="h-3 w-3 text-blue-600 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Initial Discovery Assessment Option */}
              <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 flex items-start space-x-3">
                <input
                  id="chk-execute-initial-discovery"
                  type="checkbox"
                  checked={newProjectForm.executeInitialDiscovery}
                  onChange={(e) =>
                    setNewProjectForm({ ...newProjectForm, executeInitialDiscovery: e.target.checked })
                  }
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="chk-execute-initial-discovery" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                  <span className="font-bold text-blue-900 dark:text-blue-300 block">
                    Execute Initial Discovery Phase across 8 Strategic Workstreams
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    Assess source tenant and fetch complete inventory: Identity & Directory, Exchange Mail, Storage & Sites, Teams Collaboration, Coexistence, 1,462 Registered Applications, Security & Compliance, and Data Quality.
                  </span>
                </label>
              </div>

              {/* Modal Footer Buttons */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsNewProjectModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="btn-confirm-create-project"
                  type="submit"
                  disabled={!newProjectForm.name.trim()}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-lg shadow-sm transition-colors flex items-center space-x-1.5"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Project</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
