import React, { useState } from 'react';
import {
  X,
  Check,
  ChevronRight,
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
  Play
} from 'lucide-react';
import { MailboxMigrationTemplate } from '../../types';

interface MailMigrationWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveTemplate: (templateData: any) => Promise<void>;
  initialTemplate?: MailboxMigrationTemplate | null;
  targetUserUPN?: string;
}

export const MailMigrationWizardModal: React.FC<MailMigrationWizardModalProps> = ({
  isOpen,
  onClose,
  onSaveTemplate,
  initialTemplate,
  targetUserUPN,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(3); // Default to Step 3 (Migration Options) or Step 1
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [tooltipHover, setTooltipHover] = useState<string | null>(null);

  // Form State initialized with defaults or initialTemplate
  const [formData, setFormData] = useState({
    name: initialTemplate?.name || (targetUserUPN ? `Mailbox Migration - ${targetUserUPN.split('@')[0]}` : 'New Mailbox Migration Template'),
    description: initialTemplate?.description || 'Standard mailbox migration template with mail, calendar, coexistence mail forwarding, and rules preservation.',
    sourceTenant: 'contoso.onmicrosoft.com',
    targetTenant: 'fabrikam.onmicrosoft.com',
    saveAsTemplate: true,

    // Step 2: Licensing Plan
    targetLicensingPlan: initialTemplate?.targetLicensingPlan || 'Exchange Online Plan 2',
    autoAssignLicense: initialTemplate?.autoAssignLicense ?? true,

    // Step 3: Migration Options (Screenshot 2)
    sourceScenario: initialTemplate?.sourceScenario || 'Primary mailbox',
    targetScenario: initialTemplate?.targetScenario || 'Primary mailbox',
    migrateMail: initialTemplate?.migrateMail ?? true,
    migrateCalendar: initialTemplate?.migrateCalendar ?? true,
    migrateContacts: initialTemplate?.migrateContacts ?? true,
    migrateTasksNotes: initialTemplate?.migrateTasksNotes ?? true,
    migrateRecoverableItems: initialTemplate?.migrateRecoverableItems ?? false,
    migrateSafeSenderList: initialTemplate?.migrateSafeSenderList ?? false,
    resetMigration: initialTemplate?.resetMigration ?? false,

    // Step 4: Migration Settings (Screenshot 3)
    migrateMailboxRules: initialTemplate?.migrateMailboxRules ?? false,
    migrateMailboxDelegation: initialTemplate?.migrateMailboxDelegation ?? false,
    enableAutomapping: initialTemplate?.enableAutomapping ?? true,
    migrateFolderPermissions: initialTemplate?.migrateFolderPermissions ?? false,
    migrateAutoReply: initialTemplate?.migrateAutoReply ?? false,
    migrateLitigationHold: initialTemplate?.migrateLitigationHold ?? false,

    // Step 5: Mail Flow (Screenshot 4)
    manageMailForwarding: initialTemplate?.manageMailForwarding ?? true,
    mailForwardingAction: initialTemplate?.mailForwardingAction || 'Apply Mail Forwarding',
    forwardingDirection: initialTemplate?.forwardingDirection || 'From target to source',
    customForwardingDomain: initialTemplate?.customForwardingDomain || '',

    // Step 6: Mail Folders (Screenshot 1)
    folderSelection: initialTemplate?.folderSelection || 'Migrate all folders',
    excludedFolders: initialTemplate?.excludedFolders || ['Junk Email', 'Sync Issues'],
    specificFolders: initialTemplate?.specificFolders || ['Inbox', 'Sent Items', 'Archive'],
    migrateToCustomFolder: initialTemplate?.migrateToCustomFolder ?? false,
    customFolderName: initialTemplate?.customFolderName || 'Migrated Mailbox',
    migrateToFolderMap: initialTemplate?.migrateToFolderMap ?? false,
    inboxTargetFolder: initialTemplate?.inboxTargetFolder || 'Inbox',
    deletedItemsTargetFolder: initialTemplate?.deletedItemsTargetFolder || 'Deleted Items',
    archiveTargetFolder: initialTemplate?.archiveTargetFolder || 'Archive',
    sentItemsTargetFolder: initialTemplate?.sentItemsTargetFolder || 'Sent Items',

    // Step 7: Date Range
    dateRangeFilter: initialTemplate?.dateRangeFilter || 'ALL',
    startDate: initialTemplate?.startDate || '',
    endDate: initialTemplate?.endDate || '',
    excludeItemsLargerThanMB: initialTemplate?.excludeItemsLargerThanMB || 150,

    // Step 8: Notification
    sendEmailOnComplete: initialTemplate?.sendEmailOnComplete ?? true,
    notificationEmails: initialTemplate?.notificationEmails || 'admin@targettenant.com',
    sendUserWelcomeEmail: initialTemplate?.sendUserWelcomeEmail ?? false,

    // Step 9: Reporting
    detailedItemAuditLog: initialTemplate?.detailedItemAuditLog ?? true,
    includeFailedItemReports: initialTemplate?.includeFailedItemReports ?? true,

    // Step 10: Schedule
    scheduleType: initialTemplate?.scheduleType || 'IMMEDIATE',
    scheduledTime: initialTemplate?.scheduledTime || '',
    concurrencyLimit: initialTemplate?.concurrencyLimit || 10,
  });

  if (!isOpen) return null;

  const steps = [
    { number: 1, title: 'Start', short: 'Start' },
    { number: 2, title: 'Licensing Plan', short: 'Licensing' },
    { number: 3, title: 'Migration Options', short: 'Options' },
    { number: 4, title: 'Migration Settings', short: 'Settings' },
    { number: 5, title: 'Mail Flow', short: 'Mail Flow' },
    { number: 6, title: 'Mail Folders', short: 'Folders' },
    { number: 7, title: 'Date Range', short: 'Date Range' },
    { number: 8, title: 'Notification', short: 'Notification' },
    { number: 9, title: 'Reporting', short: 'Reporting' },
    { number: 10, title: 'Schedule', short: 'Schedule' },
    { number: 11, title: 'Summary', short: 'Summary' },
  ];

  const handleNext = () => {
    if (currentStep < 11) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      await onSaveTemplate(formData);
      onClose();
    } catch (err) {
      console.error('Failed to submit template:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div
        className="relative w-full max-w-5xl bg-[#1e222d] border border-slate-700/80 rounded-lg shadow-2xl overflow-hidden flex flex-col my-8"
        style={{ minHeight: '680px' }}
      >
        {/* Wizard Header Bar */}
        <div className="px-6 py-4 bg-[#181b24] border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white tracking-wide">
                New Mail Migration Task
              </h2>
              <p className="text-xs text-slate-400">
                Configure mailbox transfer options, items, mail flow coexistence, and scheduling
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition"
            title="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Body: Left Step Sidebar + Right Step Content */}
        <div className="flex-1 flex flex-col md:flex-row min-h-[500px]">
          {/* Left Steps Navigation Sidebar */}
          <div className="w-full md:w-60 bg-[#161821] border-r border-slate-800/80 p-3 shrink-0">
            <nav className="space-y-0.5">
              {steps.map((step) => {
                const isCurrent = currentStep === step.number;
                const isPassed = currentStep > step.number;

                return (
                  <button
                    key={step.number}
                    id={`wizard-step-btn-${step.number}`}
                    onClick={() => setCurrentStep(step.number)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 text-xs text-left transition relative rounded ${
                      isCurrent
                        ? 'bg-[#222736] text-white font-semibold'
                        : isPassed
                        ? 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {/* Active orange left border bar as shown in screenshots */}
                    {isCurrent && (
                      <span className="absolute left-0 top-1 bottom-1 w-1 bg-amber-500 rounded-r" />
                    )}

                    {/* Step Icon: Checkmark if passed, number if current or future */}
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono shrink-0 ${
                        isPassed
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold'
                          : isCurrent
                          ? 'bg-blue-600 text-white font-bold'
                          : 'bg-slate-800 text-slate-500 border border-slate-700'
                      }`}
                    >
                      {isPassed ? <Check className="w-3 h-3" /> : step.number}
                    </div>

                    <span className="truncate">{step.title}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right Main Step Form Content */}
          <div className="flex-1 p-6 md:p-8 bg-[#1e222d] overflow-y-auto flex flex-col justify-between">
            <div>
              {/* ============================================================== */}
              {/* STEP 1: START */}
              {/* ============================================================== */}
              {currentStep === 1 && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="border-b border-slate-800 pb-3">
                    <h3 className="text-sm font-semibold text-white">General Information & Tenants</h3>
                    <p className="text-xs text-slate-400">
                      Define the name of this mail migration task and verify tenant endpoints.
                    </p>
                  </div>

                  <div className="space-y-4 max-w-xl">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Task / Template Name <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-[#161821] border border-slate-700 rounded text-white focus:outline-none focus:border-blue-500"
                        placeholder="e.g. Standard Cutover Template"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Description / Notes
                      </label>
                      <textarea
                        rows={3}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-[#161821] border border-slate-700 rounded text-white focus:outline-none focus:border-blue-500"
                        placeholder="Purpose, migration wave notes, or stakeholder instructions"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div className="p-3.5 bg-[#161821] border border-slate-800 rounded">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                          Source Tenant
                        </span>
                        <div className="text-xs font-mono text-blue-400 font-medium">
                          {formData.sourceTenant}
                        </div>
                        <span className="text-[10px] text-emerald-400 mt-1 block">Connected (EWS & Graph API)</span>
                      </div>

                      <div className="p-3.5 bg-[#161821] border border-slate-800 rounded">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                          Target Tenant
                        </span>
                        <div className="text-xs font-mono text-emerald-400 font-medium">
                          {formData.targetTenant}
                        </div>
                        <span className="text-[10px] text-emerald-400 mt-1 block">Connected (Target Provisioned)</span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <label className="flex items-center space-x-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.saveAsTemplate}
                          onChange={(e) => setFormData({ ...formData, saveAsTemplate: e.target.checked })}
                          className="w-4 h-4 rounded bg-[#161821] border-slate-700 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-xs text-slate-300">
                          Save as reusable Mailbox Migration Template for future waves
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* STEP 2: LICENSING PLAN */}
              {/* ============================================================== */}
              {currentStep === 2 && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="border-b border-slate-800 pb-3">
                    <h3 className="text-sm font-semibold text-white">Target Licensing Plan</h3>
                    <p className="text-xs text-slate-400">
                      Specify the Exchange Online license assignment policy for the destination mailboxes.
                    </p>
                  </div>

                  <div className="space-y-4 max-w-xl">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Target License Plan
                      </label>
                      <select
                        value={formData.targetLicensingPlan}
                        onChange={(e) => setFormData({ ...formData, targetLicensingPlan: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-[#161821] border border-slate-700 rounded text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="Exchange Online Plan 2">Exchange Online Plan 2 (100 GB Mailbox + In-Place Archive)</option>
                        <option value="Exchange Online Plan 1">Exchange Online Plan 1 (50 GB Mailbox)</option>
                        <option value="Microsoft 365 E5">Microsoft 365 E5 (Complete Productivity & Advanced Security)</option>
                        <option value="Microsoft 365 E3">Microsoft 365 E3 (Enterprise Suite)</option>
                        <option value="Microsoft 365 Business Premium">Microsoft 365 Business Premium</option>
                      </select>
                    </div>

                    <div className="p-4 bg-[#161821] border border-slate-800 rounded space-y-3">
                      <label className="flex items-start space-x-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.autoAssignLicense}
                          onChange={(e) => setFormData({ ...formData, autoAssignLicense: e.target.checked })}
                          className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-blue-500 mt-0.5"
                        />
                        <div>
                          <span className="text-xs font-medium text-white block">
                            Auto-assign target license if destination account is unlicensed
                          </span>
                          <span className="text-[11px] text-slate-400">
                            Ensures the destination mailbox is created and enabled before data sync begins.
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* STEP 3: MIGRATION OPTIONS (SCREENSHOT 2) */}
              {/* ============================================================== */}
              {currentStep === 3 && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Migration Scenario Section */}
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-3">Migration Scenario</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">
                          from
                        </label>
                        <select
                          value={formData.sourceScenario}
                          onChange={(e) => setFormData({ ...formData, sourceScenario: e.target.value })}
                          className="w-full px-3 py-2 text-xs bg-[#161821] border border-slate-700 rounded text-white focus:outline-none focus:border-blue-500"
                        >
                          <option value="Primary mailbox">Primary mailbox</option>
                          <option value="Archive mailbox">Archive mailbox</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">
                          to
                        </label>
                        <select
                          value={formData.targetScenario}
                          onChange={(e) => setFormData({ ...formData, targetScenario: e.target.value })}
                          className="w-full px-3 py-2 text-xs bg-[#161821] border border-slate-700 rounded text-white focus:outline-none focus:border-blue-500"
                        >
                          <option value="Primary mailbox">Primary mailbox</option>
                          <option value="Archive mailbox">Archive mailbox</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Checkboxes items list matching screenshot 2 */}
                  <div className="pt-2 border-t border-slate-800 space-y-3">
                    <label className="flex items-center space-x-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.migrateMail}
                        onChange={(e) => setFormData({ ...formData, migrateMail: e.target.checked })}
                        className="w-4 h-4 rounded bg-[#161821] border-slate-700 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs text-slate-200">Migrate Mail</span>
                    </label>

                    <label className="flex items-center space-x-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.migrateCalendar}
                        onChange={(e) => setFormData({ ...formData, migrateCalendar: e.target.checked })}
                        className="w-4 h-4 rounded bg-[#161821] border-slate-700 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs text-slate-200">Migrate Calendar</span>
                    </label>

                    <label className="flex items-center space-x-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.migrateContacts}
                        onChange={(e) => setFormData({ ...formData, migrateContacts: e.target.checked })}
                        className="w-4 h-4 rounded bg-[#161821] border-slate-700 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs text-slate-200">Migrate Contacts</span>
                    </label>

                    <label className="flex items-center space-x-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.migrateTasksNotes}
                        onChange={(e) => setFormData({ ...formData, migrateTasksNotes: e.target.checked })}
                        className="w-4 h-4 rounded bg-[#161821] border-slate-700 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs text-slate-200">Migrate Tasks/Notes</span>
                    </label>

                    <label className="flex items-center space-x-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.migrateRecoverableItems}
                        onChange={(e) => setFormData({ ...formData, migrateRecoverableItems: e.target.checked })}
                        className="w-4 h-4 rounded bg-[#161821] border-slate-700 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs text-slate-200">Migrate Recoverable Items</span>
                    </label>

                    <label className="flex items-center space-x-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.migrateSafeSenderList}
                        onChange={(e) => setFormData({ ...formData, migrateSafeSenderList: e.target.checked })}
                        className="w-4 h-4 rounded bg-[#161821] border-slate-700 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs text-slate-200">Migrate Safe Sender and Blocked List</span>
                    </label>

                    <div className="flex items-center space-x-2.5 pt-1">
                      <label className="flex items-center space-x-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.resetMigration}
                          onChange={(e) => setFormData({ ...formData, resetMigration: e.target.checked })}
                          className="w-4 h-4 rounded bg-[#161821] border-slate-700 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-xs text-slate-200">Reset Migration</span>
                      </label>
                      <div
                        className="relative cursor-pointer text-slate-400 hover:text-blue-400"
                        onMouseEnter={() => setTooltipHover('resetMigration')}
                        onMouseLeave={() => setTooltipHover(null)}
                      >
                        <Info className="w-3.5 h-3.5" />
                        {tooltipHover === 'resetMigration' && (
                          <div className="absolute left-6 top-1/2 -translate-y-1/2 w-64 p-2 bg-slate-900 border border-slate-700 rounded text-[11px] text-slate-200 shadow-xl z-20">
                            Resets migration state tracking and syncs all items again from scratch.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* STEP 4: MIGRATION SETTINGS (SCREENSHOT 3) */}
              {/* ============================================================== */}
              {currentStep === 4 && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="border-b border-slate-800 pb-3">
                    <h3 className="text-sm font-semibold text-white">Migration Settings</h3>
                    <p className="text-xs text-slate-400">
                      Configure inbox rules, mailbox delegation permissions, automapping, and compliance hold.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* Migrate Mailbox Rules */}
                    <div className="flex items-center space-x-2">
                      <label className="flex items-center space-x-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.migrateMailboxRules}
                          onChange={(e) => setFormData({ ...formData, migrateMailboxRules: e.target.checked })}
                          className="w-4 h-4 rounded bg-[#161821] border-slate-700 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-xs text-slate-200">Migrate Mailbox Rules</span>
                      </label>
                      <div
                        className="relative cursor-pointer text-slate-400 hover:text-blue-400"
                        onMouseEnter={() => setTooltipHover('rules')}
                        onMouseLeave={() => setTooltipHover(null)}
                      >
                        <Info className="w-3.5 h-3.5" />
                        {tooltipHover === 'rules' && (
                          <div className="absolute left-6 top-1/2 -translate-y-1/2 w-64 p-2 bg-slate-900 border border-slate-700 rounded text-[11px] text-slate-200 shadow-xl z-20">
                            Migrates client-side and server-side Outlook inbox routing rules.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Migrate Mailbox Delegation */}
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.migrateMailboxDelegation}
                          onChange={(e) => setFormData({ ...formData, migrateMailboxDelegation: e.target.checked })}
                          className="w-4 h-4 rounded bg-[#161821] border-slate-700 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-xs text-slate-200">Migrate Mailbox Delegation</span>
                      </label>

                      {/* Indented Enable Automapping for shared mailboxes */}
                      <div className="pl-6">
                        <label className="flex items-center space-x-2.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.enableAutomapping}
                            disabled={!formData.migrateMailboxDelegation}
                            onChange={(e) => setFormData({ ...formData, enableAutomapping: e.target.checked })}
                            className="w-4 h-4 rounded bg-[#161821] border-slate-700 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                          />
                          <span className={`text-xs ${formData.migrateMailboxDelegation ? 'text-slate-300' : 'text-slate-500'}`}>
                            Enable Automapping for shared mailboxes
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* Migrate Folder Permissions */}
                    <div>
                      <label className="flex items-center space-x-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.migrateFolderPermissions}
                          onChange={(e) => setFormData({ ...formData, migrateFolderPermissions: e.target.checked })}
                          className="w-4 h-4 rounded bg-[#161821] border-slate-700 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-xs text-slate-200">Migrate Folder Permissions</span>
                      </label>
                    </div>

                    {/* Migrate Auto Reply */}
                    <div>
                      <label className="flex items-center space-x-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.migrateAutoReply}
                          onChange={(e) => setFormData({ ...formData, migrateAutoReply: e.target.checked })}
                          className="w-4 h-4 rounded bg-[#161821] border-slate-700 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-xs text-slate-200">Migrate Auto Reply</span>
                      </label>
                    </div>

                    {/* Migrate Litigation Hold Settings */}
                    <div className="flex items-center space-x-2">
                      <label className="flex items-center space-x-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.migrateLitigationHold}
                          onChange={(e) => setFormData({ ...formData, migrateLitigationHold: e.target.checked })}
                          className="w-4 h-4 rounded bg-[#161821] border-slate-700 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-xs text-slate-200">Migrate Litigation Hold Settings</span>
                      </label>
                      <div
                        className="relative cursor-pointer text-slate-400 hover:text-blue-400"
                        onMouseEnter={() => setTooltipHover('litigation')}
                        onMouseLeave={() => setTooltipHover(null)}
                      >
                        <Info className="w-3.5 h-3.5" />
                        {tooltipHover === 'litigation' && (
                          <div className="absolute left-6 top-1/2 -translate-y-1/2 w-64 p-2 bg-slate-900 border border-slate-700 rounded text-[11px] text-slate-200 shadow-xl z-20">
                            Preserves legal hold flags, retention duration, and compliance owner attributes.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* STEP 5: MAIL FLOW (SCREENSHOT 4) */}
              {/* ============================================================== */}
              {currentStep === 5 && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex items-center space-x-2">
                    <label className="flex items-center space-x-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.manageMailForwarding}
                        onChange={(e) => setFormData({ ...formData, manageMailForwarding: e.target.checked })}
                        className="w-4 h-4 rounded bg-[#161821] border-slate-700 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-semibold text-white">Manage Mail Forwarding</span>
                    </label>
                    <div
                      className="relative cursor-pointer text-slate-400 hover:text-blue-400"
                      onMouseEnter={() => setTooltipHover('mailflow')}
                      onMouseLeave={() => setTooltipHover(null)}
                    >
                      <Info className="w-3.5 h-3.5" />
                      {tooltipHover === 'mailflow' && (
                        <div className="absolute left-6 top-1/2 -translate-y-1/2 w-64 p-2 bg-slate-900 border border-slate-700 rounded text-[11px] text-slate-200 shadow-xl z-20">
                          Automatically configures routing forwarders to maintain mail delivery during coexistence.
                        </div>
                      )}
                    </div>
                  </div>

                  {formData.manageMailForwarding && (
                    <div className="space-y-4 pl-6 border-l-2 border-slate-700/80">
                      {/* Radio buttons: Apply vs Remove Mail Forwarding */}
                      <div className="space-y-2">
                        <label className="flex items-center space-x-2.5 cursor-pointer">
                          <input
                            type="radio"
                            name="mailForwardingAction"
                            value="Apply Mail Forwarding"
                            checked={formData.mailForwardingAction === 'Apply Mail Forwarding'}
                            onChange={(e) => setFormData({ ...formData, mailForwardingAction: e.target.value })}
                            className="w-4 h-4 text-blue-600 bg-[#161821] border-slate-700 focus:ring-blue-500"
                          />
                          <span className="text-xs text-slate-200">Apply Mail Forwarding</span>
                        </label>

                        <label className="flex items-center space-x-2.5 cursor-pointer">
                          <input
                            type="radio"
                            name="mailForwardingAction"
                            value="Remove Mail Forwarding"
                            checked={formData.mailForwardingAction === 'Remove Mail Forwarding'}
                            onChange={(e) => setFormData({ ...formData, mailForwardingAction: e.target.value })}
                            className="w-4 h-4 text-blue-600 bg-[#161821] border-slate-700 focus:ring-blue-500"
                          />
                          <span className="text-xs text-slate-200">Remove Mail Forwarding</span>
                        </label>
                      </div>

                      {/* Mail Forwarding Direction Dropdown */}
                      <div className="max-w-md pt-2">
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">
                          Mail forwarding direction
                        </label>
                        <select
                          value={formData.forwardingDirection}
                          onChange={(e) => setFormData({ ...formData, forwardingDirection: e.target.value })}
                          className="w-full px-3 py-2 text-xs bg-[#161821] border border-slate-700 rounded text-white focus:outline-none focus:border-blue-500"
                        >
                          <option value="From target to source">From target to source</option>
                          <option value="From source to target">From source to target</option>
                        </select>
                      </div>

                      {/* Custom domain for forwarding */}
                      <div className="max-w-md pt-2">
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">
                          Custom domain for forwarding
                        </label>
                        <input
                          type="text"
                          value={formData.customForwardingDomain}
                          onChange={(e) => setFormData({ ...formData, customForwardingDomain: e.target.value })}
                          className="w-full px-3 py-2 text-xs bg-[#161821] border border-slate-700 rounded text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                          placeholder="e.g. forward.targettenant.com"
                        />
                        <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                          Specify the custom domain name for forwarding email addresses. If the domain is omitted or does not exist, the primary SMTP address will be used.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ============================================================== */}
              {/* STEP 6: MAIL FOLDERS (SCREENSHOT 1) */}
              {/* ============================================================== */}
              {currentStep === 6 && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Folder Selection Radios */}
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2.5 cursor-pointer">
                      <input
                        type="radio"
                        name="folderSelection"
                        value="Migrate all folders"
                        checked={formData.folderSelection === 'Migrate all folders'}
                        onChange={(e) => setFormData({ ...formData, folderSelection: e.target.value })}
                        className="w-4 h-4 text-blue-600 bg-[#161821] border-slate-700 focus:ring-blue-500"
                      />
                      <span className="text-xs text-slate-200">Migrate all folders</span>
                    </label>

                    <label className="flex items-center space-x-2.5 cursor-pointer">
                      <input
                        type="radio"
                        name="folderSelection"
                        value="Migrate all folders except"
                        checked={formData.folderSelection === 'Migrate all folders except'}
                        onChange={(e) => setFormData({ ...formData, folderSelection: e.target.value })}
                        className="w-4 h-4 text-blue-600 bg-[#161821] border-slate-700 focus:ring-blue-500"
                      />
                      <span className="text-xs text-slate-200">Migrate all folders except</span>
                    </label>

                    <label className="flex items-center space-x-2.5 cursor-pointer">
                      <input
                        type="radio"
                        name="folderSelection"
                        value="Migrate specific folders"
                        checked={formData.folderSelection === 'Migrate specific folders'}
                        onChange={(e) => setFormData({ ...formData, folderSelection: e.target.value })}
                        className="w-4 h-4 text-blue-600 bg-[#161821] border-slate-700 focus:ring-blue-500"
                      />
                      <span className="text-xs text-slate-200">Migrate specific folders</span>
                    </label>
                  </div>

                  {/* Folder Selection Explanation */}
                  <p className="text-xs text-slate-400 italic">
                    Transfer all mailbox content to the target.
                  </p>

                  <div className="pt-2 border-t border-slate-800 space-y-4 max-w-md">
                    {/* Migrate to custom folder */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <label className="flex items-center space-x-2.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.migrateToCustomFolder}
                            onChange={(e) => setFormData({ ...formData, migrateToCustomFolder: e.target.checked })}
                            className="w-4 h-4 rounded bg-[#161821] border-slate-700 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-xs text-slate-200">Migrate to custom folder</span>
                        </label>
                      </div>

                      {formData.migrateToCustomFolder && (
                        <div className="pl-6 flex items-center space-x-2">
                          <span className="text-xs text-slate-400 whitespace-nowrap">Custom Folder Name:</span>
                          <input
                            type="text"
                            value={formData.customFolderName}
                            onChange={(e) => setFormData({ ...formData, customFolderName: e.target.value })}
                            className="flex-1 px-2.5 py-1.5 text-xs bg-[#161821] border border-slate-700 rounded text-white focus:outline-none focus:border-blue-500"
                            placeholder="Migrated Mailbox"
                          />
                          <Info className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                      )}
                    </div>

                    {/* Migrate to folder */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center space-x-2">
                        <label className="flex items-center space-x-2.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.migrateToFolderMap}
                            onChange={(e) => setFormData({ ...formData, migrateToFolderMap: e.target.checked })}
                            className="w-4 h-4 rounded bg-[#161821] border-slate-700 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-xs text-slate-200">Migrate to folder</span>
                        </label>
                        <Info className="w-3.5 h-3.5 text-slate-400" />
                      </div>

                      {formData.migrateToFolderMap && (
                        <div className="pl-6 space-y-2">
                          <div className="flex items-center space-x-3">
                            <span className="text-xs text-slate-400 w-28">Inbox:</span>
                            <input
                              type="text"
                              value={formData.inboxTargetFolder}
                              onChange={(e) => setFormData({ ...formData, inboxTargetFolder: e.target.value })}
                              className="flex-1 px-2.5 py-1.5 text-xs bg-[#161821] border border-slate-700 rounded text-white"
                            />
                          </div>

                          <div className="flex items-center space-x-3">
                            <span className="text-xs text-slate-400 w-28">Deleted Items:</span>
                            <input
                              type="text"
                              value={formData.deletedItemsTargetFolder}
                              onChange={(e) => setFormData({ ...formData, deletedItemsTargetFolder: e.target.value })}
                              className="flex-1 px-2.5 py-1.5 text-xs bg-[#161821] border border-slate-700 rounded text-white"
                            />
                          </div>

                          <div className="flex items-center space-x-3">
                            <span className="text-xs text-slate-400 w-28">Archive:</span>
                            <input
                              type="text"
                              value={formData.archiveTargetFolder}
                              onChange={(e) => setFormData({ ...formData, archiveTargetFolder: e.target.value })}
                              className="flex-1 px-2.5 py-1.5 text-xs bg-[#161821] border border-slate-700 rounded text-white"
                            />
                            <Info className="w-3.5 h-3.5 text-slate-400" />
                          </div>

                          <div className="flex items-center space-x-3">
                            <span className="text-xs text-slate-400 w-28">Sent Items:</span>
                            <input
                              type="text"
                              value={formData.sentItemsTargetFolder}
                              onChange={(e) => setFormData({ ...formData, sentItemsTargetFolder: e.target.value })}
                              className="flex-1 px-2.5 py-1.5 text-xs bg-[#161821] border border-slate-700 rounded text-white"
                            />
                          </div>

                          <p className="text-[11px] text-slate-400 mt-2">
                            Migrates well known folders to any custom named folder.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* STEP 7: DATE RANGE */}
              {/* ============================================================== */}
              {currentStep === 7 && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="border-b border-slate-800 pb-3">
                    <h3 className="text-sm font-semibold text-white">Date Range & Size Filters</h3>
                    <p className="text-xs text-slate-400">
                      Select which message date horizons to include and configure size exclusion limits.
                    </p>
                  </div>

                  <div className="space-y-4 max-w-lg">
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2.5 cursor-pointer">
                        <input
                          type="radio"
                          name="dateRangeFilter"
                          value="ALL"
                          checked={formData.dateRangeFilter === 'ALL'}
                          onChange={(e) => setFormData({ ...formData, dateRangeFilter: e.target.value })}
                          className="w-4 h-4 text-blue-600 bg-[#161821] border-slate-700"
                        />
                        <span className="text-xs text-slate-200">Migrate all items regardless of age</span>
                      </label>

                      <label className="flex items-center space-x-2.5 cursor-pointer">
                        <input
                          type="radio"
                          name="dateRangeFilter"
                          value="NEWER_THAN_6M"
                          checked={formData.dateRangeFilter === 'NEWER_THAN_6M'}
                          onChange={(e) => setFormData({ ...formData, dateRangeFilter: e.target.value })}
                          className="w-4 h-4 text-blue-600 bg-[#161821] border-slate-700"
                        />
                        <span className="text-xs text-slate-200">Only migrate recent items (Newer than 6 months)</span>
                      </label>
                    </div>

                    <div className="pt-3 border-t border-slate-800">
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Exclude items larger than (MB)
                      </label>
                      <div className="flex items-center space-x-3">
                        <input
                          type="number"
                          value={formData.excludeItemsLargerThanMB}
                          onChange={(e) => setFormData({ ...formData, excludeItemsLargerThanMB: Number(e.target.value) })}
                          className="w-32 px-3 py-1.5 text-xs bg-[#161821] border border-slate-700 rounded text-white"
                          min={10}
                          max={500}
                        />
                        <span className="text-xs text-slate-400">MB (Exchange transport default max 150 MB)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* STEP 8: NOTIFICATION */}
              {/* ============================================================== */}
              {currentStep === 8 && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="border-b border-slate-800 pb-3">
                    <h3 className="text-sm font-semibold text-white">Alerts & Notifications</h3>
                    <p className="text-xs text-slate-400">
                      Configure automated alerts upon task completion, failures, or cutover milestones.
                    </p>
                  </div>

                  <div className="space-y-4 max-w-lg">
                    <label className="flex items-center space-x-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.sendEmailOnComplete}
                        onChange={(e) => setFormData({ ...formData, sendEmailOnComplete: e.target.checked })}
                        className="w-4 h-4 rounded bg-[#161821] border-slate-700 text-blue-600"
                      />
                      <span className="text-xs text-slate-200">Send status email upon completion or failure</span>
                    </label>

                    {formData.sendEmailOnComplete && (
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">
                          Admin Notification Email(s)
                        </label>
                        <input
                          type="text"
                          value={formData.notificationEmails}
                          onChange={(e) => setFormData({ ...formData, notificationEmails: e.target.value })}
                          className="w-full px-3 py-2 text-xs bg-[#161821] border border-slate-700 rounded text-white"
                          placeholder="admin@targettenant.com, operator@contoso.com"
                        />
                      </div>
                    )}

                    <div className="pt-2">
                      <label className="flex items-center space-x-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.sendUserWelcomeEmail}
                          onChange={(e) => setFormData({ ...formData, sendUserWelcomeEmail: e.target.checked })}
                          className="w-4 h-4 rounded bg-[#161821] border-slate-700 text-blue-600"
                        />
                        <span className="text-xs text-slate-200">Send welcome & Outlook setup guide to target user</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* STEP 9: REPORTING */}
              {/* ============================================================== */}
              {currentStep === 9 && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="border-b border-slate-800 pb-3">
                    <h3 className="text-sm font-semibold text-white">Migration Reporting & Audit Logs</h3>
                    <p className="text-xs text-slate-400">
                      Configure item-level logging and regulatory compliance audit records.
                    </p>
                  </div>

                  <div className="space-y-4 max-w-lg">
                    <label className="flex items-center space-x-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.detailedItemAuditLog}
                        onChange={(e) => setFormData({ ...formData, detailedItemAuditLog: e.target.checked })}
                        className="w-4 h-4 rounded bg-[#161821] border-slate-700 text-blue-600"
                      />
                      <span className="text-xs text-slate-200">Maintain item-level audit log (Subject, Hash, Folder, Timestamp)</span>
                    </label>

                    <label className="flex items-center space-x-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.includeFailedItemReports}
                        onChange={(e) => setFormData({ ...formData, includeFailedItemReports: e.target.checked })}
                        className="w-4 h-4 rounded bg-[#161821] border-slate-700 text-blue-600"
                      />
                      <span className="text-xs text-slate-200">Generate diagnostic report for skipped or corrupt items</span>
                    </label>
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* STEP 10: SCHEDULE */}
              {/* ============================================================== */}
              {currentStep === 10 && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="border-b border-slate-800 pb-3">
                    <h3 className="text-sm font-semibold text-white">Execution Schedule & Throttling</h3>
                    <p className="text-xs text-slate-400">
                      Decide whether to execute immediately, schedule for off-peak hours, or save as template only.
                    </p>
                  </div>

                  <div className="space-y-4 max-w-lg">
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2.5 cursor-pointer">
                        <input
                          type="radio"
                          name="scheduleType"
                          value="IMMEDIATE"
                          checked={formData.scheduleType === 'IMMEDIATE'}
                          onChange={(e) => setFormData({ ...formData, scheduleType: e.target.value })}
                          className="w-4 h-4 text-blue-600 bg-[#161821] border-slate-700"
                        />
                        <span className="text-xs text-slate-200">Run immediately upon clicking Finish</span>
                      </label>

                      <label className="flex items-center space-x-2.5 cursor-pointer">
                        <input
                          type="radio"
                          name="scheduleType"
                          value="SCHEDULED"
                          checked={formData.scheduleType === 'SCHEDULED'}
                          onChange={(e) => setFormData({ ...formData, scheduleType: e.target.value })}
                          className="w-4 h-4 text-blue-600 bg-[#161821] border-slate-700"
                        />
                        <span className="text-xs text-slate-200">Schedule execution for off-peak maintenance window</span>
                      </label>
                    </div>

                    <div className="pt-3 border-t border-slate-800">
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Concurrent Mailbox Sync Limit
                      </label>
                      <div className="flex items-center space-x-3">
                        <input
                          type="number"
                          value={formData.concurrencyLimit}
                          onChange={(e) => setFormData({ ...formData, concurrencyLimit: Number(e.target.value) })}
                          className="w-24 px-3 py-1.5 text-xs bg-[#161821] border border-slate-700 rounded text-white"
                          min={1}
                          max={50}
                        />
                        <span className="text-xs text-slate-400">Concurrent streams (Avoids Graph API 429 throttling)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* STEP 11: SUMMARY */}
              {/* ============================================================== */}
              {currentStep === 11 && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="border-b border-slate-800 pb-3">
                    <h3 className="text-sm font-semibold text-white">Configuration Summary</h3>
                    <p className="text-xs text-slate-400">
                      Review your mailbox migration options before creating the task or saving the template.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {/* Scenario & Scope Card */}
                    <div className="p-4 bg-[#161821] border border-slate-800 rounded space-y-2">
                      <div className="font-semibold text-blue-400 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5" />
                        <span>Scenario & Items</span>
                      </div>
                      <div className="text-slate-300 space-y-1">
                        <div>Direction: <span className="text-white font-medium">{formData.sourceScenario} → {formData.targetScenario}</span></div>
                        <div>Mail: <span className={formData.migrateMail ? 'text-emerald-400' : 'text-slate-500'}>{formData.migrateMail ? 'Yes' : 'No'}</span></div>
                        <div>Calendar: <span className={formData.migrateCalendar ? 'text-emerald-400' : 'text-slate-500'}>{formData.migrateCalendar ? 'Yes' : 'No'}</span></div>
                        <div>Contacts: <span className={formData.migrateContacts ? 'text-emerald-400' : 'text-slate-500'}>{formData.migrateContacts ? 'Yes' : 'No'}</span></div>
                        <div>Tasks & Notes: <span className={formData.migrateTasksNotes ? 'text-emerald-400' : 'text-slate-500'}>{formData.migrateTasksNotes ? 'Yes' : 'No'}</span></div>
                      </div>
                    </div>

                    {/* Settings & Permissions */}
                    <div className="p-4 bg-[#161821] border border-slate-800 rounded space-y-2">
                      <div className="font-semibold text-amber-400 flex items-center gap-1.5">
                        <Settings className="w-3.5 h-3.5" />
                        <span>Settings & Coexistence</span>
                      </div>
                      <div className="text-slate-300 space-y-1">
                        <div>Mailbox Rules: <span className={formData.migrateMailboxRules ? 'text-emerald-400' : 'text-slate-500'}>{formData.migrateMailboxRules ? 'Enabled' : 'Disabled'}</span></div>
                        <div>Delegations: <span className={formData.migrateMailboxDelegation ? 'text-emerald-400' : 'text-slate-500'}>{formData.migrateMailboxDelegation ? 'Enabled' : 'Disabled'}</span></div>
                        <div>Automapping: <span className={formData.enableAutomapping ? 'text-emerald-400' : 'text-slate-500'}>{formData.enableAutomapping ? 'Enabled' : 'Disabled'}</span></div>
                        <div>Mail Forwarding: <span className={formData.manageMailForwarding ? 'text-emerald-400 font-medium' : 'text-slate-500'}>{formData.manageMailForwarding ? `${formData.mailForwardingAction} (${formData.forwardingDirection})` : 'None'}</span></div>
                      </div>
                    </div>

                    {/* Folders & Filters */}
                    <div className="p-4 bg-[#161821] border border-slate-800 rounded space-y-2">
                      <div className="font-semibold text-purple-400 flex items-center gap-1.5">
                        <FolderTree className="w-3.5 h-3.5" />
                        <span>Folders & Filters</span>
                      </div>
                      <div className="text-slate-300 space-y-1">
                        <div>Folder Scope: <span className="text-white font-medium">{formData.folderSelection}</span></div>
                        <div>Custom Folder: <span className="text-slate-400">{formData.migrateToCustomFolder ? formData.customFolderName : 'Root'}</span></div>
                        <div>Size Limit: <span className="text-slate-400">{formData.excludeItemsLargerThanMB} MB</span></div>
                      </div>
                    </div>

                    {/* Target License & Execution */}
                    <div className="p-4 bg-[#161821] border border-slate-800 rounded space-y-2">
                      <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>License & Schedule</span>
                      </div>
                      <div className="text-slate-300 space-y-1">
                        <div>Target License: <span className="text-white font-medium">{formData.targetLicensingPlan}</span></div>
                        <div>Auto-assign: <span className={formData.autoAssignLicense ? 'text-emerald-400' : 'text-slate-500'}>{formData.autoAssignLicense ? 'Yes' : 'No'}</span></div>
                        <div>Execution: <span className="text-blue-400 font-medium">{formData.scheduleType}</span></div>
                        <div>Concurrency: <span className="text-white font-mono">{formData.concurrencyLimit} mailboxes</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Wizard Bottom Navigation Bar matching screenshots */}
            <div className="pt-6 border-t border-slate-700/80 mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Step Counter */}
              <div className="text-xs text-slate-400 font-medium">
                Step {currentStep} of 11
              </div>

              {/* Navigation Buttons */}
              <div className="flex items-center space-x-3">
                <button
                  id="btn-wizard-back"
                  type="button"
                  disabled={currentStep === 1 || isSubmitting}
                  onClick={handleBack}
                  className="px-4 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Back
                </button>

                {currentStep < 11 ? (
                  <button
                    id="btn-wizard-next"
                    type="button"
                    onClick={handleNext}
                    className="px-5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded transition shadow-sm flex items-center space-x-1"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    id="btn-wizard-finish"
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleFinish}
                    className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded transition shadow-sm flex items-center space-x-1.5 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span>Saving...</span>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>Finish & Save Template</span>
                      </>
                    )}
                  </button>
                )}

                <button
                  id="btn-wizard-cancel"
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
