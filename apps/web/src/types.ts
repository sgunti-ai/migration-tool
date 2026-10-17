export type AdminRole = 'GLOBAL_ADMIN' | 'MIGRATION_OPERATOR' | 'AUDITOR';

export type MigrationUserStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'PAUSED';

export interface TenantInfo {
  connected: boolean;
  domain?: string;
  displayName?: string;
  tenantId?: string;
  clientId?: string;
  cloudEnvironment?: string;
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

export type MigrationWorkloadType =
  | 'EXCHANGE_MAILBOX'
  | 'ONEDRIVE'
  | 'SHAREPOINT'
  | 'TEAMS'
  | 'ACTIVE_DIRECTORY'
  | 'HYBRID_CUTOVER';

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
  checkpointStage?: string | null;
  bytesMigrated?: number | null;
  totalBytes?: number | null;
  resumableToken?: string | null;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface MigrationJob {
  id: string;
  sourceTenantDomain: string;
  targetTenantDomain: string;
  name?: string | null;
  workloadType?: MigrationWorkloadType | string | null;
  batchCode?: string | null;
  wave?: string | null;
  status: 'PENDING' | 'PROCESSING' | 'PAUSED' | 'COMPLETED' | 'FAILED';
  streamingMode?: 'DIRECT_CHUNKED' | 'IN_MEMORY_STREAM' | string | null;
  chunkSizeMB?: number | null;
  concurrencyLimit?: number | null;
  totalDataGB?: number | null;
  dataTransferredGB?: number | null;
  checkpointState?: string | null;
  configPayload?: string | null;
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
  status: 'NOT_STARTED' | 'RUNNING' | 'RETRYING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
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
  retryCount?: number;
  maxRetries?: number;
  disconnectReason?: string;
  lastCompletedWorkload?: string;
  resumedFromStage?: string | null;
  sourceTenantDomain?: string;
  currentStageIndex?: number;
  totalStages?: number;
}

export interface DiscoverySummary {
  sourceTenant?: {
    domain: string;
  } | string;
  readinessScore?: number;
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
    exchangeStorageGB?: number;
  };
  security: {
    mfaEnforced: number;
    mfaEnabled: number;
    mfaDisabled: number;
    mfaEnforcedRate: number;
    mfaEnforcedPercent?: number;
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

export type PreFlightCategory =
  | 'LICENSING'
  | 'STORAGE'
  | 'IDENTITY'
  | 'PERMISSIONS'
  | 'NETWORK'
  | 'COEXISTENCE';

export type PreFlightStatus = 'PASSED' | 'WARNING' | 'FAILED' | 'RUNNING' | 'PENDING';

export interface PreFlightCheckItem {
  id: string;
  category: PreFlightCategory;
  title: string;
  description: string;
  status: PreFlightStatus;
  details: string;
  metrics?: Record<string, any>;
  recommendation?: string;
  durationMs?: number;
}

export interface PreFlightValidationReport {
  overallStatus: 'PASSED' | 'WARNING' | 'FAILED';
  readinessScore: number;
  timestamp: string;
  durationMs: number;
  summary: {
    total: number;
    passed: number;
    warnings: number;
    failures: number;
  };
  checks: PreFlightCheckItem[];
  canProceed: boolean;
  workloadType: string;
  targetLicensingSku?: string;
  sourceTenant?: string;
  targetTenant?: string;
}

export type BatchDependencyCondition = 'SUCCESS' | 'COMPLETED_ANY' | 'START_PARALLEL';
export type BatchFailureAction = 'STOP_QUEUE' | 'SKIP_DEPENDENTS' | 'CONTINUE';

export interface MigrationBatchItem {
  id: string;
  name: string;
  batchCode: string;
  workloadType: MigrationWorkloadType;
  userCount: number;
  startTime: string; // YYYY-MM-DDTHH:mm
  endTime: string;   // YYYY-MM-DDTHH:mm
  dependsOnBatchId: string | null;
  dependencyCondition: BatchDependencyCondition;
  concurrencyLimit: number;
  chunkSizeMB: number;
  priority: 'VIP' | 'HIGH' | 'STANDARD' | 'OFF_PEAK';
  actionOnDependencyFailure: BatchFailureAction;
  notes?: string;
}

export interface MigrationQueueConfig {
  enabled: boolean;
  queueName: string;
  enforceSequentialExecution: boolean;
  globalCutoffTime?: string;
  pauseOnAnyFailure: boolean;
  batches: MigrationBatchItem[];
}

// =========================================================================
// 8-WORKSTREAM INITIAL PROJECT DISCOVERY ASSESSMENT INTERFACES
// =========================================================================

export interface IdentityDirectoryAssessment {
  totalUsers: number;
  totalGroups: number;
  totalContacts: number;
  userBreakdown: {
    internalMembers: number;
    guestUsers: number;
    syncFromOnPrem: number;
    cloudOnly: number;
  };
  groupBreakdown: {
    securityGroups: number;
    m365UnifiedGroups: number;
    mailEnabledSecurity: number;
    distributionLists: number;
  };
  upnAndSmtpPatterns: {
    primaryUpnDomains: { domain: string; count: number; pattern: string }[];
    smtpRoutingPatterns: { domain: string; isAuthoritative: boolean; formatExample: string; count: number }[];
    aliasCountTotal: number;
  };
  licenseAssignments: {
    skuName: string;
    skuId: string;
    totalUnits: number;
    consumedUnits: number;
    availableUnits: number;
    assignedUsersCount: number;
  }[];
  dormantAccounts: {
    thresholdDays: number;
    count: number;
    percentage: number;
    sampleAccounts: { upn: string; lastSignIn: string; department: string; hasLicense: boolean }[];
  };
  duplicateAccounts: {
    count: number;
    criteria: string;
    clusters: { displayName: string; accounts: { upn: string; id: string; type: string; mail: string }[] }[];
  };
}

export interface ExchangeMailAssessment {
  totalMailboxes: number;
  mailboxTypes: {
    userMailboxes: number;
    sharedMailboxes: number;
    roomMailboxes: number;
    equipmentMailboxes: number;
    discoverySearchMailboxes: number;
  };
  sizeDistribution: {
    under2GB: number;
    between2And10GB: number;
    between10And25GB: number;
    between25And50GB: number;
    exceeding50GB: number;
    totalSizeGB: number;
    avgSizeGB: number;
  };
  archiveFootprint: {
    enabledArchivesCount: number;
    autoExpandingArchivesCount: number;
    totalArchiveStorageGB: number;
    largestArchiveSizeGB: number;
  };
  acceptedDomains: {
    domainName: string;
    domainType: 'Authoritative' | 'InternalRelay';
    isDefault: boolean;
    outboundConnectorConfigured: boolean;
  }[];
  transportRules: {
    ruleId: string;
    name: string;
    state: 'Enabled' | 'Disabled';
    priority: number;
    actions: string[];
    conditions: string[];
  }[];
  retentionPolicies: {
    policyName: string;
    isDefaultMRM: boolean;
    tagsCount: number;
    associatedMailboxes: number;
    actionsSummary: string;
  }[];
  documentHolds: {
    litigationHoldCount: number;
    inPlaceHoldCount: number;
    purviewCaseHoldCount: number;
    totalHeldMailboxes: number;
  };
}

export interface OneDriveSharePointAssessment {
  totalOneDriveAccounts: number;
  activeOneDriveCount: number;
  totalSharePointSites: number;
  activeSharePointSites: number;
  storageUsage: {
    oneDriveAllocatedGB: number;
    oneDriveActualUsedGB: number;
    sharePointAllocatedGB: number;
    sharePointActualUsedGB: number;
    totalFilesCount: number;
  };
  permissionModels: {
    sitesWithUniquePermissions: number;
    sitesWithInheritedPermissions: number;
    externalSharingEnabledSites: number;
    anonymousLinksEnabledSites: number;
  };
  brokenInheritance: {
    librariesWithBrokenInheritance: number;
    foldersWithCustomACLs: number;
    itemsWithDirectSharingLinks: number;
  };
  excessivePathLength: {
    exceeding260CharsWin32: number;
    exceeding400CharsSharePoint: number;
    longestPathFoundChars: number;
    samplePaths: { site: string; relativePath: string; length: number }[];
  };
  unsupportedCharacters: {
    filesWithUnsupportedChars: number;
    detectedCharacters: string[];
    samplePaths: { fileName: string; path: string; invalidChars: string[] }[];
  };
}

export interface TeamsCollaborationAssessment {
  totalTeams: number;
  teamTypes: {
    publicTeams: number;
    privateTeams: number;
    orgWideTeams: number;
  };
  channels: {
    standardChannels: number;
    privateChannels: number;
    sharedCrossTenantChannels: number;
    totalChannels: number;
  };
  tabs: {
    totalTabs: number;
    breakdownByType: { tabType: string; count: number }[];
  };
  thirdPartyApps: {
    totalIntegratedApps: number;
    appsList: { appName: string; appId: string; publisher: string; installedTeamsCount: number; permissionsRequired: string[] }[];
  };
  teamsPolicies: {
    messagingPoliciesCount: number;
    meetingPoliciesCount: number;
    appPermissionPoliciesCount: number;
    guestAccessEnabled: boolean;
    externalChatAllowed: boolean;
  };
}

export interface GoogleWorkspaceAssessment {
  isApplicable: boolean;
  sourceDomain: string;
  gmailVolume: {
    totalAccounts: number;
    totalMessagesCount: number;
    totalStorageGB: number;
    domainAliases: string[];
  };
  myDriveAndSharedDrives: {
    myDriveAccounts: number;
    myDriveStorageGB: number;
    sharedDrivesCount: number;
    sharedDrivesStorageGB: number;
    externalSharesCount: number;
  };
  googleClassroom: {
    activeClassesCount: number;
    enrolledStudentsCount: number;
    activeTeachersCount: number;
    courseDrivesCount: number;
    courseworkAssignmentsCount: number;
  };
  googleGroups: {
    totalGroups: number;
    externalMemberAllowedCount: number;
    securitySettingsSummary: string;
  };
  vaultHolds: {
    totalMatters: number;
    activeHoldsCount: number;
    retentionRulesCount: number;
    heldAccountsCount: number;
  };
}

export interface ApplicationsSsoAssessment {
  totalRegisteredApplications: number; // Targeting 1,462
  classifiedByOwner: {
    itManagedEnterprise: number;
    thirdPartyVerifiedVendor: number;
    individualDeveloper: number;
    orphanedOwner: number;
  };
  classifiedByAuthMethod: {
    sourceTenantEntraIdNative: number;
    externalFederatedOidcSaml: number;
    legacyAuthProtocols: number;
    multiTenantEnabled: number;
  };
  highPrivilegeApps: {
    appCountWithAppOnlyPermissions: number;
    appCountWithDirectoryRoleAssignments: number;
    appCountWithExpiredSecrets: number;
    appCountWithSecretsExpiringIn30Days: number;
  };
  sampleApplications: {
    appId: string;
    displayName: string;
    ownerType: string;
    authMethod: string;
    permissions: string[];
    signInActivity90Days: number;
  }[];
}

export interface SecurityComplianceAssessment {
  conditionalAccessPolicies: {
    totalPolicies: number;
    enabledPolicies: number;
    reportOnlyPolicies: number;
    keyPoliciesEnforced: { policyName: string; state: string; grantControls: string[]; targetUsers: string }[];
  };
  mfaPolicies: {
    enforcedUsersCount: number;
    registrationCampaignState: string;
    fido2Allowed: boolean;
    numberMatchingEnforced: boolean;
    legacySmsAllowed: boolean;
  };
  purviewConfiguration: {
    sensitivityLabelsCount: number;
    autoLabelingPoliciesCount: number;
    activeClassifiersCount: number;
    publishedLabelPoliciesCount: number;
  };
  dlpConfiguration: {
    activeDlpPoliciesCount: number;
    locationsCovered: string[];
    rulesConfigured: { ruleName: string; sensitiveInfoTypes: string[]; action: string }[];
  };
  retentionRequirements: {
    retentionLabelsCount: number;
    autoApplyRulesCount: number;
    policiesSummary: string[];
  };
  legalHoldRequirements: {
    activeEdiscoveryCases: number;
    totalCustodiansOnHold: number;
    totalHoldLocations: number;
  };
  safeguardingRequirements: {
    communicationCompliancePolicies: number;
    informationBarriersConfigured: boolean;
    customerLockboxEnabled: boolean;
  };
  dataResidencyConfigurations: {
    primaryGeo: string;
    multiGeoConfigured: boolean;
    satelliteGeos: string[];
    workloadsInSatelliteGeos: string[];
  };
}

export interface DataQualityAssessment {
  mailboxesExceeding50GB: {
    count: number;
    totalExcessGB: number;
    mailboxes: { upn: string; sizeGB: number; quotaGB: number; itemCount: number }[];
  };
  staleAccounts: {
    inactiveOver180Days: number;
    neverSignedInCount: number;
    disabledAccountsWithData: number;
  };
  duplicateContent: {
    duplicateAttachmentVolumeGB: number;
    redundantSyncedFolderCount: number;
    estimatedSavingsGB: number;
  };
  orphanedContent: {
    orphanedSharePointSitesCount: number;
    orphanedOneDrivesCount: number;
    orphanedStorageGB: number;
  };
  dormantTeams: {
    count: number;
    inactiveOver90Days: number;
    inactiveOver180Days: number;
    teamsList: { teamName: string; lastActivityDate: string; channelsCount: number; storageGB: number }[];
  };
  dormantSharePointSites: {
    count: number;
    inactiveOver180Days: number;
    sitesList: { siteUrl: string; title: string; storageGB: number; lastModifiedDate: string }[];
  };
}

export interface ProjectDiscoveryAssessmentReport {
  projectId: string;
  projectName: string;
  sourceTenantDomain: string;
  assessmentTimestamp: string;
  status: 'COMPLETED' | 'IN_PROGRESS';
  overallScore: number;
  readinessRating: 'HIGH_READINESS' | 'MEDIUM_COMPLEXITY' | 'CRITICAL_REMEDIATION_REQUIRED';
  totalObjectsScoped: number;
  totalStorageScopedGB: number;
  workstreams: {
    identityDirectory: IdentityDirectoryAssessment;
    exchangeMail: ExchangeMailAssessment;
    oneDriveSharePoint: OneDriveSharePointAssessment;
    teamsCollaboration: TeamsCollaborationAssessment;
    googleWorkspace: GoogleWorkspaceAssessment;
    applicationsSso: ApplicationsSsoAssessment;
    securityCompliance: SecurityComplianceAssessment;
    dataQuality: DataQualityAssessment;
  };
}



