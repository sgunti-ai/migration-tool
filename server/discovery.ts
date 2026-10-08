import { prisma } from './db.js';
import { recordAuditLog } from './audit.js';
import { broadcast } from './orchestrator.js';

export interface DiscoveryScanOptions {
  scanType?: 'FULL' | 'INCREMENTAL';
  workloads?: string[];
}

// In-memory reference to active scan state & timer
export interface ActiveScanState {
  scanId: string;
  scanType: string;
  workloads: string[];
  sourceTenantDomain: string;
  currentStageIndex: number;
  retryCount: number;
  maxRetries: number;
  status: 'RUNNING' | 'RETRYING' | 'PAUSED' | 'COMPLETED' | 'FAILED';
  currentStageName: string;
  resumedFromStage?: string;
  progress: number;
  startedAt: Date;
}

let activeScanState: ActiveScanState | null = null;
let activeScanTimer: NodeJS.Timeout | null = null;
let lastFailedScanCheckpoint: {
  scanId: string;
  scanType: string;
  workloads: string[];
  sourceTenantDomain: string;
  currentStageIndex: number;
  progress: number;
  lastCompletedWorkload?: string;
  disconnectReason?: string;
} | null = null;

// Workload stages explicitly covering all 7 workloads requested
export const DISCOVERY_WORKLOAD_STAGES = [
  { id: 'Exchange', workload: 'Exchange', label: 'Mailboxes', name: 'Exchange Online Mailboxes, In-Place Archives & Routing', pct: 15 },
  { id: 'Users', workload: 'Users', label: 'User Accounts', name: 'Entra ID User Accounts, Licenses, RBAC & MFA Enforcements', pct: 30 },
  { id: 'Groups', workload: 'Groups', label: 'Groups', name: 'Security Groups & Microsoft 365 Unified Collaboration Groups', pct: 45 },
  { id: 'DistributionLists', workload: 'DistributionLists', label: 'Distribution Lists', name: 'Distribution Lists, Delivery Restrictions & Moderation Policies', pct: 60 },
  { id: 'OneDrive', workload: 'OneDrive', label: 'OneDrive Accounts', name: 'OneDrive for Business Personal Sites, Quotas & External Sharing', pct: 75 },
  { id: 'SharePoint', workload: 'SharePoint', label: 'SharePoint Sites', name: 'SharePoint Online Site Collections, Document Libraries & Permissions', pct: 88 },
  { id: 'Teams', workload: 'Teams', label: 'Teams Data', name: 'Microsoft Teams, Channels, Tabs, File Hierarchies & Apps', pct: 98 },
];

// Initial high-fidelity seed dataset across all 7 M365 workloads
export const SEED_DISCOVERY_USERS = [
  {
    upn: 'adele.vance@contoso.onmicrosoft.com',
    displayName: 'Adele Vance',
    department: 'Marketing',
    jobTitle: 'Senior Product Marketing Manager',
    manager: 'miriam.graham@contoso.onmicrosoft.com',
    licenses: JSON.stringify(['Microsoft 365 E5 Enterprise', 'Teams Phone Standard', 'Power BI Pro']),
    groups: JSON.stringify(['All Company', 'Marketing Team', 'Product Launch 2026', 'Leadership Council']),
    mfaStatus: 'ENFORCED',
    accountEnabled: true,
    assignedRoles: JSON.stringify(['User Administrator']),
    usageLocation: 'US',
    mailboxSizeMB: 14320.5,
    oneDriveUsedGB: 48.2,
    lastActivityDate: new Date(Date.now() - 3600000 * 4),
    etag: 'W/"e5-user-001"',
  },
  {
    upn: 'alex.wilber@contoso.onmicrosoft.com',
    displayName: 'Alex Wilber',
    department: 'Engineering',
    jobTitle: 'Lead DevOps & Cloud Infrastructure Specialist',
    manager: 'megan.bowen@contoso.onmicrosoft.com',
    licenses: JSON.stringify(['Microsoft 365 E5 Enterprise', 'GitHub Enterprise', 'Dynamics 365']),
    groups: JSON.stringify(['All Company', 'Cloud Architecture', 'DevOps Guild', 'SecOps Alerts']),
    mfaStatus: 'ENFORCED',
    accountEnabled: true,
    assignedRoles: JSON.stringify(['Cloud Application Administrator']),
    usageLocation: 'US',
    mailboxSizeMB: 8940.2,
    oneDriveUsedGB: 112.5,
    lastActivityDate: new Date(Date.now() - 3600000 * 2),
    etag: 'W/"e5-user-002"',
  },
  {
    upn: 'megan.bowen@contoso.onmicrosoft.com',
    displayName: 'Megan Bowen',
    department: 'Engineering',
    jobTitle: 'VP of Engineering & Architecture',
    manager: 'patti.fernandez@contoso.onmicrosoft.com',
    licenses: JSON.stringify(['Microsoft 365 E5 Enterprise', 'Copilot for M365', 'Visio Plan 2']),
    groups: JSON.stringify(['All Company', 'Executive Board', 'Engineering Leads', 'Architecture Review']),
    mfaStatus: 'ENFORCED',
    accountEnabled: true,
    assignedRoles: JSON.stringify(['Global Administrator']),
    usageLocation: 'US',
    mailboxSizeMB: 38400.0,
    oneDriveUsedGB: 284.0,
    lastActivityDate: new Date(Date.now() - 3600000 * 1),
    etag: 'W/"e5-user-003"',
  },
  {
    upn: 'diego.siciliani@contoso.onmicrosoft.com',
    displayName: 'Diego Siciliani',
    department: 'Sales',
    jobTitle: 'Global Strategic Account Director',
    manager: 'patti.fernandez@contoso.onmicrosoft.com',
    licenses: JSON.stringify(['Microsoft 365 E3', 'Dynamics 365 Sales Enterprise', 'Copilot for M365']),
    groups: JSON.stringify(['All Company', 'Global Sales Team', 'EMEA Accounts', 'Revenue Operations']),
    mfaStatus: 'ENABLED',
    accountEnabled: true,
    assignedRoles: JSON.stringify([]),
    usageLocation: 'GB',
    mailboxSizeMB: 27500.8,
    oneDriveUsedGB: 86.4,
    lastActivityDate: new Date(Date.now() - 3600000 * 6),
    etag: 'W/"e3-user-004"',
  },
  {
    upn: 'enrico.catta@contoso.onmicrosoft.com',
    displayName: 'Enrico Cattaneo',
    department: 'Finance & Accounting',
    jobTitle: 'Controller & Compliance Officer',
    manager: 'patti.fernandez@contoso.onmicrosoft.com',
    licenses: JSON.stringify(['Microsoft 365 E5 Enterprise', 'Power Automate Premium']),
    groups: JSON.stringify(['All Company', 'Finance Confidential', 'SOX Audit Committee']),
    mfaStatus: 'ENFORCED',
    accountEnabled: true,
    assignedRoles: JSON.stringify(['Compliance Administrator']),
    usageLocation: 'US',
    mailboxSizeMB: 19800.4,
    oneDriveUsedGB: 41.0,
    lastActivityDate: new Date(Date.now() - 3600000 * 12),
    etag: 'W/"e5-user-005"',
  },
  {
    upn: 'isaiah.langer@contoso.onmicrosoft.com',
    displayName: 'Isaiah Langer',
    department: 'Human Resources',
    jobTitle: 'Director of People & Culture',
    manager: 'patti.fernandez@contoso.onmicrosoft.com',
    licenses: JSON.stringify(['Microsoft 365 E3', 'Viva Insights Suite']),
    groups: JSON.stringify(['All Company', 'HR Operations', 'Recruitment Taskforce']),
    mfaStatus: 'ENFORCED',
    accountEnabled: true,
    assignedRoles: JSON.stringify([]),
    usageLocation: 'US',
    mailboxSizeMB: 12400.0,
    oneDriveUsedGB: 34.6,
    lastActivityDate: new Date(Date.now() - 3600000 * 8),
    etag: 'W/"e3-user-006"',
  },
  {
    upn: 'joni.sherman@contoso.onmicrosoft.com',
    displayName: 'Joni Sherman',
    department: 'Legal & Intellectual Property',
    jobTitle: 'Senior Legal Counsel & eDiscovery Lead',
    manager: 'patti.fernandez@contoso.onmicrosoft.com',
    licenses: JSON.stringify(['Microsoft 365 E5 Enterprise', 'eDiscovery Premium']),
    groups: JSON.stringify(['All Company', 'Legal Counsel', 'Data Governance Board']),
    mfaStatus: 'ENFORCED',
    accountEnabled: true,
    assignedRoles: JSON.stringify(['eDiscovery Manager', 'Privileged Role Admin']),
    usageLocation: 'US',
    mailboxSizeMB: 31200.0,
    oneDriveUsedGB: 95.8,
    lastActivityDate: new Date(Date.now() - 3600000 * 3),
    etag: 'W/"e5-user-007"',
  },
  {
    upn: 'lynne.robbins@contoso.onmicrosoft.com',
    displayName: 'Lynne Robbins',
    department: 'Marketing',
    jobTitle: 'Content Strategist & Media Manager',
    manager: 'adele.vance@contoso.onmicrosoft.com',
    licenses: JSON.stringify(['Microsoft 365 Business Premium']),
    groups: JSON.stringify(['All Company', 'Marketing Team', 'Creative Assets']),
    mfaStatus: 'ENABLED',
    accountEnabled: true,
    assignedRoles: JSON.stringify([]),
    usageLocation: 'US',
    mailboxSizeMB: 6420.0,
    oneDriveUsedGB: 68.3,
    lastActivityDate: new Date(Date.now() - 3600000 * 14),
    etag: 'W/"bp-user-008"',
  },
  {
    upn: 'nestor.wilke@contoso.onmicrosoft.com',
    displayName: 'Nestor Wilke',
    department: 'Engineering',
    jobTitle: 'Senior Backend Systems Architect',
    manager: 'megan.bowen@contoso.onmicrosoft.com',
    licenses: JSON.stringify(['Microsoft 365 E5 Enterprise', 'GitHub Enterprise']),
    groups: JSON.stringify(['All Company', 'Engineering Leads', 'Microservices Guild']),
    mfaStatus: 'ENFORCED',
    accountEnabled: true,
    assignedRoles: JSON.stringify([]),
    usageLocation: 'DE',
    mailboxSizeMB: 15400.0,
    oneDriveUsedGB: 145.2,
    lastActivityDate: new Date(Date.now() - 3600000 * 5),
    etag: 'W/"e5-user-009"',
  },
  {
    upn: 'patti.fernandez@contoso.onmicrosoft.com',
    displayName: 'Patti Fernandez',
    department: 'Executive Leadership',
    jobTitle: 'Chief Information Officer (CIO)',
    manager: null,
    licenses: JSON.stringify(['Microsoft 365 E5 Enterprise', 'Copilot for M365', 'Defender for Cloud']),
    groups: JSON.stringify(['All Company', 'Executive Board', 'Security Steering Group']),
    mfaStatus: 'ENFORCED',
    accountEnabled: true,
    assignedRoles: JSON.stringify(['Global Administrator', 'Security Administrator']),
    usageLocation: 'US',
    mailboxSizeMB: 46200.0,
    oneDriveUsedGB: 320.0,
    lastActivityDate: new Date(Date.now() - 3600000 * 1),
    etag: 'W/"e5-user-010"',
  },
  {
    upn: 'pradeep.gupta@contoso.onmicrosoft.com',
    displayName: 'Pradeep Gupta',
    department: 'Information Technology',
    jobTitle: 'Identity & Access Lead',
    manager: 'patti.fernandez@contoso.onmicrosoft.com',
    licenses: JSON.stringify(['Microsoft 365 E5 Enterprise', 'Entra ID P2']),
    groups: JSON.stringify(['All Company', 'IT Operations', 'SecOps Alerts']),
    mfaStatus: 'ENFORCED',
    accountEnabled: true,
    assignedRoles: JSON.stringify(['Privileged Authentication Admin']),
    usageLocation: 'IN',
    mailboxSizeMB: 11300.0,
    oneDriveUsedGB: 52.4,
    lastActivityDate: new Date(Date.now() - 3600000 * 3),
    etag: 'W/"e5-user-011"',
  },
  {
    upn: 'contractor.test@contoso.onmicrosoft.com',
    displayName: 'Temp Contractor',
    department: 'Operations',
    jobTitle: 'Data Quality Specialist (Contract)',
    manager: 'diego.siciliani@contoso.onmicrosoft.com',
    licenses: JSON.stringify(['Exchange Online Plan 1']),
    groups: JSON.stringify(['Contractors External']),
    mfaStatus: 'DISABLED',
    accountEnabled: false,
    assignedRoles: JSON.stringify([]),
    usageLocation: 'US',
    mailboxSizeMB: 2100.0,
    oneDriveUsedGB: 2.1,
    lastActivityDate: new Date(Date.now() - 3600000 * 24 * 45),
    etag: 'W/"exo-user-012"',
  },
];

export const SEED_DISCOVERY_GROUPS = [
  {
    groupId: 'grp_001',
    name: 'All Company',
    email: 'allcompany@contoso.onmicrosoft.com',
    groupType: 'Microsoft 365',
    memberCount: 384,
    owners: JSON.stringify(['patti.fernandez@contoso.onmicrosoft.com']),
    members: JSON.stringify(['adele.vance@contoso.onmicrosoft.com', 'alex.wilber@contoso.onmicrosoft.com', 'megan.bowen@contoso.onmicrosoft.com']),
    isMailEnabled: true,
    isSecurityEnabled: true,
  },
  {
    groupId: 'grp_002',
    name: 'Cloud Architecture & DevOps',
    email: 'cloud-devops@contoso.onmicrosoft.com',
    groupType: 'Microsoft 365',
    memberCount: 42,
    owners: JSON.stringify(['alex.wilber@contoso.onmicrosoft.com', 'megan.bowen@contoso.onmicrosoft.com']),
    members: JSON.stringify(['nestor.wilke@contoso.onmicrosoft.com', 'alex.wilber@contoso.onmicrosoft.com']),
    isMailEnabled: true,
    isSecurityEnabled: true,
  },
  {
    groupId: 'grp_003',
    name: 'Global Admin SG',
    email: null,
    groupType: 'Security',
    memberCount: 5,
    owners: JSON.stringify(['patti.fernandez@contoso.onmicrosoft.com']),
    members: JSON.stringify(['megan.bowen@contoso.onmicrosoft.com', 'pradeep.gupta@contoso.onmicrosoft.com']),
    isMailEnabled: false,
    isSecurityEnabled: true,
  },
  {
    groupId: 'grp_004',
    name: 'Finance SOX Approvers',
    email: 'finance-sox@contoso.onmicrosoft.com',
    groupType: 'Mail-Enabled Security',
    memberCount: 18,
    owners: JSON.stringify(['enrico.catta@contoso.onmicrosoft.com']),
    members: JSON.stringify(['enrico.catta@contoso.onmicrosoft.com', 'joni.sherman@contoso.onmicrosoft.com']),
    isMailEnabled: true,
    isSecurityEnabled: true,
  },
  {
    groupId: 'grp_005',
    name: 'Marketing Launch Dynamic SG',
    email: null,
    groupType: 'Dynamic',
    memberCount: 65,
    owners: JSON.stringify(['adele.vance@contoso.onmicrosoft.com']),
    members: JSON.stringify(['adele.vance@contoso.onmicrosoft.com', 'lynne.robbins@contoso.onmicrosoft.com']),
    isMailEnabled: false,
    isSecurityEnabled: true,
  },
];

export const SEED_DISCOVERY_ONEDRIVES = [
  {
    userPrincipalName: 'adele.vance@contoso.onmicrosoft.com',
    displayName: 'Adele Vance OneDrive',
    siteUrl: 'https://contoso-my.sharepoint.com/personal/adele_vance_contoso_onmicrosoft_com',
    storageUsedBytes: 51754352640, // 48.2 GB
    storageQuotaBytes: 1099511627776, // 1 TB
    fileCount: 4230,
    lastModified: new Date(Date.now() - 3600000 * 3),
    externalSharing: 'ExistingGuests',
    sharingLinksCount: 14,
  },
  {
    userPrincipalName: 'alex.wilber@contoso.onmicrosoft.com',
    displayName: 'Alex Wilber OneDrive',
    siteUrl: 'https://contoso-my.sharepoint.com/personal/alex_wilber_contoso_onmicrosoft_com',
    storageUsedBytes: 120795955200, // 112.5 GB
    storageQuotaBytes: 1099511627776,
    fileCount: 18450,
    lastModified: new Date(Date.now() - 3600000 * 1),
    externalSharing: 'Disabled',
    sharingLinksCount: 4,
  },
  {
    userPrincipalName: 'megan.bowen@contoso.onmicrosoft.com',
    displayName: 'Megan Bowen OneDrive',
    siteUrl: 'https://contoso-my.sharepoint.com/personal/megan_bowen_contoso_onmicrosoft_com',
    storageUsedBytes: 304942678016, // 284 GB
    storageQuotaBytes: 5497558138880, // 5 TB
    fileCount: 34120,
    lastModified: new Date(Date.now() - 3600000 * 2),
    externalSharing: 'ExistingGuests',
    sharingLinksCount: 28,
  },
  {
    userPrincipalName: 'diego.siciliani@contoso.onmicrosoft.com',
    displayName: 'Diego Siciliani OneDrive',
    siteUrl: 'https://contoso-my.sharepoint.com/personal/diego_siciliani_contoso_onmicrosoft_com',
    storageUsedBytes: 92771295232, // 86.4 GB
    storageQuotaBytes: 1099511627776,
    fileCount: 8900,
    lastModified: new Date(Date.now() - 3600000 * 5),
    externalSharing: 'Anyone',
    sharingLinksCount: 42,
  },
  {
    userPrincipalName: 'nestor.wilke@contoso.onmicrosoft.com',
    displayName: 'Nestor Wilke OneDrive',
    siteUrl: 'https://contoso-my.sharepoint.com/personal/nestor_wilke_contoso_onmicrosoft_com',
    storageUsedBytes: 155914600448, // 145.2 GB
    storageQuotaBytes: 1099511627776,
    fileCount: 22100,
    lastModified: new Date(Date.now() - 3600000 * 4),
    externalSharing: 'NewAndExistingGuests',
    sharingLinksCount: 9,
  },
];

export const SEED_DISCOVERY_MAILBOXES = [
  {
    userPrincipalName: 'adele.vance@contoso.onmicrosoft.com',
    displayName: 'Adele Vance',
    mailboxType: 'UserMailbox',
    totalItemSizeMB: 14320.5,
    itemCount: 24890,
    archiveStatus: 'Active',
    archiveSizeMB: 38200.0,
    delegates: JSON.stringify(['FullAccess: lynne.robbins@contoso.onmicrosoft.com', 'SendAs: miriam.graham@contoso.onmicrosoft.com']),
    forwardingRules: JSON.stringify(['Rule: AutoArchivePress -> Folder: Press 2026']),
    retentionPolicy: 'Standard 7 Year Corporate Retention',
  },
  {
    userPrincipalName: 'alex.wilber@contoso.onmicrosoft.com',
    displayName: 'Alex Wilber',
    mailboxType: 'UserMailbox',
    totalItemSizeMB: 8940.2,
    itemCount: 16420,
    archiveStatus: 'Active',
    archiveSizeMB: 18500.0,
    delegates: JSON.stringify([]),
    forwardingRules: JSON.stringify(['ForwardTo: devops-alerts@contoso.onmicrosoft.com (DeliverToMailboxAndForward: true)']),
    retentionPolicy: 'Engineering Technical Records 5 Year',
  },
  {
    userPrincipalName: 'megan.bowen@contoso.onmicrosoft.com',
    displayName: 'Megan Bowen',
    mailboxType: 'UserMailbox',
    totalItemSizeMB: 38400.0,
    itemCount: 68100,
    archiveStatus: 'Active',
    archiveSizeMB: 84200.0,
    delegates: JSON.stringify(['FullAccess: executive-assistant@contoso.onmicrosoft.com', 'SendOnBehalf: executive-assistant@contoso.onmicrosoft.com']),
    forwardingRules: JSON.stringify([]),
    retentionPolicy: 'Executive Immature Hold Policy (Strict)',
  },
  {
    userPrincipalName: 'support@contoso.onmicrosoft.com',
    displayName: 'Global Customer Support',
    mailboxType: 'SharedMailbox',
    totalItemSizeMB: 48900.0,
    itemCount: 142000,
    archiveStatus: 'Active',
    archiveSizeMB: 120000.0,
    delegates: JSON.stringify(['FullAccess: Tier2SupportSG', 'SendAs: Tier2SupportSG']),
    forwardingRules: JSON.stringify(['ForwardTo: zendesk-ingest@contoso.zendesk.com (KeepCopy: true)']),
    retentionPolicy: 'Customer Operations 3 Year',
  },
  {
    userPrincipalName: 'boardroom-a@contoso.onmicrosoft.com',
    displayName: 'Executive Boardroom A (Capacity: 24)',
    mailboxType: 'RoomMailbox',
    totalItemSizeMB: 850.0,
    itemCount: 1200,
    archiveStatus: 'Disabled',
    archiveSizeMB: 0,
    delegates: JSON.stringify(['BookingApprovers: executive-assistant@contoso.onmicrosoft.com']),
    forwardingRules: JSON.stringify([]),
    retentionPolicy: 'Resource Calendar Standard',
  },
];

export const SEED_DISCOVERY_SHAREPOINT = [
  {
    siteTitle: 'Contoso Corporate Hub (Intranet)',
    siteUrl: 'https://contoso.sharepoint.com/sites/Hub',
    template: 'SITEPAGEPUBLISHING#0', // Communication Site
    storageUsedMB: 184500.0, // ~180 GB
    subsiteCount: 4,
    listCount: 28,
    libraryCount: 16,
    permissionsSummary: JSON.stringify({ owners: 5, members: 380, visitors: 'Everyone except external', externalSharing: 'Disabled' }),
    primaryOwner: 'patti.fernandez@contoso.onmicrosoft.com',
    lastModified: new Date(Date.now() - 3600000 * 2),
  },
  {
    siteTitle: 'Product Engineering & Architecture Docs',
    siteUrl: 'https://contoso.sharepoint.com/sites/Engineering',
    template: 'GROUP#0', // Team Site
    storageUsedMB: 542000.0, // ~529 GB
    subsiteCount: 8,
    listCount: 54,
    libraryCount: 32,
    permissionsSummary: JSON.stringify({ owners: 6, members: 78, visitors: 12, externalSharing: 'ExistingGuests' }),
    primaryOwner: 'megan.bowen@contoso.onmicrosoft.com',
    lastModified: new Date(Date.now() - 3600000 * 1),
  },
  {
    siteTitle: 'Legal & Intellectual Property Repository',
    siteUrl: 'https://contoso.sharepoint.com/sites/Legal',
    template: 'GROUP#0',
    storageUsedMB: 89400.0,
    subsiteCount: 0,
    listCount: 12,
    libraryCount: 8,
    permissionsSummary: JSON.stringify({ owners: 3, members: 12, visitors: 0, externalSharing: 'Disabled' }),
    primaryOwner: 'joni.sherman@contoso.onmicrosoft.com',
    lastModified: new Date(Date.now() - 3600000 * 18),
  },
  {
    siteTitle: 'Global Sales & Partner Collateral',
    siteUrl: 'https://contoso.sharepoint.com/sites/SalesGlobal',
    template: 'SITEPAGEPUBLISHING#0',
    storageUsedMB: 312000.0,
    subsiteCount: 2,
    listCount: 36,
    libraryCount: 22,
    permissionsSummary: JSON.stringify({ owners: 8, members: 140, visitors: 45, externalSharing: 'Anyone' }),
    primaryOwner: 'diego.siciliani@contoso.onmicrosoft.com',
    lastModified: new Date(Date.now() - 3600000 * 4),
  },
];

export const SEED_DISCOVERY_TEAMS = [
  {
    teamId: 'team_001',
    teamName: 'Enterprise Cloud Architecture',
    description: 'Core infrastructure, hybrid cloud, Entra ID and M365 governance discussions',
    visibility: 'Private',
    channelsCount: 8,
    channels: JSON.stringify(['General', 'Architecture Design', 'Migration War Room', 'Security & Compliance', 'Incident Response', 'IaC Terraform', 'K8s Clusters', 'Weekly Sync']),
    membersCount: 46,
    ownersCount: 3,
    owners: JSON.stringify(['alex.wilber@contoso.onmicrosoft.com', 'megan.bowen@contoso.onmicrosoft.com', 'pradeep.gupta@contoso.onmicrosoft.com']),
    tabsCount: 24,
    filesCount: 1820,
    installedApps: JSON.stringify(['Planner', 'Power BI', 'GitHub Integration', 'Jira Cloud', 'SharePoint']),
    chatHistoryDays: 730,
    lastActivityDate: new Date(Date.now() - 3600000 * 1),
  },
  {
    teamId: 'team_002',
    teamName: 'Marketing Strategy & Campaign Launch',
    description: 'Brand transformation, press announcements, and digital marketing execution',
    visibility: 'Public',
    channelsCount: 6,
    channels: JSON.stringify(['General', 'Campaign Assets', 'Social Media', 'PR & Press', 'Budget & Invoices', 'Analytics']),
    membersCount: 72,
    ownersCount: 2,
    owners: JSON.stringify(['adele.vance@contoso.onmicrosoft.com', 'lynne.robbins@contoso.onmicrosoft.com']),
    tabsCount: 18,
    filesCount: 3450,
    installedApps: JSON.stringify(['Planner', 'Adobe Creative Cloud', 'Miro', 'SharePoint']),
    chatHistoryDays: 365,
    lastActivityDate: new Date(Date.now() - 3600000 * 3),
  },
  {
    teamId: 'team_003',
    teamName: 'Executive Leadership Committee',
    description: 'Confidential corporate strategy, quarterly business reviews, M&A operations',
    visibility: 'HiddenMembership',
    channelsCount: 4,
    channels: JSON.stringify(['General', 'Strategic Planning', 'Board Packets', 'Confidential Audits']),
    membersCount: 12,
    ownersCount: 2,
    owners: JSON.stringify(['patti.fernandez@contoso.onmicrosoft.com', 'enrico.catta@contoso.onmicrosoft.com']),
    tabsCount: 8,
    filesCount: 640,
    installedApps: JSON.stringify(['Power BI', 'Word', 'Excel Online']),
    chatHistoryDays: 1095,
    lastActivityDate: new Date(Date.now() - 3600000 * 6),
  },
];

export const SEED_DISCOVERY_DISTRIBUTION_LISTS = [
  {
    displayName: 'All Staff Worldwide',
    primarySmtpAddress: 'allstaff@contoso.com',
    aliases: JSON.stringify(['all-employees@contoso.com', 'everyone@contoso.onmicrosoft.com']),
    memberCount: 384,
    members: JSON.stringify(['adele.vance@contoso.onmicrosoft.com', 'alex.wilber@contoso.onmicrosoft.com', 'diego.siciliani@contoso.onmicrosoft.com']),
    owners: JSON.stringify(['patti.fernandez@contoso.onmicrosoft.com']),
    deliveryManagement: 'Only senders inside organization',
    requireSenderAuthentication: true,
    moderationEnabled: true,
  },
  {
    displayName: 'Customer Inquiries & Leads',
    primarySmtpAddress: 'info@contoso.com',
    aliases: JSON.stringify(['contact@contoso.com', 'inquiries@contoso.com']),
    memberCount: 22,
    members: JSON.stringify(['diego.siciliani@contoso.onmicrosoft.com', 'adele.vance@contoso.onmicrosoft.com']),
    owners: JSON.stringify(['diego.siciliani@contoso.onmicrosoft.com']),
    deliveryManagement: 'Senders inside and outside organization',
    requireSenderAuthentication: false,
    moderationEnabled: false,
  },
  {
    displayName: 'Critical Incident Response Team',
    primarySmtpAddress: 'incident-response@contoso.com',
    aliases: JSON.stringify(['secops-paging@contoso.com', 'p1-alerts@contoso.com']),
    memberCount: 14,
    members: JSON.stringify(['alex.wilber@contoso.onmicrosoft.com', 'megan.bowen@contoso.onmicrosoft.com', 'pradeep.gupta@contoso.onmicrosoft.com']),
    owners: JSON.stringify(['megan.bowen@contoso.onmicrosoft.com']),
    deliveryManagement: 'Only senders inside organization',
    requireSenderAuthentication: true,
    moderationEnabled: false,
  },
];

/**
 * Initialize database with seed discovery data if tables are empty
 */
export async function ensureDiscoveryDataSeeded() {
  try {
    const userCount = await prisma.discoveryUser.count();
    if (userCount === 0) {
      console.log('[DISCOVERY] Populating initial enterprise discovery workload dataset...');
      for (const user of SEED_DISCOVERY_USERS) {
        await prisma.discoveryUser.create({ data: user });
      }
      for (const grp of SEED_DISCOVERY_GROUPS) {
        await prisma.discoveryGroup.create({ data: grp });
      }
      for (const od of SEED_DISCOVERY_ONEDRIVES) {
        await prisma.discoveryOneDrive.create({ data: od });
      }
      for (const mbx of SEED_DISCOVERY_MAILBOXES) {
        await prisma.discoveryMailbox.create({ data: mbx });
      }
      for (const sp of SEED_DISCOVERY_SHAREPOINT) {
        await prisma.discoverySharePointSite.create({ data: sp });
      }
      for (const tm of SEED_DISCOVERY_TEAMS) {
        await prisma.discoveryTeam.create({ data: tm });
      }
      for (const dl of SEED_DISCOVERY_DISTRIBUTION_LISTS) {
        await prisma.discoveryDistributionList.create({ data: dl });
      }

      // Record completed initial scan
      await prisma.discoveryScan.create({
        data: {
          scanType: 'FULL',
          status: 'COMPLETED',
          workloads: JSON.stringify(['Users', 'Groups', 'OneDrive', 'Exchange', 'SharePoint', 'Teams', 'DistributionLists']),
          currentStage: 'Completed - All 7 Workloads Discovered & Indexed',
          progress: 100,
          totalItemsDiscovered: 432,
          usersDiscovered: SEED_DISCOVERY_USERS.length,
          groupsDiscovered: SEED_DISCOVERY_GROUPS.length,
          oneDrivesDiscovered: SEED_DISCOVERY_ONEDRIVES.length,
          mailboxesDiscovered: SEED_DISCOVERY_MAILBOXES.length,
          sharePointSitesDiscovered: SEED_DISCOVERY_SHAREPOINT.length,
          teamsDiscovered: SEED_DISCOVERY_TEAMS.length,
          dlDiscovered: SEED_DISCOVERY_DISTRIBUTION_LISTS.length,
          totalStorageGB: 1824.5,
          completedAt: new Date(),
        },
      });
      console.log('[DISCOVERY] Seeding completed successfully.');
    }
  } catch (err) {
    console.error('[DISCOVERY] Seeding error:', err);
  }
}

/**
 * Starts a discovery scan across requested workloads on the source tenant
 */
export async function startDiscoveryScan(options: DiscoveryScanOptions = {}) {
  const scanType = options.scanType || 'FULL';
  
  // Find configured source tenant domain or default
  const sourceTenant = await prisma.tenantConnection.findUnique({
    where: { tenantType: 'SOURCE' },
  });
  const sourceTenantDomain = sourceTenant?.domain || 'contoso.onmicrosoft.com';

  const targetWorkloads = options.workloads && options.workloads.length > 0
    ? options.workloads
    : ['Exchange', 'Users', 'Groups', 'DistributionLists', 'OneDrive', 'SharePoint', 'Teams'];

  // Abort any existing timer
  if (activeScanTimer) {
    clearTimeout(activeScanTimer);
    activeScanTimer = null;
  }

  // Create new scan record in Prisma SQLite
  const scan = await prisma.discoveryScan.create({
    data: {
      scanType,
      status: 'RUNNING',
      workloads: JSON.stringify(targetWorkloads),
      currentStage: `Connecting to source tenant ${sourceTenantDomain} (Microsoft Graph & Exchange Online)...`,
      progress: 5,
      startedAt: new Date(),
    },
  });

  // Initialize active in-memory scan state with 3-retry checkpoint management
  activeScanState = {
    scanId: scan.id,
    scanType,
    workloads: targetWorkloads,
    sourceTenantDomain,
    currentStageIndex: 0,
    retryCount: 0,
    maxRetries: 3,
    status: 'RUNNING',
    currentStageName: `Initializing scan pipeline for source tenant ${sourceTenantDomain}...`,
    progress: 5,
    startedAt: new Date(),
  };

  await recordAuditLog({
    actorEmail: 'admin@contoso.onmicrosoft.com',
    actorRole: 'GLOBAL_ADMIN',
    action: `DISCOVERY_SCAN_${scanType}_STARTED`,
    resource: `DiscoveryScan:${scan.id}`,
    status: 'SUCCESS',
    details: `Started ${scanType} discovery scan on source tenant ${sourceTenantDomain} targeting: ${targetWorkloads.join(', ')}`,
  });

  broadcast({
    type: 'DISCOVERY_PROGRESS_UPDATE',
    data: {
      id: scan.id,
      ...activeScanState,
    },
  });

  // Begin scanning workloads step-by-step
  scheduleNextScanStep(1000);

  return {
    ...scan,
    retryCount: 0,
    maxRetries: 3,
    sourceTenantDomain,
  };
}

/**
 * Schedule next workload scan step
 */
function scheduleNextScanStep(delayMs = 1400) {
  if (activeScanTimer) {
    clearTimeout(activeScanTimer);
    activeScanTimer = null;
  }
  activeScanTimer = setTimeout(() => {
    executeNextScanStep();
  }, delayMs);
}

/**
 * Executes the next workload discovery stage sequentially with checkpoint preservation
 */
async function executeNextScanStep() {
  if (!activeScanState || activeScanState.status !== 'RUNNING') {
    return;
  }

  const { scanId, scanType, currentStageIndex, sourceTenantDomain } = activeScanState;

  try {
    // Check if all workload stages are completed
    if (currentStageIndex >= DISCOVERY_WORKLOAD_STAGES.length) {
      if (activeScanTimer) {
        clearTimeout(activeScanTimer);
        activeScanTimer = null;
      }

      // Fetch latest counts from DB
      const usersCount = await prisma.discoveryUser.count();
      const groupsCount = await prisma.discoveryGroup.count();
      const odCount = await prisma.discoveryOneDrive.count();
      const mbxCount = await prisma.discoveryMailbox.count();
      const spCount = await prisma.discoverySharePointSite.count();
      const teamsCount = await prisma.discoveryTeam.count();
      const dlCount = await prisma.discoveryDistributionList.count();

      // Calculate total storage
      const odBytes = await prisma.discoveryOneDrive.aggregate({ _sum: { storageUsedBytes: true } });
      const spMB = await prisma.discoverySharePointSite.aggregate({ _sum: { storageUsedMB: true } });
      const mbxMB = await prisma.discoveryMailbox.aggregate({ _sum: { totalItemSizeMB: true } });
      const totalGB = Math.round(
        ((odBytes._sum.storageUsedBytes || 0) / (1024 * 1024 * 1024)) +
        ((spMB._sum.storageUsedMB || 0) / 1024) +
        ((mbxMB._sum.totalItemSizeMB || 0) / 1024)
      );

      const totalItemsDiscovered = usersCount + groupsCount + odCount + mbxCount + spCount + teamsCount + dlCount;

      const completedScan = await prisma.discoveryScan.update({
        where: { id: scanId },
        data: {
          status: 'COMPLETED',
          currentStage: `Discovery Completed - All 7 Workloads Discovered & Indexed from ${sourceTenantDomain}`,
          progress: 100,
          usersDiscovered: usersCount,
          groupsDiscovered: groupsCount,
          oneDrivesDiscovered: odCount,
          mailboxesDiscovered: mbxCount,
          sharePointSitesDiscovered: spCount,
          teamsDiscovered: teamsCount,
          dlDiscovered: dlCount,
          totalItemsDiscovered,
          totalStorageGB: totalGB,
          completedAt: new Date(),
        },
      });

      // Broadcast completion to all WebSocket clients
      broadcast({
        type: 'DISCOVERY_COMPLETED',
        data: {
          ...completedScan,
          sourceTenantDomain,
          retryCount: activeScanState.retryCount,
          maxRetries: activeScanState.maxRetries,
        },
      });

      await recordAuditLog({
        actorEmail: 'admin@contoso.onmicrosoft.com',
        actorRole: 'GLOBAL_ADMIN',
        action: 'DISCOVERY_SCAN_COMPLETED',
        resource: `DiscoveryScan:${scanId}`,
        status: 'SUCCESS',
        details: `Completed discovery scan on ${sourceTenantDomain} with ${totalItemsDiscovered} items across all 7 workloads.`,
      });

      activeScanState = null;
      return;
    }

    // Execute current workload stage
    const stage = DISCOVERY_WORKLOAD_STAGES[currentStageIndex];
    const stageDescription = `Scanning ${stage.label} (${stage.name}) on source tenant ${sourceTenantDomain}...`;
    activeScanState.currentStageName = stageDescription;
    activeScanState.progress = stage.pct;

    // Simulate touching lastScannedAt
    const now = new Date();
    if (stage.workload === 'Users') {
      await prisma.discoveryUser.updateMany({ data: { lastScannedAt: now } });
    } else if (stage.workload === 'Exchange') {
      await prisma.discoveryMailbox.updateMany({ data: { lastScannedAt: now } });
    } else if (stage.workload === 'Groups') {
      await prisma.discoveryGroup.updateMany({ data: { lastScannedAt: now } });
    } else if (stage.workload === 'OneDrive') {
      await prisma.discoveryOneDrive.updateMany({ data: { lastScannedAt: now } });
    } else if (stage.workload === 'SharePoint') {
      await prisma.discoverySharePointSite.updateMany({ data: { lastScannedAt: now } });
    } else if (stage.workload === 'Teams') {
      await prisma.discoveryTeam.updateMany({ data: { lastScannedAt: now } });
    } else if (stage.workload === 'DistributionLists') {
      await prisma.discoveryDistributionList.updateMany({ data: { lastScannedAt: now } });
    }

    const updatedScan = await prisma.discoveryScan.update({
      where: { id: scanId },
      data: {
        currentStage: stageDescription,
        progress: stage.pct,
      },
    });

    broadcast({
      type: 'DISCOVERY_PROGRESS_UPDATE',
      data: {
        ...updatedScan,
        currentStageIndex,
        totalStages: DISCOVERY_WORKLOAD_STAGES.length,
        currentWorkload: stage.label,
        retryCount: activeScanState.retryCount,
        maxRetries: activeScanState.maxRetries,
        sourceTenantDomain,
      },
    });

    // Advance to next stage index
    activeScanState.currentStageIndex++;

    // Schedule next workload scan
    scheduleNextScanStep(1500);

  } catch (err: any) {
    console.error('[DISCOVERY] Pipeline error during stage execution:', err);
    await handleScanDisconnect(err.message || 'Transient network or Microsoft Graph API communication error');
  }
}

/**
 * Handles disconnection with up to 3 retries, continuing from the exact paused stage
 */
export async function handleScanDisconnect(errorReason = 'Transient Microsoft Graph Connection Interruption') {
  if (!activeScanState) return;

  if (activeScanTimer) {
    clearTimeout(activeScanTimer);
    activeScanTimer = null;
  }

  const { scanId, retryCount, maxRetries, currentStageIndex, sourceTenantDomain } = activeScanState;
  const currentStage = DISCOVERY_WORKLOAD_STAGES[currentStageIndex] || DISCOVERY_WORKLOAD_STAGES[0];

  if (retryCount < maxRetries) {
    activeScanState.retryCount++;
    activeScanState.status = 'RETRYING';
    activeScanState.resumedFromStage = currentStage.label;

    const retryNotice = `Disconnected from source tenant (${errorReason}). Retrying connection (Attempt ${activeScanState.retryCount} of ${maxRetries})... Resuming from ${currentStage.label}`;
    activeScanState.currentStageName = retryNotice;

    await prisma.discoveryScan.update({
      where: { id: scanId },
      data: {
        status: 'RETRYING',
        currentStage: retryNotice,
      },
    });

    await recordAuditLog({
      actorEmail: 'system@contoso.onmicrosoft.com',
      actorRole: 'GLOBAL_ADMIN',
      action: 'DISCOVERY_SCAN_RETRYING',
      resource: `DiscoveryScan:${scanId}`,
      status: 'WARNING',
      details: `Connection to source tenant ${sourceTenantDomain} interrupted. Attempting auto-recovery ${activeScanState.retryCount}/${maxRetries}. Preserving checkpoint at stage ${currentStage.label}.`,
    });

    broadcast({
      type: 'DISCOVERY_RETRYING',
      data: {
        scanId,
        status: 'RETRYING',
        retryCount: activeScanState.retryCount,
        maxRetries,
        progress: activeScanState.progress,
        currentStage: retryNotice,
        resumedFromStage: currentStage.label,
        sourceTenantDomain,
      },
    });

    // Wait backoff interval and resume from EXACT checkpoint
    activeScanTimer = setTimeout(async () => {
      if (!activeScanState) return;
      activeScanState.status = 'RUNNING';
      const resumeNotice = `Connection restored to ${sourceTenantDomain}. Resuming scan from ${currentStage.label}...`;
      activeScanState.currentStageName = resumeNotice;

      await prisma.discoveryScan.update({
        where: { id: scanId },
        data: {
          status: 'RUNNING',
          currentStage: resumeNotice,
        },
      });

      broadcast({
        type: 'DISCOVERY_PROGRESS_UPDATE',
        data: {
          scanId,
          status: 'RUNNING',
          retryCount: activeScanState.retryCount,
          maxRetries,
          progress: activeScanState.progress,
          currentStage: resumeNotice,
          sourceTenantDomain,
        },
      });

      // Continue execution from the exact currentStageIndex without resetting
      scheduleNextScanStep(1000);
    }, 2800);

  } else {
    // 3 retries exhausted -> Mark scan as FAILED
    activeScanState.status = 'FAILED';
    const failNotice = `Discovery scan failed after ${maxRetries} retry attempts: Unable to maintain connection to source tenant ${sourceTenantDomain}.`;

    await prisma.discoveryScan.update({
      where: { id: scanId },
      data: {
        status: 'FAILED',
        errorMessage: failNotice,
        currentStage: failNotice,
      },
    });

    await recordAuditLog({
      actorEmail: 'system@contoso.onmicrosoft.com',
      actorRole: 'GLOBAL_ADMIN',
      action: 'DISCOVERY_SCAN_FAILED',
      resource: `DiscoveryScan:${scanId}`,
      status: 'FAILED',
      details: failNotice,
    });

    broadcast({
      type: 'DISCOVERY_FAILED',
      data: {
        scanId,
        status: 'FAILED',
        errorMessage: failNotice,
        sourceTenantDomain,
      },
    });

    lastFailedScanCheckpoint = {
      scanId: activeScanState.scanId,
      scanType: activeScanState.scanType,
      workloads: activeScanState.workloads,
      sourceTenantDomain: activeScanState.sourceTenantDomain,
      currentStageIndex: activeScanState.currentStageIndex,
      progress: activeScanState.progress,
      lastCompletedWorkload: activeScanState.resumedFromStage || currentStage.label,
      disconnectReason: failNotice,
    };

    activeScanState = null;
  }
}

/**
 * Retries and resumes a failed or interrupted discovery scan, transitioning it back into RUNNING progress
 */
export async function retryDiscoveryScan(options: { fromCheckpoint?: boolean; scanType?: string; workloads?: string[] } = {}) {
  const fromCheckpoint = options.fromCheckpoint !== false;

  if (activeScanTimer) {
    clearTimeout(activeScanTimer);
    activeScanTimer = null;
  }

  // 1. Resume from in-memory failed checkpoint if available
  if (fromCheckpoint && lastFailedScanCheckpoint) {
    const cp = lastFailedScanCheckpoint;
    const stageToResume = DISCOVERY_WORKLOAD_STAGES[cp.currentStageIndex] || DISCOVERY_WORKLOAD_STAGES[0];
    const resumeNotice = `Connection restored. Resuming discovery scan from checkpoint: ${stageToResume.label} (${cp.progress}%)...`;

    activeScanState = {
      scanId: cp.scanId,
      scanType: cp.scanType,
      workloads: cp.workloads,
      sourceTenantDomain: cp.sourceTenantDomain,
      currentStageIndex: cp.currentStageIndex,
      retryCount: 0,
      maxRetries: 3,
      status: 'RUNNING',
      currentStageName: resumeNotice,
      progress: Math.max(5, cp.progress),
      startedAt: new Date(),
      resumedFromStage: stageToResume.label,
    };

    await prisma.discoveryScan.update({
      where: { id: cp.scanId },
      data: {
        status: 'RUNNING',
        currentStage: resumeNotice,
        progress: Math.max(5, cp.progress),
        errorMessage: null,
      },
    });

    await recordAuditLog({
      actorEmail: 'admin@contoso.onmicrosoft.com',
      actorRole: 'GLOBAL_ADMIN',
      action: 'DISCOVERY_SCAN_RESUMED',
      resource: `DiscoveryScan:${cp.scanId}`,
      status: 'SUCCESS',
      details: `Resumed discovery scan from checkpoint at ${stageToResume.label} (${cp.progress}%) with fresh retry quota.`,
    });

    broadcast({
      type: 'DISCOVERY_PROGRESS_UPDATE',
      data: {
        scanId: cp.scanId,
        id: cp.scanId,
        status: 'RUNNING',
        retryCount: 0,
        maxRetries: 3,
        progress: activeScanState.progress,
        currentStage: resumeNotice,
        sourceTenantDomain: cp.sourceTenantDomain,
      },
    });

    scheduleNextScanStep(1000);

    return {
      success: true,
      resumed: true,
      status: 'RUNNING',
      stage: stageToResume.label,
      progress: cp.progress,
      scanId: cp.scanId,
    };
  }

  // 2. Check if latest scan in database was marked as FAILED
  const latestFailedScan = await prisma.discoveryScan.findFirst({
    where: { status: 'FAILED' },
    orderBy: { startedAt: 'desc' },
  });

  if (fromCheckpoint && latestFailedScan) {
    const workloads = JSON.parse(latestFailedScan.workloads || '["Exchange", "Users", "Groups", "DistributionLists", "OneDrive", "SharePoint", "Teams"]');
    const sourceTenant = await prisma.tenantConnection.findUnique({
      where: { tenantType: 'SOURCE' },
    });
    const sourceTenantDomain = sourceTenant?.domain || 'contoso.onmicrosoft.com';
    const resumeProgress = Math.max(15, latestFailedScan.progress || 15);
    const resumeStageIndex = Math.min(
      DISCOVERY_WORKLOAD_STAGES.length - 1,
      Math.floor((resumeProgress / 100) * DISCOVERY_WORKLOAD_STAGES.length)
    );
    const stageToResume = DISCOVERY_WORKLOAD_STAGES[resumeStageIndex];
    const resumeNotice = `Connection restored. Resuming discovery scan from checkpoint: ${stageToResume.label} (${resumeProgress}%)...`;

    activeScanState = {
      scanId: latestFailedScan.id,
      scanType: latestFailedScan.scanType,
      workloads,
      sourceTenantDomain,
      currentStageIndex: resumeStageIndex,
      retryCount: 0,
      maxRetries: 3,
      status: 'RUNNING',
      currentStageName: resumeNotice,
      progress: resumeProgress,
      startedAt: new Date(),
      resumedFromStage: stageToResume.label,
    };

    await prisma.discoveryScan.update({
      where: { id: latestFailedScan.id },
      data: {
        status: 'RUNNING',
        currentStage: resumeNotice,
        progress: resumeProgress,
        errorMessage: null,
      },
    });

    broadcast({
      type: 'DISCOVERY_PROGRESS_UPDATE',
      data: {
        scanId: latestFailedScan.id,
        id: latestFailedScan.id,
        status: 'RUNNING',
        retryCount: 0,
        maxRetries: 3,
        progress: resumeProgress,
        currentStage: resumeNotice,
        sourceTenantDomain,
      },
    });

    scheduleNextScanStep(1000);

    return {
      success: true,
      resumed: true,
      status: 'RUNNING',
      stage: stageToResume.label,
      progress: resumeProgress,
      scanId: latestFailedScan.id,
    };
  }

  // 3. Fallback: Start fresh scan
  const newScan = await startDiscoveryScan({
    scanType: (options.scanType as any) || 'FULL',
    workloads: options.workloads,
  });

  return {
    success: true,
    resumed: false,
    status: 'RUNNING',
    scanId: newScan.id,
    progress: 5,
  };
}

/**
 * Triggers a simulated disconnect during an active scan to test the 3-attempt checkpoint retry
 */
export async function triggerSimulatedDisconnect(reason = 'Simulated Graph API Throttling & Network Disconnect') {
  if (!activeScanState || (activeScanState.status !== 'RUNNING' && activeScanState.status !== 'RETRYING')) {
    return {
      success: false,
      message: 'No active discovery scan is currently running to simulate disconnect on.',
    };
  }

  await handleScanDisconnect(reason);

  return {
    success: true,
    message: `Disconnect triggered. Retrying attempt ${activeScanState?.retryCount || 1} of ${activeScanState?.maxRetries || 3}. Resuming from checkpoint: ${activeScanState?.resumedFromStage || 'Current Workload'}`,
    activeScanState,
  };
}

/**
 * Returns latest discovery status & progress with active retry & checkpoint information
 */
export async function getDiscoveryStatus() {
  const latestScan = await prisma.discoveryScan.findFirst({
    orderBy: { startedAt: 'desc' },
  });

  const sourceTenant = await prisma.tenantConnection.findUnique({
    where: { tenantType: 'SOURCE' },
  });
  const sourceTenantDomain = sourceTenant?.domain || 'contoso.onmicrosoft.com';

  if (activeScanState && latestScan && activeScanState.scanId === latestScan.id) {
    return {
      ...latestScan,
      status: activeScanState.status,
      currentStage: activeScanState.currentStageName,
      progress: activeScanState.progress,
      retryCount: activeScanState.retryCount,
      maxRetries: activeScanState.maxRetries,
      sourceTenantDomain: activeScanState.sourceTenantDomain,
      resumedFromStage: activeScanState.resumedFromStage,
      currentStageIndex: activeScanState.currentStageIndex,
      totalStages: DISCOVERY_WORKLOAD_STAGES.length,
    };
  }

  return {
    ...(latestScan || { status: 'NOT_STARTED', progress: 0 }),
    sourceTenantDomain,
    retryCount: 0,
    maxRetries: 3,
  };
}

/**
 * Returns summary metrics for all 7 workloads
 */
export async function getDiscoverySummary() {
  const [
    userCount,
    groupCount,
    oneDriveCount,
    mailboxCount,
    sharePointCount,
    teamsCount,
    dlCount,
    lastScan,
    sourceTenant,
  ] = await Promise.all([
    prisma.discoveryUser.count(),
    prisma.discoveryGroup.count(),
    prisma.discoveryOneDrive.count(),
    prisma.discoveryMailbox.count(),
    prisma.discoverySharePointSite.count(),
    prisma.discoveryTeam.count(),
    prisma.discoveryDistributionList.count(),
    prisma.discoveryScan.findFirst({
      where: { status: 'COMPLETED' },
      orderBy: { completedAt: 'desc' },
    }),
    prisma.tenantConnection.findUnique({
      where: { tenantType: 'SOURCE' },
    }),
  ]);

  // Total Storage calculation
  const odAggregate = await prisma.discoveryOneDrive.aggregate({
    _sum: { storageUsedBytes: true },
  });
  const spAggregate = await prisma.discoverySharePointSite.aggregate({
    _sum: { storageUsedMB: true },
  });
  const mbxAggregate = await prisma.discoveryMailbox.aggregate({
    _sum: { totalItemSizeMB: true },
  });

  const totalOneDriveGB = (odAggregate._sum.storageUsedBytes || 0) / (1024 * 1024 * 1024);
  const totalSharePointGB = (spAggregate._sum.storageUsedMB || 0) / 1024;
  const totalMailboxGB = (mbxAggregate._sum.totalItemSizeMB || 0) / 1024;
  const totalStorageGB = Math.round((totalOneDriveGB + totalSharePointGB + totalMailboxGB) * 10) / 10;

  // MFA Distribution
  const mfaEnforced = await prisma.discoveryUser.count({ where: { mfaStatus: 'ENFORCED' } });
  const mfaEnabled = await prisma.discoveryUser.count({ where: { mfaStatus: 'ENABLED' } });
  const mfaDisabled = await prisma.discoveryUser.count({ where: { mfaStatus: 'DISABLED' } });

  return {
    sourceTenant: {
      domain: sourceTenant?.domain || 'contoso.onmicrosoft.com',
      displayName: sourceTenant?.displayName || 'Contoso Enterprise Corp',
      connected: !!sourceTenant,
    },
    workloadCounts: {
      users: userCount,
      groups: groupCount,
      onedrive: oneDriveCount,
      exchange: mailboxCount,
      sharepoint: sharePointCount,
      teams: teamsCount,
      distributionLists: dlCount,
    },
    totalItems: userCount + groupCount + oneDriveCount + mailboxCount + sharePointCount + teamsCount + dlCount,
    storage: {
      totalStorageGB,
      oneDriveStorageGB: Math.round(totalOneDriveGB * 10) / 10,
      sharePointStorageGB: Math.round(totalSharePointGB * 10) / 10,
      mailboxStorageGB: Math.round(totalMailboxGB * 10) / 10,
    },
    security: {
      mfaEnforced,
      mfaEnabled,
      mfaDisabled,
      mfaEnforcedRate: userCount > 0 ? Math.round(((mfaEnforced + mfaEnabled) / userCount) * 100) : 0,
    },
    lastScanTimestamp: lastScan?.completedAt || lastScan?.startedAt || null,
    scanType: lastScan?.scanType || 'FULL',
    status: lastScan?.status || 'NOT_STARTED',
  };
}

/**
 * Returns discovered users with filtering and sorting
 */
export async function getDiscoveredUsers(params: {
  search?: string;
  department?: string;
  mfaStatus?: string;
  license?: string;
  accountEnabled?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  const {
    search = '',
    department = '',
    mfaStatus = '',
    license = '',
    accountEnabled = '',
    page = 1,
    limit = 50,
    sortBy = 'displayName',
    sortOrder = 'asc',
  } = params;

  const where: any = {};

  if (search) {
    where.OR = [
      { upn: { contains: search } },
      { displayName: { contains: search } },
      { jobTitle: { contains: search } },
      { department: { contains: search } },
    ];
  }

  if (department && department !== 'ALL') {
    where.department = department;
  }

  if (mfaStatus && mfaStatus !== 'ALL') {
    where.mfaStatus = mfaStatus;
  }

  if (license && license !== 'ALL') {
    where.licenses = { contains: license };
  }

  if (accountEnabled === 'true') {
    where.accountEnabled = true;
  } else if (accountEnabled === 'false') {
    where.accountEnabled = false;
  }

  const [total, users] = await Promise.all([
    prisma.discoveryUser.count({ where }),
    prisma.discoveryUser.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
    }),
  ]);

  // Parse JSON fields safely
  const formattedUsers = users.map((u) => ({
    ...u,
    licenses: safeParseJSON(u.licenses, []),
    groups: safeParseJSON(u.groups, []),
    assignedRoles: safeParseJSON(u.assignedRoles || '[]', []),
  }));

  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    users: formattedUsers,
  };
}

/**
 * Returns detailed view for a single user (including related mailbox, onedrive, teams)
 */
export async function getDiscoveredUserDetails(id: string) {
  const user = await prisma.discoveryUser.findFirst({
    where: {
      OR: [{ id }, { upn: id }],
    },
  });

  if (!user) return null;

  // Retrieve linked OneDrive, Mailbox, and Teams memberships
  const [oneDrive, mailbox, allTeams, managerUser] = await Promise.all([
    prisma.discoveryOneDrive.findUnique({ where: { userPrincipalName: user.upn } }),
    prisma.discoveryMailbox.findUnique({ where: { userPrincipalName: user.upn } }),
    prisma.discoveryTeam.findMany(),
    user.manager
      ? prisma.discoveryUser.findUnique({ where: { upn: user.manager } })
      : null,
  ]);

  const userTeams = allTeams.filter((t) => {
    try {
      const owners = JSON.parse(t.owners);
      return owners.includes(user.upn);
    } catch {
      return false;
    }
  });

  return {
    ...user,
    licenses: safeParseJSON(user.licenses, []),
    groups: safeParseJSON(user.groups, []),
    assignedRoles: safeParseJSON(user.assignedRoles || '[]', []),
    oneDrive: oneDrive
      ? {
          ...oneDrive,
          storageUsedGB: Math.round((oneDrive.storageUsedBytes / (1024 * 1024 * 1024)) * 10) / 10,
          storageQuotaGB: Math.round(oneDrive.storageQuotaBytes / (1024 * 1024 * 1024)),
        }
      : null,
    mailbox: mailbox
      ? {
          ...mailbox,
          delegates: safeParseJSON(mailbox.delegates, []),
          forwardingRules: safeParseJSON(mailbox.forwardingRules, []),
        }
      : null,
    teams: userTeams.map((t) => ({
      id: t.id,
      teamId: t.teamId,
      teamName: t.teamName,
      visibility: t.visibility,
      channelsCount: t.channelsCount,
      role: 'Owner',
    })),
    managerDetails: managerUser
      ? {
          displayName: managerUser.displayName,
          upn: managerUser.upn,
          jobTitle: managerUser.jobTitle,
          department: managerUser.department,
        }
      : null,
  };
}

/**
 * Returns workload items (groups, onedrive, exchange, sharepoint, teams, distribution lists)
 */
export async function getDiscoveredWorkloadItems(workload: string) {
  switch (workload.toLowerCase()) {
    case 'groups': {
      const items = await prisma.discoveryGroup.findMany({ orderBy: { name: 'asc' } });
      return items.map((i) => ({
        ...i,
        owners: safeParseJSON(i.owners, []),
        members: safeParseJSON(i.members || '[]', []),
      }));
    }
    case 'onedrive': {
      return prisma.discoveryOneDrive.findMany({ orderBy: { storageUsedBytes: 'desc' } });
    }
    case 'exchange': {
      const items = await prisma.discoveryMailbox.findMany({ orderBy: { totalItemSizeMB: 'desc' } });
      return items.map((i) => ({
        ...i,
        delegates: safeParseJSON(i.delegates, []),
        forwardingRules: safeParseJSON(i.forwardingRules, []),
      }));
    }
    case 'sharepoint': {
      const items = await prisma.discoverySharePointSite.findMany({ orderBy: { storageUsedMB: 'desc' } });
      return items.map((i) => ({
        ...i,
        permissionsSummary: safeParseJSON(i.permissionsSummary, {}),
      }));
    }
    case 'teams': {
      const items = await prisma.discoveryTeam.findMany({ orderBy: { teamName: 'asc' } });
      return items.map((i) => ({
        ...i,
        channels: safeParseJSON(i.channels, []),
        owners: safeParseJSON(i.owners, []),
        installedApps: safeParseJSON(i.installedApps, []),
      }));
    }
    case 'distributionlists':
    case 'dl': {
      const items = await prisma.discoveryDistributionList.findMany({ orderBy: { displayName: 'asc' } });
      return items.map((i) => ({
        ...i,
        aliases: safeParseJSON(i.aliases, []),
        members: safeParseJSON(i.members, []),
        owners: safeParseJSON(i.owners, []),
      }));
    }
    default:
      return [];
  }
}

/**
 * Returns all historical discovery scans
 */
export async function getDiscoveryScanHistory() {
  return prisma.discoveryScan.findMany({
    orderBy: { startedAt: 'desc' },
    take: 30,
  });
}

/**
 * Returns all identified workloads formatted into a unified, searchable inventory dataset
 */
export async function getAllDiscoveredWorkloadsUnified() {
  const [
    mailboxes,
    users,
    groups,
    distributionLists,
    oneDrives,
    sharePointSites,
    teams,
    sourceTenant,
  ] = await Promise.all([
    prisma.discoveryMailbox.findMany({ orderBy: { totalItemSizeMB: 'desc' } }),
    prisma.discoveryUser.findMany({ orderBy: { displayName: 'asc' } }),
    prisma.discoveryGroup.findMany({ orderBy: { name: 'asc' } }),
    prisma.discoveryDistributionList.findMany({ orderBy: { displayName: 'asc' } }),
    prisma.discoveryOneDrive.findMany({ orderBy: { storageUsedBytes: 'desc' } }),
    prisma.discoverySharePointSite.findMany({ orderBy: { storageUsedMB: 'desc' } }),
    prisma.discoveryTeam.findMany({ orderBy: { teamName: 'asc' } }),
    prisma.tenantConnection.findUnique({ where: { tenantType: 'SOURCE' } }),
  ]);

  const sourceDomain = sourceTenant?.domain || 'contoso.onmicrosoft.com';
  const unifiedItems: any[] = [];

  // 1. Mailboxes
  for (const mbx of mailboxes) {
    const sizeGB = Math.round((mbx.totalItemSizeMB / 1024) * 10) / 10;
    unifiedItems.push({
      id: mbx.id,
      workloadKey: 'exchange',
      workloadType: 'Mailbox',
      name: mbx.userPrincipalName,
      displayName: mbx.displayName,
      primaryDetail: `${mbx.mailboxType} Mailbox`,
      secondaryDetail: `Items: ${mbx.itemCount.toLocaleString()} | Archive: ${mbx.archiveStatus}`,
      sizeOrVolume: `${sizeGB} GB (${mbx.totalItemSizeMB} MB)`,
      statusBadge: mbx.archiveStatus === 'Active' ? 'Archive Active' : 'Archive Disabled',
      securityRating: mbx.archiveStatus === 'Active' ? 'Protected' : 'Standard',
      governance: `Delegates: ${safeParseJSON(mbx.delegates, []).length}`,
      lastScannedAt: mbx.lastScannedAt,
      sourceTenant: sourceDomain,
      rawData: mbx,
    });
  }

  // 2. User Accounts
  for (const u of users) {
    const licenses = safeParseJSON(u.licenses, []);
    unifiedItems.push({
      id: u.id,
      workloadKey: 'users',
      workloadType: 'User Account',
      name: u.upn,
      displayName: u.displayName,
      primaryDetail: u.jobTitle ? `${u.jobTitle} (${u.department || 'General'})` : (u.department || 'General'),
      secondaryDetail: `Licenses: ${licenses.join(', ') || 'None'}`,
      sizeOrVolume: `${licenses.length} License(s)`,
      statusBadge: u.mfaStatus === 'ENFORCED' ? 'MFA Enforced' : (u.mfaStatus === 'ENABLED' ? 'MFA Enabled' : 'MFA Disabled'),
      securityRating: u.mfaStatus === 'ENFORCED' ? 'High' : 'Action Needed',
      governance: u.accountEnabled ? 'Active Account' : 'Disabled Account',
      lastScannedAt: u.lastScannedAt,
      sourceTenant: sourceDomain,
      rawData: u,
    });
  }

  // 3. Groups
  for (const g of groups) {
    const owners = safeParseJSON(g.owners, []);
    const members = safeParseJSON(g.members, []);
    unifiedItems.push({
      id: g.id,
      workloadKey: 'groups',
      workloadType: 'Group',
      name: g.email || g.groupId,
      displayName: g.name,
      primaryDetail: `${g.groupType} Group`,
      secondaryDetail: `Owners: ${owners.length} | Mail-Enabled: ${g.isMailEnabled ? 'Yes' : 'No'}`,
      sizeOrVolume: `${g.memberCount || members.length} Members`,
      statusBadge: g.isSecurityEnabled ? 'Security Group' : 'M365 Group',
      securityRating: g.isMailEnabled ? 'Mail Enabled' : 'Security Only',
      governance: g.groupType,
      lastScannedAt: g.lastScannedAt,
      sourceTenant: sourceDomain,
      rawData: g,
    });
  }

  // 4. Distribution Lists
  for (const dl of distributionLists) {
    const members = safeParseJSON(dl.members, []);
    const aliases = safeParseJSON(dl.aliases, []);
    unifiedItems.push({
      id: dl.id,
      workloadKey: 'distributionlists',
      workloadType: 'Distribution List',
      name: dl.primarySmtpAddress,
      displayName: dl.displayName,
      primaryDetail: dl.deliveryManagement || 'Distribution Group',
      secondaryDetail: `Aliases: ${aliases.length} | Moderation: ${dl.moderationEnabled ? 'Enabled' : 'None'}`,
      sizeOrVolume: `${dl.memberCount || members.length} Members`,
      statusBadge: dl.requireSenderAuthentication ? 'Internal Only' : 'External Allowed',
      securityRating: dl.moderationEnabled ? 'Moderated' : 'Open',
      governance: dl.requireSenderAuthentication ? 'Auth Required' : 'Public Routing',
      lastScannedAt: dl.lastScannedAt,
      sourceTenant: sourceDomain,
      rawData: dl,
    });
  }

  // 5. OneDrive Accounts
  for (const od of oneDrives) {
    const usedGB = Math.round((od.storageUsedBytes / (1024 * 1024 * 1024)) * 10) / 10;
    const quotaGB = Math.round(od.storageQuotaBytes / (1024 * 1024 * 1024));
    unifiedItems.push({
      id: od.id,
      workloadKey: 'onedrive',
      workloadType: 'OneDrive Account',
      name: od.userPrincipalName,
      displayName: od.displayName || od.userPrincipalName,
      primaryDetail: `Personal Storage Quota: ${quotaGB} GB`,
      secondaryDetail: `Files: ${od.fileCount.toLocaleString()} | External Sharing: ${od.externalSharing}`,
      sizeOrVolume: `${usedGB} GB used (${od.fileCount} files)`,
      statusBadge: od.externalSharing === 'Disabled' ? 'Sharing Restricted' : 'Sharing Allowed',
      securityRating: od.externalSharing === 'Disabled' ? 'Compliant' : 'External Risk',
      governance: `Usage: ${Math.round((usedGB / (quotaGB || 1024)) * 100)}%`,
      lastScannedAt: od.lastScannedAt,
      sourceTenant: sourceDomain,
      rawData: od,
    });
  }

  // 6. SharePoint Sites
  for (const sp of sharePointSites) {
    const usedGB = Math.round((sp.storageUsedMB / 1024) * 10) / 10;
    unifiedItems.push({
      id: sp.id,
      workloadKey: 'sharepoint',
      workloadType: 'SharePoint Site',
      name: sp.siteUrl,
      displayName: sp.siteTitle,
      primaryDetail: `${sp.template} Template`,
      secondaryDetail: `Owner: ${sp.primaryOwner || 'Site Administrator'} | Subsites: ${sp.subsiteCount}`,
      sizeOrVolume: `${usedGB} GB (${sp.storageUsedMB} MB)`,
      statusBadge: sp.template.includes('TEAM') ? 'Team Site' : 'Communication Site',
      securityRating: sp.libraryCount > 0 ? `${sp.libraryCount} Libraries` : 'Document Storage',
      governance: `Lists: ${sp.listCount} | Libraries: ${sp.libraryCount}`,
      lastScannedAt: sp.lastScannedAt,
      sourceTenant: sourceDomain,
      rawData: sp,
    });
  }

  // 7. Teams Data
  for (const tm of teams) {
    const channels = safeParseJSON(tm.channels, []);
    const installedApps = safeParseJSON(tm.installedApps, []);
    const storageGB = Math.round(((tm.filesCount * 45) / 1024) * 10) / 10;
    unifiedItems.push({
      id: tm.id,
      workloadKey: 'teams',
      workloadType: 'Teams Data',
      name: tm.teamId,
      displayName: tm.teamName,
      primaryDetail: `${tm.visibility} Team`,
      secondaryDetail: `Channels: ${tm.channelsCount || channels.length} | Apps: ${installedApps.length}`,
      sizeOrVolume: `${storageGB} GB (${tm.membersCount} Members)`,
      statusBadge: tm.visibility === 'Private' ? 'Private' : 'Public',
      securityRating: tm.ownersCount > 0 ? `${tm.ownersCount} Owner(s)` : 'Managed Team',
      governance: `${tm.channelsCount} Channels | ${installedApps.length} Apps`,
      lastScannedAt: tm.lastScannedAt,
      sourceTenant: sourceDomain,
      rawData: tm,
    });
  }

  return {
    sourceTenant: sourceDomain,
    totalItems: unifiedItems.length,
    workloads: {
      mailboxes: mailboxes.length,
      users: users.length,
      groups: groups.length,
      distributionLists: distributionLists.length,
      oneDrive: oneDrives.length,
      sharePoint: sharePointSites.length,
      teams: teams.length,
    },
    items: unifiedItems,
  };
}

/**
 * Export discovery data as CSV or JSON (Single workload or Full Master Inventory)
 */
export async function exportDiscoveryData(options: {
  format: 'csv' | 'json';
  workload?: string;
  selectedIds?: string[];
}) {
  const format = options.format || 'json';
  const workload = options.workload || 'full_inventory';

  const sourceTenant = await prisma.tenantConnection.findUnique({
    where: { tenantType: 'SOURCE' },
  });
  const sourceDomain = sourceTenant?.domain || 'contoso.onmicrosoft.com';

  // Check if Full Inventory is requested across all 7 workloads
  if (workload === 'full' || workload === 'full_inventory' || workload === 'all') {
    const unified = await getAllDiscoveredWorkloadsUnified();

    if (format === 'json') {
      return {
        contentType: 'application/json',
        filename: `m365_full_discovery_inventory_${sourceDomain}_${Date.now()}.json`,
        data: JSON.stringify(
          {
            reportTitle: 'Microsoft 365 Full Discovery Inventory Report',
            sourceTenant: sourceDomain,
            exportedAt: new Date().toISOString(),
            totalDiscoveredItems: unified.totalItems,
            workloadSummary: unified.workloads,
            items: unified.items,
          },
          null,
          2
        ),
      };
    } else {
      // Full Master Inventory CSV
      const headers = [
        'Workload_Type',
        'Identifier',
        'Display_Name',
        'Classification_Or_Role',
        'Details',
        'Size_Or_Count',
        'Status_Badge',
        'Security_Governance',
        'Source_Tenant',
        'Last_Scanned_Timestamp',
      ];

      const csvRows = [
        headers.join(','),
        ...unified.items.map((item) =>
          [
            item.workloadType,
            item.name,
            item.displayName,
            item.primaryDetail,
            item.secondaryDetail,
            item.sizeOrVolume,
            item.statusBadge,
            item.governance,
            item.sourceTenant,
            item.lastScannedAt ? new Date(item.lastScannedAt).toISOString() : '',
          ]
            .map((val) => `"${String(val || '').replace(/"/g, '""')}"`)
            .join(',')
        ),
      ];

      return {
        contentType: 'text/csv',
        filename: `m365_full_discovery_inventory_${sourceDomain}_${Date.now()}.csv`,
        data: csvRows.join('\r\n'),
      };
    }
  }

  // Specific workload export
  let data: any[] = [];
  if (workload === 'users') {
    const where: any = {};
    if (options.selectedIds && options.selectedIds.length > 0) {
      where.id = { in: options.selectedIds };
    }
    data = await prisma.discoveryUser.findMany({ where });
  } else {
    data = await getDiscoveredWorkloadItems(workload);
  }

  if (format === 'json') {
    return {
      contentType: 'application/json',
      filename: `m365_discovery_${workload}_${sourceDomain}_${Date.now()}.json`,
      data: JSON.stringify(data, null, 2),
    };
  } else {
    if (data.length === 0) {
      return {
        contentType: 'text/csv',
        filename: `m365_discovery_${workload}_${sourceDomain}_${Date.now()}.csv`,
        data: 'No records found for this workload',
      };
    }

    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map((row) =>
        headers
          .map((h) => {
            const val = row[h];
            if (val === null || val === undefined) return '""';
            const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
            return `"${str.replace(/"/g, '""')}"`;
          })
          .join(',')
      ),
    ];

    return {
      contentType: 'text/csv',
      filename: `m365_discovery_${workload}_${sourceDomain}_${Date.now()}.csv`,
      data: csvRows.join('\r\n'),
    };
  }
}

function safeParseJSON(jsonStr: string, fallback: any) {
  try {
    return JSON.parse(jsonStr);
  } catch {
    return fallback;
  }
}
