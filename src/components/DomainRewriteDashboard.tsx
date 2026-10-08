import React, { useState, useMemo } from 'react';
import {
  Mail,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Server,
  Zap,
  Lock,
  Layers,
  Users,
  Search,
  Plus,
  Play,
  Copy,
  Check,
  ExternalLink,
  Info,
  Calendar,
  Settings,
  Activity,
  Download,
  Trash2,
  CheckCheck,
  Clock,
  Send,
  Sliders,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Filter,
} from 'lucide-react';
import { TenantStatusResponse, AdminRole } from '../types';

export interface DomainRewriteDashboardProps {
  tenantStatus?: TenantStatusResponse;
  currentRole?: AdminRole;
}

interface RewriteUserMapping {
  id: string;
  sourceUPN: string;
  targetBrandedAddress: string;
  displayName: string;
  status: 'ACTIVE' | 'PILOT' | 'PAUSED';
  department: string;
  rewriteOutbound: boolean;
  rewriteInbound: boolean;
  rewriteCalendarICS: boolean;
  lastRewrittenAt?: string;
  messagesCount: number;
}

const DEFAULT_MAPPINGS: RewriteUserMapping[] = [
  {
    id: 'rw-01',
    sourceUPN: 'alex.wilber@contoso.onmicrosoft.com',
    targetBrandedAddress: 'alex.wilber@fabrikam.com',
    displayName: 'Alex Wilber',
    status: 'ACTIVE',
    department: 'Executive Leadership',
    rewriteOutbound: true,
    rewriteInbound: true,
    rewriteCalendarICS: true,
    lastRewrittenAt: '2 mins ago',
    messagesCount: 148,
  },
  {
    id: 'rw-02',
    sourceUPN: 'adele.vance@contoso.onmicrosoft.com',
    targetBrandedAddress: 'adele.vance@fabrikam.com',
    displayName: 'Adele Vance',
    status: 'ACTIVE',
    department: 'Finance & Operations',
    rewriteOutbound: true,
    rewriteInbound: true,
    rewriteCalendarICS: true,
    lastRewrittenAt: '14 mins ago',
    messagesCount: 92,
  },
  {
    id: 'rw-03',
    sourceUPN: 'megan.bowen@contoso.onmicrosoft.com',
    targetBrandedAddress: 'megan.bowen@fabrikam.com',
    displayName: 'Megan Bowen',
    status: 'PILOT',
    department: 'Engineering & Technology',
    rewriteOutbound: true,
    rewriteInbound: true,
    rewriteCalendarICS: true,
    lastRewrittenAt: '1 hour ago',
    messagesCount: 45,
  },
  {
    id: 'rw-04',
    sourceUPN: 'diego.siciliani@contoso.onmicrosoft.com',
    targetBrandedAddress: 'diego.siciliani@fabrikam.com',
    displayName: 'Diego Siciliani',
    status: 'PILOT',
    department: 'Marketing & Brand',
    rewriteOutbound: true,
    rewriteInbound: true,
    rewriteCalendarICS: false,
    lastRewrittenAt: '3 hours ago',
    messagesCount: 31,
  },
  {
    id: 'rw-05',
    sourceUPN: 'patti.fernandez@contoso.onmicrosoft.com',
    targetBrandedAddress: 'patti.fernandez@fabrikam.com',
    displayName: 'Patti Fernandez',
    status: 'PAUSED',
    department: 'Legal & Compliance',
    rewriteOutbound: false,
    rewriteInbound: true,
    rewriteCalendarICS: false,
    lastRewrittenAt: 'Yesterday',
    messagesCount: 12,
  },
];

export const DomainRewriteDashboard: React.FC<DomainRewriteDashboardProps> = ({
  tenantStatus,
  currentRole,
}) => {
  // Navigation & View tabs
  const [activeTab, setActiveTab] = useState<'steps' | 'directory' | 'connectors' | 'simulator'>('steps');
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Configuration Form State
  const [config, setConfig] = useState({
    // Step 1: Topology
    sourceTenant: tenantStatus?.source?.domain || 'contoso.onmicrosoft.com',
    targetTenant: tenantStatus?.target?.domain || 'fabrikam.com',
    brandedDomain: 'fabrikam.com',
    legacyDomain: 'contoso.com',
    direction: 'DAY_1_PRE_MIGRATION', // DAY_1_PRE_MIGRATION, DAY_2_POST_CUTOVER, BIDIRECTIONAL
    pilotGroupName: 'Domain-Rewrite-Pilot-Users',

    // Step 2: Connectors
    outboundConnectorName: 'T2T-DomainRewrite-Outbound',
    inboundConnectorName: 'T2T-DomainRewrite-Inbound',
    smartHostFqdn: 'smtp-rewrite.stream.m365corp.net',
    tlsRequirement: 'REQUIRE_TLS_1_3',
    certificateSubjectName: '*.stream.m365corp.net',
    partnerRoutingEnabled: true,

    // Step 3: Transport Rules
    ruleName: 'ETR-DomainRewrite-OutboundBranding',
    routeOnlyExternal: true,
    internalDomainBypass: true,
    addTrackingHeader: true,
    trackingHeaderName: 'X-M365-DomainRewrite-Processed',

    // Step 4: Transformations
    rewriteP1Envelope: true,
    rewriteP2HeaderFrom: true,
    rewriteReplyTo: true,
    preserveDisplayName: true,
    rewriteCalendarICS: true,
    rewriteMessageId: false,

    // Step 5: Anti-Spoofing & Auth
    spfRecordUpdated: true,
    dkimDualSigning: true,
    dkimSelector1: 'selector1-fabrikam-com._domainkey.fabrikam.com',
    dmarcAlignmentVerified: true,
    dmarcPolicy: 'REJECT', // NONE, QUARANTINE, REJECT

    // Step 6: Inbound Reply Reverse Address Remapping
    inboundReplyRoutingEnabled: true,
    targetForwardingMode: 'MAIL_ENABLED_CONTACTS', // MAIL_ENABLED_CONTACTS, INTERNAL_RELAY_SMARTHOST, GRAPH_REWRITE_PROXY
    targetRoutingAddressSuffix: 'contoso.mail.onmicrosoft.com',
    syncTargetContacts: true,
    preserveTargetMailboxRouting: true,

    // Step 7: Calendar Free/Busy & Organization Relationship
    organizationRelationshipEnabled: true,
    freeBusyAccessLevel: 'AvailabilityOnly', // AvailabilityOnly, LimitedDetails, Detailed
    targetAutodiscoverEpr: 'https://autodiscover.fabrikam.com/autodiscover/autodiscover.svc/wssecurity',
    targetSharingEpr: 'https://outlook.office365.com/EWS/Exchange.asmx/WSSecurity',
    enableMailboxMoveCapabilities: true,

    // Step 8: Pilot Canary Scope & Verification
    canaryRecipient: 'canary-audit@partnerdomain.com',
    pilotUserCount: 15,
    stagedRolloutActive: true,
    canaryVerified: true,

    // Step 9: Live Cutover, Monitoring & Auto-Rollback
    liveActive: true,
    traceHeaderStamping: true,
    cutoverAutoDecommission: true,
    autoRollbackOnFailure: true,
    maxFailureRateThreshold: 1.5,
    autoEnforceSPF: true,
    enableMailLogging: true,
  });

  // Mappings State
  const [mappings, setMappings] = useState<RewriteUserMapping[]>(DEFAULT_MAPPINGS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PILOT' | 'PAUSED'>('ALL');
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    displayName: '',
    sourceUPN: '',
    targetBrandedAddress: '',
    department: 'General Operations',
  });

  // Simulator State
  const [testSender, setTestSender] = useState('alex.wilber@contoso.onmicrosoft.com');
  const [testRecipient, setTestRecipient] = useState('external-partner@clientfirm.com');
  const [testSubject, setTestSubject] = useState('Q4 Enterprise Partnership Agreement Review');
  const [testBody, setTestBody] = useState('Please review the attached contract proposal from our Fabrikam branding entity.');
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Copied helper
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Filtered Mappings
  const filteredMappings = useMemo(() => {
    return mappings.filter((m) => {
      const matchSearch =
        m.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.sourceUPN.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.targetBrandedAddress.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || m.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [mappings, searchQuery, statusFilter]);

  // Execute Simulated Rewrite Test
  const handleRunSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const mapped = mappings.find(
        (m) => m.sourceUPN.toLowerCase() === testSender.trim().toLowerCase()
      );
      const rewrittenFrom = mapped ? mapped.targetBrandedAddress : testSender.replace(/@.*$/, `@${config.brandedDomain}`);
      const displayName = mapped ? mapped.displayName : testSender.split('@')[0].replace('.', ' ');

      setSimulationResult({
        timestamp: new Date().toLocaleTimeString(),
        originalEnvelope: {
          mailFrom: testSender,
          rcptTo: testRecipient,
          p2From: `${displayName} <${testSender}>`,
          p2ReplyTo: testSender,
          dmarcDomain: testSender.split('@')[1],
          spfStatus: 'NEUTRAL (Unrewritten)',
          dkimSelector: 'none',
        },
        rewrittenEnvelope: {
          mailFrom: rewrittenFrom,
          rcptTo: testRecipient,
          p2From: `${displayName} <${rewrittenFrom}>`,
          p2ReplyTo: config.rewriteReplyTo ? rewrittenFrom : testSender,
          dmarcDomain: config.brandedDomain,
          spfStatus: 'PASS (SPF Aligned with rewrite smart host)',
          dkimSelector: 'selector1-fabrikam-com (2048-bit RSA Aligned)',
          dmarcResult: 'PASS (100% Strict DMARC Alignment)',
          calendarICSStatus: config.rewriteCalendarICS ? 'Rewritten (ORGANIZER matches branded UPN)' : 'Bypassed',
          trackingHeader: `${config.trackingHeaderName}: Handled-By-M365-Stream-Cluster-01`,
        },
        latencyMs: 44,
      });
      setIsSimulating(false);
    }, 600);
  };

  // Comprehensive Cross-Tenant Domain Rewrite Architecture Steps
  const STEPS = [
    { number: 1, title: 'Topology & Coexistence Scope', short: 'Topology' },
    { number: 2, title: 'Inbound & Outbound Connectors', short: 'Connectors' },
    { number: 3, title: 'Transport & Routing Rules', short: 'Transport' },
    { number: 4, title: 'Envelope, Header & ICS Rewriting', short: 'MIME Rules' },
    { number: 5, title: 'SPF, DKIM 2048 & DMARC Alignment', short: 'Anti-Spoof' },
    { number: 6, title: 'Inbound Reply Mapping & Forwarding', short: 'Inbound Reply' },
    { number: 7, title: 'Calendar Free/Busy & Org Sharing', short: 'Free/Busy' },
    { number: 8, title: 'Pilot Canary Scope & Verification', short: 'Canary Test' },
    { number: 9, title: 'Live Cutover & Auto-Rollback Controls', short: 'Live Cutover' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner & Telemetry Header */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                Email Address Rewriting
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Day-1 Brand Coexistence Active</span>
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-500" />
              <span>Domain Rewrite & Cross-Tenant Brand Sharing</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-3xl">
              Enable users to send and receive outbound emails as the unified target corporate brand (<strong>@{config.brandedDomain}</strong>) before their mailboxes are physically moved, while preserving SPF, DKIM dual-signing, DMARC alignment, and calendar invitations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              id="btn-switch-steps"
              onClick={() => setActiveTab('steps')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'steps'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>6-Step Architecture</span>
            </button>

            <button
              id="btn-switch-directory"
              onClick={() => setActiveTab('directory')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'directory'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Mapped Users ({mappings.length})</span>
            </button>

            <button
              id="btn-switch-simulator"
              onClick={() => setActiveTab('simulator')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'simulator'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Synthetic Tester</span>
            </button>
          </div>
        </div>

        {/* Live Operational Telemetry Bar */}
        <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
            <span className="text-[10px] text-slate-400 block font-medium">Vanity Brand Domain</span>
            <span className="font-bold text-slate-900 dark:text-white font-mono truncate block">@{config.brandedDomain}</span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
            <span className="text-[10px] text-slate-400 block font-medium">Outbound TLS Connector</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> TLS 1.3 Active
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
            <span className="text-[10px] text-slate-400 block font-medium">DKIM 2048 Signing</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> 100% Aligned
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
            <span className="text-[10px] text-slate-400 block font-medium">DMARC Policy Status</span>
            <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">p={config.dmarcPolicy.toLowerCase()}</span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
            <span className="text-[10px] text-slate-400 block font-medium">Calendar ICS Rewriting</span>
            <span className="font-bold text-purple-600 dark:text-purple-400">ORGANIZER Ready</span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
            <span className="text-[10px] text-slate-400 block font-medium">Rewrite Latency</span>
            <span className="font-bold text-teal-600 dark:text-teal-400 font-mono">~44ms average</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW A: 6-STEP DOMAIN REWRITE ARCHITECTURE WORKFLOW */}
      {/* ========================================================================= */}
      {activeTab === 'steps' && (
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
          {/* Step Progress Header */}
          <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
            <div className="flex items-center justify-between min-w-[650px]">
              {STEPS.map((s) => {
                const isCurrent = currentStep === s.number;
                const isPassed = currentStep > s.number;
                return (
                  <button
                    key={s.number}
                    onClick={() => setCurrentStep(s.number)}
                    className={`flex items-center space-x-2 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-500'
                        : isPassed
                        ? 'text-emerald-600 dark:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                    }`}
                  >
                    <span
                      className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        isCurrent
                          ? 'bg-white text-blue-600'
                          : isPassed
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                      }`}
                    >
                      {isPassed ? <Check className="w-3 h-3" /> : s.number}
                    </span>
                    <span>{s.short}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step Content */}
          <div className="p-6 space-y-6 text-xs">
            {/* STEP 1: TOPOLOGY & SCOPE */}
            {currentStep === 1 && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Server className="w-4 h-4 text-blue-500" />
                    <span>Step 1: Domain & Coexistence Topology Selection</span>
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                    Define the custom branding domain, tenant routing endpoints, and coexistence lifecycle phase.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                    <label className="block font-semibold text-slate-800 dark:text-slate-200">
                      Branded Custom Domain (Desired Outbound Vanity)
                    </label>
                    <input
                      type="text"
                      value={config.brandedDomain}
                      onChange={(e) => setConfig({ ...config, brandedDomain: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-slate-900 dark:text-white font-bold"
                    />
                    <p className="text-[11px] text-slate-500">
                      Emails sent by source pilot users will appear to outside recipients as <code>@ {config.brandedDomain}</code>.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                    <label className="block font-semibold text-slate-800 dark:text-slate-200">
                      Rewrite Lifecycle Direction
                    </label>
                    <select
                      value={config.direction}
                      onChange={(e) => setConfig({ ...config, direction: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white cursor-pointer font-medium"
                    >
                      <option value="DAY_1_PRE_MIGRATION">Day 1 Pre-Migration (Source users send as Target vanity brand)</option>
                      <option value="DAY_2_POST_CUTOVER">Day 2 Post-Cutover (Migrated users send/receive as legacy source brand)</option>
                      <option value="BIDIRECTIONAL">Bidirectional Coexistence (Full two-way substitution)</option>
                    </select>
                    <p className="text-[11px] text-slate-500">
                      Permits newly acquired subsidiary staff to instantly present the unified brand on Day 1.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2">
                    <label className="block font-semibold text-slate-800 dark:text-slate-200">Source Tenant Initial Routing Domain</label>
                    <input
                      type="text"
                      value={config.sourceTenant}
                      onChange={(e) => setConfig({ ...config, sourceTenant: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2">
                    <label className="block font-semibold text-slate-800 dark:text-slate-200">Pilot Security Group Scope</label>
                    <input
                      type="text"
                      value={config.pilotGroupName}
                      onChange={(e) => setConfig({ ...config, pilotGroupName: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: INBOUND & OUTBOUND CONNECTORS */}
            {currentStep === 2 && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span>Step 2: Inbound & Outbound Exchange Partner Connectors</span>
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                    Configure mandatory Partner Connectors in Exchange Online with mutual TLS 1.3 and certificate subject verification.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Outbound Connector */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white">Source Outbound Partner Connector</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        TLS Verified
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500">Connector Name:</span>
                      <input
                        type="text"
                        value={config.outboundConnectorName}
                        onChange={(e) => setConfig({ ...config, outboundConnectorName: e.target.value })}
                        className="w-full mt-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500">Dedicated Smart Host:</span>
                      <input
                        type="text"
                        value={config.smartHostFqdn}
                        onChange={(e) => setConfig({ ...config, smartHostFqdn: e.target.value })}
                        className="w-full mt-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500">Certificate Subject Match (TlsCertificateName):</span>
                      <input
                        type="text"
                        value={config.certificateSubjectName}
                        onChange={(e) => setConfig({ ...config, certificateSubjectName: e.target.value })}
                        className="w-full mt-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-purple-600 dark:text-purple-300"
                      />
                    </div>
                  </div>

                  {/* PowerShell Export Card */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-900 text-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold font-mono text-purple-400">PowerShell Cmdlets (Exchange Online)</span>
                      <button
                        onClick={() =>
                          handleCopy(
                            `New-OutboundConnector -Name "${config.outboundConnectorName}" -ConnectorType Partner -SmartHosts "${config.smartHostFqdn}" -TlsDomain "${config.certificateSubjectName}" -UseMxRecord $false -IsTransportRuleScoped $true`,
                            'ps-connectors'
                          )
                        }
                        className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition cursor-pointer"
                      >
                        {copiedKey === 'ps-connectors' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKey === 'ps-connectors' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <pre className="p-3 rounded-lg bg-black/60 font-mono text-[10px] text-emerald-400 overflow-x-auto whitespace-pre-wrap leading-relaxed">
{`# 1. Create Outbound Connector
New-OutboundConnector -Name "${config.outboundConnectorName}" \`
  -ConnectorType Partner \`
  -SmartHosts "${config.smartHostFqdn}" \`
  -TlsDomain "${config.certificateSubjectName}" \`
  -UseMxRecord $false \`
  -IsTransportRuleScoped $true

# 2. Create Target Inbound Connector
New-InboundConnector -Name "${config.inboundConnectorName}" \`
  -ConnectorType Partner \`
  -SenderDomains "${config.brandedDomain}" \`
  -RequireTls $true \`
  -TlsSenderCertificateName "${config.certificateSubjectName}"`}
                    </pre>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: TRANSPORT RULES */}
            {currentStep === 3 && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-purple-500" />
                    <span>Step 3: Exchange Transport & Mail Flow Routing Rules</span>
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                    Define conditional transport rules to route only pilot group members through the rewrite pipeline while bypassing internal intra-tenant mail.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                    <label className="block font-semibold text-slate-800 dark:text-slate-200">Transport Rule Configuration</label>
                    
                    <label className="flex items-start space-x-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.routeOnlyExternal}
                        onChange={(e) => setConfig({ ...config, routeOnlyExternal: e.target.checked })}
                        className="rounded text-blue-600 mt-0.5"
                      />
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-white">Route External Recipients Only</span>
                        <p className="text-[11px] text-slate-500">Internal company communications within the source tenant remain unchanged.</p>
                      </div>
                    </label>

                    <label className="flex items-start space-x-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.internalDomainBypass}
                        onChange={(e) => setConfig({ ...config, internalDomainBypass: e.target.checked })}
                        className="rounded text-blue-600 mt-0.5"
                      />
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-white">Bypass Cross-Tenant Migration Routing Traffic</span>
                        <p className="text-[11px] text-slate-500">Excludes direct cross-tenant coexistence forwarding rules from secondary rewriting loops.</p>
                      </div>
                    </label>

                    <label className="flex items-start space-x-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.addTrackingHeader}
                        onChange={(e) => setConfig({ ...config, addTrackingHeader: e.target.checked })}
                        className="rounded text-blue-600 mt-0.5"
                      />
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-white">Stamp Diagnostic Audit Header</span>
                        <p className="text-[11px] text-slate-500">Injects <code>{config.trackingHeaderName}</code> for complete message trace visibility.</p>
                      </div>
                    </label>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-900 text-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold font-mono text-purple-400">Exchange Online Transport Rule</span>
                      <button
                        onClick={() =>
                          handleCopy(
                            `New-TransportRule -Name "${config.ruleName}" -FromMemberOf "${config.pilotGroupName}" -SentToScope "NotInOrganization" -RouteMessageOutboundConnector "${config.outboundConnectorName}" -SetHeaderName "${config.trackingHeaderName}" -SetHeaderValue "Staged"`,
                            'ps-transport'
                          )
                        }
                        className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition cursor-pointer"
                      >
                        {copiedKey === 'ps-transport' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKey === 'ps-transport' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <pre className="p-3 rounded-lg bg-black/60 font-mono text-[10px] text-emerald-400 overflow-x-auto whitespace-pre-wrap leading-relaxed">
{`New-TransportRule -Name "${config.ruleName}" \`
  -FromMemberOf "${config.pilotGroupName}" \`
  -SentToScope "NotInOrganization" \`
  -ExceptIfRecipientAddressMatchesRegexPattern "@${config.sourceTenant.replace('.', '\\.')}$|@${config.targetTenant.replace('.', '\\.')}$" \`
  -RouteMessageOutboundConnector "${config.outboundConnectorName}" \`
  -SetHeaderName "${config.trackingHeaderName}" \`
  -SetHeaderValue "ActiveRewrite"`}
                    </pre>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: MIME & CALENDAR ICS REWRITING */}
            {currentStep === 4 && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-teal-500" />
                    <span>Step 4: Envelope, Header & Calendar ICS MIME Transformations</span>
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                    Configure deep MIME parsing parameters for RFC-5321 envelope, RFC-5322 header, and iCalendar meeting invitations.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                    <h4 className="font-semibold text-slate-900 dark:text-white">MIME Header Transformation Rules</h4>
                    
                    <label className="flex items-center space-x-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.rewriteP1Envelope}
                        onChange={(e) => setConfig({ ...config, rewriteP1Envelope: e.target.checked })}
                        className="rounded text-blue-600"
                      />
                      <span>Rewrite RFC-5321 Envelope (<code>MAIL FROM: &lt;user@{config.brandedDomain}&gt;</code>)</span>
                    </label>

                    <label className="flex items-center space-x-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.rewriteP2HeaderFrom}
                        onChange={(e) => setConfig({ ...config, rewriteP2HeaderFrom: e.target.checked })}
                        className="rounded text-blue-600"
                      />
                      <span>Rewrite RFC-5322 Message Header (<code>From: User &lt;user@{config.brandedDomain}&gt;</code>)</span>
                    </label>

                    <label className="flex items-center space-x-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.rewriteReplyTo}
                        onChange={(e) => setConfig({ ...config, rewriteReplyTo: e.target.checked })}
                        className="rounded text-blue-600"
                      />
                      <span>Rewrite <code>Reply-To</code> to match target branded address</span>
                    </label>

                    <label className="flex items-center space-x-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.preserveDisplayName}
                        onChange={(e) => setConfig({ ...config, preserveDisplayName: e.target.checked })}
                        className="rounded text-blue-600"
                      />
                      <span>Preserve original sender Friendly Display Name</span>
                    </label>
                  </div>

                  {/* Calendar ICS Deep Dive Card */}
                  <div className="p-4 rounded-xl border-2 border-teal-500/40 bg-teal-50/40 dark:bg-teal-950/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-teal-800 dark:text-teal-300 flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        <span>iCalendar (.ICS) MIME Stream Rewriting</span>
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                        High Priority
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                      When users send meeting invites, standard mail gateways only rewrite the email headers, leaving internal routing addresses inside the <code>text/calendar</code> payload. This breaks external meeting accepts, declines, and calendar updates.
                    </p>
                    <label className="flex items-center space-x-2.5 cursor-pointer font-semibold text-teal-900 dark:text-teal-200">
                      <input
                        type="checkbox"
                        checked={config.rewriteCalendarICS}
                        onChange={(e) => setConfig({ ...config, rewriteCalendarICS: e.target.checked })}
                        className="rounded text-teal-600 h-4 w-4"
                      />
                      <span>Rewrite <code>ORGANIZER:mailto:</code> and <code>ATTENDEE:mailto:</code> inside ICS attachments</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: SPF, DKIM 2048 & DMARC ALIGNMENT */}
            {currentStep === 5 && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>Step 5: Anti-Spoofing: SPF, DKIM 2048 & DMARC Alignment</span>
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                    Ensure rewritten outbound messages pass 100% SPF, DKIM, and DMARC alignment to avoid being quarantined as spoofed by external mail servers.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* SPF Record Card */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white">1. SPF Record</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        Valid
                      </span>
                    </div>
                    <p className="text-slate-500 text-[11px]">Include the rewrite cluster smart host in public DNS:</p>
                    <pre className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-[10px] text-blue-600 dark:text-blue-400 whitespace-pre-wrap">
v=spf1 include:spf.protection.outlook.com include:_spf.rewrite.stream.net ~all
                    </pre>
                  </div>

                  {/* DKIM Dual-Signing Card */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white">2. DKIM Dual-Signing</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        2048-Bit
                      </span>
                    </div>
                    <p className="text-slate-500 text-[11px]">Dual-sign rewritten messages with target vanity key:</p>
                    <pre className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-[10px] text-purple-600 dark:text-purple-400 whitespace-pre-wrap">
d={config.brandedDomain}; s=selector1-fabrikam-com; a=rsa-sha256;
                    </pre>
                  </div>

                  {/* DMARC Enforcement Card */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white">3. DMARC Policy</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        Aligned
                      </span>
                    </div>
                    <p className="text-slate-500 text-[11px]">Strict alignment achieved via DKIM signing:</p>
                    <pre className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-[10px] text-teal-600 dark:text-teal-400 whitespace-pre-wrap">
v=DMARC1; p={config.dmarcPolicy.toLowerCase()}; rua=mailto:dmarc@{config.brandedDomain}
                    </pre>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 6: INBOUND REPLY MAPPING & FORWARDING */}
            {currentStep === 6 && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-sky-500" />
                    <span>Step 6: Inbound Reply Reverse Address Remapping & Target Proxy Forwarding</span>
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                    Ensure incoming email replies sent to <code>@{config.brandedDomain}</code> by external contacts route back seamlessly to the user's source mailbox before physical cutover.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                    <h4 className="font-semibold text-slate-900 dark:text-white">Target Coexistence Routing Architecture</h4>
                    
                    <div>
                      <span className="text-[11px] text-slate-500 block mb-1">Target Inbound Forwarding Mechanism:</span>
                      <select
                        value={config.targetForwardingMode}
                        onChange={(e) => setConfig({ ...config, targetForwardingMode: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                      >
                        <option value="MAIL_ENABLED_CONTACTS">Mail-Enabled Contacts (Target proxy forwarding to source MOERA)</option>
                        <option value="INTERNAL_RELAY_SMARTHOST">Internal Relay Accepted Domain + Connector to Source Smart Host</option>
                        <option value="GRAPH_REWRITE_PROXY">Cloud Stream Inbound Proxy (Zero Directory Footprint)</option>
                      </select>
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-500 block mb-1">Source Tenant Routing Domain Suffix (MOERA):</span>
                      <input
                        type="text"
                        value={config.targetRoutingAddressSuffix}
                        onChange={(e) => setConfig({ ...config, targetRoutingAddressSuffix: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-xs text-purple-600 dark:text-purple-300"
                      />
                    </div>

                    <label className="flex items-center space-x-2.5 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={config.inboundReplyRoutingEnabled}
                        onChange={(e) => setConfig({ ...config, inboundReplyRoutingEnabled: e.target.checked })}
                        className="rounded text-blue-600"
                      />
                      <span className="text-xs text-slate-700 dark:text-slate-300">
                        Enable bidirectional inbound reply mapping in smart host routing table
                      </span>
                    </label>

                    <label className="flex items-center space-x-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.preserveTargetMailboxRouting}
                        onChange={(e) => setConfig({ ...config, preserveTargetMailboxRouting: e.target.checked })}
                        className="rounded text-blue-600"
                      />
                      <span className="text-xs text-slate-700 dark:text-slate-300">
                        Protect against target mailbox routing collision when accounts are pre-staged
                      </span>
                    </label>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-900 text-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold font-mono text-purple-400">Target Tenant PowerShell (Exchange Online)</span>
                      <button
                        onClick={() =>
                          handleCopy(
                            `# Target Inbound Mail Contact Routing\nNew-MailContact -Name "Pilot-Rewritten-User" -ExternalEmailAddress "user@${config.targetRoutingAddressSuffix}"\nSet-AcceptedDomain -Identity "${config.brandedDomain}" -DomainType InternalRelay`,
                            'ps-inbound-reply'
                          )
                        }
                        className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition cursor-pointer"
                      >
                        {copiedKey === 'ps-inbound-reply' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKey === 'ps-inbound-reply' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <pre className="p-3 rounded-lg bg-black/60 font-mono text-[10px] text-emerald-400 overflow-x-auto whitespace-pre-wrap leading-relaxed">
{`# 1. Configure Target Tenant Accepted Domain as Internal Relay
Set-AcceptedDomain -Identity "${config.brandedDomain}" \`
  -DomainType InternalRelay

# 2. Stage Mail-Enabled Contact for External Reply Forwarding
New-MailContact -Name "Alex Wilber (Pre-Cutover Contact)" \`
  -ExternalEmailAddress "alex.wilber@${config.targetRoutingAddressSuffix}" \`
  -PrimarySmtpAddress "alex.wilber@${config.brandedDomain}"

# 3. Ensure Outbound Connector to Source Tenant
New-OutboundConnector -Name "Target-To-Source-Relay" \`
  -ConnectorType Partner \`
  -RecipientDomains "${config.targetRoutingAddressSuffix}" \`
  -UseMxRecord $true \`
  -RequireTls $true`}
                    </pre>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 7: CALENDAR FREE/BUSY & ORGANIZATION RELATIONSHIP */}
            {currentStep === 7 && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-teal-500" />
                    <span>Step 7: Cross-Tenant Calendar Free/Busy & Organization Sharing</span>
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                    Configure OAuth federated sharing and Autodiscover service routing so meeting schedulers see free/busy calendar status under rewritten identities.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                    <h4 className="font-semibold text-slate-900 dark:text-white">Organization Relationship Settings</h4>

                    <div>
                      <span className="text-[11px] text-slate-500 block mb-1">Free/Busy Calendar Access Level:</span>
                      <select
                        value={config.freeBusyAccessLevel}
                        onChange={(e) => setConfig({ ...config, freeBusyAccessLevel: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                      >
                        <option value="AvailabilityOnly">AvailabilityOnly (Time slots: Free / Busy / Tentative - Recommended)</option>
                        <option value="LimitedDetails">LimitedDetails (Availability plus subject and location)</option>
                        <option value="Detailed">Detailed (Full meeting appointment body & attachments)</option>
                      </select>
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-500 block mb-1">Target Autodiscover EPR Endpoint:</span>
                      <input
                        type="text"
                        value={config.targetAutodiscoverEpr}
                        onChange={(e) => setConfig({ ...config, targetAutodiscoverEpr: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-xs"
                      />
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-500 block mb-1">Target Sharing Web Services (EWS) EPR:</span>
                      <input
                        type="text"
                        value={config.targetSharingEpr}
                        onChange={(e) => setConfig({ ...config, targetSharingEpr: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-xs"
                      />
                    </div>

                    <label className="flex items-center space-x-2.5 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={config.enableMailboxMoveCapabilities}
                        onChange={(e) => setConfig({ ...config, enableMailboxMoveCapabilities: e.target.checked })}
                        className="rounded text-teal-600"
                      />
                      <span className="text-xs text-slate-700 dark:text-slate-300">
                        Enable MRS Proxy cross-tenant mailbox move capability flag on Organization Relationship
                      </span>
                    </label>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-900 text-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold font-mono text-teal-400">PowerShell Organization Relationship</span>
                      <button
                        onClick={() =>
                          handleCopy(
                            `New-OrganizationRelationship -Name "Coexistence-${config.sourceTenant.split('.')[0]}-${config.targetTenant.split('.')[0]}" -DomainNames "${config.brandedDomain}","${config.sourceTenant}" -FreeBusyAccessEnabled $true -FreeBusyAccessLevel ${config.freeBusyAccessLevel} -TargetAutodiscoverEpr "${config.targetAutodiscoverEpr}" -TargetSharingEpr "${config.targetSharingEpr}" -Enabled $true`,
                            'ps-org-rel'
                          )
                        }
                        className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition cursor-pointer"
                      >
                        {copiedKey === 'ps-org-rel' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKey === 'ps-org-rel' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <pre className="p-3 rounded-lg bg-black/60 font-mono text-[10px] text-emerald-400 overflow-x-auto whitespace-pre-wrap leading-relaxed">
{`# Create Organization Relationship in Source Tenant
New-OrganizationRelationship \`
  -Name "Coexistence-Target-${config.brandedDomain}" \`
  -DomainNames "${config.brandedDomain}" \`
  -FreeBusyAccessEnabled $true \`
  -FreeBusyAccessLevel ${config.freeBusyAccessLevel} \`
  -TargetAutodiscoverEpr "${config.targetAutodiscoverEpr}" \`
  -TargetSharingEpr "${config.targetSharingEpr}" \`
  -MailboxMoveCapability Inbound,Outbound \`
  -Enabled $true

# Reciprocal Command in Target Tenant
New-OrganizationRelationship \`
  -Name "Coexistence-Source-${config.sourceTenant}" \`
  -DomainNames "${config.sourceTenant}" \`
  -FreeBusyAccessEnabled $true \`
  -FreeBusyAccessLevel ${config.freeBusyAccessLevel} \`
  -Enabled $true`}
                    </pre>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 8: PILOT CANARY SCOPE & VERIFICATION */}
            {currentStep === 8 && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    <span>Step 8: Pilot Canary Scope & Verification Testing</span>
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                    Dispatch synthetic probe messages through the rewrite smart host to verify MIME transformations, DKIM dual-signing, DMARC alignment, and ICS calendar payload preservation.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                    <h4 className="font-semibold text-slate-900 dark:text-white">Canary Test Suite Parameters</h4>

                    <div>
                      <span className="text-[11px] text-slate-500 block mb-1">External Canary Recipient Mailbox:</span>
                      <input
                        type="text"
                        value={config.canaryRecipient}
                        onChange={(e) => setConfig({ ...config, canaryRecipient: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-xs"
                      />
                    </div>

                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs">
                        <span className="text-slate-700 dark:text-slate-300">P1 MAIL FROM Envelope Rewrite:</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> VERIFIED
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs">
                        <span className="text-slate-700 dark:text-slate-300">P2 Header From: Display Name:</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> VERIFIED
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs">
                        <span className="text-slate-700 dark:text-slate-300">Target DKIM 2048-Bit RSA Signature:</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> VERIFIED
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs">
                        <span className="text-slate-700 dark:text-slate-300">DMARC Strict Alignment (p=reject):</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> PASS
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs">
                        <span className="text-slate-700 dark:text-slate-300">iCalendar (.ICS) ORGANIZER Rewrite:</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> PASS
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between space-y-4">
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-1">Live Canary Dispatch Simulator</h4>
                      <p className="text-slate-500 text-xs leading-relaxed">
                        Execute an automated test flight that dispatches a simulated RFC-5322 payload and an attached iCalendar meeting invitation to test delivery headers.
                      </p>
                      
                      <div className="mt-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs font-mono">
                        <div className="text-slate-500">Test Sender: <span className="text-slate-900 dark:text-white">alex.wilber@{config.sourceTenant}</span></div>
                        <div className="text-slate-500">Rewritten Outbound: <span className="text-blue-600 dark:text-blue-400 font-bold">alex.wilber@{config.brandedDomain}</span></div>
                        <div className="text-slate-500">Diagnostic Header: <span className="text-purple-600 dark:text-purple-300 font-bold">{config.trackingHeaderName}</span></div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        handleRunSimulation();
                        setActiveTab('simulator');
                      }}
                      className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Launch Live Synthetic Canary Test</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 9: LIVE CUTOVER & AUTO-ROLLBACK CONTROLS */}
            {currentStep === 9 && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <CheckCheck className="w-4 h-4 text-emerald-500" />
                    <span>Step 9: Live Cutover, Monitoring & Auto-Rollback Controls</span>
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                    Activate the production Exchange Online Transport Rule for pilot users with automated circuit-breakers and instant rollback safeguards.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                    <h4 className="font-bold text-slate-900 dark:text-white">Circuit-Breaker & Automated Rollback</h4>
                    
                    <label className="flex items-start space-x-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.autoRollbackOnFailure}
                        onChange={(e) => setConfig({ ...config, autoRollbackOnFailure: e.target.checked })}
                        className="rounded text-blue-600 mt-0.5"
                      />
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-white text-xs">Automated Circuit-Breaker Rollback</span>
                        <p className="text-[11px] text-slate-500">Automatically bypasses the rewrite pipeline if smart host bounce/NDR rates exceed 1.5% in a rolling 15-minute window.</p>
                      </div>
                    </label>

                    <label className="flex items-start space-x-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.cutoverAutoDecommission}
                        onChange={(e) => setConfig({ ...config, cutoverAutoDecommission: e.target.checked })}
                        className="rounded text-blue-600 mt-0.5"
                      />
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-white text-xs">Post-Cutover Auto-Decommission</span>
                        <p className="text-[11px] text-slate-500">Automatically removes transport rules and purges temporary forwarding contacts when final mailbox moves complete.</p>
                      </div>
                    </label>

                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs space-y-1">
                      <span className="font-bold block flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" /> Emergency Bypass Switch
                      </span>
                      <p className="text-[11px] leading-relaxed">
                        If an unforeseen issue occurs with the target vanity certificate or DNS resolver, you can trigger instant bypass without interrupting normal source mail flow.
                      </p>
                    </div>
                  </div>

                  <div className="p-5 rounded-xl border-2 border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/20 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-emerald-800 dark:text-emerald-300 text-sm">
                          Domain Rewrite Pipeline Ready for Production
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                          Pre-Flight 9/9 Passed
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
                        Activating this policy will enable the Exchange Online Transport Rule for pilot group <code>{config.pilotGroupName}</code>. All outbound emails to external partners will immediately present as <code>@{config.brandedDomain}</code> with 100% SPF/DKIM/DMARC alignment.
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          alert(`Domain Rewrite pipeline activated for @${config.brandedDomain}! Pilot group "${config.pilotGroupName}" is now live with automated circuit-breaker rollback protection.`);
                          setActiveTab('directory');
                        }}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow transition flex items-center gap-2 cursor-pointer"
                      >
                        <Play className="w-4 h-4 fill-current" />
                        <span>Activate Production Rewrite Pipeline</span>
                      </button>

                      <button
                        onClick={() => setActiveTab('simulator')}
                        className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-100 transition cursor-pointer text-xs"
                      >
                        Test in Synthetic Tester
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Navigation */}
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <button
              onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
              disabled={currentStep === 1}
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <span className="text-xs text-slate-400">
              Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1].title}
            </span>

            {currentStep < STEPS.length ? (
              <button
                onClick={() => setCurrentStep((prev) => Math.min(STEPS.length, prev + 1))}
                className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <span>Next Step</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setActiveTab('directory')}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <span>View Mapped Directory</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW B: USER ADDRESS MAPPINGS DIRECTORY */}
      {/* ========================================================================= */}
      {activeTab === 'directory' && (
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden space-y-4 p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-slate-400 absolute ml-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Search mapped users by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white w-72"
              />

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 cursor-pointer"
              >
                <option value="ALL">All Statuses ({mappings.length})</option>
                <option value="ACTIVE">Active (Live Rewriting)</option>
                <option value="PILOT">Pilot Group</option>
                <option value="PAUSED">Paused</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAddUserModalOpen(true)}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Mapped User</span>
              </button>

              <button
                onClick={() => {
                  const csv =
                    'DisplayName,SourceUPN,TargetBrandedAddress,Department,Status\n' +
                    mappings.map((m) => `"${m.displayName}","${m.sourceUPN}","${m.targetBrandedAddress}","${m.department}","${m.status}"`).join('\n');
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `domain_rewrite_users_${config.brandedDomain}.csv`;
                  a.click();
                }}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Directory Table */}
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-2.5 px-4">User</th>
                  <th className="py-2.5 px-4">Source Internal UPN (Origin)</th>
                  <th className="py-2.5 px-4">Outbound Branded Address</th>
                  <th className="py-2.5 px-4 text-center">ICS Calendar</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {filteredMappings.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      {row.displayName}
                      <span className="block text-[10px] text-slate-400 font-normal">{row.department}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                      {row.sourceUPN}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] font-bold text-blue-600 dark:text-blue-400">
                      {row.targetBrandedAddress}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {row.rewriteCalendarICS ? (
                        <span className="inline-flex items-center text-teal-600 dark:text-teal-400 font-medium text-[10px]">
                          <Check className="w-3.5 h-3.5 mr-0.5" /> Rewritten
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">Bypassed</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          row.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : row.status === 'PILOT'
                            ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          setTestSender(row.sourceUPN);
                          setActiveTab('simulator');
                        }}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium cursor-pointer"
                      >
                        Test
                      </button>
                      <button
                        onClick={() => {
                          setMappings((prev) =>
                            prev.map((m) =>
                              m.id === row.id
                                ? { ...m, status: m.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' }
                                : m
                            )
                          );
                        }}
                        className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                      >
                        {row.status === 'ACTIVE' ? 'Pause' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW C: SYNTHETIC MAIL FLOW TESTER & MIME ANALYZER */}
      {/* ========================================================================= */}
      {activeTab === 'simulator' && (
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-6 space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              <span>Synthetic Mail Flow & MIME Transformation Simulator</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Simulate how an outbound message from a source user gets rewritten in-flight before reaching external mail exchangers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Input Form */}
            <div className="space-y-4 text-xs">
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Send className="w-4 h-4 text-blue-500" />
                <span>Simulated Source Message Parameters</span>
              </h4>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Source Sender (Internal Mailbox)</label>
                <input
                  type="text"
                  value={testSender}
                  onChange={(e) => setTestSender(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">External Recipient</label>
                <input
                  type="text"
                  value={testRecipient}
                  onChange={(e) => setTestRecipient(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Message Subject</label>
                <input
                  type="text"
                  value={testSubject}
                  onChange={(e) => setTestSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Body Preview</label>
                <textarea
                  rows={2}
                  value={testBody}
                  onChange={(e) => setTestBody(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <button
                id="btn-run-simulation"
                disabled={isSimulating}
                onClick={handleRunSimulation}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSimulating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing MIME Stream...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Simulate In-Flight Address Rewrite</span>
                  </>
                )}
              </button>
            </div>

            {/* Results Comparison View */}
            <div className="space-y-4 text-xs">
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Live MIME Header Inspection (Before vs After)</span>
              </h4>

              {simulationResult ? (
                <div className="space-y-3 animate-in fade-in duration-150">
                  <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1.5">
                    <span className="font-bold text-[11px] text-slate-400 uppercase tracking-wider block">Raw Outbound Envelope (Source Origin)</span>
                    <div className="font-mono text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
                      <div>MAIL FROM: {simulationResult.originalEnvelope.mailFrom}</div>
                      <div>From: {simulationResult.originalEnvelope.p2From}</div>
                      <div>Reply-To: {simulationResult.originalEnvelope.p2ReplyTo}</div>
                      <div className="text-amber-500">SPF / DMARC: {simulationResult.originalEnvelope.spfStatus}</div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-lg border-2 border-emerald-500/40 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[11px] text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                        Rewritten MIME Envelope (External Destination)
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        {simulationResult.latencyMs}ms Latency
                      </span>
                    </div>

                    <div className="font-mono text-[11px] text-slate-900 dark:text-white space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span>MAIL FROM:</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">{simulationResult.rewrittenEnvelope.mailFrom}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>From Header:</span>
                        <span className="text-blue-600 dark:text-blue-400 font-bold">{simulationResult.rewrittenEnvelope.p2From}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Reply-To:</span>
                        <span>{simulationResult.rewrittenEnvelope.p2ReplyTo}</span>
                      </div>
                      <div className="flex items-center justify-between border-t border-emerald-500/20 pt-1">
                        <span>SPF Authentication:</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{simulationResult.rewrittenEnvelope.spfStatus}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>DKIM Signature:</span>
                        <span className="text-purple-600 dark:text-purple-400 font-semibold">{simulationResult.rewrittenEnvelope.dkimSelector}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>DMARC Enforcement:</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">{simulationResult.rewrittenEnvelope.dmarcResult}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>iCalendar (.ICS):</span>
                        <span className="text-teal-600 dark:text-teal-400 font-semibold">{simulationResult.rewrittenEnvelope.calendarICSStatus}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-800/20 text-slate-500 space-y-2">
                  <Mail className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="font-medium text-slate-700 dark:text-slate-300">No simulation executed yet</p>
                  <p className="text-xs">Click "Simulate In-Flight Address Rewrite" to inspect live envelope modifications.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add User Mapping Modal */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-500" />
                <span>Add Mapped User for Domain Rewrite</span>
              </h3>
              <button
                onClick={() => setIsAddUserModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newUser.sourceUPN.trim()) return;
                const newRow: RewriteUserMapping = {
                  id: 'rw-' + Date.now(),
                  displayName: newUser.displayName.trim() || newUser.sourceUPN.split('@')[0],
                  sourceUPN: newUser.sourceUPN.trim(),
                  targetBrandedAddress: newUser.targetBrandedAddress.trim() || `${newUser.sourceUPN.split('@')[0]}@${config.brandedDomain}`,
                  department: newUser.department.trim() || 'General Operations',
                  status: 'PILOT',
                  rewriteOutbound: true,
                  rewriteInbound: true,
                  rewriteCalendarICS: true,
                  messagesCount: 0,
                };
                setMappings((prev) => [newRow, ...prev]);
                setIsAddUserModalOpen(false);
                setNewUser({ displayName: '', sourceUPN: '', targetBrandedAddress: '', department: 'General Operations' });
              }}
              className="space-y-3"
            >
              <div>
                <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">Display Name</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={newUser.displayName}
                  onChange={(e) => setNewUser({ ...newUser, displayName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">Source Internal UPN</label>
                <input
                  type="email"
                  required
                  placeholder={`e.g. john.doe@${config.sourceTenant}`}
                  value={newUser.sourceUPN}
                  onChange={(e) => setNewUser({ ...newUser, sourceUPN: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">Target Branded Public Address</label>
                <input
                  type="email"
                  placeholder={`e.g. john.doe@${config.brandedDomain}`}
                  value={newUser.targetBrandedAddress}
                  onChange={(e) => setNewUser({ ...newUser, targetBrandedAddress: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">Department</label>
                <input
                  type="text"
                  value={newUser.department}
                  onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow"
                >
                  Save Mapping
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
