import React from 'react';
import {
  HardDrive,
  FolderTree,
  Lock,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Activity,
  ArrowRight,
  Shield,
  FileText,
  Clock,
  CalendarClock,
  Cpu,
  Plus,
  Trash2,
  Copy,
  GitMerge,
  ListOrdered
} from 'lucide-react';
import { MigrationBatchItem, MigrationQueueConfig, BatchFailureAction } from '../../types';

export interface OneDriveStepsProps {
  currentStep: number;
  formData: any;
  setFormData: (data: any) => void;
  queueConfig: MigrationQueueConfig;
  setQueueConfig: React.Dispatch<React.SetStateAction<MigrationQueueConfig>>;
  selectedBatchId: string;
  setSelectedBatchId: (id: string) => void;
  handleAddBatch: () => void;
  handleRemoveBatch: (id: string) => void;
  handleUpdateBatch: (id: string, updates: Partial<MigrationBatchItem>) => void;
  handleDuplicateBatch: (id: string) => void;
}

export const OneDriveSteps: React.FC<OneDriveStepsProps> = ({
  currentStep,
  formData,
  setFormData,
  queueConfig,
  setQueueConfig,
  selectedBatchId,
  setSelectedBatchId,
  handleAddBatch,
  handleRemoveBatch,
  handleUpdateBatch,
  handleDuplicateBatch,
}) => {
  // STEP 2: TARGET SITE PROTECTION & IDENTITY MAPPING
  if (currentStep === 2) {
    return (
      <div className="space-y-5 animate-in fade-in duration-150 text-xs">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Lock className="h-5 w-5 text-blue-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              OneDrive Step 2: Target Site Protection & Identity Mapping Safeguards
            </h3>
          </div>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5">
            Enforce Microsoft Learn's mandatory safeguard blocking target personal site pre-creation to prevent container collisions.
          </p>
        </div>

        {/* CRITICAL SAFEGUARD BANNER */}
        <div className="p-4 rounded-xl border-2 border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider text-[11px]">
              <Shield className="h-4 w-4" />
              <span>Microsoft Mandatory Safeguard: Restrict Target Personal Site Pre-Creation</span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Required
            </span>
          </div>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Per Microsoft Learn, target users must NOT manually provision or sign into OneDrive in the destination tenant prior to migration. If a target drive container already exists, cross-tenant moves fail with collision errors.
          </p>
          <label className="flex items-center space-x-2 font-semibold text-emerald-900 dark:text-emerald-200 pt-1 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.restrictTargetSitePreCreation ?? true}
              onChange={(e) => setFormData({ ...formData, restrictTargetSitePreCreation: e.target.checked })}
              className="rounded text-emerald-600 h-4 w-4"
            />
            <span>
              Enforce `Set-SPOTenant -PersonalShowGuids $true` / Block early target Personal Site creation until clean migration container is placed
            </span>
          </label>
        </div>

        {/* Identity Suffix Mapping */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
            <h4 className="font-semibold text-slate-900 dark:text-white">UPN Transformation Strategy</h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-slate-400">Source Suffix</label>
                <input
                  type="text"
                  value={formData.domainTransformSource || '@contoso.onmicrosoft.com'}
                  onChange={(e) => setFormData({ ...formData, domainTransformSource: e.target.value })}
                  className="w-full px-2 py-1 mt-1 font-mono text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400">Target Suffix</label>
                <input
                  type="text"
                  value={formData.domainTransformTarget || '@fabrikam.com'}
                  onChange={(e) => setFormData({ ...formData, domainTransformTarget: e.target.value })}
                  className="w-full px-2 py-1 mt-1 font-mono text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
            <h4 className="font-semibold text-slate-900 dark:text-white">Target Licensing SKU</h4>
            <select
              value={formData.targetLicensingSku || 'SharePoint / OneDrive Plan 2 (Cross-Tenant Addon)'}
              onChange={(e) => setFormData({ ...formData, targetLicensingSku: e.target.value })}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-white"
            >
              <option value="SharePoint / OneDrive Plan 2 (Cross-Tenant Addon)">SharePoint / OneDrive Plan 2 (Cross-Tenant Addon)</option>
              <option value="Microsoft 365 E5 Enterprise">Microsoft 365 E5 Enterprise</option>
              <option value="Microsoft 365 E3 Business">Microsoft 365 E3 Business</option>
            </select>
          </div>
        </div>
      </div>
    );
  }

  // STEP 3: SCOPE, FILES & VERSIONING
  if (currentStep === 3) {
    return (
      <div className="space-y-5 animate-in fade-in duration-150 text-xs">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <FolderTree className="h-5 w-5 text-blue-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              OneDrive Step 3: Scope, File Policies & Version Retention
            </h3>
          </div>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5">
            Configure document libraries, personal notebooks, version history policies, and 400-character path remediation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
            <h4 className="font-semibold text-slate-900 dark:text-white">Version Retention Policy</h4>
            <div className="space-y-2">
              {[
                { id: 'ALL_VERSIONS', title: 'All Version History', desc: 'Full revision trail across all documents (regulatory compliance standard)' },
                { id: 'LAST_5', title: 'Last 5 Major Versions', desc: 'Prunes ancient revisions for optimal sync velocity' },
                { id: 'CURRENT_ONLY', title: 'Current Version Only', desc: 'Transfers only the latest head copy of files' },
              ].map((opt) => (
                <label
                  key={opt.id}
                  onClick={() => setFormData({ ...formData, versionHistoryOption: opt.id })}
                  className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer ${
                    (formData.versionHistoryOption || 'ALL_VERSIONS') === opt.id
                      ? 'border-blue-500 bg-white dark:bg-slate-900 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 bg-transparent'
                  }`}
                >
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{opt.title}</span>
                    <p className="text-[10px] text-slate-500">{opt.desc}</p>
                  </div>
                  <input
                    type="radio"
                    name="odVersion"
                    checked={(formData.versionHistoryOption || 'ALL_VERSIONS') === opt.id}
                    onChange={() => {}}
                    className="text-blue-600"
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
            <h4 className="font-semibold text-slate-900 dark:text-white">Hard Limit Compliance (Microsoft Learn)</h4>
            <div className="space-y-2 text-[11px]">
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <span>Capacity Hard Limit:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">5 TB & 1,000,000 Items / Drive</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <span>URL Path Limit:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">400 Characters Max</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <span>Purview Customer Key:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">Must Not Be Enabled</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // STEP 4: PERMISSIONS & EXTERNAL LINKS
  if (currentStep === 4) {
    return (
      <div className="space-y-5 animate-in fade-in duration-150 text-xs">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Lock className="h-5 w-5 text-blue-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              OneDrive Step 4: Permissions, Folder ACLs & Sharing Links
            </h3>
          </div>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5">
            Preserve custom folder ACLs, re-link external guest sharing links, and maintain author timestamps.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          <div className="space-y-2.5">
            <label className="flex items-start space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.preserveFolderPermissions ?? true}
                onChange={(e) => setFormData({ ...formData, preserveFolderPermissions: e.target.checked })}
                className="rounded text-blue-600 mt-0.5"
              />
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200">Preserve Direct Folder ACLs & Internal Sharing</span>
                <p className="text-[10px] text-slate-500">Maintains read/write permissions granted to internal colleagues.</p>
              </div>
            </label>

            <label className="flex items-start space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.relinkExternalSharing ?? true}
                onChange={(e) => setFormData({ ...formData, relinkExternalSharing: e.target.checked })}
                className="rounded text-blue-600 mt-0.5"
              />
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200">Re-link External Guest Sharing Links</span>
                <p className="text-[10px] text-slate-500">Re-creates anonymous and specific-person guest links on the target tenant.</p>
              </div>
            </label>

            <label className="flex items-start space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.preserveTimestampsAndAuthors ?? true}
                onChange={(e) => setFormData({ ...formData, preserveTimestampsAndAuthors: e.target.checked })}
                className="rounded text-blue-600 mt-0.5"
              />
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200">Preserve Author & Created/Modified Timestamps</span>
                <p className="text-[10px] text-slate-500">Retains original Created By, Modified By, and date attributes.</p>
              </div>
            </label>
          </div>
        </div>
      </div>
    );
  }

  // STEP 5: DIRECT STREAMING & URL REDIRECTION
  if (currentStep === 5) {
    return (
      <div className="space-y-5 animate-in fade-in duration-150 text-xs">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <ExternalLink className="h-5 w-5 text-blue-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              OneDrive Step 5: Direct Streaming Pipeline & Source URL Redirection
            </h3>
          </div>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5">
            Cloud-to-cloud move (`Start-SPOCrossTenantUserContentMove`) with automated redirect pointers placed at source personal site URLs.
          </p>
        </div>

        {/* Source Redirection Highlight */}
        <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-50/50 dark:bg-blue-950/20 space-y-2">
          <div className="flex items-center space-x-2 text-blue-700 dark:text-blue-300 font-bold uppercase tracking-wider text-[11px]">
            <ExternalLink className="h-4 w-4" />
            <span>Automated Source URL Redirection Link Architecture</span>
          </div>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Per Microsoft Learn, when a cross-tenant move completes, an automated redirect pointer site is created at the user's source OneDrive URL. When external or internal users click previously shared bookmarks, they are transparently forwarded to the new target location.
          </p>
          <label className="flex items-center space-x-2 font-semibold text-blue-800 dark:text-blue-200 pt-1 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.enableSourceRedirectLinks ?? true}
              onChange={(e) => setFormData({ ...formData, enableSourceRedirectLinks: e.target.checked })}
              className="rounded text-blue-600"
            />
            <span>Enable automatic redirect pointer sites at source personal URLs</span>
          </label>
        </div>
      </div>
    );
  }

  return null;
};
