import React from 'react';
import {
  Globe,
  FolderTree,
  FileText,
  Lock,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Activity,
  Layers,
  Database,
  ArrowRight,
  Server,
  Info,
  Calendar,
  Clock,
  Play
} from 'lucide-react';
import { MigrationBatchItem, MigrationQueueConfig, BatchFailureAction } from '../../types';

export interface SharePointStepsProps {
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

export const SharePointSteps: React.FC<SharePointStepsProps> = ({
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
  // STEP 2: SITE COLLECTION & DOCUMENT LIBRARY MAPPING
  if (currentStep === 2) {
    return (
      <div className="space-y-5 animate-in fade-in duration-150 text-xs">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <FolderTree className="h-5 w-5 text-teal-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              SharePoint Step 2: Site Collection Discovery & Target URL Remapping
            </h3>
          </div>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5">
            Discover Hub, Communication, and Team sites from source tenant and define target URL destinations.
          </p>
        </div>

        {/* Admin Center Endpoints */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Source SharePoint Admin URL
            </label>
            <input
              type="text"
              value={formData.sharePointAdminUrl || `https://${(formData.sourceTenant || 'contoso').split('.')[0]}-admin.sharepoint.com`}
              onChange={(e) => setFormData({ ...formData, sharePointAdminUrl: e.target.value })}
              className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-slate-900 dark:text-white"
            />
            <div className="flex items-center space-x-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>SharePoint Administrator Auth Verified</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Target SharePoint Admin URL
            </label>
            <input
              type="text"
              value={formData.sharePointTargetAdminUrl || `https://${(formData.targetTenant || 'fabrikam').split('.')[0]}-admin.sharepoint.com`}
              onChange={(e) => setFormData({ ...formData, sharePointTargetAdminUrl: e.target.value })}
              className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-slate-900 dark:text-white"
            />
            <div className="flex items-center space-x-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Target Tenant SPO Migration API Active</span>
            </div>
          </div>
        </div>

        {/* Site Types in Scope */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
            Site Collection Topology in Scope
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-start space-x-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.migrateHubSites ?? true}
                onChange={(e) => setFormData({ ...formData, migrateHubSites: e.target.checked })}
                className="rounded text-teal-600 mt-0.5"
              />
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200">Hub & Intranet Sites</span>
                <p className="text-[10px] text-slate-500 mt-0.5">Corporate portals, global navigation, and associated sub-sites.</p>
              </div>
            </label>

            <label className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-start space-x-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.migrateCommunicationSites ?? true}
                onChange={(e) => setFormData({ ...formData, migrateCommunicationSites: e.target.checked })}
                className="rounded text-teal-600 mt-0.5"
              />
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200">Communication Sites</span>
                <p className="text-[10px] text-slate-500 mt-0.5">Department announcements, marketing, and company knowledge bases.</p>
              </div>
            </label>

            <label className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-start space-x-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.migrateTeamSites ?? true}
                onChange={(e) => setFormData({ ...formData, migrateTeamSites: e.target.checked })}
                className="rounded text-teal-600 mt-0.5"
              />
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200">M365 Group & Team Sites</span>
                <p className="text-[10px] text-slate-500 mt-0.5">Project workspaces, departmental document repositories, and modern lists.</p>
              </div>
            </label>
          </div>
        </div>

        {/* URL Remapping Table Preview */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
              Discovered Site Collections URL Mapping (Sample Preview)
            </h4>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
              Auto-Provisioning Target Containers
            </span>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-2.5">Source Site Title & URL</th>
                  <th className="p-2.5">Type</th>
                  <th className="p-2.5">Storage Footprint</th>
                  <th className="p-2.5">Target Destination URL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono">
                <tr>
                  <td className="p-2.5 text-slate-900 dark:text-white font-medium">
                    Corporate Intranet Hub
                    <div className="text-[10px] text-slate-400">https://contoso.sharepoint.com/sites/intranet</div>
                  </td>
                  <td className="p-2.5 font-sans"><span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400">Hub Site</span></td>
                  <td className="p-2.5 text-slate-600 dark:text-slate-300">42.5 GB (18,400 items)</td>
                  <td className="p-2.5 text-blue-600 dark:text-blue-400">https://fabrikam.sharepoint.com/sites/intranet</td>
                </tr>
                <tr>
                  <td className="p-2.5 text-slate-900 dark:text-white font-medium">
                    Human Resources Portal
                    <div className="text-[10px] text-slate-400">https://contoso.sharepoint.com/sites/hr</div>
                  </td>
                  <td className="p-2.5 font-sans"><span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">Communication</span></td>
                  <td className="p-2.5 text-slate-600 dark:text-slate-300">28.2 GB (9,200 items)</td>
                  <td className="p-2.5 text-blue-600 dark:text-blue-400">https://fabrikam.sharepoint.com/sites/hr</td>
                </tr>
                <tr>
                  <td className="p-2.5 text-slate-900 dark:text-white font-medium">
                    Engineering Team Collaboration
                    <div className="text-[10px] text-slate-400">https://contoso.sharepoint.com/sites/engineering</div>
                  </td>
                  <td className="p-2.5 font-sans"><span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">Team Site</span></td>
                  <td className="p-2.5 text-slate-600 dark:text-slate-300">84.0 GB (44,100 items)</td>
                  <td className="p-2.5 text-blue-600 dark:text-blue-400">https://fabrikam.sharepoint.com/sites/engineering</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // STEP 3: CONTENT SCOPE, LISTS, PAGES & VERSION RETENTION
  if (currentStep === 3) {
    return (
      <div className="space-y-5 animate-in fade-in duration-150 text-xs">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-teal-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              SharePoint Step 3: Content Scope, Lists, Pages & Versioning Policies
            </h3>
          </div>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5">
            Configure document libraries, modern lists (&gt;5,000 threshold protection), pages, and version retention rules.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
            <h4 className="font-semibold text-slate-900 dark:text-white">Version Retention Policy</h4>
            <div className="space-y-2">
              {[
                { id: 'ALL', title: 'All Major & Minor Versions', desc: 'Preserves complete regulatory compliance & change audit trail.' },
                { id: 'LAST_10', title: 'Last 10 Major Versions', desc: 'Optimal balance of history retention and high streaming performance.' },
                { id: 'CURRENT', title: 'Current Version Only', desc: 'Migrates only the head published revision of all documents.' },
              ].map((opt) => (
                <label
                  key={opt.id}
                  onClick={() => setFormData({ ...formData, migrateOneDriveVersions: opt.id })}
                  className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer ${
                    formData.migrateOneDriveVersions === opt.id
                      ? 'border-teal-500 bg-white dark:bg-slate-900 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 bg-transparent'
                  }`}
                >
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{opt.title}</span>
                    <p className="text-[10px] text-slate-500">{opt.desc}</p>
                  </div>
                  <input
                    type="radio"
                    name="spVersion"
                    checked={formData.migrateOneDriveVersions === opt.id}
                    onChange={() => {}}
                    className="text-teal-600"
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
            <h4 className="font-semibold text-slate-900 dark:text-white">List & Path Safeguards (Microsoft Learn)</h4>
            <div className="space-y-2.5 pt-1">
              <label className="flex items-start space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.sharePointLargeListThresholdSafeguard ?? true}
                  onChange={(e) => setFormData({ ...formData, sharePointLargeListThresholdSafeguard: e.target.checked })}
                  className="rounded text-teal-600 mt-0.5"
                />
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Large List Threshold Protection (&gt;5,000 items)
                  </span>
                  <p className="text-[10px] text-slate-500">
                    Automatically preserves indexed columns and chunk queries to bypass SharePoint 5,000 list view limit failures.
                  </p>
                </div>
              </label>

              <label className="flex items-start space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.remediatePathLengthExceeded ?? true}
                  onChange={(e) => setFormData({ ...formData, remediatePathLengthExceeded: e.target.checked })}
                  className="rounded text-teal-600 mt-0.5"
                />
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    400-Character URL Path Length Remediation
                  </span>
                  <p className="text-[10px] text-slate-500">
                    Detects nested deep folders exceeding 400 characters and creates aliases to prevent upload errors.
                  </p>
                </div>
              </label>

              <label className="flex items-start space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.migrateSharePointLists ?? true}
                  onChange={(e) => setFormData({ ...formData, migrateSharePointLists: e.target.checked })}
                  className="rounded text-teal-600 mt-0.5"
                />
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Migrate Custom Lists & Metadata Taxonomies
                  </span>
                  <p className="text-[10px] text-slate-500">
                    Preserves choice fields, lookup columns, managed metadata terms, and calculated formulas.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // STEP 4: PERMISSIONS, GROUPS & SHARING LINKS
  if (currentStep === 4) {
    return (
      <div className="space-y-5 animate-in fade-in duration-150 text-xs">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Lock className="h-5 w-5 text-teal-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              SharePoint Step 4: Permissions, SharePoint Groups & External Links
            </h3>
          </div>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5">
            Remap Owners, Members, Visitors, custom permission levels, broken inheritance ACLs, and external guest links.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
            <h4 className="font-semibold text-slate-900 dark:text-white">SharePoint Group Membership Mapping</h4>
            <div className="space-y-2">
              <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-between">
                <span>Site Owners Group</span>
                <span className="font-mono text-teal-600 dark:text-teal-400 font-medium">Full Control ➔ Target Site Owners</span>
              </div>
              <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-between">
                <span>Site Members Group</span>
                <span className="font-mono text-blue-600 dark:text-blue-400 font-medium">Edit / Contribute ➔ Target Members</span>
              </div>
              <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-between">
                <span>Site Visitors Group</span>
                <span className="font-mono text-purple-600 dark:text-purple-400 font-medium">Read Only ➔ Target Visitors</span>
              </div>
            </div>

            <label className="flex items-center space-x-2 pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.preserveFolderACLs ?? true}
                onChange={(e) => setFormData({ ...formData, preserveFolderACLs: e.target.checked })}
                className="rounded text-teal-600"
              />
              <span>Preserve unique item-level permissions & broken inheritance structures</span>
            </label>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
            <h4 className="font-semibold text-slate-900 dark:text-white">External Sharing & Author Metadata</h4>
            <div className="space-y-2.5">
              <label className="flex items-start space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.relinkExternalSharing ?? true}
                  onChange={(e) => setFormData({ ...formData, relinkExternalSharing: e.target.checked })}
                  className="rounded text-teal-600 mt-0.5"
                />
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Re-link External Guest Sharing Links</span>
                  <p className="text-[10px] text-slate-500">Replicates anonymous and specific-person guest links on the target tenant.</p>
                </div>
              </label>

              <label className="flex items-start space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.preserveTimestampsAndAuthors ?? true}
                  onChange={(e) => setFormData({ ...formData, preserveTimestampsAndAuthors: e.target.checked })}
                  className="rounded text-teal-600 mt-0.5"
                />
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Preserve Author & Modified Timestamps</span>
                  <p className="text-[10px] text-slate-500">Maintains original Created, Created By, Modified, and Modified By audit attributes.</p>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // STEP 5: AZURE MIGRATION PIPELINE & STREAMING
  if (currentStep === 5) {
    return (
      <div className="space-y-5 animate-in fade-in duration-150 text-xs">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-teal-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              SharePoint Step 5: High-Throughput Azure SPO Pipeline & Concurrency
            </h3>
          </div>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5">
            Configure direct in-memory streaming with Microsoft SharePoint Migration API (CreateMigrationJob) for peak GB/hour.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
            <h4 className="font-semibold text-slate-900 dark:text-white">Throughput & Worker Concurrency</h4>
            <div>
              <label className="block text-[11px] text-slate-500 mb-1">Parallel Site Migration Workers</label>
              <select
                value={formData.concurrencyLimit || 4}
                onChange={(e) => setFormData({ ...formData, concurrencyLimit: parseInt(e.target.value, 10) })}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              >
                <option value="2">2 Concurrent Workers (Light Network)</option>
                <option value="4">4 Concurrent Workers (Recommended Standard)</option>
                <option value="8">8 Concurrent Workers (High-Bandwidth Enterprise)</option>
                <option value="16">16 Concurrent Workers (Maximum Throughput)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-slate-500 mb-1">Direct Memory Chunk Size</label>
              <select
                value={formData.chunkSizeMB || 25}
                onChange={(e) => setFormData({ ...formData, chunkSizeMB: parseInt(e.target.value, 10) })}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              >
                <option value="10">10 MB Chunks (Standard Sites)</option>
                <option value="25">25 MB Chunks (Optimal for Large CAD / Video Assets)</option>
                <option value="50">50 MB Chunks (Heavy Datasets)</option>
              </select>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
            <h4 className="font-semibold text-slate-900 dark:text-white">Throttling Resilience & Staging Bypass</h4>
            <div className="space-y-2">
              <div className="p-2.5 rounded-lg border border-teal-500/20 bg-teal-50/50 dark:bg-teal-950/20 flex items-start space-x-2">
                <CheckCircle2 className="h-4 w-4 text-teal-600 mt-0.5 shrink-0" />
                <div>
                  <span className="font-semibold text-slate-900 dark:text-white">Zero Disk Intermediate Staging</span>
                  <p className="text-[10px] text-slate-500 mt-0.5">Stream direct cloud-to-cloud without saving site packages to local disk.</p>
                </div>
              </div>

              <div className="p-2.5 rounded-lg border border-teal-500/20 bg-teal-50/50 dark:bg-teal-950/20 flex items-start space-x-2">
                <CheckCircle2 className="h-4 w-4 text-teal-600 mt-0.5 shrink-0" />
                <div>
                  <span className="font-semibold text-slate-900 dark:text-white">CSOM 429 Jitter Backoff Protocol</span>
                  <p className="text-[10px] text-slate-500 mt-0.5">Automated retry logic responding to Retry-After headers from Microsoft SPO.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // STEP 6: SITE WAVES, SOURCE LOCK & SCHEDULE
  if (currentStep === 6) {
    return (
      <div className="space-y-5 animate-in fade-in duration-150 text-xs">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-teal-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              SharePoint Step 6: Site Waves, Read-Only Source Lock & Cutover Schedule
            </h3>
          </div>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5">
            Group site collections into sequential cutover waves and enforce source site read-only locks during cutover.
          </p>
        </div>

        {/* Read-Only Source Lock Option */}
        <div className="p-4 rounded-xl border border-amber-300 dark:border-amber-800/60 bg-amber-50/50 dark:bg-amber-950/20 space-y-2">
          <div className="flex items-center space-x-2 font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider text-[11px]">
            <Lock className="h-4 w-4" />
            <span>Anti-Delta Divergence: Lock Source Sites During Cutover</span>
          </div>
          <p className="text-slate-600 dark:text-slate-300">
            Automatically place source SharePoint sites into Read-Only state (`Set-SPOSite -LockState ReadOnly`) when final cutover begins to guarantee zero unmigrated edits.
          </p>
          <label className="flex items-center space-x-2 font-semibold text-amber-900 dark:text-amber-200 pt-1 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.sharePointReadonlyLockDuringCutover ?? true}
              onChange={(e) => setFormData({ ...formData, sharePointReadonlyLockDuringCutover: e.target.checked })}
              className="rounded text-amber-600"
            />
            <span>Enforce source site read-only lock upon cutover window start</span>
          </label>
        </div>

        {/* Schedule Mode Selector */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
            <h4 className="font-semibold text-slate-900 dark:text-white">Execution Mode</h4>
            <div className="space-y-2">
              <label
                onClick={() => setFormData({ ...formData, scheduleType: 'QUEUE_AND_BATCH' })}
                className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer ${
                  formData.scheduleType === 'QUEUE_AND_BATCH'
                    ? 'border-teal-500 bg-teal-50/40 dark:bg-teal-950/20'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200">Multi-Wave Scheduled Queue</span>
                  <p className="text-[10px] text-slate-500">Phased departmental site rollouts with maintenance cutoff windows.</p>
                </div>
                <input
                  type="radio"
                  name="spSchedule"
                  checked={formData.scheduleType === 'QUEUE_AND_BATCH'}
                  onChange={() => {}}
                  className="text-teal-600"
                />
              </label>

              <label
                onClick={() => setFormData({ ...formData, scheduleType: 'IMMEDIATE' })}
                className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer ${
                  formData.scheduleType === 'IMMEDIATE'
                    ? 'border-teal-500 bg-teal-50/40 dark:bg-teal-950/20'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200">Immediate Execution</span>
                  <p className="text-[10px] text-slate-500">Commence site ingestion immediately following pre-flight pass.</p>
                </div>
                <input
                  type="radio"
                  name="spSchedule"
                  checked={formData.scheduleType === 'IMMEDIATE'}
                  onChange={() => {}}
                  className="text-teal-600"
                />
              </label>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
            <h4 className="font-semibold text-slate-900 dark:text-white">Maintenance Cutover Windows</h4>
            <div className="space-y-2">
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Window Start Time</label>
                <input
                  type="datetime-local"
                  value={formData.scheduledWindowStartTime}
                  onChange={(e) => setFormData({ ...formData, scheduledWindowStartTime: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Window Hard Cutoff</label>
                <input
                  type="datetime-local"
                  value={formData.scheduledWindowEndTime}
                  onChange={(e) => setFormData({ ...formData, scheduledWindowEndTime: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
