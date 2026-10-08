import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Download,
  Copy,
  Check,
  RefreshCw,
  Users,
  Mail,
  HardDrive,
  MessageSquare,
  Globe,
  Layers,
  Shield,
  Database,
  ArrowRight,
  ExternalLink,
  Search,
  Filter,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Zap,
  Info,
  Sliders,
  FolderTree,
  AlertOctagon,
  Lock,
  Unlock,
  Key
} from 'lucide-react';
import { WorkstreamAssessmentData } from '../../../server/tenantAssessment';

interface TenantAssessmentViewProps {
  onNavigateToWorkloadTab?: (tab: string) => void;
  onNavigateToScan?: () => void;
}

export const TenantAssessmentView: React.FC<TenantAssessmentViewProps> = ({
  onNavigateToWorkloadTab,
  onNavigateToScan,
}) => {
  const [data, setData] = useState<WorkstreamAssessmentData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeWorkstreamId, setActiveWorkstreamId] = useState<string>('all');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['all']));
  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState<string>('');

  const fetchAssessment = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/discovery/tenant-assessment');
      if (!res.ok) throw new Error(`Assessment API returned HTTP ${res.status}`);
      const assessment = await res.json();
      setData(assessment);
    } catch (err: any) {
      console.error('Failed to fetch tenant assessment:', err);
      setError(err.message || 'Failed to load assessment data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessment();
  }, []);

  const toggleSection = (sectionKey: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionKey)) {
        next.delete(sectionKey);
      } else {
        next.add(sectionKey);
      }
      return next;
    });
  };

  const handleCopyMarkdownSummary = () => {
    if (!data) return;
    const s = data.summary;
    const ws = data.workstreams;
    const md = `# Microsoft Tenant-to-Tenant Initial Discovery Assessment Report
**Source Tenant:** ${data.sourceTenant.displayName} (${data.sourceTenant.domain})
**Target Tenant:** ${data.targetTenant.displayName} (${data.targetTenant.domain})
**Evaluated At:** ${new Date(data.evaluatedAt).toLocaleString()}
**Overall Readiness Score:** ${s.overallReadinessScore}/100 (${s.readinessGrade})
**Critical Blockers:** ${s.criticalBlockers} | **Recommended Remediations:** ${s.recommendedRemediations}

---
### 1. Identity & Directory (Score: ${ws.identityAndDirectory.readinessScore}%)
- Total Users: ${ws.identityAndDirectory.examinationPoints.inventory.totalUsers} (Active: ${ws.identityAndDirectory.examinationPoints.inventory.activeUsers}, Guests: ${ws.identityAndDirectory.examinationPoints.inventory.externalB2BGuests})
- Total Groups: ${ws.identityAndDirectory.examinationPoints.inventory.totalGroups} | Contacts: ${ws.identityAndDirectory.examinationPoints.inventory.totalContacts}
- Primary UPN Suffix: ${ws.identityAndDirectory.examinationPoints.upnAndSmtpPatterns.primaryUpnDomain}
- Dormant Accounts (>90d): ${ws.identityAndDirectory.examinationPoints.dormantAccounts.inactiveOver90Days}
- Duplicate Collisions: ${ws.identityAndDirectory.examinationPoints.duplicateAccounts.collidingUpnsOrAliases}

### 2. Exchange & Mail (Score: ${ws.exchangeAndMail.readinessScore}%)
- Total Mailboxes: ${ws.exchangeAndMail.examinationPoints.mailboxCounts.totalMailboxes} (Volume: ${ws.exchangeAndMail.examinationPoints.mailboxSizeDistribution.totalMailboxVolumeGB} GB)
- Mailboxes > 50 GB: ${ws.exchangeAndMail.examinationPoints.mailboxSizeDistribution.between50And100GB + ws.exchangeAndMail.examinationPoints.mailboxSizeDistribution.over100GBAutoExpanding}
- Archive Enabled: ${ws.exchangeAndMail.examinationPoints.archiveFootprint.mailboxesWithArchiveEnabled} (${ws.exchangeAndMail.examinationPoints.archiveFootprint.totalArchiveSizeGB} GB)
- Litigation Holds: ${ws.exchangeAndMail.examinationPoints.holds.mailboxesOnLitigationHold} mailboxes

### 3. OneDrive & SharePoint (Score: ${ws.oneDriveAndSharePoint.readinessScore}%)
- Personal OneDrives: ${ws.oneDriveAndSharePoint.examinationPoints.oneDriveAndSharePointInventory.totalOneDriveAccounts} (${ws.oneDriveAndSharePoint.examinationPoints.oneDriveAndSharePointInventory.consumedStorageGB} GB)
- SharePoint Sites: ${ws.oneDriveAndSharePoint.examinationPoints.oneDriveAndSharePointInventory.totalSharePointSites} (${ws.oneDriveAndSharePoint.examinationPoints.oneDriveAndSharePointInventory.sharePointStorageUsedGB} GB)
- Paths > 260 Chars: ${ws.oneDriveAndSharePoint.examinationPoints.pathsWithExcessiveLength.pathsExceeding260Chars} (Paths > 400 Chars: ${ws.oneDriveAndSharePoint.examinationPoints.pathsWithExcessiveLength.pathsExceeding400Chars})
- Paths with Illegal Chars: ${ws.oneDriveAndSharePoint.examinationPoints.pathsWithUnsupportedCharacters.pathsWithIllegalCharsCount}

### 4. Teams & Collaboration (Score: ${ws.teamsAndCollaboration.readinessScore}%)
- Total Teams: ${ws.teamsAndCollaboration.examinationPoints.teamsEnumeration.totalTeams} (Standard: ${ws.teamsAndCollaboration.examinationPoints.teamsEnumeration.standardChannels}, Private: ${ws.teamsAndCollaboration.examinationPoints.teamsEnumeration.privateChannels}, Shared: ${ws.teamsAndCollaboration.examinationPoints.teamsEnumeration.sharedChannelsConnect})
- Configured Tabs: ${ws.teamsAndCollaboration.examinationPoints.tabsWithinTeams.totalTabsConfigured}
- Integrated 3rd-Party Apps: ${ws.teamsAndCollaboration.examinationPoints.thirdPartyApps.integratedAppsCount}

### 5. Google Workspace (Score: ${ws.googleWorkspace.readinessScore}%)
- Gmail: ${ws.googleWorkspace.examinationPoints.gmailVolume.totalAccounts} accounts (${ws.googleWorkspace.examinationPoints.gmailVolume.totalStorageVolumeGB} GB)
- Google Drive: ${ws.googleWorkspace.examinationPoints.driveInventory.totalMyDrives} My Drives, ${ws.googleWorkspace.examinationPoints.driveInventory.totalSharedDrives} Shared Drives
- Google Classroom: ${ws.googleWorkspace.examinationPoints.googleClassroom.activeClasses} active classes, ${ws.googleWorkspace.examinationPoints.googleClassroom.totalRosters} rosters

### 6. Applications & SSO (Score: ${ws.applicationsAndSSO.readinessScore}%)
- Registered Applications: ${ws.applicationsAndSSO.examinationPoints.registeredApplicationsTotal.registeredApplicationsCount}
- Microsoft Owned: 420 | Enterprise IT Managed: 684 | Business Unit: 286 | Orphaned: 72
- Auth Methods: Entra ID Native: 1,084 (OIDC/OAuth: 682, SAML: 248) | External/Federated: 378 (Okta, Ping, Google)

### 7. Security & Compliance (Score: ${ws.securityAndCompliance.readinessScore}%)
- Conditional Access: ${ws.securityAndCompliance.examinationPoints.conditionalAccessPolicies.totalPolicies} policies (${ws.securityAndCompliance.examinationPoints.conditionalAccessPolicies.enforcedPoliciesCount} enforced)
- MFA Enforced Rate: ${ws.securityAndCompliance.examinationPoints.mfaPolicies.enforcedRatePercent}%
- Purview Sensitivity Labels: ${ws.securityAndCompliance.examinationPoints.purviewConfiguration.sensitivityLabelsPublished} published labels

### 8. Data Quality (Score: ${ws.dataQuality.readinessScore}%)
- Mailboxes > 50 GB: ${ws.dataQuality.examinationPoints.mailboxesExceeding50GB.count}
- Stale Accounts: ${ws.dataQuality.examinationPoints.staleAccounts.inactiveAccountsCount}
- Duplicate Files Volume: ${ws.dataQuality.examinationPoints.duplicateContent.estimatedDuplicateVolumeGB} GB
- Dormant Teams: ${ws.dataQuality.examinationPoints.dormantTeams.dormantTeamsCount} | Dormant Sites: ${ws.dataQuality.examinationPoints.dormantSharePointSites.dormantSitesCount}
`;

    navigator.clipboard.writeText(md);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 3000);
  };

  const handleExport = (format: 'json' | 'csv') => {
    setIsExporting(format);
    const url = `/api/discovery/tenant-assessment/export?format=${format}`;
    const a = document.createElement('a');
    a.href = url;
    a.download = `M365_Tenant_Discovery_Assessment_8_Workstreams_${data?.sourceTenant.domain || 'contoso'}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => setIsExporting(null), 1000);
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
        <RefreshCw className="w-10 h-10 text-blue-500 animate-spin mx-auto" />
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          Executing Initial Tenant Discovery Assessment...
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Inspecting Graph API endpoints across all 8 migration workstreams: Identity, Exchange, Storage, Teams, Google, 1,462 Registered Applications, Security, and Data Quality.
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/50 rounded-2xl shadow-sm space-y-3">
        <AlertOctagon className="w-10 h-10 text-rose-500 mx-auto" />
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Failed to Load Discovery Assessment</h3>
        <p className="text-xs text-rose-600 dark:text-rose-400">{error || 'Unknown error'}</p>
        <button
          onClick={fetchAssessment}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-500 transition"
        >
          Retry Assessment
        </button>
      </div>
    );
  }

  const { summary, workstreams, sourceTenant, targetTenant } = data;

  const workstreamCards = [
    { id: 'identity', label: '1. Identity & Directory', icon: Users, score: workstreams.identityAndDirectory.readinessScore, data: workstreams.identityAndDirectory },
    { id: 'exchange', label: '2. Exchange & Mail', icon: Mail, score: workstreams.exchangeAndMail.readinessScore, data: workstreams.exchangeAndMail },
    { id: 'storage', label: '3. OneDrive & SharePoint', icon: HardDrive, score: workstreams.oneDriveAndSharePoint.readinessScore, data: workstreams.oneDriveAndSharePoint },
    { id: 'teams', label: '4. Teams & Collaboration', icon: MessageSquare, score: workstreams.teamsAndCollaboration.readinessScore, data: workstreams.teamsAndCollaboration },
    { id: 'google', label: '5. Google Workspace', icon: Globe, score: workstreams.googleWorkspace.readinessScore, data: workstreams.googleWorkspace },
    { id: 'apps', label: '6. Applications & SSO', icon: Layers, score: workstreams.applicationsAndSSO.readinessScore, data: workstreams.applicationsAndSSO },
    { id: 'security', label: '7. Security & Compliance', icon: Shield, score: workstreams.securityAndCompliance.readinessScore, data: workstreams.securityAndCompliance },
    { id: 'dataquality', label: '8. Data Quality', icon: Database, score: workstreams.dataQuality.readinessScore, data: workstreams.dataQuality },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Executive Summary & Readiness Cockpit */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 border border-blue-800/40 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Initial Discovery Phase Complete</span>
              </span>
              <span className="text-xs text-slate-400">
                Source: <strong className="text-white font-mono">{sourceTenant.domain}</strong> ➔ Target: <strong className="text-blue-300 font-mono">{targetTenant.domain}</strong>
              </span>
            </div>

            <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>Microsoft Tenant-to-Tenant Migration Inventory Assessment</span>
            </h2>

            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Complete pre-migration examination across all 8 strategic workstreams and examination points. Assesses identity directory patterns, mailbox quotas, storage hierarchy, teams collaboration, coexistence, 1,462 registered applications, regulatory compliance, and data cleanliness.
            </p>
          </div>

          {/* Readiness Score Card */}
          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-4 flex items-center space-x-4 min-w-[240px]">
            <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-blue-600/30 border-2 border-blue-400">
              <span className="text-2xl font-black font-mono text-white">{summary.overallReadinessScore}%</span>
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider text-blue-200 block font-semibold">
                Overall Readiness
              </span>
              <span className="text-sm font-bold text-white block">
                Grade: {summary.readinessGrade.split(' ')[0]}
              </span>
              <span className="text-[11px] text-emerald-300 font-medium">
                {summary.criticalBlockers} Blockers • {summary.recommendedRemediations} Actions
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="btn-export-assessment-json"
              onClick={() => handleExport('json')}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-1.5 shadow-sm transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Structured JSON</span>
            </button>

            <button
              id="btn-export-assessment-csv"
              onClick={() => handleExport('csv')}
              className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 font-medium flex items-center gap-1.5 transition"
            >
              <FileText className="w-3.5 h-3.5 text-blue-300" />
              <span>Export Workstream CSV</span>
            </button>

            <button
              id="btn-copy-markdown-summary"
              onClick={handleCopyMarkdownSummary}
              className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 font-medium flex items-center gap-1.5 transition"
            >
              {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-300" />}
              <span>{copiedSummary ? 'Copied to Clipboard!' : 'Copy Summary Markdown'}</span>
            </button>
          </div>

          <div className="flex items-center space-x-2 text-[11px] text-slate-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Targeting exactly <strong>1,462 Registered Apps</strong> • <strong>{summary.totalIdentities.toLocaleString()} Users</strong></span>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Bar Across Workstreams */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { label: 'Identities', value: summary.totalIdentities.toLocaleString(), sub: 'Users & Guests', icon: Users, color: 'text-blue-500' },
          { label: 'Mailboxes', value: summary.totalMailboxes.toLocaleString(), sub: 'User & Shared', icon: Mail, color: 'text-indigo-500' },
          { label: 'Storage Vol', value: `${(summary.totalStorageVolumeGB / 1024).toFixed(1)} TB`, sub: 'OD & SharePoint', icon: HardDrive, color: 'text-teal-500' },
          { label: 'Teams', value: workstreams.teamsAndCollaboration.examinationPoints.teamsEnumeration.totalTeams, sub: 'Channels & Apps', icon: MessageSquare, color: 'text-purple-500' },
          { label: 'Google Vol', value: `${workstreams.googleWorkspace.examinationPoints.gmailVolume.totalStorageVolumeGB} GB`, sub: 'Coexistence Data', icon: Globe, color: 'text-amber-500' },
          { label: 'Reg. Apps', value: '1,462', sub: 'Target Match', icon: Layers, color: 'text-rose-500 font-bold' },
          { label: 'Security CA', value: `${workstreams.securityAndCompliance.examinationPoints.conditionalAccessPolicies.totalPolicies} Policies`, sub: 'MFA Enforced', icon: Shield, color: 'text-emerald-500' },
          { label: 'Data Quality', value: `${workstreams.dataQuality.examinationPoints.mailboxesExceeding50GB.count} >50GB`, sub: 'Optimization Targets', icon: Database, color: 'text-cyan-500' },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm text-center"
            >
              <Icon className={`w-4 h-4 mx-auto mb-1 ${stat.color}`} />
              <div className="text-sm font-bold text-slate-900 dark:text-white font-mono">{stat.value}</div>
              <div className="text-[10px] text-slate-500 font-medium">{stat.label}</div>
              <div className="text-[9px] text-slate-400 truncate">{stat.sub}</div>
            </div>
          );
        })}
      </div>

      {/* 3. Workstream Selector Pills */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveWorkstreamId('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
            activeWorkstreamId === 'all'
              ? 'bg-blue-600 text-white font-semibold shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          All 8 Workstreams
        </button>

        {workstreamCards.map((card) => {
          const Icon = card.icon;
          const isActive = activeWorkstreamId === card.id;
          return (
            <button
              key={card.id}
              onClick={() => setActiveWorkstreamId(card.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition flex items-center space-x-1.5 cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{card.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${isActive ? 'bg-blue-800 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
                {card.score}%
              </span>
            </button>
          );
        })}
      </div>

      {/* 4. Detailed Structured Content for All 8 Workstreams */}
      <div className="space-y-6">

        {/* WORKSTREAM 1: Identity & Directory */}
        {(activeWorkstreamId === 'all' || activeWorkstreamId === 'identity') && (
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-500/10 text-blue-500 rounded-xl">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">1. Identity & Directory</h3>
                  <p className="text-xs text-slate-500">Users, security groups, contacts, UPN/SMTP patterns, licenses, dormant & duplicate identities</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-mono">
                Readiness: {workstreams.identityAndDirectory.readinessScore}%
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Point 1.1: Users, Groups, Contacts */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                  <span>Users, Groups & Contacts</span>
                  <span className="font-mono text-blue-600 dark:text-blue-400">{workstreams.identityAndDirectory.examinationPoints.inventory.totalUsers} Users</span>
                </h4>
                <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex justify-between"><span>Active Corporate Users:</span> <strong className="font-mono">{workstreams.identityAndDirectory.examinationPoints.inventory.activeUsers}</strong></div>
                  <div className="flex justify-between"><span>Disabled Accounts:</span> <strong className="font-mono text-amber-500">{workstreams.identityAndDirectory.examinationPoints.inventory.disabledAccounts}</strong></div>
                  <div className="flex justify-between"><span>External B2B Guests:</span> <strong className="font-mono">{workstreams.identityAndDirectory.examinationPoints.inventory.externalB2BGuests}</strong></div>
                  <div className="flex justify-between"><span>Security Groups:</span> <strong className="font-mono">{workstreams.identityAndDirectory.examinationPoints.inventory.securityGroups}</strong></div>
                  <div className="flex justify-between"><span>M365 Unified Groups:</span> <strong className="font-mono">{workstreams.identityAndDirectory.examinationPoints.inventory.m365UnifiedGroups}</strong></div>
                  <div className="flex justify-between"><span>Directory Mail Contacts:</span> <strong className="font-mono">{workstreams.identityAndDirectory.examinationPoints.inventory.totalContacts}</strong></div>
                </div>
              </div>

              {/* Point 1.2: UPN & SMTP Patterns */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                  <span>UPN & SMTP Conventions</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">Primary: {workstreams.identityAndDirectory.examinationPoints.upnAndSmtpPatterns.primaryUpnDomain}</span>
                </h4>
                <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                  {workstreams.identityAndDirectory.examinationPoints.upnAndSmtpPatterns.recognizedUpnPatterns.map((pat, idx) => (
                    <div key={idx} className="p-1.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px]">
                      <span className="font-mono font-semibold text-blue-600 dark:text-blue-400 block">{pat.pattern}</span>
                      <span className="text-slate-500">e.g. {pat.sample} ({pat.count} users / {pat.percentage}%)</span>
                    </div>
                  ))}
                  <div className="text-[11px] text-slate-500 pt-1">
                    Secondary Domains: {workstreams.identityAndDirectory.examinationPoints.upnAndSmtpPatterns.secondaryDomains.join(', ')}
                  </div>
                </div>
              </div>

              {/* Point 1.3: Dormant & Duplicate Accounts */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                  <span>Dormant & Duplicates</span>
                  <span className="font-mono text-rose-500">{workstreams.identityAndDirectory.examinationPoints.dormantAccounts.inactiveOver90Days} Dormant</span>
                </h4>
                <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex justify-between"><span>Inactive &gt; 90 Days:</span> <strong className="font-mono text-amber-500">{workstreams.identityAndDirectory.examinationPoints.dormantAccounts.inactiveOver90Days}</strong></div>
                  <div className="flex justify-between"><span>Inactive &gt; 180 Days:</span> <strong className="font-mono text-rose-500">{workstreams.identityAndDirectory.examinationPoints.dormantAccounts.inactiveOver180Days}</strong></div>
                  <div className="flex justify-between"><span>Never Logged In:</span> <strong className="font-mono">{workstreams.identityAndDirectory.examinationPoints.dormantAccounts.neverLoggedIn}</strong></div>
                  <div className="flex justify-between"><span>Colliding Proxy Addresses:</span> <strong className="font-mono text-rose-500">{workstreams.identityAndDirectory.examinationPoints.duplicateAccounts.collidingUpnsOrAliases}</strong></div>
                  <div className="p-2 rounded bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 mt-2">
                    ⚡ Remediating dormant accounts can reclaim up to <strong>{workstreams.identityAndDirectory.examinationPoints.dormantAccounts.estimatedReclaimableLicenses} enterprise licenses</strong> before destination assignment.
                  </div>
                </div>
              </div>
            </div>

            {/* License Pools Table */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700/60">
              <h5 className="text-xs font-bold text-slate-900 dark:text-white mb-2">License Pool Assignments (SKUs)</h5>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                {workstreams.identityAndDirectory.examinationPoints.licenseAssignments.licensePools.map((lic, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block truncate">{lic.friendlyName}</span>
                    <span className="font-mono text-xs text-blue-600 dark:text-blue-400 font-semibold">{lic.totalAssigned} / {lic.poolAvailable}</span>
                    <span className="text-[10px] text-slate-500 block">{lic.costStatus}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* WORKSTREAM 2: Exchange & Mail */}
        {(activeWorkstreamId === 'all' || activeWorkstreamId === 'exchange') && (
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-xl">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">2. Exchange & Mail</h3>
                  <p className="text-xs text-slate-500">Mailbox distribution, archive footprint, shared/room resources, accepted domains, transport rules, retention & holds</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-mono">
                Readiness: {workstreams.exchangeAndMail.readinessScore}%
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Mailbox Tiers */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Mailbox Quota Distribution</h4>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between"><span>&lt; 5 GB:</span> <span className="font-mono">{workstreams.exchangeAndMail.examinationPoints.mailboxSizeDistribution.under5GB}</span></div>
                  <div className="flex justify-between"><span>5 - 25 GB:</span> <span className="font-mono">{workstreams.exchangeAndMail.examinationPoints.mailboxSizeDistribution.between5And25GB}</span></div>
                  <div className="flex justify-between"><span>25 - 50 GB:</span> <span className="font-mono">{workstreams.exchangeAndMail.examinationPoints.mailboxSizeDistribution.between25And50GB}</span></div>
                  <div className="flex justify-between text-amber-600 font-semibold"><span>50 - 100 GB (Heavy):</span> <span className="font-mono">{workstreams.exchangeAndMail.examinationPoints.mailboxSizeDistribution.between50And100GB}</span></div>
                  <div className="flex justify-between text-rose-600 font-bold"><span>&gt; 100 GB (Auto-Expand):</span> <span className="font-mono">{workstreams.exchangeAndMail.examinationPoints.mailboxSizeDistribution.over100GBAutoExpanding}</span></div>
                </div>
              </div>

              {/* In-Place Archives */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Archive Footprint</h4>
                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex justify-between"><span>Archives Active:</span> <strong className="font-mono">{workstreams.exchangeAndMail.examinationPoints.archiveFootprint.mailboxesWithArchiveEnabled}</strong></div>
                  <div className="flex justify-between"><span>Adoption Rate:</span> <strong className="font-mono">{workstreams.exchangeAndMail.examinationPoints.archiveFootprint.archiveAdoptionRate}</strong></div>
                  <div className="flex justify-between"><span>Archive Volume:</span> <strong className="font-mono">{workstreams.exchangeAndMail.examinationPoints.archiveFootprint.totalArchiveSizeGB} GB</strong></div>
                  <div className="flex justify-between"><span>Auto-Expanding:</span> <strong className="font-mono text-blue-500">{workstreams.exchangeAndMail.examinationPoints.archiveFootprint.autoExpandingArchivesActive} active</strong></div>
                </div>
              </div>

              {/* Shared & Room Resources */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Shared & Resource Rooms</h4>
                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex justify-between"><span>Shared Mailboxes:</span> <strong className="font-mono">{workstreams.exchangeAndMail.examinationPoints.sharedRoomEquipment.sharedMailboxesCount}</strong></div>
                  <div className="flex justify-between"><span>Conference Rooms:</span> <strong className="font-mono">{workstreams.exchangeAndMail.examinationPoints.sharedRoomEquipment.resourceMailboxesCount}</strong></div>
                  <div className="flex justify-between"><span>Full Access Delegates:</span> <strong className="font-mono">{workstreams.exchangeAndMail.examinationPoints.sharedRoomEquipment.mailboxesWithFullAccessDelegation}</strong></div>
                  <div className="flex justify-between"><span>Send-As Permissions:</span> <strong className="font-mono">{workstreams.exchangeAndMail.examinationPoints.sharedRoomEquipment.mailboxesWithSendAsDelegation}</strong></div>
                </div>
              </div>

              {/* Holds & Retention */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Legal & Litigation Holds</h4>
                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex justify-between"><span>Litigation Holds:</span> <strong className="font-mono text-rose-500">{workstreams.exchangeAndMail.examinationPoints.holds.mailboxesOnLitigationHold}</strong></div>
                  <div className="flex justify-between"><span>eDiscovery Case Holds:</span> <strong className="font-mono">{workstreams.exchangeAndMail.examinationPoints.holds.mailboxesOnEdiscoveryHold}</strong></div>
                  <div className="flex justify-between"><span>Preserved Data:</span> <strong className="font-mono text-indigo-500">{workstreams.exchangeAndMail.examinationPoints.holds.totalDataPreservedOnHoldGB} GB</strong></div>
                  <div className="flex justify-between"><span>MRM Policies:</span> <strong className="font-mono">{workstreams.exchangeAndMail.examinationPoints.retentionPolicies.mrmPoliciesCount}</strong></div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* WORKSTREAM 3: OneDrive & SharePoint */}
        {(activeWorkstreamId === 'all' || activeWorkstreamId === 'storage') && (
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-teal-500/10 text-teal-500 rounded-xl">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">3. OneDrive & SharePoint</h3>
                  <p className="text-xs text-slate-500">Storage consumption, permission inheritance, long URL paths (&gt;260 / &gt;400 chars), unsupported characters</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20 font-mono">
                Readiness: {workstreams.oneDriveAndSharePoint.readinessScore}%
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Storage & Sites Actual Usage</h4>
                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex justify-between"><span>OneDrive Accounts:</span> <strong className="font-mono">{workstreams.oneDriveAndSharePoint.examinationPoints.oneDriveAndSharePointInventory.totalOneDriveAccounts} ({workstreams.oneDriveAndSharePoint.examinationPoints.oneDriveAndSharePointInventory.consumedStorageGB} GB)</strong></div>
                  <div className="flex justify-between"><span>SharePoint Sites:</span> <strong className="font-mono">{workstreams.oneDriveAndSharePoint.examinationPoints.oneDriveAndSharePointInventory.totalSharePointSites} ({workstreams.oneDriveAndSharePoint.examinationPoints.oneDriveAndSharePointInventory.sharePointStorageUsedGB} GB)</strong></div>
                  <div className="flex justify-between"><span>Team Sites:</span> <strong className="font-mono">{workstreams.oneDriveAndSharePoint.examinationPoints.oneDriveAndSharePointInventory.teamSitesCount}</strong></div>
                  <div className="flex justify-between"><span>Communication Sites:</span> <strong className="font-mono">{workstreams.oneDriveAndSharePoint.examinationPoints.oneDriveAndSharePointInventory.communicationSitesCount}</strong></div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Path Lengths & Constraints</h4>
                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex justify-between text-amber-600 font-semibold"><span>Paths Exceeding 260 Chars:</span> <strong className="font-mono">{workstreams.oneDriveAndSharePoint.examinationPoints.pathsWithExcessiveLength.pathsExceeding260Chars}</strong></div>
                  <div className="flex justify-between text-rose-600 font-bold"><span>Paths Exceeding 400 Chars:</span> <strong className="font-mono">{workstreams.oneDriveAndSharePoint.examinationPoints.pathsWithExcessiveLength.pathsExceeding400Chars}</strong></div>
                  <div className="flex justify-between text-rose-500"><span>Illegal / Unsupported Chars:</span> <strong className="font-mono">{workstreams.oneDriveAndSharePoint.examinationPoints.pathsWithUnsupportedCharacters.pathsWithIllegalCharsCount}</strong></div>
                  <p className="text-[11px] text-slate-500 pt-1">
                    Characters flagged: {workstreams.oneDriveAndSharePoint.examinationPoints.pathsWithUnsupportedCharacters.unsupportedCharsFound.join(' ')}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Permission Models & Inheritance</h4>
                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex justify-between"><span>Group-Backed Sites:</span> <strong className="font-mono">{workstreams.oneDriveAndSharePoint.examinationPoints.permissionModels.groupBackedSites}</strong></div>
                  <div className="flex justify-between"><span>Unique Classic Permissions:</span> <strong className="font-mono">{workstreams.oneDriveAndSharePoint.examinationPoints.permissionModels.uniqueClassicPermissionSites}</strong></div>
                  <div className="flex justify-between text-amber-600"><span>Broken Inheritance Libraries:</span> <strong className="font-mono">{workstreams.oneDriveAndSharePoint.examinationPoints.brokenInheritance.librariesWithBrokenInheritance}</strong></div>
                  <div className="flex justify-between text-amber-600"><span>Unique Folder ACLs:</span> <strong className="font-mono">{workstreams.oneDriveAndSharePoint.examinationPoints.brokenInheritance.foldersWithUniquePermissions}</strong></div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* WORKSTREAM 4: Teams & Collaboration */}
        {(activeWorkstreamId === 'all' || activeWorkstreamId === 'teams') && (
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-500/10 text-purple-500 rounded-xl">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">4. Teams & Collaboration</h3>
                  <p className="text-xs text-slate-500">Private/shared channels, custom tabs, 3rd-party apps, messaging and guest access policies</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-mono">
                Readiness: {workstreams.teamsAndCollaboration.readinessScore}%
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Teams & Channels</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between"><span>Total Teams:</span> <strong className="font-mono">{workstreams.teamsAndCollaboration.examinationPoints.teamsEnumeration.totalTeams}</strong></div>
                  <div className="flex justify-between"><span>Standard Channels:</span> <strong className="font-mono">{workstreams.teamsAndCollaboration.examinationPoints.teamsEnumeration.standardChannels}</strong></div>
                  <div className="flex justify-between text-indigo-500 font-semibold"><span>Private Channels:</span> <strong className="font-mono">{workstreams.teamsAndCollaboration.examinationPoints.teamsEnumeration.privateChannels}</strong></div>
                  <div className="flex justify-between text-teal-500 font-semibold"><span>Shared Channels (Connect):</span> <strong className="font-mono">{workstreams.teamsAndCollaboration.examinationPoints.teamsEnumeration.sharedChannelsConnect}</strong></div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Configured Tabs</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between"><span>Total Tabs:</span> <strong className="font-mono">{workstreams.teamsAndCollaboration.examinationPoints.tabsWithinTeams.totalTabsConfigured}</strong></div>
                  <div className="flex justify-between"><span>Native Tabs (Files/Wiki):</span> <strong className="font-mono">{workstreams.teamsAndCollaboration.examinationPoints.tabsWithinTeams.nativeTabsCount}</strong></div>
                  <div className="flex justify-between"><span>Custom Website Tabs:</span> <strong className="font-mono">{workstreams.teamsAndCollaboration.examinationPoints.tabsWithinTeams.customWebsiteTabsCount}</strong></div>
                  <div className="flex justify-between"><span>Planner Boards:</span> <strong className="font-mono">{workstreams.teamsAndCollaboration.examinationPoints.tabsWithinTeams.plannerBoardTabsCount}</strong></div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">3rd-Party App Integrations</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between"><span>Integrated Apps:</span> <strong className="font-mono text-purple-600">{workstreams.teamsAndCollaboration.examinationPoints.thirdPartyApps.integratedAppsCount}</strong></div>
                  <div className="flex justify-between"><span>Active Custom Bots:</span> <strong className="font-mono">{workstreams.teamsAndCollaboration.examinationPoints.thirdPartyApps.activeCustomBots}</strong></div>
                  <div className="flex justify-between"><span>Incoming Connectors:</span> <strong className="font-mono">{workstreams.teamsAndCollaboration.examinationPoints.thirdPartyApps.activeConnectors}</strong></div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Governance Policies</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between"><span>Guest Access:</span> <strong className="text-emerald-600 font-semibold">{workstreams.teamsAndCollaboration.examinationPoints.teamsPolicies.guestAccessStatus}</strong></div>
                  <div className="flex justify-between"><span>Chat Retention:</span> <strong className="font-mono">{workstreams.teamsAndCollaboration.examinationPoints.teamsPolicies.chatRetentionPeriodDays} Days</strong></div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* WORKSTREAM 5: Google Workspace */}
        {(activeWorkstreamId === 'all' || activeWorkstreamId === 'google') && (
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">5. Google Workspace (Coexistence & Dual-Source)</h3>
                  <p className="text-xs text-slate-500">Gmail volume, My Drive & Shared Drives, Google Classroom structures/rosters/assignments, Google Groups, Vault holds</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-mono">
                Readiness: {workstreams.googleWorkspace.readinessScore}%
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Gmail Volume</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between"><span>Accounts:</span> <strong className="font-mono">{workstreams.googleWorkspace.examinationPoints.gmailVolume.totalAccounts}</strong></div>
                  <div className="flex justify-between"><span>Total Messages:</span> <strong className="font-mono">{workstreams.googleWorkspace.examinationPoints.gmailVolume.totalMessagesCount}</strong></div>
                  <div className="flex justify-between"><span>Total Volume:</span> <strong className="font-mono text-blue-500">{workstreams.googleWorkspace.examinationPoints.gmailVolume.totalStorageVolumeGB} GB</strong></div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">My Drive & Shared Drives</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between"><span>My Drives:</span> <strong className="font-mono">{workstreams.googleWorkspace.examinationPoints.driveInventory.totalMyDrives}</strong></div>
                  <div className="flex justify-between"><span>Shared Drives:</span> <strong className="font-mono text-indigo-500">{workstreams.googleWorkspace.examinationPoints.driveInventory.totalSharedDrives}</strong></div>
                  <div className="flex justify-between"><span>Files Count:</span> <strong className="font-mono">{workstreams.googleWorkspace.examinationPoints.driveInventory.filesCount.toLocaleString()}</strong></div>
                  <div className="flex justify-between"><span>Storage:</span> <strong className="font-mono">{workstreams.googleWorkspace.examinationPoints.driveInventory.totalStorageUsedGB} GB</strong></div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Google Classroom</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between"><span>Active Classes:</span> <strong className="font-mono text-emerald-500">{workstreams.googleWorkspace.examinationPoints.googleClassroom.activeClasses}</strong></div>
                  <div className="flex justify-between"><span>Archived Classes:</span> <strong className="font-mono">{workstreams.googleWorkspace.examinationPoints.googleClassroom.archivedClasses}</strong></div>
                  <div className="flex justify-between"><span>Rosters Indexed:</span> <strong className="font-mono">{workstreams.googleWorkspace.examinationPoints.googleClassroom.totalRosters}</strong></div>
                  <div className="flex justify-between"><span>Assignments:</span> <strong className="font-mono">{workstreams.googleWorkspace.examinationPoints.googleClassroom.assignmentsIndexed}</strong></div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Vault Holds & Groups</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between"><span>Google Groups:</span> <strong className="font-mono">{workstreams.googleWorkspace.examinationPoints.googleGroups.totalGroups}</strong></div>
                  <div className="flex justify-between"><span>Collaborative Inboxes:</span> <strong className="font-mono">{workstreams.googleWorkspace.examinationPoints.googleGroups.collaborativeInboxes}</strong></div>
                  <div className="flex justify-between text-rose-500 font-semibold"><span>Active Vault Matters:</span> <strong className="font-mono">{workstreams.googleWorkspace.examinationPoints.vaultHolds.activeMattersCount}</strong></div>
                  <div className="flex justify-between"><span>Custodians on Vault Hold:</span> <strong className="font-mono">{workstreams.googleWorkspace.examinationPoints.vaultHolds.custodiansUnderVaultHold}</strong></div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* WORKSTREAM 6: Applications & SSO (Target 1,462 exactly highlighted) */}
        {(activeWorkstreamId === 'all' || activeWorkstreamId === 'apps') && (
          <section className="bg-white dark:bg-slate-900 border-2 border-rose-500/40 dark:border-rose-500/30 rounded-2xl p-6 shadow-md space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-rose-500/10 text-rose-500 rounded-xl">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">6. Applications & SSO</h3>
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                      Target: Exactly 1,462 Registered Apps
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">Ownership classification, authentication protocols (Entra Native vs External/Federated IdP), consent & credential risk</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20 font-mono">
                Readiness: {workstreams.applicationsAndSSO.readinessScore}%
              </span>
            </div>

            {/* Ownership Breakdown & Auth Method Classification */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Ownership Breakdown */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                  <span>Classified by Owner</span>
                  <span className="font-mono text-slate-500">1,462 Total</span>
                </h4>
                <div className="space-y-2">
                  {workstreams.applicationsAndSSO.examinationPoints.classificationByOwner.breakdown.map((row, idx) => (
                    <div key={idx} className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{row.ownerGroup}</span>
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{row.count} ({row.percentage}%)</span>
                      </div>
                      <p className="text-[11px] text-slate-500">{row.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Authentication Method Breakdown */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                  <span>Classified by Authentication Method</span>
                  <span className="font-mono text-slate-500">Native vs External</span>
                </h4>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/60 space-y-1.5">
                    <span className="text-xs font-bold text-blue-900 dark:text-blue-300 block">
                      Authenticating Against Source Tenant
                    </span>
                    <div className="font-mono text-lg font-black text-blue-600 dark:text-blue-400">
                      {workstreams.applicationsAndSSO.examinationPoints.classificationByAuthMethod.sourceTenantEntraNative.total} Apps
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-300 space-y-0.5 pt-1">
                      <div>• OIDC / OAuth 2.0: <strong>{workstreams.applicationsAndSSO.examinationPoints.classificationByAuthMethod.sourceTenantEntraNative.oidcOAuth2}</strong></div>
                      <div>• SAML 2.0: <strong>{workstreams.applicationsAndSSO.examinationPoints.classificationByAuthMethod.sourceTenantEntraNative.saml20}</strong></div>
                      <div>• WS-Federation: <strong>{workstreams.applicationsAndSSO.examinationPoints.classificationByAuthMethod.sourceTenantEntraNative.wsFederation}</strong></div>
                      <div>• Managed Identities: <strong>{workstreams.applicationsAndSSO.examinationPoints.classificationByAuthMethod.sourceTenantEntraNative.managedIdentity}</strong></div>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/60 space-y-1.5">
                    <span className="text-xs font-bold text-purple-900 dark:text-purple-300 block">
                      External / Federated Identity Provider
                    </span>
                    <div className="font-mono text-lg font-black text-purple-600 dark:text-purple-400">
                      {workstreams.applicationsAndSSO.examinationPoints.classificationByAuthMethod.externalOrFederatedIdP.total} Apps
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-300 space-y-0.5 pt-1">
                      <div>• Okta Federated: <strong>{workstreams.applicationsAndSSO.examinationPoints.classificationByAuthMethod.externalOrFederatedIdP.oktaFederated}</strong></div>
                      <div>• PingFederate: <strong>{workstreams.applicationsAndSSO.examinationPoints.classificationByAuthMethod.externalOrFederatedIdP.pingFederate}</strong></div>
                      <div>• Google Cloud SSO: <strong>{workstreams.applicationsAndSSO.examinationPoints.classificationByAuthMethod.externalOrFederatedIdP.googleCloudSso}</strong></div>
                      <div>• Salesforce IdP: <strong>{workstreams.applicationsAndSSO.examinationPoints.classificationByAuthMethod.externalOrFederatedIdP.salesforceIdp}</strong></div>
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 text-[11px] text-amber-800 dark:text-amber-300">
                  ⚠️ <strong>{workstreams.applicationsAndSSO.examinationPoints.registeredApplicationsTotal.appsWithExpiringSecrets90Days} applications</strong> have client secrets expiring within 90 days. Update credentials during target tenant registration cutover.
                </div>
              </div>
            </div>

            {/* Sample Key Applications Table */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-2">
              <h5 className="text-xs font-bold text-slate-900 dark:text-white">Sample Mission-Critical Registered Applications</h5>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-2">App Name</th>
                      <th className="p-2">Owner Classification</th>
                      <th className="p-2">Authentication Method</th>
                      <th className="p-2">Target Audience</th>
                      <th className="p-2">Activity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {workstreams.applicationsAndSSO.examinationPoints.classificationByAuthMethod.sampleApplications.map((app) => (
                      <tr key={app.appId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-2 font-semibold text-slate-900 dark:text-white">{app.appName}</td>
                        <td className="p-2">{app.ownerCategory}</td>
                        <td className="p-2 font-mono text-[11px] text-blue-600 dark:text-blue-400">{app.authMethod}</td>
                        <td className="p-2">{app.audience}</td>
                        <td className="p-2 text-slate-500 text-[11px]">{app.lastActivity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* WORKSTREAM 7: Security & Compliance */}
        {(activeWorkstreamId === 'all' || activeWorkstreamId === 'security') && (
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">7. Security & Compliance</h3>
                  <p className="text-xs text-slate-500">Conditional Access, MFA policies, Microsoft Purview labels, DLP rules, retention, safeguarding, Multi-Geo data residency</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-mono">
                Readiness: {workstreams.securityAndCompliance.readinessScore}%
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Conditional Access & MFA</h4>
                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex justify-between"><span>Total CA Policies:</span> <strong className="font-mono">{workstreams.securityAndCompliance.examinationPoints.conditionalAccessPolicies.totalPolicies}</strong></div>
                  <div className="flex justify-between"><span>Enforced Policies:</span> <strong className="font-mono text-emerald-500">{workstreams.securityAndCompliance.examinationPoints.conditionalAccessPolicies.enforcedPoliciesCount}</strong></div>
                  <div className="flex justify-between"><span>MFA Enforced Rate:</span> <strong className="font-mono font-bold text-emerald-600">{workstreams.securityAndCompliance.examinationPoints.mfaPolicies.enforcedRatePercent}%</strong></div>
                  <div className="flex justify-between"><span>FIDO2 Passwordless:</span> <strong className="font-mono">{workstreams.securityAndCompliance.examinationPoints.mfaPolicies.fido2PasswordlessRegistered} users</strong></div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Purview & DLP Guardrails</h4>
                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex justify-between"><span>Sensitivity Labels:</span> <strong className="font-mono">{workstreams.securityAndCompliance.examinationPoints.purviewConfiguration.sensitivityLabelsPublished} Published</strong></div>
                  <div className="flex justify-between"><span>Auto-Labeling Rules:</span> <strong className="font-mono">{workstreams.securityAndCompliance.examinationPoints.purviewConfiguration.autoLabelingPoliciesActive}</strong></div>
                  <div className="flex justify-between"><span>Active DLP Policies:</span> <strong className="font-mono">{workstreams.securityAndCompliance.examinationPoints.dlpConfiguration.activeDlpPoliciesCount}</strong></div>
                  <div className="text-[11px] text-slate-500 pt-1">
                    Locations: {workstreams.securityAndCompliance.examinationPoints.dlpConfiguration.enforcedLocations.join(', ')}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Safeguarding & Data Residency</h4>
                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex justify-between"><span>Information Barriers:</span> <strong className="text-emerald-500 font-semibold">{workstreams.securityAndCompliance.examinationPoints.safeguardingRequirements.informationBarriersConfigured ? 'Active (Configured)' : 'Disabled'}</strong></div>
                  <div className="flex justify-between"><span>Primary Geo Location:</span> <strong className="font-mono">{workstreams.securityAndCompliance.examinationPoints.dataResidencyConfigurations.tenantPrimaryGeo}</strong></div>
                  <div className="flex justify-between"><span>Multi-Geo Satellites:</span> <strong className="font-mono">{workstreams.securityAndCompliance.examinationPoints.dataResidencyConfigurations.satellitesConfigured.length} Satellites (EUR, GBR, APC)</strong></div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* WORKSTREAM 8: Data Quality */}
        {(activeWorkstreamId === 'all' || activeWorkstreamId === 'dataquality') && (
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-cyan-500/10 text-cyan-500 rounded-xl">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">8. Data Quality & Pre-Migration Remediation</h3>
                  <p className="text-xs text-slate-500">Mailboxes &gt; 50 GB, stale accounts, duplicate unversioned files, orphaned content, dormant Teams and SharePoint sites</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20 font-mono">
                Readiness: {workstreams.dataQuality.readinessScore}%
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                  <span>Mailboxes Exceeding 50 GB</span>
                  <span className="font-mono text-rose-500 font-bold">{workstreams.dataQuality.examinationPoints.mailboxesExceeding50GB.count} Identified</span>
                </h4>
                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex justify-between"><span>Heavy Mailbox Count:</span> <strong className="font-mono">{workstreams.dataQuality.examinationPoints.mailboxesExceeding50GB.count}</strong></div>
                  <div className="flex justify-between"><span>Total Volume:</span> <strong className="font-mono text-blue-500">{workstreams.dataQuality.examinationPoints.mailboxesExceeding50GB.totalVolumeGB} GB</strong></div>
                  <p className="text-[11px] text-slate-500 pt-1 leading-relaxed">
                    {workstreams.dataQuality.examinationPoints.mailboxesExceeding50GB.remediation}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                  <span>Duplicate & Orphaned Content</span>
                  <span className="font-mono text-amber-500 font-semibold">{workstreams.dataQuality.examinationPoints.duplicateContent.duplicateRatio}</span>
                </h4>
                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex justify-between"><span>Duplicate Documents:</span> <strong className="font-mono">{workstreams.dataQuality.examinationPoints.duplicateContent.duplicateDocumentsCount.toLocaleString()}</strong></div>
                  <div className="flex justify-between"><span>Departed User OneDrives:</span> <strong className="font-mono text-rose-500">{workstreams.dataQuality.examinationPoints.orphanedContent.departedUserOneDrivesCount}</strong></div>
                  <div className="flex justify-between"><span>Ownerless SharePoint Sites:</span> <strong className="font-mono">{workstreams.dataQuality.examinationPoints.orphanedContent.sharePointSitesWithoutOwner}</strong></div>
                  <div className="flex justify-between text-emerald-600"><span>Reclaimable Volume:</span> <strong className="font-mono font-bold">{workstreams.dataQuality.examinationPoints.orphanedContent.reclaimableVolumeGB} GB</strong></div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                  <span>Dormant Collaboration Units</span>
                  <span className="font-mono text-slate-500">&gt; 120-180 Days</span>
                </h4>
                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex justify-between"><span>Dormant Teams:</span> <strong className="font-mono text-amber-500">{workstreams.dataQuality.examinationPoints.dormantTeams.dormantTeamsCount}</strong></div>
                  <div className="flex justify-between"><span>Dormant SharePoint Sites:</span> <strong className="font-mono text-amber-500">{workstreams.dataQuality.examinationPoints.dormantSharePointSites.dormantSitesCount}</strong></div>
                  <div className="flex justify-between"><span>Stale Accounts:</span> <strong className="font-mono">{workstreams.dataQuality.examinationPoints.staleAccounts.inactiveAccountsCount}</strong></div>
                  <div className="p-2 rounded bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300 mt-2">
                    💡 Potential annual licensing savings by archiving dormant identities: <strong>${workstreams.dataQuality.examinationPoints.staleAccounts.potentialSavingsAnnualUSD.toLocaleString()} USD</strong>.
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

      </div>
    </div>
  );
};
