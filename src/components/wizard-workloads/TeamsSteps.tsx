import React from 'react';
import {
  MessageSquare,
  Users,
  FolderTree,
  FileText,
  Calendar,
  Layers,
  Sparkles,
  Lock,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Activity,
  ArrowRight
} from 'lucide-react';
import { MigrationBatchItem, MigrationQueueConfig } from '../../types';

export interface TeamsStepsProps {
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

export const TeamsSteps: React.FC<TeamsStepsProps> = ({
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
  // STEP 2: ROSTERS, MEMBERSHIP & IDENTITY MAPPING
  if (currentStep === 2) {
    return (
      <div className="space-y-5 animate-in fade-in duration-150 text-xs">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-indigo-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Teams Step 2: Team Roster, Membership & Identity Mapping
            </h3>
          </div>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5">
            Map Team Owners, Members, and External Guests to target tenant identities and configure Private Channel rosters.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
            <h4 className="font-semibold text-slate-900 dark:text-white">Role Mapping Strategy</h4>
            <div className="space-y-2">
              <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-between">
                <span>Team Owners</span>
                <span className="font-mono text-indigo-600 dark:text-indigo-400 font-medium">Mapped to Target Team Owners</span>
              </div>
              <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-between">
                <span>Team Members</span>
                <span className="font-mono text-blue-600 dark:text-blue-400 font-medium">Mapped to Target Team Members</span>
              </div>
              <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-between">
                <span>External Guests</span>
                <span className="font-mono text-purple-600 dark:text-purple-400 font-medium">Entra B2B Guest Invites</span>
              </div>
            </div>

            <label className="flex items-center space-x-2 pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.teamsDirectConnectSharedChannels ?? true}
                onChange={(e) => setFormData({ ...formData, teamsDirectConnectSharedChannels: e.target.checked })}
                className="rounded text-indigo-600"
              />
              <span>Configure B2B Direct Connect for Cross-Tenant Shared Channels</span>
            </label>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
            <h4 className="font-semibold text-slate-900 dark:text-white">Channel Roster Scoping</h4>
            <div className="space-y-2.5">
              <label className="flex items-start space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.migrateStandardChannels ?? true}
                  onChange={(e) => setFormData({ ...formData, migrateStandardChannels: e.target.checked })}
                  className="rounded text-indigo-600 mt-0.5"
                />
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Standard Channels</span>
                  <p className="text-[10px] text-slate-500">Accessible to all team members; General channel structure preserved.</p>
                </div>
              </label>

              <label className="flex items-start space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.migratePrivateChannels ?? true}
                  onChange={(e) => setFormData({ ...formData, migratePrivateChannels: e.target.checked })}
                  className="rounded text-indigo-600 mt-0.5"
                />
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Private Channels & Dedicated Sites</span>
                  <p className="text-[10px] text-slate-500">Recreates dedicated private channel rosters and underlying separate site collections.</p>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // STEP 3: CHANNELS & CHAT HISTORY SCOPE
  if (currentStep === 3) {
    return (
      <div className="space-y-5 animate-in fade-in duration-150 text-xs">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-indigo-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Teams Step 3: Channels, 1:1 Chats & Message History Scope
            </h3>
          </div>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5">
            Configure channel conversation threads, 1:1 and group direct chats, rich card formatting, and reaction retention.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
            <h4 className="font-semibold text-slate-900 dark:text-white">Chat Message Fidelity & Rendering</h4>
            <div className="space-y-2">
              {[
                { id: 'FULL_HTML_AND_REACTIONS', title: 'Full HTML + Emojis + Reactions', desc: 'Preserves formatting, @mentions, thumbs-up/heart reactions, and inline images.' },
                { id: 'STANDARD_HTML', title: 'Standard HTML Message History', desc: 'Preserves message text, code blocks, and timestamps without dynamic reaction state.' },
              ].map((opt) => (
                <label
                  key={opt.id}
                  onClick={() => setFormData({ ...formData, teamsMessageFidelity: opt.id })}
                  className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer ${
                    (formData.teamsMessageFidelity || 'FULL_HTML_AND_REACTIONS') === opt.id
                      ? 'border-indigo-500 bg-white dark:bg-slate-900 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 bg-transparent'
                  }`}
                >
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{opt.title}</span>
                    <p className="text-[10px] text-slate-500">{opt.desc}</p>
                  </div>
                  <input
                    type="radio"
                    name="teamsFidelity"
                    checked={(formData.teamsMessageFidelity || 'FULL_HTML_AND_REACTIONS') === opt.id}
                    onChange={() => {}}
                    className="text-indigo-600"
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
            <h4 className="font-semibold text-slate-900 dark:text-white">Conversation Types & Date Filters</h4>
            <div className="space-y-2.5">
              <label className="flex items-start space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.migrateOneOnOneChats ?? true}
                  onChange={(e) => setFormData({ ...formData, migrateOneOnOneChats: e.target.checked })}
                  className="rounded text-indigo-600 mt-0.5"
                />
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">1:1 Direct User Chats</span>
                  <p className="text-[10px] text-slate-500">Migrates direct messaging history between migrated users.</p>
                </div>
              </label>

              <label className="flex items-start space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.migrateGroupChats ?? true}
                  onChange={(e) => setFormData({ ...formData, migrateGroupChats: e.target.checked })}
                  className="rounded text-indigo-600 mt-0.5"
                />
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Group Chats (Non-Team)</span>
                  <p className="text-[10px] text-slate-500">Ad-hoc multi-party group chat conversation threads.</p>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // STEP 4: CHANNEL FILES, SHAREPOINT & ONENOTE
  if (currentStep === 4) {
    return (
      <div className="space-y-5 animate-in fade-in duration-150 text-xs">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <FolderTree className="h-5 w-5 text-indigo-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Teams Step 4: Channel Files, Underlying SharePoint & OneNote
            </h3>
          </div>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5">
            Synchronize channel files stored in underlying SharePoint document libraries and migrate team OneNote notebooks.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
            <h4 className="font-semibold text-slate-900 dark:text-white">Legacy Teams Wiki Handling</h4>
            <div className="space-y-2">
              {[
                { id: 'CONVERT_TO_ONENOTE', title: 'Convert Teams Wiki ➔ OneNote (Microsoft Recommended)', desc: 'Converts deprecated Teams Wiki tab data into modern native OneNote notebooks.' },
                { id: 'ARCHIVE_FILES', title: 'Archive as HTML / Markdown Files', desc: 'Saves legacy wiki pages into a dedicated SharePoint channel archive folder.' },
              ].map((opt) => (
                <label
                  key={opt.id}
                  onClick={() => setFormData({ ...formData, teamsWikiConversion: opt.id })}
                  className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer ${
                    (formData.teamsWikiConversion || 'CONVERT_TO_ONENOTE') === opt.id
                      ? 'border-indigo-500 bg-white dark:bg-slate-900 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 bg-transparent'
                  }`}
                >
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{opt.title}</span>
                    <p className="text-[10px] text-slate-500">{opt.desc}</p>
                  </div>
                  <input
                    type="radio"
                    name="teamsWiki"
                    checked={(formData.teamsWikiConversion || 'CONVERT_TO_ONENOTE') === opt.id}
                    onChange={() => {}}
                    className="text-indigo-600"
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
            <h4 className="font-semibold text-slate-900 dark:text-white">Channel Files & Document Libraries</h4>
            <div className="space-y-2">
              <div className="p-2.5 rounded-lg border border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-950/20 flex items-start space-x-2">
                <CheckCircle2 className="h-4 w-4 text-indigo-600 mt-0.5 shrink-0" />
                <div>
                  <span className="font-semibold text-slate-900 dark:text-white">Auto-Linked SharePoint Site Collections</span>
                  <p className="text-[10px] text-slate-500 mt-0.5">Files in each channel are matched to their corresponding target SharePoint folder.</p>
                </div>
              </div>

              <div className="p-2.5 rounded-lg border border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-950/20 flex items-start space-x-2">
                <CheckCircle2 className="h-4 w-4 text-indigo-600 mt-0.5 shrink-0" />
                <div>
                  <span className="font-semibold text-slate-900 dark:text-white">Inline File Attachment Re-linking</span>
                  <p className="text-[10px] text-slate-500 mt-0.5">Links in chat messages pointing to uploaded channel files are rewritten to target URLs.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // STEP 5: APPS, TABS, PLANNER BOARDS & WEBHOOKS
  if (currentStep === 5) {
    return (
      <div className="space-y-5 animate-in fade-in duration-150 text-xs">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-indigo-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Teams Step 5: Apps, Custom Tabs, Planner Boards & Webhooks
            </h3>
          </div>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5">
            Re-create channel tabs (Website, Excel, PowerBI), Planner tasks, buckets, assignments, and bot connectors.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
            <h4 className="font-semibold text-slate-900 dark:text-white">Planner Boards & Task Migration</h4>
            <label className="flex items-start space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.teamsPlannerTasksMigration ?? true}
                onChange={(e) => setFormData({ ...formData, teamsPlannerTasksMigration: e.target.checked })}
                className="rounded text-indigo-600 mt-0.5"
              />
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200">Replicate Microsoft Planner Plans & Tasks</span>
                <p className="text-[10px] text-slate-500">Migrates buckets, task titles, checklists, notes, assignments, and completion states.</p>
              </div>
            </label>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
            <h4 className="font-semibold text-slate-900 dark:text-white">Channel Tabs & Connectors</h4>
            <label className="flex items-start space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.teamsAppsAndTabsRecreation ?? true}
                onChange={(e) => setFormData({ ...formData, teamsAppsAndTabsRecreation: e.target.checked })}
                className="rounded text-indigo-600 mt-0.5"
              />
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200">Auto-Recreate Configured Channel Tabs</span>
                <p className="text-[10px] text-slate-500">Re-registers document tabs, website tabs, and SharePoint list tabs in corresponding target channels.</p>
              </div>
            </label>
          </div>
        </div>
      </div>
    );
  }

  // STEP 6: GRAPH MIGRATION STREAMING & MODE
  if (currentStep === 6) {
    return (
      <div className="space-y-5 animate-in fade-in duration-150 text-xs">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-indigo-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Teams Step 6: Graph Migration Mode & Historical Back-Dating
            </h3>
          </div>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5">
            Leverage official Microsoft Graph Migration API mode to insert historical chat messages with authentic timestamps.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-indigo-300 dark:border-indigo-800/60 bg-indigo-50/50 dark:bg-indigo-950/20 space-y-2">
          <div className="flex items-center space-x-2 font-bold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider text-[11px]">
            <CheckCircle2 className="h-4 w-4" />
            <span>Microsoft Graph Migration API Protocol Enabled</span>
          </div>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Channels are created in "Migration Mode" via `POST /teams/{'{id}'}/completeMigration`. This permits back-dating message timestamps to match historical conversation chronology before finalizing the channel for live user communication.
          </p>
        </div>
      </div>
    );
  }

  // STEP 7: WAVE SCHEDULING, ARCHIVAL & CUTOVER
  if (currentStep === 7) {
    return (
      <div className="space-y-5 animate-in fade-in duration-150 text-xs">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-indigo-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Teams Step 7: Wave Scheduling, Source Team Archival & Cutover
            </h3>
          </div>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5">
            Configure cutover waves, archive source teams (Read-Only mode), and set user welcome broadcast announcements.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
            <h4 className="font-semibold text-slate-900 dark:text-white">Source Team Cutover Action</h4>
            <label className="flex items-start space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.teamsArchiveSourceTeamOnCutover ?? true}
                onChange={(e) => setFormData({ ...formData, teamsArchiveSourceTeamOnCutover: e.target.checked })}
                className="rounded text-indigo-600 mt-0.5"
              />
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200">Archive Source Team upon Cutover</span>
                <p className="text-[10px] text-slate-500">Locks source team into read-only mode to prevent diverging chat threads after cutover.</p>
              </div>
            </label>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
            <h4 className="font-semibold text-slate-900 dark:text-white">Cutover Maintenance Window</h4>
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
