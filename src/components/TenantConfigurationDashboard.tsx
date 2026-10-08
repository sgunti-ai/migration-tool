import React, { useState, useEffect } from 'react';
import { 
  Building2, Save, RotateCcw, HelpCircle, Key, Globe, CheckCircle, 
  Settings2, FileType, HardDrive, AlertTriangle, Calendar, Users, 
  Wand2, Shield, Play, Lock, FileClock, History, Link, Eye, EyeOff,
  Check, X, Sparkles, RefreshCw, ExternalLink, ArrowRight, ShieldCheck,
  Zap, Server, Trash2, ArrowUpRight, CheckCircle2, AlertCircle
} from 'lucide-react';
import { TenantStatusResponse, AdminRole } from '../types';

interface TenantConfigurationDashboardProps {
  tenantStatus?: TenantStatusResponse;
  onRefresh?: () => void;
  currentRole?: AdminRole;
  onNavigateTab?: (tab: any, subTab?: any) => void;
}

interface TestResult {
  loading: boolean;
  success?: boolean;
  message?: string;
  latencyMs?: number;
  authorityUrl?: string;
  timestamp?: string;
}

export const TenantConfigurationDashboard: React.FC<TenantConfigurationDashboardProps> = ({
  tenantStatus,
  onRefresh,
  currentRole = 'GLOBAL_ADMIN',
  onNavigateTab,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'config' | 'policies' | 'mapping'>('config');
  const [showConfirm, setShowConfirm] = useState<'save' | 'reset' | 'disconnect_source' | 'disconnect_target' | null>(null);
  
  // Toast notifications
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info' | 'warning'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Password / Secret visibility toggles
  const [showSourceSecret, setShowSourceSecret] = useState(false);
  const [showTargetSecret, setShowTargetSecret] = useState(false);

  // Tenant Connection Form State
  const [configState, setConfigState] = useState({
    // Source
    sourceDomain: tenantStatus?.source?.domain || 'contoso.onmicrosoft.com',
    sourceDisplayName: tenantStatus?.source?.displayName || 'Contoso Enterprise Corp',
    sourceTenantId: tenantStatus?.source?.tenantId || '9188040d-6c67-4c5b-b112-36a304b66dad',
    sourceClientId: tenantStatus?.source?.clientId || 'a8b9c0d1-e2f3-4g5h-6i7j-8k9l0m1n2o3p',
    sourceClientSecret: '••••••••••••••••••••••••••••••••',
    sourceCloudEnv: tenantStatus?.source?.cloudEnvironment || 'PUBLIC',

    // Target
    targetDomain: tenantStatus?.target?.domain || 'fabrikam.com',
    targetDisplayName: tenantStatus?.target?.displayName || 'Fabrikam Global Cloud',
    targetTenantId: tenantStatus?.target?.tenantId || '8266040d-6c67-4c5b-b112-99a304b66bab',
    targetClientId: tenantStatus?.target?.clientId || 'b1c2d3e4-f5g6-7h8i-9j0k-1l2m3n4o5p6q',
    targetClientSecret: '••••••••••••••••••••••••••••••••',
    targetCloudEnv: tenantStatus?.target?.cloudEnvironment || 'PUBLIC',
  });

  // Sync with prop when external status changes
  useEffect(() => {
    if (tenantStatus) {
      setConfigState(prev => ({
        ...prev,
        sourceDomain: tenantStatus.source?.domain || prev.sourceDomain,
        sourceDisplayName: tenantStatus.source?.displayName || prev.sourceDisplayName,
        sourceTenantId: tenantStatus.source?.tenantId || prev.sourceTenantId,
        sourceClientId: tenantStatus.source?.clientId || prev.sourceClientId,
        sourceCloudEnv: tenantStatus.source?.cloudEnvironment || prev.sourceCloudEnv,

        targetDomain: tenantStatus.target?.domain || prev.targetDomain,
        targetDisplayName: tenantStatus.target?.displayName || prev.targetDisplayName,
        targetTenantId: tenantStatus.target?.tenantId || prev.targetTenantId,
        targetClientId: tenantStatus.target?.clientId || prev.targetClientId,
        targetCloudEnv: tenantStatus.target?.cloudEnvironment || prev.targetCloudEnv,
      }));
    }
  }, [tenantStatus]);

  // Migration Policy State
  const [policyState, setPolicyState] = useState({
    preservePermissions: true,
    preserveVersions: true,
    maxVersionCount: 10,
    preserveTimestamps: true,
    preserveMailboxRules: true,
    preserveDelegations: true,
    excludeHiddenItems: true,
    excludeExtensions: '.exe, .dll, .tmp, .iso, .bak',
    maxFileSize: 15,
    quotaLimit: 85,
    conflictResolution: 'skip',
    scheduleWindow: 'off-peak',
    parallelWorkers: 16,
  });

  // User Mapping Rules State
  const [mappingState, setMappingState] = useState({
    template: 'upn-match',
    domainTransformSource: '@contoso.onmicrosoft.com',
    domainTransformTarget: '@fabrikam.com',
    algorithm: 'fuzzy-match',
    manualOverride: true,
    prefixRule: 'keep_prefix',
  });

  // Test Connection Results
  const [sourceTestResult, setSourceTestResult] = useState<TestResult | null>(null);
  const [targetTestResult, setTargetTestResult] = useState<TestResult | null>(null);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [isConnectingSource, setIsConnectingSource] = useState(false);
  const [isConnectingTarget, setIsConnectingTarget] = useState(false);

  // Live test input for user mapping sandbox
  const [sampleEmailInput, setSampleEmailInput] = useState('alex.wilson@contoso.onmicrosoft.com');

  // Fetch initial policies from backend if available
  useEffect(() => {
    fetch('/api/tenants/policies')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setPolicyState(prev => ({
            ...prev,
            preservePermissions: data.preservePermissions ?? prev.preservePermissions,
            preserveVersions: data.preserveVersions ?? prev.preserveVersions,
            preserveTimestamps: data.preserveTimestamps ?? prev.preserveTimestamps,
            preserveMailboxRules: data.preserveMailboxRules ?? prev.preserveMailboxRules,
            preserveDelegations: data.preserveDelegations ?? prev.preserveDelegations,
            excludeExtensions: data.excludeExtensions ?? prev.excludeExtensions,
            maxFileSize: data.maxFileSize ?? prev.maxFileSize,
            quotaLimit: data.quotaLimit ?? prev.quotaLimit,
            conflictResolution: data.conflictResolution ?? prev.conflictResolution,
            scheduleWindow: data.scheduleWindow ?? prev.scheduleWindow,
            parallelWorkers: data.parallelWorkers ?? prev.parallelWorkers,
          }));

          setMappingState(prev => ({
            ...prev,
            template: data.template ?? prev.template,
            domainTransformSource: data.domainTransformSource ?? prev.domainTransformSource,
            domainTransformTarget: data.domainTransformTarget ?? prev.domainTransformTarget,
            algorithm: data.algorithm ?? prev.algorithm,
            manualOverride: data.manualOverride ?? prev.manualOverride,
          }));
        }
      })
      .catch(() => {});
  }, []);

  // Compute live mapped email
  const computedMappedEmail = React.useMemo(() => {
    if (!sampleEmailInput) return '';
    const srcDomain = mappingState.domainTransformSource.replace(/^@/, '');
    const tgtDomain = mappingState.domainTransformTarget.replace(/^@/, '');
    
    if (sampleEmailInput.includes('@')) {
      const [user, domain] = sampleEmailInput.split('@');
      if (domain.toLowerCase() === srcDomain.toLowerCase() || domain.toLowerCase().includes('contoso')) {
        return `${user}@${tgtDomain}`;
      }
      return `${user}@${tgtDomain}`;
    }
    return `${sampleEmailInput}@${tgtDomain}`;
  }, [sampleEmailInput, mappingState.domainTransformSource, mappingState.domainTransformTarget]);

  // Test connection to Entra ID
  const handleTestConnection = async (type: 'SOURCE' | 'TARGET') => {
    const isSource = type === 'SOURCE';
    const domain = isSource ? configState.sourceDomain : configState.targetDomain;
    const clientId = isSource ? configState.sourceClientId : configState.targetClientId;
    const tenantId = isSource ? configState.sourceTenantId : configState.targetTenantId;
    const cloudEnv = isSource ? configState.sourceCloudEnv : configState.targetCloudEnv;

    if (!domain.trim()) {
      showToast(`Please enter a valid domain for ${isSource ? 'Source' : 'Target'} tenant.`, 'warning');
      return;
    }

    const setResult = isSource ? setSourceTestResult : setTargetTestResult;
    setResult({ loading: true });

    try {
      const res = await fetch('/api/auth/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantType: type,
          domain: domain.trim(),
          clientId,
          tenantId,
          cloudEnvironment: cloudEnv,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setResult({
          loading: false,
          success: true,
          message: data.message || `Endpoint ${data.authorityUrl} responded with 200 OK`,
          latencyMs: data.latencyMs,
          authorityUrl: data.authorityUrl,
          timestamp: new Date().toLocaleTimeString(),
        });
        showToast(`Connection to ${domain} validated successfully! (${data.latencyMs}ms)`, 'success');
      } else {
        setResult({
          loading: false,
          success: false,
          message: data.error || 'Failed to reach Microsoft Entra authority endpoint',
          timestamp: new Date().toLocaleTimeString(),
        });
        showToast(data.error || 'Connection test failed', 'error');
      }
    } catch (err: any) {
      setResult({
        loading: false,
        success: false,
        message: err.message || 'Network error while testing connection',
        timestamp: new Date().toLocaleTimeString(),
      });
      showToast('Network error while testing endpoint', 'error');
    }
  };

  // Connect / Save single tenant
  const handleConnectTenant = async (type: 'SOURCE' | 'TARGET') => {
    const isSource = type === 'SOURCE';
    const domain = isSource ? configState.sourceDomain : configState.targetDomain;
    const displayName = isSource ? configState.sourceDisplayName : configState.targetDisplayName;
    const tenantId = isSource ? configState.sourceTenantId : configState.targetTenantId;
    const clientId = isSource ? configState.sourceClientId : configState.targetClientId;
    const cloudEnv = isSource ? configState.sourceCloudEnv : configState.targetCloudEnv;

    if (!domain.trim()) {
      showToast(`Please enter a domain for ${isSource ? 'Source' : 'Target'} tenant.`, 'warning');
      return;
    }

    if (isSource) setIsConnectingSource(true);
    else setIsConnectingTarget(true);

    try {
      const res = await fetch('/api/auth/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-role': currentRole,
        },
        body: JSON.stringify({
          tenantType: type,
          domain: domain.trim(),
          displayName: displayName.trim(),
          tenantId: tenantId.trim(),
          clientId: clientId.trim(),
          cloudEnvironment: cloudEnv,
        }),
      });

      if (res.ok) {
        showToast(`${type === 'SOURCE' ? 'Source' : 'Target'} tenant (${domain}) successfully connected & saved!`, 'success');
        if (onRefresh) onRefresh();
      } else {
        const errData = await res.json();
        showToast(errData.error || 'Failed to connect tenant', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Connection error', 'error');
    } finally {
      if (isSource) setIsConnectingSource(false);
      else setIsConnectingTarget(false);
    }
  };

  // Disconnect tenant
  const handleDisconnect = async (type: 'SOURCE' | 'TARGET') => {
    try {
      const res = await fetch(`/api/auth/disconnect/${type.toLowerCase()}`, {
        method: 'POST',
        headers: { 'x-admin-role': currentRole },
      });

      if (res.ok) {
        showToast(`${type} tenant disconnected successfully.`, 'info');
        setShowConfirm(null);
        if (onRefresh) onRefresh();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to disconnect', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to disconnect', 'error');
    }
  };

  // Save All Configurations & Policies
  const handleSaveAll = async () => {
    setIsSavingAll(true);
    try {
      // 1. Save Source Tenant
      await fetch('/api/auth/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-role': currentRole,
        },
        body: JSON.stringify({
          tenantType: 'SOURCE',
          domain: configState.sourceDomain.trim(),
          displayName: configState.sourceDisplayName.trim(),
          tenantId: configState.sourceTenantId.trim(),
          clientId: configState.sourceClientId.trim(),
          cloudEnvironment: configState.sourceCloudEnv,
        }),
      });

      // 2. Save Target Tenant
      await fetch('/api/auth/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-role': currentRole,
        },
        body: JSON.stringify({
          tenantType: 'TARGET',
          domain: configState.targetDomain.trim(),
          displayName: configState.targetDisplayName.trim(),
          tenantId: configState.targetTenantId.trim(),
          clientId: configState.targetClientId.trim(),
          cloudEnvironment: configState.targetCloudEnv,
        }),
      });

      // 3. Save Migration Policies & User Mapping
      await fetch('/api/tenants/policies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-role': currentRole,
        },
        body: JSON.stringify({
          ...policyState,
          ...mappingState,
        }),
      });

      // Save to localStorage as backup
      localStorage.setItem('tenant_config_policies', JSON.stringify({ policyState, mappingState }));

      showToast('All tenant configurations, migration policies, and mapping rules saved successfully!', 'success');
      setShowConfirm(null);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Failed to save configurations', 'error');
    } finally {
      setIsSavingAll(false);
    }
  };

  // Quick Sandbox Pair loader
  const handleConnectSandboxPair = async () => {
    const sandboxConfig = {
      sourceDomain: 'contoso.onmicrosoft.com',
      sourceDisplayName: 'Contoso Enterprise Corp (Source)',
      sourceTenantId: '9188040d-6c67-4c5b-b112-36a304b66dad',
      sourceClientId: 'a8b9c0d1-e2f3-4g5h-6i7j-8k9l0m1n2o3p',
      sourceClientSecret: '••••••••••••••••••••••••••••••••',
      sourceCloudEnv: 'PUBLIC',

      targetDomain: 'fabrikam.com',
      targetDisplayName: 'Fabrikam Global Cloud (Target)',
      targetTenantId: '8266040d-6c67-4c5b-b112-99a304b66bab',
      targetClientId: 'b1c2d3e4-f5g6-7h8i-9j0k-1l2m3n4o5p6q',
      targetClientSecret: '••••••••••••••••••••••••••••••••',
      targetCloudEnv: 'PUBLIC',
    };

    setConfigState(sandboxConfig);

    try {
      await fetch('/api/auth/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-role': currentRole },
        body: JSON.stringify({
          tenantType: 'SOURCE',
          domain: sandboxConfig.sourceDomain,
          displayName: sandboxConfig.sourceDisplayName,
          tenantId: sandboxConfig.sourceTenantId,
          clientId: sandboxConfig.sourceClientId,
          cloudEnvironment: sandboxConfig.sourceCloudEnv,
        }),
      });

      await fetch('/api/auth/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-role': currentRole },
        body: JSON.stringify({
          tenantType: 'TARGET',
          domain: sandboxConfig.targetDomain,
          displayName: sandboxConfig.targetDisplayName,
          tenantId: sandboxConfig.targetTenantId,
          clientId: sandboxConfig.targetClientId,
          cloudEnvironment: sandboxConfig.targetCloudEnv,
        }),
      });

      showToast('Enterprise Sandbox Pair (Contoso ➔ Fabrikam) connected & ready!', 'success');
      if (onRefresh) onRefresh();
    } catch (err: any) {
      showToast('Loaded sandbox presets locally.', 'info');
    }
  };

  // Reset to default settings
  const handleResetDefaults = () => {
    setConfigState({
      sourceDomain: 'contoso.onmicrosoft.com',
      sourceDisplayName: 'Contoso Enterprise Corp',
      sourceTenantId: '9188040d-6c67-4c5b-b112-36a304b66dad',
      sourceClientId: 'a8b9c0d1-e2f3-4g5h-6i7j-8k9l0m1n2o3p',
      sourceClientSecret: '••••••••••••••••••••••••••••••••',
      sourceCloudEnv: 'PUBLIC',

      targetDomain: 'fabrikam.com',
      targetDisplayName: 'Fabrikam Global Cloud',
      targetTenantId: '8266040d-6c67-4c5b-b112-99a304b66bab',
      targetClientId: 'b1c2d3e4-f5g6-7h8i-9j0k-1l2m3n4o5p6q',
      targetClientSecret: '••••••••••••••••••••••••••••••••',
      targetCloudEnv: 'PUBLIC',
    });

    setPolicyState({
      preservePermissions: true,
      preserveVersions: true,
      maxVersionCount: 10,
      preserveTimestamps: true,
      preserveMailboxRules: true,
      preserveDelegations: true,
      excludeHiddenItems: true,
      excludeExtensions: '.exe, .dll, .tmp, .iso, .bak',
      maxFileSize: 15,
      quotaLimit: 85,
      conflictResolution: 'skip',
      scheduleWindow: 'off-peak',
      parallelWorkers: 16,
    });

    setMappingState({
      template: 'upn-match',
      domainTransformSource: '@contoso.onmicrosoft.com',
      domainTransformTarget: '@fabrikam.com',
      algorithm: 'fuzzy-match',
      manualOverride: true,
      prefixRule: 'keep_prefix',
    });

    showToast('Reset all configurations to factory defaults.', 'info');
    setShowConfirm(null);
  };

  // Check connection status
  const isSourceConnected = tenantStatus?.source?.connected ?? true;
  const isTargetConnected = tenantStatus?.target?.connected ?? true;

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 min-h-[850px] border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm text-slate-900 dark:text-slate-100 transition-colors">
      
      {/* Toast notification banner */}
      {toast && (
        <div className="p-3 px-6 text-sm font-medium flex items-center justify-between transition-all border-b shadow-sm animate-fadeIn"
          style={{
            backgroundColor: toast.type === 'success' ? '#064e3b' : toast.type === 'error' ? '#7f1d1d' : toast.type === 'warning' ? '#78350f' : '#1e3a8a',
            color: '#ffffff',
            borderColor: toast.type === 'success' ? '#059669' : toast.type === 'error' ? '#dc2626' : toast.type === 'warning' ? '#d97706' : '#2563eb'
          }}
        >
          <div className="flex items-center space-x-2">
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />}
            {toast.type === 'error' && <AlertTriangle className="w-4 h-4 text-red-300 shrink-0" />}
            {toast.type === 'warning' && <AlertCircle className="w-4 h-4 text-amber-300 shrink-0" />}
            {toast.type === 'info' && <ShieldCheck className="w-4 h-4 text-sky-300 shrink-0" />}
            <span>{toast.message}</span>
          </div>
          <button onClick={() => setToast(null)} className="p-1 hover:bg-white/20 rounded transition">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="px-6 py-5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">Tenant Configurations & Connectivity</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Manage Microsoft Entra ID endpoints, tenant certificates, migration governance policies, and automated user mapping.
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button 
            onClick={handleConnectSandboxPair}
            className="flex items-center space-x-1.5 px-3 py-2 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-lg text-xs font-semibold transition shadow-sm cursor-pointer"
            title="Pre-populate and connect Contoso -> Fabrikam demo sandbox pair"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Connect Sandbox Pair</span>
          </button>

          <button 
            onClick={() => setShowConfirm('reset')}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 rounded-lg text-xs font-medium transition cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
            <span>Reset Defaults</span>
          </button>

          <button 
            onClick={() => setShowConfirm('save')}
            disabled={isSavingAll}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition shadow-sm cursor-pointer disabled:opacity-50"
          >
            {isSavingAll ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            <span>Save All Configurations</span>
          </button>
        </div>
      </div>

      {/* Navigation Subtabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 gap-1 overflow-x-auto">
        <button 
          onClick={() => setActiveSubTab('config')} 
          className={`px-4 py-3 text-sm font-semibold border-b-2 flex items-center space-x-2 transition whitespace-nowrap cursor-pointer ${
            activeSubTab === 'config' 
              ? 'border-blue-600 text-blue-600 dark:text-blue-400' 
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Building2 className="h-4 w-4" />
          <span>Tenant Connections & Endpoints</span>
          <span className="ml-1.5 px-1.5 py-0.5 text-[10px] rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {isSourceConnected && isTargetConnected ? '2/2 Active' : 'Config'}
          </span>
        </button>

        <button 
          onClick={() => setActiveSubTab('policies')} 
          className={`px-4 py-3 text-sm font-semibold border-b-2 flex items-center space-x-2 transition whitespace-nowrap cursor-pointer ${
            activeSubTab === 'policies' 
              ? 'border-blue-600 text-blue-600 dark:text-blue-400' 
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Settings2 className="h-4 w-4" />
          <span>Migration Policies</span>
        </button>

        <button 
          onClick={() => setActiveSubTab('mapping')} 
          className={`px-4 py-3 text-sm font-semibold border-b-2 flex items-center space-x-2 transition whitespace-nowrap cursor-pointer ${
            activeSubTab === 'mapping' 
              ? 'border-blue-600 text-blue-600 dark:text-blue-400' 
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>User Mapping & Transforms</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="p-6 overflow-y-auto flex-1 space-y-6">

        {/* ========================================================================= */}
        {/* SUBTAB 1: TENANT CONFIGURATION & CONNECTION ENDPOINTS */}
        {/* ========================================================================= */}
        {activeSubTab === 'config' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Context Info Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl gap-3">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-blue-500/10 text-blue-500 dark:text-blue-400 rounded-lg shrink-0 mt-0.5">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Dual Microsoft 365 Tenant Federation
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Credentials, secrets, and refresh tokens are encrypted at rest using AES-256-GCM. You can directly edit the credentials below or test the connection against the Microsoft Graph endpoints.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  Active Pair: <strong className="text-blue-600 dark:text-blue-400">{configState.sourceDomain}</strong> ➔ <strong className="text-emerald-600 dark:text-emerald-400">{configState.targetDomain}</strong>
                </span>
              </div>
            </div>

            {/* Side-by-Side Tenant Editing Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* SOURCE TENANT CARD */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4 flex flex-col justify-between">
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Step 1 • Origin</span>
                        <h2 className="text-base font-bold text-slate-900 dark:text-white">Source Tenant</h2>
                      </div>
                    </div>
                    {isSourceConnected ? (
                      <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 text-xs font-semibold rounded-full flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Connected
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 text-xs font-medium rounded-full">
                        Not Connected
                      </span>
                    )}
                  </div>

                  {/* Form Fields */}
                  <div className="space-y-3.5 mt-4">
                    {/* Primary Domain */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                        <span>Tenant Primary Domain</span>
                        <span className="text-[11px] font-normal text-slate-400">e.g. contoso.onmicrosoft.com</span>
                      </label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                        <input 
                          type="text" 
                          value={configState.sourceDomain} 
                          onChange={e => setConfigState({ ...configState, sourceDomain: e.target.value })}
                          placeholder="contoso.onmicrosoft.com"
                          className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" 
                        />
                      </div>
                    </div>

                    {/* Display Name */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Organization Display Name
                      </label>
                      <input 
                        type="text" 
                        value={configState.sourceDisplayName} 
                        onChange={e => setConfigState({ ...configState, sourceDisplayName: e.target.value })}
                        placeholder="Contoso Enterprise Corp"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" 
                      />
                    </div>

                    {/* Directory (Tenant) ID */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                        <span>Directory (Tenant) ID</span>
                        <button 
                          type="button"
                          onClick={() => setConfigState({ ...configState, sourceTenantId: '9188040d-6c67-4c5b-b112-36a304b66dad' })}
                          className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Sample GUID
                        </button>
                      </label>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                        <input 
                          type="text" 
                          value={configState.sourceTenantId} 
                          onChange={e => setConfigState({ ...configState, sourceTenantId: e.target.value })}
                          placeholder="00000000-0000-0000-0000-000000000000"
                          className="w-full pl-9 pr-3 py-2 font-mono text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" 
                        />
                      </div>
                    </div>

                    {/* App Registration Client ID */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                        <span>Application (Client) ID</span>
                        <span title="The Client ID of the enterprise application registered in Azure Portal"><HelpCircle className="w-3.5 h-3.5 text-slate-400" /></span>
                      </label>
                      <input 
                        type="text" 
                        value={configState.sourceClientId} 
                        onChange={e => setConfigState({ ...configState, sourceClientId: e.target.value })}
                        placeholder="a8b9c0d1-e2f3-4g5h-6i7j-8k9l0m1n2o3p"
                        className="w-full px-3 py-2 font-mono text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" 
                      />
                    </div>

                    {/* Client Secret */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                        <span>Client Secret / Certificate Key</span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <Lock className="w-3 h-3" /> AES-256 Encrypted
                        </span>
                      </label>
                      <div className="relative">
                        <input 
                          type={showSourceSecret ? "text" : "password"} 
                          value={configState.sourceClientSecret} 
                          onChange={e => setConfigState({ ...configState, sourceClientSecret: e.target.value })}
                          placeholder="Enter client secret"
                          className="w-full px-3 py-2 pr-10 font-mono text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" 
                        />
                        <button
                          type="button"
                          onClick={() => setShowSourceSecret(!showSourceSecret)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        >
                          {showSourceSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Microsoft Cloud Environment */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Microsoft Cloud Authority
                      </label>
                      <select 
                        value={configState.sourceCloudEnv}
                        onChange={e => setConfigState({ ...configState, sourceCloudEnv: e.target.value })}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                      >
                        <option value="PUBLIC">Azure Public Commercial (login.microsoftonline.com)</option>
                        <option value="US_GOV_GCC_HIGH">Azure US Government GCC High (login.microsoftonline.us)</option>
                        <option value="DOD">Azure US DoD (login.microsoftonline.us)</option>
                        <option value="CHINA">Azure 21Vianet China (login.partner.microsoftonline.cn)</option>
                      </select>
                    </div>

                    {/* Test Result Indicator */}
                    {sourceTestResult && (
                      <div className={`p-3 rounded-lg text-xs border ${
                        sourceTestResult.loading 
                          ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                          : sourceTestResult.success 
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300' 
                            : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
                      }`}>
                        {sourceTestResult.loading ? (
                          <div className="flex items-center space-x-2">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Pinging Microsoft Entra token endpoint & validating realm...</span>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-semibold flex items-center gap-1">
                                {sourceTestResult.success ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
                                <span>{sourceTestResult.success ? 'Endpoint Verified (200 OK)' : 'Validation Failed'}</span>
                              </div>
                              <p className="mt-0.5 text-[11px] opacity-90">{sourceTestResult.message}</p>
                            </div>
                            {sourceTestResult.latencyMs && (
                              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                                {sourceTestResult.latencyMs}ms
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button 
                    type="button"
                    onClick={() => handleTestConnection('SOURCE')}
                    disabled={sourceTestResult?.loading}
                    className="flex-1 py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition cursor-pointer"
                  >
                    {sourceTestResult?.loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 text-blue-500" />}
                    <span>Test Connection</span>
                  </button>

                  <button 
                    type="button"
                    onClick={() => handleConnectTenant('SOURCE')}
                    disabled={isConnectingSource}
                    className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {isConnectingSource ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span>Connect & Save</span>
                  </button>

                  {isSourceConnected && (
                    <button 
                      type="button"
                      onClick={() => setShowConfirm('disconnect_source')}
                      className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                      title="Disconnect Source Tenant"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* TARGET TENANT CARD */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4 flex flex-col justify-between">
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/40">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Step 2 • Destination</span>
                        <h2 className="text-base font-bold text-slate-900 dark:text-white">Target Tenant</h2>
                      </div>
                    </div>
                    {isTargetConnected ? (
                      <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 text-xs font-semibold rounded-full flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Connected
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 text-xs font-medium rounded-full">
                        Not Connected
                      </span>
                    )}
                  </div>

                  {/* Form Fields */}
                  <div className="space-y-3.5 mt-4">
                    {/* Primary Domain */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                        <span>Tenant Primary Domain</span>
                        <span className="text-[11px] font-normal text-slate-400">e.g. fabrikam.com</span>
                      </label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                        <input 
                          type="text" 
                          value={configState.targetDomain} 
                          onChange={e => setConfigState({ ...configState, targetDomain: e.target.value })}
                          placeholder="fabrikam.com"
                          className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition" 
                        />
                      </div>
                    </div>

                    {/* Display Name */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Organization Display Name
                      </label>
                      <input 
                        type="text" 
                        value={configState.targetDisplayName} 
                        onChange={e => setConfigState({ ...configState, targetDisplayName: e.target.value })}
                        placeholder="Fabrikam Global Cloud"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition" 
                      />
                    </div>

                    {/* Directory (Tenant) ID */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                        <span>Directory (Tenant) ID</span>
                        <button 
                          type="button"
                          onClick={() => setConfigState({ ...configState, targetTenantId: '8266040d-6c67-4c5b-b112-99a304b66bab' })}
                          className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          Sample GUID
                        </button>
                      </label>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                        <input 
                          type="text" 
                          value={configState.targetTenantId} 
                          onChange={e => setConfigState({ ...configState, targetTenantId: e.target.value })}
                          placeholder="00000000-0000-0000-0000-000000000000"
                          className="w-full pl-9 pr-3 py-2 font-mono text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition" 
                        />
                      </div>
                    </div>

                    {/* App Registration Client ID */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                        <span>Application (Client) ID</span>
                        <span title="The Client ID registered in target tenant"><HelpCircle className="w-3.5 h-3.5 text-slate-400" /></span>
                      </label>
                      <input 
                        type="text" 
                        value={configState.targetClientId} 
                        onChange={e => setConfigState({ ...configState, targetClientId: e.target.value })}
                        placeholder="b1c2d3e4-f5g6-7h8i-9j0k-1l2m3n4o5p6q"
                        className="w-full px-3 py-2 font-mono text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition" 
                      />
                    </div>

                    {/* Client Secret */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                        <span>Client Secret / Certificate Key</span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <Lock className="w-3 h-3" /> AES-256 Encrypted
                        </span>
                      </label>
                      <div className="relative">
                        <input 
                          type={showTargetSecret ? "text" : "password"} 
                          value={configState.targetClientSecret} 
                          onChange={e => setConfigState({ ...configState, targetClientSecret: e.target.value })}
                          placeholder="Enter client secret"
                          className="w-full px-3 py-2 pr-10 font-mono text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition" 
                        />
                        <button
                          type="button"
                          onClick={() => setShowTargetSecret(!showTargetSecret)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        >
                          {showTargetSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Microsoft Cloud Environment */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Microsoft Cloud Authority
                      </label>
                      <select 
                        value={configState.targetCloudEnv}
                        onChange={e => setConfigState({ ...configState, targetCloudEnv: e.target.value })}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                      >
                        <option value="PUBLIC">Azure Public Commercial (login.microsoftonline.com)</option>
                        <option value="US_GOV_GCC_HIGH">Azure US Government GCC High (login.microsoftonline.us)</option>
                        <option value="DOD">Azure US DoD (login.microsoftonline.us)</option>
                        <option value="CHINA">Azure 21Vianet China (login.partner.microsoftonline.cn)</option>
                      </select>
                    </div>

                    {/* Test Result Indicator */}
                    {targetTestResult && (
                      <div className={`p-3 rounded-lg text-xs border ${
                        targetTestResult.loading 
                          ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300'
                          : targetTestResult.success 
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300' 
                            : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
                      }`}>
                        {targetTestResult.loading ? (
                          <div className="flex items-center space-x-2">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Pinging Microsoft Entra token endpoint & validating realm...</span>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-semibold flex items-center gap-1">
                                {targetTestResult.success ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
                                <span>{targetTestResult.success ? 'Endpoint Verified (200 OK)' : 'Validation Failed'}</span>
                              </div>
                              <p className="mt-0.5 text-[11px] opacity-90">{targetTestResult.message}</p>
                            </div>
                            {targetTestResult.latencyMs && (
                              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                                {targetTestResult.latencyMs}ms
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button 
                    type="button"
                    onClick={() => handleTestConnection('TARGET')}
                    disabled={targetTestResult?.loading}
                    className="flex-1 py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition cursor-pointer"
                  >
                    {targetTestResult?.loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 text-indigo-500" />}
                    <span>Test Connection</span>
                  </button>

                  <button 
                    type="button"
                    onClick={() => handleConnectTenant('TARGET')}
                    disabled={isConnectingTarget}
                    className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {isConnectingTarget ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span>Connect & Save</span>
                  </button>

                  {isTargetConnected && (
                    <button 
                      type="button"
                      onClick={() => setShowConfirm('disconnect_target')}
                      className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                      title="Disconnect Target Tenant"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Microsoft Graph Permission Verification Grid */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Entra ID Enterprise Application Permission Matrix
                  </h3>
                </div>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Tenant-Wide Admin Consent Active
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { name: 'User.ReadWrite.All', desc: 'User account discovery, creation, and profile reconciliation', type: 'Application' },
                  { name: 'Mail.ReadWrite', desc: 'Exchange Online mailbox item extraction and target sync', type: 'Application' },
                  { name: 'Files.ReadWrite.All', desc: 'OneDrive personal file and metadata migration', type: 'Application' },
                  { name: 'Sites.FullControl.All', desc: 'SharePoint Online site provisioning and document library sync', type: 'Application' },
                  { name: 'Directory.ReadWrite.All', desc: 'Security group matching, distribution lists, and attributes', type: 'Application' },
                  { name: 'Domain.ReadWrite.All', desc: 'Cross-tenant domain rewrite verification and move orchestration', type: 'Application' },
                ].map((perm) => (
                  <div key={perm.name} className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 rounded-lg flex items-start space-x-3">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-mono font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <span>{perm.name}</span>
                        <span className="text-[10px] px-1.5 py-0.2 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded">
                          {perm.type}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                        {perm.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SUBTAB 2: MIGRATION POLICIES */}
        {/* ========================================================================= */}
        {activeSubTab === 'policies' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Presets Header Bar */}
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Migration Policy Profiles</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Configure item fidelity rules, version cutoffs, throttles, and automated conflict strategies.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPolicyState({
                      preservePermissions: true,
                      preserveVersions: true,
                      maxVersionCount: 10,
                      preserveTimestamps: true,
                      preserveMailboxRules: true,
                      preserveDelegations: true,
                      excludeHiddenItems: true,
                      excludeExtensions: '.exe, .dll, .tmp, .iso, .bak',
                      maxFileSize: 15,
                      quotaLimit: 85,
                      conflictResolution: 'skip',
                      scheduleWindow: 'off-peak',
                      parallelWorkers: 16,
                    });
                    showToast('Loaded Standard Recommended profile', 'info');
                  }}
                  className="px-2.5 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition"
                >
                  Standard Recommended
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPolicyState({
                      preservePermissions: false,
                      preserveVersions: false,
                      maxVersionCount: 1,
                      preserveTimestamps: true,
                      preserveMailboxRules: false,
                      preserveDelegations: false,
                      excludeHiddenItems: true,
                      excludeExtensions: '.exe, .dll, .tmp, .iso, .bak, .zip, .tar, .mp4, .mov',
                      maxFileSize: 5,
                      quotaLimit: 95,
                      conflictResolution: 'overwrite',
                      scheduleWindow: 'any',
                      parallelWorkers: 32,
                    });
                    showToast('Loaded High Speed Cutover profile', 'info');
                  }}
                  className="px-2.5 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition"
                >
                  High Speed Cutover
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPolicyState({
                      preservePermissions: true,
                      preserveVersions: true,
                      maxVersionCount: 50,
                      preserveTimestamps: true,
                      preserveMailboxRules: true,
                      preserveDelegations: true,
                      excludeHiddenItems: false,
                      excludeExtensions: '.tmp',
                      maxFileSize: 50,
                      quotaLimit: 75,
                      conflictResolution: 'rename',
                      scheduleWindow: 'off-peak',
                      parallelWorkers: 8,
                    });
                    showToast('Loaded Strict Compliance & Audit profile', 'info');
                  }}
                  className="px-2.5 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition"
                >
                  Strict Compliance & Audit
                </button>
              </div>
            </div>

            {/* Data Fidelity Settings */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center">
                <Settings2 className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" />
                Data Fidelity & Metadata Preservation
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Preserve Permissions */}
                <label className="flex items-start space-x-3 p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg cursor-pointer hover:border-blue-400 transition">
                  <input 
                    type="checkbox" 
                    checked={policyState.preservePermissions} 
                    onChange={e => setPolicyState({ ...policyState, preservePermissions: e.target.checked })} 
                    className="w-4 h-4 rounded text-blue-600 mt-1 cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center">
                      Preserve Permissions & ACLs
                      <Lock className="w-3.5 h-3.5 ml-1.5 text-slate-400" />
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Migrates item-level permissions, direct access grants, and anonymous sharing links to target.
                    </p>
                  </div>
                </label>

                {/* Preserve Versions */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg space-y-2">
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={policyState.preserveVersions} 
                      onChange={e => setPolicyState({ ...policyState, preserveVersions: e.target.checked })} 
                      className="w-4 h-4 rounded text-blue-600 mt-1 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center">
                        Preserve File Version History
                        <History className="w-3.5 h-3.5 ml-1.5 text-slate-400" />
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Transfers prior revision history for OneDrive & SharePoint documents.
                      </p>
                    </div>
                  </label>

                  {policyState.preserveVersions && (
                    <div className="pl-7 flex items-center space-x-3 pt-1">
                      <span className="text-[11px] text-slate-600 dark:text-slate-400">Max versions to migrate:</span>
                      <input 
                        type="number" 
                        min={1} 
                        max={100}
                        value={policyState.maxVersionCount}
                        onChange={e => setPolicyState({ ...policyState, maxVersionCount: Number(e.target.value) })}
                        className="w-16 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs text-center font-mono"
                      />
                    </div>
                  )}
                </div>

                {/* Preserve Timestamps */}
                <label className="flex items-start space-x-3 p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg cursor-pointer hover:border-blue-400 transition">
                  <input 
                    type="checkbox" 
                    checked={policyState.preserveTimestamps} 
                    onChange={e => setPolicyState({ ...policyState, preserveTimestamps: e.target.checked })} 
                    className="w-4 h-4 rounded text-blue-600 mt-1 cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center">
                      Preserve Original Timestamps
                      <FileClock className="w-3.5 h-3.5 ml-1.5 text-slate-400" />
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Maintains original "Created Date" and "Last Modified By" system attributes.
                    </p>
                  </div>
                </label>

                {/* Mailbox Rules & Delegations */}
                <label className="flex items-start space-x-3 p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg cursor-pointer hover:border-blue-400 transition">
                  <input 
                    type="checkbox" 
                    checked={policyState.preserveMailboxRules} 
                    onChange={e => setPolicyState({ ...policyState, preserveMailboxRules: e.target.checked })} 
                    className="w-4 h-4 rounded text-blue-600 mt-1 cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center">
                      Preserve Mailbox Rules & Delegations
                      <Users className="w-3.5 h-3.5 ml-1.5 text-slate-400" />
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Transfers server-side inbox rules, safe senders list, and SendAs/FullAccess mailbox permissions.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* File Restrictions & Throttling */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Excluded Extensions & Size Limits */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center">
                  <FileType className="w-4 h-4 mr-2 text-indigo-600 dark:text-indigo-400" />
                  File Filtering & Storage Thresholds
                </h3>

                <div className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Excluded File Extensions
                    </label>
                    <input 
                      type="text" 
                      value={policyState.excludeExtensions} 
                      onChange={e => setPolicyState({ ...policyState, excludeExtensions: e.target.value })}
                      placeholder=".exe, .dll, .tmp, .iso"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {['.exe', '.dll', '.tmp', '.iso', '.bak', '.zip', '.mp4'].map(tag => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            const current = policyState.excludeExtensions;
                            if (current.includes(tag)) {
                              setPolicyState({
                                ...policyState,
                                excludeExtensions: current.split(',').map(s => s.trim()).filter(s => s !== tag).join(', ')
                              });
                            } else {
                              setPolicyState({
                                ...policyState,
                                excludeExtensions: current ? `${current}, ${tag}` : tag
                              });
                            }
                          }}
                          className={`text-[10px] px-2 py-0.5 rounded-full border transition cursor-pointer ${
                            policyState.excludeExtensions.includes(tag)
                              ? 'bg-blue-100 dark:bg-blue-900/50 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                              : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {policyState.excludeExtensions.includes(tag) ? `✓ ${tag}` : `+ ${tag}`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Max Single File (GB)
                      </label>
                      <input 
                        type="number" 
                        min={1} 
                        max={250}
                        value={policyState.maxFileSize}
                        onChange={e => setPolicyState({ ...policyState, maxFileSize: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Quota Warning (%)
                      </label>
                      <input 
                        type="number" 
                        min={50} 
                        max={99}
                        value={policyState.quotaLimit}
                        onChange={e => setPolicyState({ ...policyState, quotaLimit: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Conflict Resolution & Scheduling */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-emerald-600 dark:text-emerald-400" />
                  Execution Window & Conflict Action
                </h3>

                <div className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      File Conflict Strategy
                    </label>
                    <select 
                      value={policyState.conflictResolution}
                      onChange={e => setPolicyState({ ...policyState, conflictResolution: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100"
                    >
                      <option value="skip">Skip existing files (Do not overwrite target items)</option>
                      <option value="overwrite">Overwrite in target (Replace with source version)</option>
                      <option value="rename">Auto-rename (Append _migrated to filename)</option>
                      <option value="newer">Keep newest (Compare modified timestamp)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Allowed Schedule Window
                    </label>
                    <select 
                      value={policyState.scheduleWindow}
                      onChange={e => setPolicyState({ ...policyState, scheduleWindow: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100"
                    >
                      <option value="any">Continuous 24/7 (Real-time active transfer)</option>
                      <option value="off-peak">Off-peak only (18:00 - 06:00 UTC)</option>
                      <option value="weekend">Maintenance windows / Weekends only</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                      <span>Parallel Worker Threads</span>
                      <span className="font-mono text-blue-600 dark:text-blue-400">{policyState.parallelWorkers} Workers</span>
                    </label>
                    <input 
                      type="range" 
                      min={4} 
                      max={32} 
                      step={4}
                      value={policyState.parallelWorkers}
                      onChange={e => setPolicyState({ ...policyState, parallelWorkers: Number(e.target.value) })}
                      className="w-full accent-blue-600"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>4 (Low Network Impact)</span>
                      <span>16 (Balanced)</span>
                      <span>32 (Max Throughput)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Save Action */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  fetch('/api/tenants/policies', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-admin-role': currentRole },
                    body: JSON.stringify({ ...policyState, ...mappingState }),
                  })
                    .then(r => r.json())
                    .then(() => showToast('Migration policies updated successfully!', 'success'))
                    .catch(() => showToast('Saved policies locally.', 'info'));
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-sm flex items-center space-x-2 transition cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Migration Policies</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SUBTAB 3: USER MAPPING RULES */}
        {/* ========================================================================= */}
        {activeSubTab === 'mapping' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Template & Matching Algorithm */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center">
                <Wand2 className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" />
                Identity Correlation & Algorithm Selection
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Attribute Matching Template
                  </label>
                  <select 
                    value={mappingState.template}
                    onChange={e => setMappingState({ ...mappingState, template: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100"
                  >
                    <option value="upn-match">Exact UserPrincipalName (UPN) Match</option>
                    <option value="email-match">Primary SMTP Email Address Match</option>
                    <option value="employee-id">Enterprise EmployeeID Match</option>
                    <option value="samaccount">sAMAccountName / MailNickname Match</option>
                    <option value="custom">Custom Regex Identity Rule</option>
                  </select>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                    Defines the primary foreign key used by the migration engine when linking source and target mailbox containers.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Matching Algorithm Strictness
                  </label>
                  <select 
                    value={mappingState.algorithm}
                    onChange={e => setMappingState({ ...mappingState, algorithm: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100"
                  >
                    <option value="strict">Strict (Exact character & case equality)</option>
                    <option value="fuzzy-match">Fuzzy Normalization (Case-insensitive, trims periods & spaces)</option>
                    <option value="heuristic">Heuristic AI-Assisted Name Matching</option>
                  </select>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                    Fuzzy matching avoids mapping drops caused by capitalization variance or punctuation formatting.
                  </p>
                </div>
              </div>
            </div>

            {/* Domain Transformation Rule */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center">
                <Link className="w-4 h-4 mr-2 text-indigo-600 dark:text-indigo-400" />
                Domain Suffix Transformation Rule
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Source Domain Suffix
                  </label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={mappingState.domainTransformSource}
                      onChange={e => setMappingState({ ...mappingState, domainTransformSource: e.target.value })}
                      placeholder="@contoso.onmicrosoft.com"
                      className="w-full px-3 py-2 font-mono text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Target Domain Suffix
                  </label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={mappingState.domainTransformTarget}
                      onChange={e => setMappingState({ ...mappingState, domainTransformTarget: e.target.value })}
                      placeholder="@fabrikam.com"
                      className="w-full px-3 py-2 font-mono text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>

              {/* Live Interactive Sandbox Tester */}
              <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Interactive Mapping Sandbox Tester
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">Live Evaluation</span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="w-full sm:flex-1">
                    <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">Type Test User UPN:</label>
                    <input 
                      type="text" 
                      value={sampleEmailInput}
                      onChange={e => setSampleEmailInput(e.target.value)}
                      className="w-full px-3 py-1.5 font-mono text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <ArrowRight className="w-5 h-5 text-slate-400 hidden sm:block mt-5 shrink-0" />

                  <div className="w-full sm:flex-1">
                    <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">Resulting Target Identity:</label>
                    <div className="w-full px-3 py-1.5 font-mono text-xs bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-lg text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                      <span className="truncate">{computedMappedEmail}</span>
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 ml-1" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Manual Override Checkbox */}
              <div className="pt-2">
                <label className="flex items-center space-x-3 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={mappingState.manualOverride}
                    onChange={e => setMappingState({ ...mappingState, manualOverride: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      Permit Operator CSV Manual Overrides
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Allows migration operators to specify explicit 1-to-1 exceptions in the CSV mapping engine that bypass algorithm rules.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Save Mapping Button */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  fetch('/api/tenants/policies', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-admin-role': currentRole },
                    body: JSON.stringify({ ...policyState, ...mappingState }),
                  })
                    .then(r => r.json())
                    .then(() => showToast('User mapping rules updated successfully!', 'success'))
                    .catch(() => showToast('Saved mapping rules locally.', 'info'));
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-sm flex items-center space-x-2 transition cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save User Mapping Rules</span>
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <div className={`p-2.5 rounded-xl ${
                showConfirm === 'save' 
                  ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' 
                  : 'bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400'
              }`}>
                {showConfirm === 'save' ? <Save className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {showConfirm === 'save' 
                    ? 'Save All Tenant Configurations' 
                    : showConfirm === 'reset' 
                      ? 'Reset to Factory Defaults' 
                      : `Disconnect ${showConfirm === 'disconnect_source' ? 'Source' : 'Target'} Tenant`}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {showConfirm === 'save' 
                    ? 'This will update both tenant endpoints and synchronize policies across active migration pipelines.' 
                    : showConfirm === 'reset' 
                      ? 'Are you sure you want to restore all values back to defaults?' 
                      : 'Disconnecting will revoke token access and pause any ongoing synchronization for this tenant.'}
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button 
                type="button"
                onClick={() => setShowConfirm(null)} 
                className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={() => {
                  if (showConfirm === 'save') handleSaveAll();
                  else if (showConfirm === 'reset') handleResetDefaults();
                  else if (showConfirm === 'disconnect_source') handleDisconnect('SOURCE');
                  else if (showConfirm === 'disconnect_target') handleDisconnect('TARGET');
                }}
                className={`px-4 py-2 text-white text-xs font-bold rounded-lg transition shadow-sm cursor-pointer ${
                  showConfirm === 'save' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                {showConfirm === 'save' ? 'Confirm Save' : showConfirm === 'reset' ? 'Confirm Reset' : 'Confirm Disconnect'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
