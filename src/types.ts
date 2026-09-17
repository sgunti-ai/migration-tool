export type AdminRole = 'GLOBAL_ADMIN' | 'MIGRATION_OPERATOR' | 'AUDITOR';

export type MigrationUserStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'PAUSED';

export interface TenantInfo {
  connected: boolean;
  domain?: string;
  displayName?: string;
  tenantId?: string;
  adminConsentGranted?: boolean;
  connectedAt?: string;
}

export interface TenantStatusResponse {
  source: TenantInfo;
  target: TenantInfo;
}

export interface CSVUserRow {
  id: string;
  sourceUPN: string;
  targetUPN: string;
  migrateMailbox: boolean;
  migrateOneDrive: boolean;
  isValid: boolean;
  errors: string[];
}

export interface UserMigrationStatus {
  id: string;
  jobId: string;
  sourceUPN: string;
  targetUPN: string;
  status: MigrationUserStatus;
  mailboxProgress: number;
  driveProgress: number;
  migrateMailbox: boolean;
  migrateOneDrive: boolean;
  activeStep: string | null;
  errorMessage: string | null;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface MigrationJob {
  id: string;
  sourceTenantDomain: string;
  targetTenantDomain: string;
  status: 'PENDING' | 'PROCESSING' | 'PAUSED' | 'COMPLETED' | 'FAILED';
  totalUsers: number;
  completedUsers: number;
  failedUsers: number;
  createdAt: string;
  updatedAt: string;
  userStatuses?: UserMigrationStatus[];
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  resource: string;
  status: 'SUCCESS' | 'FAILED' | 'WARNING';
  details: string | null;
  ipAddress: string | null;
}

export interface SecurityStatus {
  encryptionAtRest: {
    status: string;
    algorithm: string;
    keyDerivation: string;
    verified: boolean;
  };
  encryptionInTransit: {
    status: string;
    protocol: string;
    hsts: boolean;
    verified: boolean;
  };
  rbac: {
    activeRole: AdminRole;
    rolesSupported: AdminRole[];
    enforced: boolean;
  };
  automatedBackups: {
    status: string;
    lastBackupAt: string;
    backupRetentionDays: number;
    storageEngine: string;
  };
  cloudArchitecture: {
    provider: string;
    primaryRegion: string;
    secondaryFailoverRegion: string;
    failoverReady: boolean;
    serverlessMode: string;
  };
  compliance: {
    gdpr: string;
    hipaa: string;
    iso27001: string;
    soc2Type2: string;
  };
}

export interface SystemMetrics {
  systemHealth: string;
  currentLatencyMs: number;
  latencyThresholdMs: number;
  hasLatencySpike: boolean;
  activeWsConnections: number;
  uptimeSeconds: number;
  memoryUsageMB: number;
}

export type DiscoveryWorkload = 'Users' | 'Groups' | 'OneDrive' | 'Exchange' | 'SharePoint' | 'Teams' | 'DistributionLists';

export interface DiscoveryScanStatus {
  id: string;
  scanType: 'FULL' | 'INCREMENTAL';
  status: 'NOT_STARTED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  workloads: string;
  currentStage: string | null;
  progress: number;
  totalItemsDiscovered: number;
  usersDiscovered: number;
  groupsDiscovered: number;
  oneDrivesDiscovered: number;
  mailboxesDiscovered: number;
  sharePointSitesDiscovered: number;
  teamsDiscovered: number;
  dlDiscovered: number;
  totalStorageGB: number;
  errorMessage: string | null;
  startedAt: string;
  completedAt: string | null;
}

export interface DiscoverySummary {
  workloadCounts: {
    users: number;
    groups: number;
    onedrive: number;
    exchange: number;
    sharepoint: number;
    teams: number;
    distributionLists: number;
  };
  totalItems: number;
  storage: {
    totalStorageGB: number;
    oneDriveStorageGB: number;
    sharePointStorageGB: number;
    mailboxStorageGB: number;
  };
  security: {
    mfaEnforced: number;
    mfaEnabled: number;
    mfaDisabled: number;
    mfaEnforcedRate: number;
  };
  lastScanTimestamp: string | null;
  scanType: 'FULL' | 'INCREMENTAL';
  status: string;
}

export interface DiscoveredUser {
  id: string;
  upn: string;
  displayName: string;
  department: string | null;
  jobTitle: string | null;
  manager: string | null;
  licenses: string[];
  groups: string[];
  mfaStatus: 'ENFORCED' | 'ENABLED' | 'DISABLED';
  accountEnabled: boolean;
  assignedRoles: string[];
  usageLocation: string | null;
  mailboxSizeMB: number;
  oneDriveUsedGB: number;
  lastActivityDate: string | null;
  etag: string | null;
  lastScannedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface DiscoveredUserDetail extends DiscoveredUser {
  oneDrive?: {
    id: string;
    userPrincipalName: string;
    displayName: string;
    siteUrl: string;
    storageUsedBytes: number;
    storageQuotaBytes: number;
    fileCount: number;
    lastModified: string | null;
    externalSharing: string;
    sharingLinksCount: number;
    storageUsedGB: number;
    storageQuotaGB: number;
  } | null;
  mailbox?: {
    id: string;
    userPrincipalName: string;
    displayName: string;
    mailboxType: string;
    totalItemSizeMB: number;
    itemCount: number;
    archiveStatus: string;
    archiveSizeMB: number;
    delegates: string[];
    forwardingRules: string[];
    retentionPolicy: string | null;
  } | null;
  teams?: {
    id: string;
    teamId: string;
    teamName: string;
    visibility: string;
    channelsCount: number;
    role: string;
  }[];
  managerDetails?: {
    displayName: string;
    upn: string;
    jobTitle: string | null;
    department: string | null;
  } | null;
}

export interface MailboxMigrationTemplate {
  id: string;
  name: string;
  description?: string | null;
  sourceScenario: string;
  targetScenario: string;
  
  // Step 3: Migration Options
  migrateMail: boolean;
  migrateCalendar: boolean;
  migrateContacts: boolean;
  migrateTasksNotes: boolean;
  migrateRecoverableItems: boolean;
  migrateSafeSenderList: boolean;
  resetMigration: boolean;

  // Step 4: Migration Settings
  migrateMailboxRules: boolean;
  migrateMailboxDelegation: boolean;
  enableAutomapping: boolean;
  migrateFolderPermissions: boolean;
  migrateAutoReply: boolean;
  migrateLitigationHold: boolean;

  // Step 5: Mail Flow
  manageMailForwarding: boolean;
  mailForwardingAction: string;
  forwardingDirection: string;
  customForwardingDomain?: string | null;

  // Step 6: Mail Folders
  folderSelection: string;
  excludedFolders: string[];
  specificFolders: string[];
  migrateToCustomFolder: boolean;
  customFolderName?: string | null;
  migrateToFolderMap: boolean;
  inboxTargetFolder?: string | null;
  deletedItemsTargetFolder?: string | null;
  archiveTargetFolder?: string | null;
  sentItemsTargetFolder?: string | null;

  // Step 2: Licensing Plan
  targetLicensingPlan: string;
  autoAssignLicense: boolean;

  // Step 7: Date Range
  dateRangeFilter: string;
  startDate?: string | null;
  endDate?: string | null;
  excludeItemsLargerThanMB?: number | null;

  // Step 8: Notification
  sendEmailOnComplete: boolean;
  notificationEmails: string;
  sendUserWelcomeEmail: boolean;

  // Step 9: Reporting
  detailedItemAuditLog: boolean;
  includeFailedItemReports: boolean;

  // Step 10: Schedule
  scheduleType: string;
  scheduledTime?: string | null;
  concurrencyLimit: number;

  createdAt: string;
  updatedAt: string;
}

export interface MailboxMigrationTask {
  id: string;
  taskName: string;
  templateId?: string | null;
  templateName?: string | null;
  sourceUPN: string;
  targetUPN: string;
  status: 'READY' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'PAUSED';
  progressPercent: number;
  itemsMigrated: number;
  totalItems: number;
  sizeMigratedMB: number;
  totalSizeMB: number;
  currentFolder?: string | null;
  errorMessage?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}


