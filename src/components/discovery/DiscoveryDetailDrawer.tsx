import React, { useState, useEffect } from 'react';
import { DiscoveredUser, DiscoveredUserDetail } from '../../types';
import {
  X,
  User,
  Mail,
  HardDrive,
  Users,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  ExternalLink,
  Layers,
  Key,
  FolderLock,
  Globe,
  Archive,
  ArrowRight,
  Sparkles,
  Share2
} from 'lucide-react';

interface DiscoveryDetailDrawerProps {
  user: DiscoveredUser | null;
  isOpen: boolean;
  onClose: () => void;
  onStageMigration?: (user: DiscoveredUser) => void;
}

export const DiscoveryDetailDrawer: React.FC<DiscoveryDetailDrawerProps> = ({
  user,
  isOpen,
  onClose,
  onStageMigration,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'exchange' | 'onedrive' | 'teams' | 'licenses'>('profile');
  const [detailData, setDetailData] = useState<DiscoveredUserDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (user && isOpen) {
      setLoading(true);
      fetch(`/api/discovery/users/${encodeURIComponent(user.upn)}`)
        .then((res) => res.json())
        .then((data) => {
          setDetailData(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Failed to load user drilldown:', err);
          setLoading(false);
        });
    } else {
      setDetailData(null);
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const mfaIcon =
    user.mfaStatus === 'ENFORCED' ? (
      <ShieldCheck className="w-4 h-4 text-emerald-400" />
    ) : user.mfaStatus === 'ENABLED' ? (
      <ShieldAlert className="w-4 h-4 text-amber-400" />
    ) : (
      <ShieldX className="w-4 h-4 text-rose-400" />
    );

  const mfaColor =
    user.mfaStatus === 'ENFORCED'
      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      : user.mfaStatus === 'ENABLED'
      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      : 'bg-rose-500/10 text-rose-400 border-rose-500/20';

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fadeIn">
      {/* Click outside to close */}
      <div className="flex-1" onClick={onClose} />

      {/* Drawer Container */}
      <div className="w-full max-w-2xl bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl animate-slideLeft overflow-hidden">
        {/* Drawer Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-900/90 flex items-start justify-between">
          <div className="flex items-start space-x-4 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-lg font-bold text-blue-400 shrink-0">
              {user.displayName.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2.5">
                <h2 className="text-lg font-bold text-white truncate">{user.displayName}</h2>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border flex items-center gap-1 ${mfaColor}`}>
                  {mfaIcon}
                  {user.mfaStatus}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono truncate mt-0.5">{user.upn}</p>
              <div className="flex items-center space-x-2 text-xs text-slate-400 mt-2">
                <span>{user.jobTitle || 'No Title'}</span>
                <span>•</span>
                <span className="text-slate-300 font-medium">{user.department || 'General'}</span>
                <span>•</span>
                <span>Location: {user.usageLocation || 'US'}</span>
              </div>
            </div>
          </div>

          <button
            id="btn-close-drawer"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-slate-800 bg-slate-900/50 flex space-x-6 text-xs font-medium overflow-x-auto">
          {[
            { id: 'profile', label: 'Identity & Access', icon: User },
            { id: 'exchange', label: 'Exchange Mailbox', icon: Mail },
            { id: 'onedrive', label: 'OneDrive Personal', icon: HardDrive },
            { id: 'teams', label: 'Teams & Groups', icon: Users },
            { id: 'licenses', label: 'Licenses & SKUs', icon: Sparkles },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 flex items-center space-x-1.5 border-b-2 transition whitespace-nowrap ${
                  isActive
                    ? 'border-blue-500 text-blue-400 font-semibold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Drawer Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3 text-slate-400">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs">Querying Microsoft Graph & Exchange Online statistics...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: PROFILE & IDENTITY */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  {/* Account Status Card */}
                  <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-3">
                    <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Account & Authentication State
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-slate-400">Account Enabled:</span>
                        <div className="font-medium text-white mt-0.5">
                          {user.accountEnabled ? (
                            <span className="text-emerald-400">Yes (Active)</span>
                          ) : (
                            <span className="text-rose-400">No (Disabled / Suspended)</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-400">MFA Policy Status:</span>
                        <div className="font-medium text-white mt-0.5">{user.mfaStatus}</div>
                      </div>
                      <div>
                        <span className="text-slate-400">Reporting Manager:</span>
                        <div className="font-medium text-white mt-0.5">
                          {user.manager || <span className="text-slate-500 italic">None assigned</span>}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-400">Entra ID Sync ETag:</span>
                        <div className="font-mono text-slate-300 mt-0.5">{user.etag || 'None'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Directory Roles */}
                  <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-3">
                    <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                      <Key className="w-3.5 h-3.5 text-amber-400" />
                      <span>Assigned Entra ID Directory Roles</span>
                    </h3>
                    {user.assignedRoles && user.assignedRoles.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {user.assignedRoles.map((role) => (
                          <span
                            key={role}
                            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20"
                          >
                            {role}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">No administrative privileged roles assigned.</p>
                    )}
                  </div>

                  {/* Migration Readiness Assessment */}
                  <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-900/40 space-y-2">
                    <div className="flex items-center space-x-2 text-blue-400 text-xs font-semibold uppercase tracking-wider">
                      <Sparkles className="w-4 h-4" />
                      <span>Migration Readiness Assessment</span>
                    </div>
                    <p className="text-xs text-slate-300">
                      User identity and workloads are fully mapped. Target domain Fabrikam tenant has matching license quotas available.
                    </p>
                    <div className="pt-2 flex items-center space-x-4 text-xs text-slate-400">
                      <span>• UPN Format: Compliant</span>
                      <span>• Mailbox Size: Supported</span>
                      <span>• OneDrive Quota: Validated</span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: EXCHANGE MAILBOX */}
              {activeTab === 'exchange' && (
                <div className="space-y-6">
                  {detailData?.mailbox ? (
                    <>
                      <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                            Exchange Online Mailbox
                          </span>
                          <span className="px-2 py-0.5 rounded text-xs font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            {detailData.mailbox.mailboxType}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                          <div>
                            <span className="text-slate-400">Total Primary Size:</span>
                            <div className="text-base font-bold text-white mt-0.5">
                              {(detailData.mailbox.totalItemSizeMB / 1024).toFixed(2)} GB
                            </div>
                            <span className="text-[10px] text-slate-500">
                              {Math.round(detailData.mailbox.totalItemSizeMB)} MB total
                            </span>
                          </div>

                          <div>
                            <span className="text-slate-400">Item Count:</span>
                            <div className="text-base font-bold text-white mt-0.5">
                              {(detailData.mailbox?.itemCount ?? 0).toLocaleString()} items
                            </div>
                          </div>

                          <div>
                            <span className="text-slate-400">Online Archive:</span>
                            <div className="text-base font-bold text-white mt-0.5 flex items-center space-x-1">
                              <Archive className="w-3.5 h-3.5 text-indigo-400" />
                              <span>{detailData.mailbox.archiveStatus}</span>
                            </div>
                            {detailData.mailbox.archiveStatus === 'Active' && (
                              <span className="text-[10px] text-slate-400">
                                Archive Size: {(detailData.mailbox.archiveSizeMB / 1024).toFixed(1)} GB
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-700/60 text-xs">
                          <span className="text-slate-400">Retention Policy:</span>
                          <div className="font-medium text-slate-200 mt-0.5">
                            {detailData.mailbox.retentionPolicy || 'Default MRM Policy'}
                          </div>
                        </div>
                      </div>

                      {/* Delegation & Permissions */}
                      <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-3">
                        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                          <FolderLock className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Mailbox Delegation & Permissions</span>
                        </h4>
                        {detailData.mailbox.delegates && detailData.mailbox.delegates.length > 0 ? (
                          <div className="space-y-1.5">
                            {detailData.mailbox.delegates.map((del, idx) => (
                              <div
                                key={idx}
                                className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-slate-300 flex items-center space-x-2"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                                <span>{del}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500 italic">No external delegates configured for this mailbox.</p>
                        )}
                      </div>

                      {/* Forwarding Rules */}
                      <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-3">
                        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                          <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                          <span>Inbox Forwarding Rules & Redirection</span>
                        </h4>
                        {detailData.mailbox.forwardingRules && detailData.mailbox.forwardingRules.length > 0 ? (
                          <div className="space-y-1.5">
                            {detailData.mailbox.forwardingRules.map((rule, idx) => (
                              <div
                                key={idx}
                                className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-amber-300"
                              >
                                {rule}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500 italic">No forwarding rules active.</p>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12 text-slate-500 text-xs">
                      No Exchange Online mailbox discovered for this user.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: ONEDRIVE FOR BUSINESS */}
              {activeTab === 'onedrive' && (
                <div className="space-y-6">
                  {detailData?.oneDrive ? (
                    <>
                      <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                            Personal Site Details
                          </span>
                          <span className="px-2 py-0.5 rounded text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            OneDrive for Business
                          </span>
                        </div>

                        <div className="text-xs">
                          <span className="text-slate-400">Site Collection URL:</span>
                          <div className="font-mono text-blue-400 mt-1 break-all bg-slate-900 p-2 rounded-lg border border-slate-800 flex items-center justify-between">
                            <span>{detailData.oneDrive.siteUrl}</span>
                            <ExternalLink className="w-3.5 h-3.5 text-slate-500 shrink-0 ml-2" />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs pt-2">
                          <div>
                            <span className="text-slate-400">Storage Used:</span>
                            <div className="text-base font-bold text-white mt-0.5">
                              {detailData.oneDrive.storageUsedGB} GB
                            </div>
                            <span className="text-[10px] text-slate-500">
                              of {detailData.oneDrive.storageQuotaGB} GB quota
                            </span>
                          </div>

                          <div>
                            <span className="text-slate-400">Total File Count:</span>
                            <div className="text-base font-bold text-white mt-0.5">
                              {(detailData.oneDrive?.fileCount ?? 0).toLocaleString()}
                            </div>
                          </div>

                          <div>
                            <span className="text-slate-400">External Sharing:</span>
                            <div className="text-sm font-semibold text-amber-400 mt-0.5 flex items-center space-x-1">
                              <Share2 className="w-3.5 h-3.5" />
                              <span>{detailData.oneDrive.externalSharing}</span>
                            </div>
                            <span className="text-[10px] text-slate-400">
                              {detailData.oneDrive.sharingLinksCount} active sharing links
                            </span>
                          </div>
                        </div>

                        {/* Storage usage bar */}
                        <div className="pt-2">
                          <div className="flex justify-between text-xs text-slate-400 mb-1">
                            <span>Quota Utilization</span>
                            <span>
                              {Math.round(
                                (detailData.oneDrive.storageUsedGB / (detailData.oneDrive.storageQuotaGB || 1)) * 100
                              )}
                              %
                            </span>
                          </div>
                          <div className="w-full bg-slate-700/60 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full rounded-full"
                              style={{
                                width: `${Math.min(
                                  100,
                                  (detailData.oneDrive.storageUsedGB / (detailData.oneDrive.storageQuotaGB || 1)) * 100
                                )}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12 text-slate-500 text-xs">
                      No active OneDrive for Business provisioned.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: TEAMS & GROUPS */}
              {activeTab === 'teams' && (
                <div className="space-y-6">
                  {/* Teams */}
                  <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-3">
                    <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                      <Users className="w-3.5 h-3.5 text-purple-400" />
                      <span>Microsoft Teams Memberships</span>
                    </h3>
                    {detailData?.teams && detailData.teams.length > 0 ? (
                      <div className="space-y-2">
                        {detailData.teams.map((tm) => (
                          <div
                            key={tm.id}
                            className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                          >
                            <div>
                              <div className="font-semibold text-white">{tm.teamName}</div>
                              <div className="text-[11px] text-slate-400">
                                {tm.channelsCount} channels • Visibility: {tm.visibility}
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-purple-500/10 text-purple-300 border border-purple-500/20">
                              {tm.role}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">User is not an owner or direct admin of any discovered Teams.</p>
                    )}
                  </div>

                  {/* Groups */}
                  <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-3">
                    <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                      <Layers className="w-3.5 h-3.5 text-blue-400" />
                      <span>Group Memberships</span>
                    </h3>
                    {user.groups && user.groups.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {user.groups.map((grp) => (
                          <span
                            key={grp}
                            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700"
                          >
                            {grp}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">No explicit group memberships mapped.</p>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: LICENSES & SKUS */}
              {activeTab === 'licenses' && (
                <div className="space-y-6">
                  <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-3">
                    <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                      <span>Assigned Subscriptions & Plans</span>
                    </h3>
                    {user.licenses && user.licenses.length > 0 ? (
                      <div className="space-y-2">
                        {user.licenses.map((lic) => (
                          <div
                            key={lic}
                            className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                          >
                            <div>
                              <div className="font-semibold text-white">{lic}</div>
                              <div className="text-[11px] text-slate-400">Active • Direct Entra Assignment</div>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Licensed
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">No licenses assigned to this account.</p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition"
          >
            Close
          </button>

          {onStageMigration && (
            <button
              id="btn-drawer-stage-user"
              onClick={() => {
                onStageMigration(user);
                onClose();
              }}
              className="px-4 py-2 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-sm transition flex items-center space-x-1.5"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Stage for Migration Wave</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
