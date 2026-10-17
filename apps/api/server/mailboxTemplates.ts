import { prisma } from './db.js';

// Pre-seeded standard enterprise mailbox migration templates matching typical production scenarios
export const SEED_MAILBOX_TEMPLATES = [
  {
    id: 'tmpl_standard_mailbox_sync',
    name: 'Standard Mailbox Cutover Template',
    description: 'Default enterprise mail migration with mail, calendar, contacts, tasks, and automatic coexistence mail forwarding.',
    sourceScenario: 'Primary mailbox',
    targetScenario: 'Primary mailbox',
    migrateMail: true,
    migrateCalendar: true,
    migrateContacts: true,
    migrateTasksNotes: true,
    migrateRecoverableItems: false,
    migrateSafeSenderList: true,
    resetMigration: false,
    migrateMailboxRules: true,
    migrateMailboxDelegation: true,
    enableAutomapping: true,
    migrateFolderPermissions: true,
    migrateAutoReply: false,
    migrateLitigationHold: false,
    manageMailForwarding: true,
    mailForwardingAction: 'Apply Mail Forwarding',
    forwardingDirection: 'From target to source',
    customForwardingDomain: 'contoso.onmicrosoft.com',
    folderSelection: 'Migrate all folders',
    excludedFolders: JSON.stringify(['Junk Email', 'Sync Issues', 'RSS Feeds']),
    specificFolders: JSON.stringify([]),
    migrateToCustomFolder: false,
    customFolderName: 'Migrated Mailbox',
    migrateToFolderMap: false,
    inboxTargetFolder: 'Inbox',
    deletedItemsTargetFolder: 'Deleted Items',
    archiveTargetFolder: 'Archive',
    sentItemsTargetFolder: 'Sent Items',
    targetLicensingPlan: 'Exchange Online Plan 2',
    autoAssignLicense: true,
    dateRangeFilter: 'ALL',
    excludeItemsLargerThanMB: 150,
    sendEmailOnComplete: true,
    notificationEmails: 'migration-admin@targettenant.com',
    sendUserWelcomeEmail: false,
    detailedItemAuditLog: true,
    includeFailedItemReports: true,
    scheduleType: 'IMMEDIATE',
    concurrencyLimit: 10,
  },
  {
    id: 'tmpl_vip_coexistence',
    name: 'Executive / VIP Coexistence Sync',
    description: 'High-fidelity migration preserving all delegations, custom folders, litigation hold, and auto-replies with bi-directional mail forwarding.',
    sourceScenario: 'Primary mailbox',
    targetScenario: 'Primary mailbox',
    migrateMail: true,
    migrateCalendar: true,
    migrateContacts: true,
    migrateTasksNotes: true,
    migrateRecoverableItems: true,
    migrateSafeSenderList: true,
    resetMigration: false,
    migrateMailboxRules: true,
    migrateMailboxDelegation: true,
    enableAutomapping: true,
    migrateFolderPermissions: true,
    migrateAutoReply: true,
    migrateLitigationHold: true,
    manageMailForwarding: true,
    mailForwardingAction: 'Apply Mail Forwarding',
    forwardingDirection: 'From target to source',
    customForwardingDomain: 'fabrikam.onmicrosoft.com',
    folderSelection: 'Migrate all folders',
    excludedFolders: JSON.stringify([]),
    specificFolders: JSON.stringify([]),
    migrateToCustomFolder: false,
    customFolderName: 'Migrated Mailbox',
    migrateToFolderMap: true,
    inboxTargetFolder: 'Inbox',
    deletedItemsTargetFolder: 'Deleted Items',
    archiveTargetFolder: 'Archive',
    sentItemsTargetFolder: 'Sent Items',
    targetLicensingPlan: 'Microsoft 365 E5',
    autoAssignLicense: true,
    dateRangeFilter: 'ALL',
    excludeItemsLargerThanMB: 250,
    sendEmailOnComplete: true,
    notificationEmails: 'vip-ops@targettenant.com',
    sendUserWelcomeEmail: true,
    detailedItemAuditLog: true,
    includeFailedItemReports: true,
    scheduleType: 'SCHEDULED',
    concurrencyLimit: 5,
  },
  {
    id: 'tmpl_archive_only',
    name: 'In-Place Archive Staging Template',
    description: 'Transfers historical items directly to target in-place archive mailbox without touching primary mailbox mail flow.',
    sourceScenario: 'Archive mailbox',
    targetScenario: 'Archive mailbox',
    migrateMail: true,
    migrateCalendar: false,
    migrateContacts: false,
    migrateTasksNotes: false,
    migrateRecoverableItems: true,
    migrateSafeSenderList: false,
    resetMigration: false,
    migrateMailboxRules: false,
    migrateMailboxDelegation: false,
    enableAutomapping: false,
    migrateFolderPermissions: false,
    migrateAutoReply: false,
    migrateLitigationHold: true,
    manageMailForwarding: false,
    mailForwardingAction: 'Remove Mail Forwarding',
    forwardingDirection: 'From target to source',
    customForwardingDomain: '',
    folderSelection: 'Migrate all folders',
    excludedFolders: JSON.stringify([]),
    specificFolders: JSON.stringify([]),
    migrateToCustomFolder: true,
    customFolderName: 'Legacy Archive',
    migrateToFolderMap: false,
    inboxTargetFolder: 'Inbox',
    deletedItemsTargetFolder: 'Deleted Items',
    archiveTargetFolder: 'Archive',
    sentItemsTargetFolder: 'Sent Items',
    targetLicensingPlan: 'Exchange Online Archiving',
    autoAssignLicense: true,
    dateRangeFilter: 'ALL',
    excludeItemsLargerThanMB: 150,
    sendEmailOnComplete: true,
    notificationEmails: 'compliance@targettenant.com',
    sendUserWelcomeEmail: false,
    detailedItemAuditLog: true,
    includeFailedItemReports: true,
    scheduleType: 'IMMEDIATE',
    concurrencyLimit: 15,
  },
];

export async function ensureMailboxTemplatesSeeded() {
  try {
    const count = await prisma.mailboxMigrationTemplate.count();
    if (count === 0) {
      for (const tmpl of SEED_MAILBOX_TEMPLATES) {
        await prisma.mailboxMigrationTemplate.create({
          data: tmpl,
        });
      }
      console.log(`[Seed] Seeded ${SEED_MAILBOX_TEMPLATES.length} initial mailbox migration templates.`);
    }
  } catch (err) {
    console.error('[Seed Error] Failed to seed mailbox templates:', err);
  }
}

export async function getMailboxTemplates() {
  await ensureMailboxTemplatesSeeded();
  const templates = await prisma.mailboxMigrationTemplate.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return templates.map((t) => ({
    ...t,
    excludedFolders: t.excludedFolders ? JSON.parse(t.excludedFolders) : [],
    specificFolders: t.specificFolders ? JSON.parse(t.specificFolders) : [],
  }));
}

export async function saveMailboxTemplate(data: any) {
  const payload = {
    name: data.name || 'Untitled Mailbox Template',
    description: data.description || '',
    sourceScenario: data.sourceScenario || 'Primary mailbox',
    targetScenario: data.targetScenario || 'Primary mailbox',
    
    // Step 3: Migration Options
    migrateMail: Boolean(data.migrateMail),
    migrateCalendar: Boolean(data.migrateCalendar),
    migrateContacts: Boolean(data.migrateContacts),
    migrateTasksNotes: Boolean(data.migrateTasksNotes),
    migrateRecoverableItems: Boolean(data.migrateRecoverableItems),
    migrateSafeSenderList: Boolean(data.migrateSafeSenderList),
    resetMigration: Boolean(data.resetMigration),

    // Step 4: Migration Settings
    migrateMailboxRules: Boolean(data.migrateMailboxRules),
    migrateMailboxDelegation: Boolean(data.migrateMailboxDelegation),
    enableAutomapping: Boolean(data.enableAutomapping ?? true),
    migrateFolderPermissions: Boolean(data.migrateFolderPermissions),
    migrateAutoReply: Boolean(data.migrateAutoReply),
    migrateLitigationHold: Boolean(data.migrateLitigationHold),

    // Step 5: Mail Flow
    manageMailForwarding: Boolean(data.manageMailForwarding),
    mailForwardingAction: data.mailForwardingAction || 'Apply Mail Forwarding',
    forwardingDirection: data.forwardingDirection || 'From target to source',
    customForwardingDomain: data.customForwardingDomain || null,

    // Step 6: Mail Folders
    folderSelection: data.folderSelection || 'Migrate all folders',
    excludedFolders: JSON.stringify(Array.isArray(data.excludedFolders) ? data.excludedFolders : []),
    specificFolders: JSON.stringify(Array.isArray(data.specificFolders) ? data.specificFolders : []),
    migrateToCustomFolder: Boolean(data.migrateToCustomFolder),
    customFolderName: data.customFolderName || 'Migrated Mailbox',
    migrateToFolderMap: Boolean(data.migrateToFolderMap),
    inboxTargetFolder: data.inboxTargetFolder || 'Inbox',
    deletedItemsTargetFolder: data.deletedItemsTargetFolder || 'Deleted Items',
    archiveTargetFolder: data.archiveTargetFolder || 'Archive',
    sentItemsTargetFolder: data.sentItemsTargetFolder || 'Sent Items',

    // Step 2: Licensing Plan
    targetLicensingPlan: data.targetLicensingPlan || 'Exchange Online Plan 2',
    autoAssignLicense: Boolean(data.autoAssignLicense ?? true),

    // Step 7: Date Range
    dateRangeFilter: data.dateRangeFilter || 'ALL',
    startDate: data.startDate ? new Date(data.startDate) : null,
    endDate: data.endDate ? new Date(data.endDate) : null,
    excludeItemsLargerThanMB: data.excludeItemsLargerThanMB ? Number(data.excludeItemsLargerThanMB) : 150,

    // Step 8: Notification
    sendEmailOnComplete: Boolean(data.sendEmailOnComplete ?? true),
    notificationEmails: data.notificationEmails || 'admin@targetm365.com',
    sendUserWelcomeEmail: Boolean(data.sendUserWelcomeEmail),

    // Step 9: Reporting
    detailedItemAuditLog: Boolean(data.detailedItemAuditLog ?? true),
    includeFailedItemReports: Boolean(data.includeFailedItemReports ?? true),

    // Step 10: Schedule
    scheduleType: data.scheduleType || 'IMMEDIATE',
    scheduledTime: data.scheduledTime ? new Date(data.scheduledTime) : null,
    concurrencyLimit: data.concurrencyLimit ? Number(data.concurrencyLimit) : 10,
  };

  if (data.id && data.id.startsWith('tmpl_')) {
    // Check if exists
    const existing = await prisma.mailboxMigrationTemplate.findUnique({ where: { id: data.id } });
    if (existing) {
      return prisma.mailboxMigrationTemplate.update({
        where: { id: data.id },
        data: payload,
      });
    }
  }

  return prisma.mailboxMigrationTemplate.create({
    data: payload,
  });
}

export async function deleteMailboxTemplate(id: string) {
  return prisma.mailboxMigrationTemplate.delete({
    where: { id },
  });
}

export async function getMailboxMigrationTasks() {
  return prisma.mailboxMigrationTask.findMany({
    orderBy: { createdAt: 'desc' },
  });
}

export async function createMailboxMigrationTask(data: any) {
  return prisma.mailboxMigrationTask.create({
    data: {
      taskName: data.taskName || `Mailbox Migration - ${new Date().toLocaleDateString()}`,
      templateId: data.templateId || null,
      templateName: data.templateName || 'Custom Template',
      sourceUPN: data.sourceUPN,
      targetUPN: data.targetUPN || data.sourceUPN,
      status: 'IN_PROGRESS',
      progressPercent: 5,
      itemsMigrated: 12,
      totalItems: data.totalItems || 1540,
      sizeMigratedMB: 24.5,
      totalSizeMB: data.totalSizeMB || 3200,
      currentFolder: 'Inbox',
      startedAt: new Date(),
    },
  });
}
