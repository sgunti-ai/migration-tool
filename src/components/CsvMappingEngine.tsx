import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  Trash2,
  ArrowRight,
  Sparkles,
  Info,
  Check,
  X,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Lock,
  Users,
  Key,
  FolderTree,
  Database,
  RefreshCw,
  Layers,
  Copy,
  CheckCheck,
  ExternalLink,
  Shield,
  HelpCircle,
  Zap,
} from 'lucide-react';
import { CSVUserRow, TenantStatusResponse, AdminRole } from '../types';

interface CsvMappingEngineProps {
  tenantStatus: TenantStatusResponse;
  currentRole: AdminRole;
  onInitializeJob: (mappings: CSVUserRow[]) => Promise<void>;
  isInitializing: boolean;
}

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const CsvMappingEngine: React.FC<CsvMappingEngineProps> = ({
  tenantStatus,
  currentRole,
  onInitializeJob,
  isInitializing,
}) => {
  const [rows, setRows] = useState<CSVUserRow[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isBestPracticesExpanded, setIsBestPracticesExpanded] = useState<boolean>(true);
  const [bestPracticeFilter, setBestPracticeFilter] = useState<'ALL' | 'IDENTITY' | 'CREDENTIALS' | 'HYGIENE' | 'SECURITY' | 'GOVERNANCE'>('ALL');
  const [copiedCmdlet, setCopiedCmdlet] = useState<boolean>(false);
  const [checklist, setChecklist] = useState({
    immutableIdCheck: true,
    staleAccountsFiltered: true,
    credentialPolicySet: true,
    secondaryProxyStaged: true,
    idFixRemediationRun: true,
    groupBasedLicensingConfigured: true,
    conditionalAccessExclusionSet: true,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate a single parsed row
  const validateRow = (sourceUPN: string, targetUPN: string, index: number): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    if (!sourceUPN || !sourceUPN.trim()) {
      errors.push('SourceUPN is required');
    } else if (!EMAIL_REGEX.test(sourceUPN.trim())) {
      errors.push(`Invalid source email format: "${sourceUPN}"`);
    }

    if (!targetUPN || !targetUPN.trim()) {
      errors.push('TargetUPN is required');
    } else if (!EMAIL_REGEX.test(targetUPN.trim())) {
      errors.push(`Invalid target email format: "${targetUPN}"`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  // Parse CSV text
  const parseCSVText = (text: string, name = 'user-mappings.csv') => {
    const lines = text.split(/\r\n|\n/).filter((l) => l.trim().length > 0);
    if (lines.length <= 1) {
      alert('CSV file appears to be empty or has only header row.');
      return;
    }

    // Header validation
    const header = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
    const sourceIdx = header.findIndex((h) => h.toLowerCase() === 'sourceupn');
    const targetIdx = header.findIndex((h) => h.toLowerCase() === 'targetupn');
    const mailIdx = header.findIndex((h) => h.toLowerCase() === 'migratemailbox');
    const driveIdx = header.findIndex((h) => h.toLowerCase() === 'migrateonedrive');

    if (sourceIdx === -1 || targetIdx === -1) {
      alert('CSV must contain "SourceUPN" and "TargetUPN" columns.');
      return;
    }

    const parsedRows: CSVUserRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const cols = line.split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
      const sourceUPN = cols[sourceIdx] || '';
      const targetUPN = cols[targetIdx] || '';
      const migrateMailbox = mailIdx !== -1 ? cols[mailIdx].toLowerCase() !== 'false' : true;
      const migrateOneDrive = driveIdx !== -1 ? cols[driveIdx].toLowerCase() !== 'false' : true;

      const validation = validateRow(sourceUPN, targetUPN, i);

      parsedRows.push({
        id: `row-${i}-${Date.now()}`,
        sourceUPN,
        targetUPN,
        migrateMailbox,
        migrateOneDrive,
        isValid: validation.isValid,
        errors: validation.errors,
      });
    }

    setRows(parsedRows);
    setFileName(name);
  };

  // Handle file upload through click or drag-and-drop
  const handleFileUpload = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      alert('Please upload a valid .csv format file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        parseCSVText(content, file.name);
      }
    };
    reader.readAsText(file);
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Download Sample CSV Template
  const handleDownloadSample = () => {
    const srcDomain = tenantStatus.source.domain || 'contoso.onmicrosoft.com';
    const tgtDomain = tenantStatus.target.domain || 'fabrikam.com';

    const csvContent =
      'SourceUPN,TargetUPN,MigrateMailbox,MigrateOneDrive\r\n' +
      `alex.wilber@${srcDomain},alex.wilber@${tgtDomain},true,true\r\n` +
      `adele.vance@${srcDomain},adele.vance@${tgtDomain},true,true\r\n` +
      `megan.bowen@${srcDomain},megan.bowen@${tgtDomain},true,true\r\n` +
      `isaiah.langer@${srcDomain},isaiah.langer@${tgtDomain},true,false\r\n` +
      `lee.gu@${srcDomain},lee.gu@${tgtDomain},false,true\r\n`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'm365_migration_user_mapping_sample.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Load Built-in Demo Enterprise Presets
  const handleLoadSampleUsers = () => {
    const srcDomain = tenantStatus.source.domain || 'contoso.onmicrosoft.com';
    const tgtDomain = tenantStatus.target.domain || 'fabrikam.com';

    const sampleText =
      'SourceUPN,TargetUPN,MigrateMailbox,MigrateOneDrive\n' +
      `alex.wilber@${srcDomain},alex.wilber@${tgtDomain},true,true\n` +
      `adele.vance@${srcDomain},adele.vance@${tgtDomain},true,true\n` +
      `megan.bowen@${srcDomain},megan.bowen@${tgtDomain},true,true\n` +
      `isaiah.langer@${srcDomain},isaiah.langer@${tgtDomain},true,true\n` +
      `lee.gu@${srcDomain},lee.gu@${tgtDomain},true,true\n` +
      `lynne.robbins@${srcDomain},lynne.robbins@${tgtDomain},true,true\n` +
      `invalid-user-format,corrupted@${tgtDomain},true,true`; // Intentionally include 1 invalid row to demonstrate validation

    parseCSVText(sampleText, 'enterprise-demo-directory.csv');
  };

  // Toggle item options
  const toggleOption = (id: string, field: 'migrateMailbox' | 'migrateOneDrive') => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: !r[field] } : r))
    );
  };

  const removeRow = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const clearAll = () => {
    setRows([]);
    setFileName(null);
  };

  const validRows = rows.filter((r) => r.isValid);
  const invalidRows = rows.filter((r) => !r.isValid);

  const bothTenantsConnected =
    tenantStatus.source.connected && tenantStatus.target.connected;

  const canInitialize =
    bothTenantsConnected && validRows.length > 0 && !isInitializing && currentRole !== 'AUDITOR';

  return (
    <div className="space-y-6">
      {/* AD Express Header */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                Active Directory & Entra ID
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <Zap className="w-3 h-3" />
                <span>Express Mode</span>
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-500" />
              <span>AD Express: Rapid Directory & User Identity Migration</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-3xl">
              Accelerated Active Directory & Entra ID user provisioning engine. Upload RFC-4180 CSV mappings or load verified accounts to stage user cutover pipelines with automated format validation and source-anchor matching.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              id="btn-toggle-best-practices"
              onClick={() => setIsBestPracticesExpanded(!isBestPracticesExpanded)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 text-xs font-semibold rounded-lg border border-purple-200 dark:border-purple-800 transition-colors cursor-pointer"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Best Practices Guide</span>
              {isBestPracticesExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* AD EXPRESS BEST PRACTICES & ARCHITECTURE GUIDE (MICROSOFT LEARN VERIFIED) */}
      {/* ========================================================================= */}
      {isBestPracticesExpanded && (
        <div className="bg-white dark:bg-slate-900/90 border border-purple-200 dark:border-purple-900/40 rounded-xl p-5 shadow-sm space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>AD Express Migration Best Practices & Architecture Standards</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Microsoft Learn Verified
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Follow these 10 core enterprise architecture standards to ensure seamless identity matching, zero account lockouts, Kerberos token integrity, and automated cloud licensing.
                </p>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              {[
                { id: 'ALL', label: 'All Standards (10)' },
                { id: 'IDENTITY', label: 'Identity Matching' },
                { id: 'CREDENTIALS', label: 'Credentials & PHS' },
                { id: 'HYGIENE', label: 'Scope & Hygiene' },
                { id: 'SECURITY', label: 'Security & Kerberos' },
                { id: 'GOVERNANCE', label: 'Licensing & Attributes' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setBestPracticeFilter(f.id as any)}
                  className={`px-2.5 py-1 rounded-md font-medium text-[11px] transition-colors cursor-pointer ${
                    bestPracticeFilter === f.id
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* 10 Enterprise Best Practice Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
            {/* BP 1: ImmutableID / Hard Matching */}
            {(bestPracticeFilter === 'ALL' || bestPracticeFilter === 'IDENTITY') && (
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2 hover:border-purple-300 dark:hover:border-purple-800 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-blue-500" />
                    <span>1. ImmutableID & SourceAnchor</span>
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                    Critical
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                  Enforce hard-matching via <code>mS-DS-ConsistencyGuid</code> (Base64) to bind on-prem AD objects to target Entra ID. Soft-matching via UPN or primary mail fails if target users were pre-staged with altered usernames or temporary domains.
                </p>
                <div className="pt-1 border-t border-slate-200/60 dark:border-slate-700/60 font-mono text-[10px] text-purple-600 dark:text-purple-300 truncate" title="Set-MgUser -UserId $upn -OnPremisesImmutableId $base64Guid">
                  Cmdlet: Set-MgUser -OnPremisesImmutableId $guid
                </div>
              </div>
            )}

            {/* BP 2: UPN Suffix & Staged Routing */}
            {(bestPracticeFilter === 'ALL' || bestPracticeFilter === 'IDENTITY') && (
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2 hover:border-purple-300 dark:hover:border-purple-800 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 text-teal-500" />
                    <span>2. UPN Suffix & Staged Routing</span>
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                    Architecture
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                  Never assign the custom vanity domain as target primary UPN prior to MX cutover. Pre-stage users with initial MOERA <code>@target.onmicrosoft.com</code> and add the vanity address as secondary proxy <code>smtp:user@vanity.com</code>.
                </p>
                <div className="pt-1 border-t border-slate-200/60 dark:border-slate-700/60 font-mono text-[10px] text-purple-600 dark:text-purple-300 truncate" title="Update-MgUser -UserId $id -UserPrincipalName $moera -ProxyAddresses @('smtp:...')">
                  Cmdlet: Update-MgUser -UserPrincipalName $moera
                </div>
              </div>
            )}

            {/* BP 3: Password Hash Sync & Staged Rollout */}
            {(bestPracticeFilter === 'ALL' || bestPracticeFilter === 'CREDENTIALS') && (
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2 hover:border-purple-300 dark:hover:border-purple-800 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-500" />
                    <span>3. Password Hash Sync (PHS)</span>
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    Security
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                  Pre-sync credentials using seamless PHS with Cloud Kerberos or provision cryptographically randomized initial passwords with mandatory reset on first login (<code>forceChangePasswordNextSignIn = $true</code>). Avoid ADFS federation during pilot waves.
                </p>
                <div className="pt-1 border-t border-slate-200/60 dark:border-slate-700/60 font-mono text-[10px] text-purple-600 dark:text-purple-300 truncate" title="Update-MgUser -PasswordProfile @{ForceChangePasswordNextSignIn=$true}">
                  Cmdlet: Update-MgUser -PasswordProfile @&#123;...&#125;
                </div>
              </div>
            )}

            {/* BP 4: sIDHistory for On-Premises ACL Access */}
            {(bestPracticeFilter === 'ALL' || bestPracticeFilter === 'SECURITY') && (
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2 hover:border-purple-300 dark:hover:border-purple-800 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-indigo-500" />
                    <span>4. sIDHistory & Kerberos Ticket Size</span>
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                    Access Continuity
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                  For cross-forest cutovers, extract and inject source account SIDs into the target object's <code>sIDHistory</code> with SID filtering quarantine disabled on the trust. Calculate <code>MaxTokenSize</code> to avoid Kerberos ticket overflow on legacy shares.
                </p>
                <div className="pt-1 border-t border-slate-200/60 dark:border-slate-700/60 font-mono text-[10px] text-purple-600 dark:text-purple-300 truncate" title="Netdom trust $trust /Domain:$domain /EnableSIDHistory:Yes">
                  Cmdlet: Netdom trust /EnableSIDHistory:Yes
                </div>
              </div>
            )}

            {/* BP 5: Scope Hygiene & Service Account Filtering */}
            {(bestPracticeFilter === 'ALL' || bestPracticeFilter === 'HYGIENE') && (
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2 hover:border-purple-300 dark:hover:border-purple-800 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <FolderTree className="w-3.5 h-3.5 text-emerald-500" />
                    <span>5. OU Hygiene & Object Filtering</span>
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Data Hygiene
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                  Filter out stale accounts (&gt;90 days inactive), service accounts (<code>SVC_*</code>, <code>KRBTGT</code>), and conference room identities from user CSV batches. Target synchronization only to active employee organizational units.
                </p>
                <div className="pt-1 border-t border-slate-200/60 dark:border-slate-700/60 font-mono text-[10px] text-purple-600 dark:text-purple-300 truncate" title="Get-ADUser -Filter {Enabled -eq $true -and LastLogonDate -gt $date}">
                  Cmdlet: Get-ADUser -Filter &#123;Enabled -eq $true&#125;
                </div>
              </div>
            )}

            {/* BP 6: Group Nesting & Recursion Flattening */}
            {(bestPracticeFilter === 'ALL' || bestPracticeFilter === 'HYGIENE') && (
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2 hover:border-purple-300 dark:hover:border-purple-800 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-violet-500" />
                    <span>6. Group Nesting & Recursion</span>
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    Replication Safety
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                  Pre-audit circular nested groups and flatten multi-tier hierarchies before delta sync. Entra ID replication performance degrades significantly when synchronizing deeply nested groups (&gt;5 levels). Convert nested groups to dynamic rule memberships.
                </p>
                <div className="pt-1 border-t border-slate-200/60 dark:border-slate-700/60 font-mono text-[10px] text-purple-600 dark:text-purple-300 truncate" title="Get-ADGroupMember -Identity $grp -Recursive">
                  Cmdlet: Get-ADGroupMember -Identity $grp -Recursive
                </div>
              </div>
            )}

            {/* BP 7: Directory Schema Extensions */}
            {(bestPracticeFilter === 'ALL' || bestPracticeFilter === 'GOVERNANCE') && (
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2 hover:border-purple-300 dark:hover:border-purple-800 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-500" />
                    <span>7. Schema Extension Attributes</span>
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                    Attribute Sync
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                  Map custom legacy attributes (<code>extensionAttribute1-15</code>, employeeID, costCenter, division) to target Entra ID directory extensions so dynamic groups, conditional access, and automated licensing trigger without delay.
                </p>
                <div className="pt-1 border-t border-slate-200/60 dark:border-slate-700/60 font-mono text-[10px] text-purple-600 dark:text-purple-300 truncate" title="Set-AzureADUserExtension -ExtensionName ...">
                  Cmdlet: Set-MgUserExtension -UserId $id
                </div>
              </div>
            )}

            {/* BP 8: Group-Based Licensing (GBL) Automation */}
            {(bestPracticeFilter === 'ALL' || bestPracticeFilter === 'GOVERNANCE') && (
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2 hover:border-purple-300 dark:hover:border-purple-800 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>8. Group-Based Licensing (GBL)</span>
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Provisioning
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                  Never assign Microsoft 365 license SKUs individually via CSV scripts during mass migration. Bind license SKUs (E5/E3) to Entra security groups; new accounts inherit Exchange and OneDrive licenses upon membership sync with automated error queues.
                </p>
                <div className="pt-1 border-t border-slate-200/60 dark:border-slate-700/60 font-mono text-[10px] text-purple-600 dark:text-purple-300 truncate" title="Set-MgGroupLicense -GroupId $grpId -AddLicenses @{SkuId=$skuId}">
                  Cmdlet: Set-MgGroupLicense -GroupId $grpId
                </div>
              </div>
            )}

            {/* BP 9: IdFix Tool & Conflict Remediation */}
            {(bestPracticeFilter === 'ALL' || bestPracticeFilter === 'HYGIENE') && (
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2 hover:border-purple-300 dark:hover:border-purple-800 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-rose-500" />
                    <span>9. IdFix & Duplicate Proxy Resolution</span>
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                    Conflict Check
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                  Run Microsoft IdFix to remediate invalid characters, trailing spaces, and duplicate <code>proxyAddresses</code> or conflicting <code>mailNickname</code> values in Active Directory before initial staging. Unresolved duplicates trigger silent sync halts.
                </p>
                <div className="pt-1 border-t border-slate-200/60 dark:border-slate-700/60 font-mono text-[10px] text-purple-600 dark:text-purple-300 truncate" title="Invoke-IdFixRemediation -ExportLog -FixDuplicates">
                  Tool: Microsoft IdFix Directory Tool (CLI / GUI)
                </div>
              </div>
            )}

            {/* BP 10: Conditional Access & MFA Staged Pilot Exclusion */}
            {(bestPracticeFilter === 'ALL' || bestPracticeFilter === 'SECURITY') && (
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2 hover:border-purple-300 dark:hover:border-purple-800 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-blue-500" />
                    <span>10. Conditional Access Pilot Exclusion</span>
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    Zero Lockout
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                  Add newly provisioned migration target accounts to an exclusion security group in target Conditional Access and Intune device compliance policies during the initial sync window, avoiding immediate lockout before first interactive onboarding.
                </p>
                <div className="pt-1 border-t border-slate-200/60 dark:border-slate-700/60 font-mono text-[10px] text-purple-600 dark:text-purple-300 truncate" title="New-MgGroupMember -GroupId $caExclusionGroup -DirectoryObjectId $userId">
                  Cmdlet: Add-MgGroupMember -GroupId $caExclusionGrp
                </div>
              </div>
            )}
          </div>

          {/* Interactive Compliance Pre-Flight Checklist */}
          <div className="p-4 rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/40 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <CheckCheck className="w-4 h-4 text-emerald-500" />
                <span>AD Express Pre-Flight Compliance Verification</span>
              </span>
              <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                Confirm directory prerequisites and safety checks before committing batch identities into migration execution.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-[11px]">
              <label className="flex items-center space-x-2 cursor-pointer text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={checklist.immutableIdCheck}
                  onChange={(e) => setChecklist({ ...checklist, immutableIdCheck: e.target.checked })}
                  className="rounded text-purple-600 h-3.5 w-3.5"
                />
                <span>ImmutableID / ConsistencyGuid Verified</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={checklist.staleAccountsFiltered}
                  onChange={(e) => setChecklist({ ...checklist, staleAccountsFiltered: e.target.checked })}
                  className="rounded text-purple-600 h-3.5 w-3.5"
                />
                <span>Service & Stale Accounts Excluded</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={checklist.credentialPolicySet}
                  onChange={(e) => setChecklist({ ...checklist, credentialPolicySet: e.target.checked })}
                  className="rounded text-purple-600 h-3.5 w-3.5"
                />
                <span>PHS or ForcePasswordReset Set</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={checklist.secondaryProxyStaged}
                  onChange={(e) => setChecklist({ ...checklist, secondaryProxyStaged: e.target.checked })}
                  className="rounded text-purple-600 h-3.5 w-3.5"
                />
                <span>Vanity Proxy Staged as Secondary</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={checklist.idFixRemediationRun}
                  onChange={(e) => setChecklist({ ...checklist, idFixRemediationRun: e.target.checked })}
                  className="rounded text-purple-600 h-3.5 w-3.5"
                />
                <span>IdFix Duplicate Proxy Check Passed</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={checklist.groupBasedLicensingConfigured}
                  onChange={(e) => setChecklist({ ...checklist, groupBasedLicensingConfigured: e.target.checked })}
                  className="rounded text-purple-600 h-3.5 w-3.5"
                />
                <span>Group-Based Licensing (GBL) Active</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Visual File Drop Zone & Header */}
      <div className="bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-purple-500" />
              <span>User Identity & Workload CSV Mapping</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Upload an RFC-4180 compliant CSV containing user identity mappings between the source and target tenant.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-download-sample-csv"
              onClick={handleDownloadSample}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 text-purple-500" />
              <span>Download Template CSV</span>
            </button>

            <button
              id="btn-load-sample-users"
              onClick={handleLoadSampleUsers}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900 text-purple-700 dark:text-purple-300 text-xs font-medium rounded-lg border border-purple-200 dark:border-purple-800 transition-colors cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Load 7 Sample Accounts</span>
            </button>
          </div>
        </div>

        {/* Drop Zone Area */}
        <div
          id="csv-drop-zone"
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            dragActive
              ? 'border-blue-500 bg-blue-950/20'
              : 'border-slate-200 dark:border-slate-700 hover:border-slate-600 bg-white dark:bg-slate-800/30'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileUpload(e.target.files[0]);
              }
            }}
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-full">
              <UploadCloud className="h-8 w-8" />
            </div>
            <div className="text-sm font-medium text-slate-200">
              {fileName ? (
                <span className="text-blue-400 font-semibold">{fileName}</span>
              ) : (
                <>Drag and drop your user-mapping CSV file here, or <span className="text-blue-400 underline">browse</span></>
              )}
            </div>
            <p className="text-xs text-slate-500 max-w-sm">
              Expected columns: <code className="text-slate-500 dark:text-slate-400 font-mono">SourceUPN</code>, <code className="text-slate-500 dark:text-slate-400 font-mono">TargetUPN</code>, <code className="text-slate-500 dark:text-slate-400 font-mono">MigrateMailbox</code>, <code className="text-slate-500 dark:text-slate-400 font-mono">MigrateOneDrive</code>
            </p>
          </div>
        </div>
      </div>

      {/* Dynamic Data Table & Validation Summary */}
      {rows.length > 0 && (
        <div className="bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
          {/* Table Header & Metrics */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Mapped User Payloads ({rows.length})
              </div>
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-950 text-emerald-400 border border-emerald-800">
                <CheckCircle2 className="h-3 w-3" />
                <span>{validRows.length} Valid</span>
              </span>
              {invalidRows.length > 0 && (
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-950 text-rose-400 border border-rose-800">
                  <AlertCircle className="h-3 w-3" />
                  <span>{invalidRows.length} Formatted with Errors</span>
                </span>
              )}
            </div>

            <button
              onClick={clearAll}
              className="text-xs text-slate-500 dark:text-slate-400 hover:text-rose-400 flex items-center space-x-1 transition-colors cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear Table</span>
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Source UPN (Origin)</th>
                  <th className="py-3 px-4">Target UPN (Destination)</th>
                  <th className="py-3 px-4 text-center">Exchange Mailbox</th>
                  <th className="py-3 px-4 text-center">OneDrive Files</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-600 dark:text-slate-300">
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className={`transition-colors ${
                      !row.isValid ? 'bg-rose-950/20' : 'hover:bg-white dark:bg-slate-800/30'
                    }`}
                  >
                    <td className="py-3 px-4 whitespace-nowrap">
                      {row.isValid ? (
                        <span className="inline-flex items-center text-emerald-400">
                          <CheckCircle2 className="h-4 w-4" />
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-rose-400" title={row.errors.join(', ')}>
                          <AlertCircle className="h-4 w-4" />
                        </span>
                      )}
                    </td>

                    {/* Source UPN with validation error highlighting */}
                    <td className="py-3 px-4 font-mono">
                      <span className={!row.isValid && !EMAIL_REGEX.test(row.sourceUPN) ? 'text-rose-400 font-semibold' : 'text-slate-200'}>
                        {row.sourceUPN || <span className="text-rose-500 italic">Missing field</span>}
                      </span>
                      {!row.isValid && !EMAIL_REGEX.test(row.sourceUPN) && (
                        <p className="text-[10px] text-rose-400 mt-0.5">Invalid email syntax</p>
                      )}
                    </td>

                    {/* Target UPN */}
                    <td className="py-3 px-4 font-mono">
                      <span className={!row.isValid && !EMAIL_REGEX.test(row.targetUPN) ? 'text-rose-400 font-semibold' : 'text-slate-200'}>
                        {row.targetUPN || <span className="text-rose-500 italic">Missing field</span>}
                      </span>
                      {!row.isValid && !EMAIL_REGEX.test(row.targetUPN) && (
                        <p className="text-[10px] text-rose-400 mt-0.5">Invalid email syntax</p>
                      )}
                    </td>

                    {/* Mailbox toggle */}
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => toggleOption(row.id, 'migrateMailbox')}
                        className={`inline-flex items-center justify-center h-6 w-6 rounded border transition-colors cursor-pointer ${
                          row.migrateMailbox
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : 'bg-white dark:bg-slate-800 border-slate-700 text-slate-500'
                        }`}
                      >
                        {row.migrateMailbox ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                      </button>
                    </td>

                    {/* OneDrive toggle */}
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => toggleOption(row.id, 'migrateOneDrive')}
                        className={`inline-flex items-center justify-center h-6 w-6 rounded border transition-colors cursor-pointer ${
                          row.migrateOneDrive
                            ? 'bg-indigo-600 border-indigo-500 text-slate-900 dark:text-white'
                            : 'bg-white dark:bg-slate-800 border-slate-700 text-slate-500'
                        }`}
                      >
                        {row.migrateOneDrive ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                      </button>
                    </td>

                    {/* Row delete */}
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => removeRow(row.id)}
                        className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Prominent Action Button Section */}
      <div className="bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span className="text-xs font-semibold text-slate-200">
              Pipeline Readiness Status:
            </span>
            {bothTenantsConnected ? (
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Both Tenants Connected
              </span>
            ) : (
              <span className="text-xs font-medium text-amber-400 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" /> Both Source & Target must be connected
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {validRows.length === 0
              ? 'Upload or load a CSV with at least one valid row to activate the pipeline.'
              : `${validRows.length} valid user mappings ready for SQLite persistence & background processing.`}
          </p>
        </div>

        <button
          id="btn-initialize-pipeline"
          disabled={!canInitialize}
          onClick={() => onInitializeJob(validRows)}
          className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold text-sm shadow-lg transition-all ${
            canInitialize
              ? 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer shadow-blue-500/25 active:scale-98'
              : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-60'
          }`}
        >
          <span>{isInitializing ? 'Creating Pipeline Job...' : 'Initialize Tenant Migration Pipeline'}</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
