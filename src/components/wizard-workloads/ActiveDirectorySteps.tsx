import React from 'react';
import {
  Users,
  Layers,
  Key,
  FolderTree,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Lock,
  RefreshCw,
  Server,
  Activity,
  ArrowRight
} from 'lucide-react';
import { MigrationBatchItem, MigrationQueueConfig } from '../../types';

export interface ActiveDirectoryStepsProps {
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

export const ActiveDirectorySteps: React.FC<ActiveDirectoryStepsProps> = ({
  currentStep,
  formData,
  setFormData,
}) => {
  // STEP 2: OBJECT SCOPE & OU FILTERING
  if (currentStep === 2) {
    return (
      <div className="space-y-5 animate-in fade-in duration-150 text-xs">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-purple-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Directory Step 2: Object Scope & Organizational Unit (OU) Filtering
            </h3>
          </div>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5">
            Select Active Directory and Entra ID object classes and filter specific OU containers for synchronization.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
            <h4 className="font-semibold text-slate-900 dark:text-white">Directory Object Classes in Scope</h4>
            <div className="space-y-2">
              {[
                { id: 'users', label: 'User Accounts (Standard & VIP)', desc: 'Active employee accounts and cloud identities' },
                { id: 'groups', label: 'Security Groups & Mail-Enabled Groups', desc: 'Resource access groups and distribution rosters' },
                { id: 'm365_groups', label: 'Microsoft 365 Unified Groups', desc: 'Teams and SharePoint connected collaboration groups' },
                { id: 'contacts', label: 'Mail Contacts & External Partners', desc: 'GAL contacts for cross-tenant mail forwarding' },
              ].map((cls) => (
                <label key={cls.id} className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-start space-x-2.5 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded text-purple-600 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{cls.label}</span>
                    <p className="text-[10px] text-slate-500">{cls.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
            <h4 className="font-semibold text-slate-900 dark:text-white">Organizational Unit (OU) Filter Container</h4>
            <div className="space-y-2">
              {[
                'OU=Users,OU=Corporate,DC=contoso,DC=com',
                'OU=Engineering,OU=Corporate,DC=contoso,DC=com',
                'OU=Finance,OU=Corporate,DC=contoso,DC=com',
                'OU=Executive,OU=Corporate,DC=contoso,DC=com',
              ].map((ou, idx) => (
                <div key={idx} className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-[10px] text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>{ou}</span>
                  <span className="text-emerald-500 font-sans font-bold">Included</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // STEP 3: ATTRIBUTES & UPN TRANSFORMATIONS
  if (currentStep === 3) {
    return (
      <div className="space-y-5 animate-in fade-in duration-150 text-xs">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-5 w-5 text-purple-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Directory Step 3: Attribute Mapping, UPN Suffixes & Source Anchors
            </h3>
          </div>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5">
            Configure UserPrincipalName transformations, proxyAddresses normalization, and immutable source anchor translation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
            <h4 className="font-semibold text-slate-900 dark:text-white">UPN Suffix Transformation</h4>
            <div className="space-y-2">
              <div>
                <label className="block text-[10px] text-slate-400">Source UPN Domain Suffix</label>
                <input
                  type="text"
                  value={formData.domainTransformSource || '@contoso.onmicrosoft.com'}
                  onChange={(e) => setFormData({ ...formData, domainTransformSource: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded font-mono text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400">Target UPN Domain Suffix</label>
                <input
                  type="text"
                  value={formData.domainTransformTarget || '@fabrikam.com'}
                  onChange={(e) => setFormData({ ...formData, domainTransformTarget: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded font-mono text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
            <h4 className="font-semibold text-slate-900 dark:text-white">Source Anchor (ImmutableID) Strategy</h4>
            <select
              value={formData.adSourceAnchorAttribute || 'objectGUID'}
              onChange={(e) => setFormData({ ...formData, adSourceAnchorAttribute: e.target.value })}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-white"
            >
              <option value="objectGUID">mS-DS-ConsistencyGuid / objectGUID (Microsoft Default)</option>
              <option value="userPrincipalName">userPrincipalName (Cloud-only identity mapping)</option>
            </select>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Base64 encoded binary GUID used to uniquely correlate user objects between Active Directory and Microsoft Entra ID.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // STEP 4: CREDENTIALS, PASSWORDS & ONBOARDING
  if (currentStep === 4) {
    return (
      <div className="space-y-5 animate-in fade-in duration-150 text-xs">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Key className="h-5 w-5 text-purple-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Directory Step 4: Passwords, Credentials & SSPR / MFA Onboarding
            </h3>
          </div>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5">
            Choose between Password Hash Synchronization (PHS) or temporary random passwords with mandatory first-login change.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
            <h4 className="font-semibold text-slate-900 dark:text-white">Password Synchronization Mode</h4>
            <div className="space-y-2">
              {[
                { id: 'PASSWORD_HASH_SYNC', title: 'Password Hash Synchronization (PHS)', desc: 'Synchronizes one-way SHA-256 password hashes to maintain identical passwords.' },
                { id: 'TEMPORARY_RANDOM', title: 'Generate Secure Temporary Password', desc: 'Sets random complex passwords and requires user to change password on first login.' },
              ].map((opt) => (
                <label
                  key={opt.id}
                  onClick={() => setFormData({ ...formData, adPasswordSyncMode: opt.id })}
                  className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer ${
                    (formData.adPasswordSyncMode || 'PASSWORD_HASH_SYNC') === opt.id
                      ? 'border-purple-500 bg-white dark:bg-slate-900 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 bg-transparent'
                  }`}
                >
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{opt.title}</span>
                    <p className="text-[10px] text-slate-500">{opt.desc}</p>
                  </div>
                  <input
                    type="radio"
                    name="adPassMode"
                    checked={(formData.adPasswordSyncMode || 'PASSWORD_HASH_SYNC') === opt.id}
                    onChange={() => {}}
                    className="text-purple-600"
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
            <h4 className="font-semibold text-slate-900 dark:text-white">Security & MFA Safeguards</h4>
            <div className="space-y-2">
              <label className="flex items-start space-x-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded text-purple-600 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Force Password Change on First Sign-in</span>
                  <p className="text-[10px] text-slate-500">Enforces Entra ID credential refresh upon initial user authentication.</p>
                </div>
              </label>

              <label className="flex items-start space-x-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded text-purple-600 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Trigger Combined SSPR / MFA Registration</span>
                  <p className="text-[10px] text-slate-500">Prompts users to register Microsoft Authenticator on first target logon.</p>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // STEP 5: GROUP MEMBERSHIP & HIERARCHY
  if (currentStep === 5) {
    return (
      <div className="space-y-5 animate-in fade-in duration-150 text-xs">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Layers className="h-5 w-5 text-purple-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Directory Step 5: Group Membership Nesting & Hierarchy Resolution
            </h3>
          </div>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5">
            Resolve circular group nesting, replicate group managers, and translate dynamic Entra ID group membership rules.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          <h4 className="font-semibold text-slate-900 dark:text-white">Nesting & Hierarchy Policies</h4>
          <div className="space-y-2">
            <label className="flex items-start space-x-2 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded text-purple-600 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200">Flatten Nested Security Groups for Cloud Compatibility</span>
                <p className="text-[10px] text-slate-500">Resolves deep on-prem multi-level nesting into direct cloud memberships.</p>
              </div>
            </label>

            <label className="flex items-start space-x-2 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded text-purple-600 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200">Replicate Group Ownership & ManagedBy Attributes</span>
                <p className="text-[10px] text-slate-500">Preserves designated group owners for self-service access requests.</p>
              </div>
            </label>
          </div>
        </div>
      </div>
    );
  }

  // STEP 6: CONFLICT RESOLUTION & QUARANTINE
  if (currentStep === 6) {
    return (
      <div className="space-y-5 animate-in fade-in duration-150 text-xs">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="h-5 w-5 text-purple-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Directory Step 6: Identity Collision Handling & Quarantine Tank
            </h3>
          </div>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5">
            Automate soft-matching and isolate duplicate UPN collisions into a quarantine tank to prevent account overwrites.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          <h4 className="font-semibold text-slate-900 dark:text-white">Conflict Resolution Rules</h4>
          <div className="space-y-2">
            <div className="p-3 rounded-lg border border-purple-500/20 bg-purple-50/50 dark:bg-purple-950/20">
              <span className="font-semibold text-slate-900 dark:text-white">Primary SMTP Soft-Matching</span>
              <p className="text-[10px] text-slate-500 mt-0.5">If target object already exists with matching mail attribute, automatically correlates identities.</p>
            </div>
            <div className="p-3 rounded-lg border border-purple-500/20 bg-purple-50/50 dark:bg-purple-950/20">
              <span className="font-semibold text-slate-900 dark:text-white">Quarantine Holding Tank for Duplicate UPNs</span>
              <p className="text-[10px] text-slate-500 mt-0.5">Conflicting accounts are placed in quarantine with an alert notification rather than overwriting target users.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // STEP 7: DELTA SYNC & STAGING WAVES
  if (currentStep === 7) {
    return (
      <div className="space-y-5 animate-in fade-in duration-150 text-xs">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-purple-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Directory Step 7: Delta Sync Intervals & Staging Waves
            </h3>
          </div>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5">
            Set continuous delta sync intervals (15, 30, or 60 minutes) to keep passwords and attributes aligned until cutover.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
            <h4 className="font-semibold text-slate-900 dark:text-white">Continuous Delta Sync Interval</h4>
            <select
              value={formData.adDeltaSyncIntervalMinutes || 15}
              onChange={(e) => setFormData({ ...formData, adDeltaSyncIntervalMinutes: parseInt(e.target.value, 10) })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-white"
            >
              <option value="15">Every 15 Minutes (Standard Production Sync)</option>
              <option value="30">Every 30 Minutes</option>
              <option value="60">Every 60 Minutes (Off-Peak)</option>
            </select>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
            <h4 className="font-semibold text-slate-900 dark:text-white">Scheduled Cutover Window</h4>
            <div>
              <label className="block text-[11px] text-slate-500 mb-1">Scheduled Start Time</label>
              <input
                type="datetime-local"
                value={formData.scheduledWindowStartTime}
                onChange={(e) => setFormData({ ...formData, scheduledWindowStartTime: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
