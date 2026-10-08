import React, { useState } from 'react';
import {
  Building2,
  CheckCircle,
  ExternalLink,
  Shield,
  Key,
  Globe,
  RefreshCw,
  LogOut,
  Sparkles,
  Info,
} from 'lucide-react';
import { TenantStatusResponse, AdminRole } from '../types';

interface TenantConnectCardsProps {
  tenantStatus: TenantStatusResponse;
  onRefresh: () => void;
  currentRole: AdminRole;
}

export const TenantConnectCards: React.FC<TenantConnectCardsProps> = ({
  tenantStatus,
  onRefresh,
  currentRole,
}) => {
  const [loadingTenant, setLoadingTenant] = useState<'source' | 'target' | null>(null);
  const [showConfigModal, setShowConfigModal] = useState<'SOURCE' | 'TARGET' | null>(null);
  const [manualDomain, setManualDomain] = useState('');
  const [manualName, setManualName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Trigger Microsoft MSAL Admin Consent OAuth Flow via Popup
  const handleConnectOAuth = async (tenantType: 'source' | 'target') => {
    setLoadingTenant(tenantType);
    try {
      // 1. Fetch OAuth URL from server
      const res = await fetch(`/api/auth/url/${tenantType}`);
      const data = await res.json();

      // 2. Open popup directly to Microsoft OAuth provider URL
      const authWindow = window.open(
        data.url,
        `msal_oauth_${tenantType}`,
        'width=640,height=720,scrollbars=yes,status=yes'
      );

      if (!authWindow) {
        alert('Please allow popups for this site to complete Microsoft Entra ID admin consent.');
        setLoadingTenant(null);
        return;
      }

      // Check if window was closed or wait for postMessage
      const checkTimer = setInterval(() => {
        if (authWindow.closed) {
          clearInterval(checkTimer);
          setLoadingTenant(null);
          onRefresh();
        }
      }, 1000);
    } catch (err) {
      console.error('Failed to initiate MSAL OAuth:', err);
      setLoadingTenant(null);
    }
  };

  // Direct connection for custom domain or test sandbox
  const handleDirectConnect = async (type: 'SOURCE' | 'TARGET', domain: string, displayName?: string) => {
    setIsSubmitting(true);
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
          displayName: displayName || (type === 'SOURCE' ? 'Contoso Enterprise Corp' : 'Fabrikam Global Inc'),
          tenantId: `${type.toLowerCase()}-${Math.random().toString(36).substring(2, 9)}`,
        }),
      });

      if (res.ok) {
        setShowConfigModal(null);
        setManualDomain('');
        setManualName('');
        onRefresh();
      }
    } catch (err) {
      console.error('Failed to connect tenant:', err);
    } finally {
      setIsSubmitting(false);
      setLoadingTenant(null);
    }
  };

  const handleDisconnect = async (type: 'SOURCE' | 'TARGET') => {
    if (currentRole === 'AUDITOR') {
      alert('Auditors have read-only privileges. Disconnect requires Global Administrator.');
      return;
    }
    if (!confirm(`Are you sure you want to disconnect the ${type} tenant?`)) return;

    try {
      await fetch(`/api/auth/disconnect/${type}`, {
        method: 'POST',
        headers: {
          'x-admin-role': currentRole,
        },
      });
      onRefresh();
    } catch (err) {
      console.error('Failed to disconnect:', err);
    }
  };

  const handleQuickSandboxConnectBoth = async () => {
    setIsSubmitting(true);
    try {
      await handleDirectConnect('SOURCE', 'contoso.onmicrosoft.com', 'Contoso Enterprise Corp (Source)');
      await handleDirectConnect('TARGET', 'fabrikam-corp.com', 'Fabrikam Global Cloud (Target)');
      onRefresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSourceConnected = tenantStatus.source.connected;
  const isTargetConnected = tenantStatus.target.connected;

  return (
    <div className="space-y-4">
      {/* Top action notice & Sandbox quick button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl p-4 gap-3">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg shrink-0 mt-0.5">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-100">
              Multi-Tenant Entra ID Authentication & MSAL Consent
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Connect both Source and Target Microsoft 365 tenants with tenant-wide administrative consent. Tokens are encrypted at rest with AES-256-GCM.
            </p>
          </div>
        </div>

        {(!isSourceConnected || !isTargetConnected) && (
          <button
            id="btn-quick-sandbox"
            onClick={handleQuickSandboxConnectBoth}
            disabled={isSubmitting}
            className="flex items-center justify-center space-x-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-slate-900 dark:text-white text-xs font-semibold rounded-lg shadow-sm transition-all shrink-0 cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Connect Enterprise Sandbox Pair</span>
          </button>
        )}
      </div>

      {/* Side-by-Side Tenant Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* SOURCE TENANT CARD */}
        <div
          id="card-source-tenant"
          className={`rounded-xl border transition-all p-5 flex flex-col justify-between ${
            isSourceConnected
              ? 'bg-slate-50 dark:bg-slate-900/90 border-emerald-500/40 shadow-sm shadow-emerald-950/20'
              : 'bg-slate-50 dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 hover:border-slate-200 dark:border-slate-700'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-lg bg-blue-900/40 text-blue-400 border border-blue-800/50">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">
                    Step 1 • Source
                  </span>
                  <h3 className="text-base font-semibold text-slate-100">
                    Connect Source Tenant
                  </h3>
                </div>
              </div>

              {/* Status Chip */}
              {isSourceConnected ? (
                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                  <CheckCircle className="h-3.5 w-3.5" />
                  <span>Connected</span>
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                  Not Connected
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Origin Microsoft 365 organization containing source user accounts, Exchange mailboxes, and personal OneDrive drives.
            </p>

            {/* Tenant details when connected */}
            {isSourceConnected && (
              <div className="bg-white dark:bg-slate-800/60 rounded-lg p-3 border border-slate-200 dark:border-slate-700/60 mb-4 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-slate-500" /> Primary Domain:
                  </span>
                  <span className="font-semibold text-emerald-400 font-mono">
                    {tenantStatus.source.domain}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-slate-500" /> Organization:
                  </span>
                  <span className="text-slate-200 truncate max-w-[180px]">
                    {tenantStatus.source.displayName || 'Enterprise Source Tenant'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Key className="h-3.5 w-3.5 text-slate-500" /> Admin Consent:
                  </span>
                  <span className="text-emerald-400 font-medium">Granted (Graph.ReadWrite.All)</span>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
            {!isSourceConnected ? (
              <div className="flex items-center gap-2 w-full">
                <button
                  id="btn-connect-source-oauth"
                  onClick={() => handleConnectOAuth('source')}
                  disabled={loadingTenant === 'source'}
                  className="flex-1 flex items-center justify-center space-x-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>{loadingTenant === 'source' ? 'Opening MSAL...' : 'OAuth Admin Consent'}</span>
                </button>
                <button
                  id="btn-source-manual-connect"
                  onClick={() => setShowConfigModal('SOURCE')}
                  className="px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                >
                  Domain Setup
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full">
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Shield className="h-3 w-3 text-emerald-500" /> AES-256 Encrypted Session
                </span>
                <button
                  id="btn-disconnect-source"
                  onClick={() => handleDisconnect('SOURCE')}
                  className="flex items-center space-x-1 px-2.5 py-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 rounded text-xs transition-colors cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Disconnect</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* TARGET TENANT CARD */}
        <div
          id="card-target-tenant"
          className={`rounded-xl border transition-all p-5 flex flex-col justify-between ${
            isTargetConnected
              ? 'bg-slate-50 dark:bg-slate-900/90 border-emerald-500/40 shadow-sm shadow-emerald-950/20'
              : 'bg-slate-50 dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 hover:border-slate-200 dark:border-slate-700'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-lg bg-indigo-900/40 text-indigo-400 border border-indigo-800/50">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
                    Step 2 • Target
                  </span>
                  <h3 className="text-base font-semibold text-slate-100">
                    Connect Target Tenant
                  </h3>
                </div>
              </div>

              {/* Status Chip */}
              {isTargetConnected ? (
                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                  <CheckCircle className="h-3.5 w-3.5" />
                  <span>Connected</span>
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                  Not Connected
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Destination Microsoft 365 organization where migrated user identities, mailboxes, and OneDrive documents will be provisioned.
            </p>

            {/* Tenant details when connected */}
            {isTargetConnected && (
              <div className="bg-white dark:bg-slate-800/60 rounded-lg p-3 border border-slate-200 dark:border-slate-700/60 mb-4 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-slate-500" /> Primary Domain:
                  </span>
                  <span className="font-semibold text-emerald-400 font-mono">
                    {tenantStatus.target.domain}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-slate-500" /> Organization:
                  </span>
                  <span className="text-slate-200 truncate max-w-[180px]">
                    {tenantStatus.target.displayName || 'Destination Target Tenant'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Key className="h-3.5 w-3.5 text-slate-500" /> Admin Consent:
                  </span>
                  <span className="text-emerald-400 font-medium">Granted (Directory.ReadWrite.All)</span>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
            {!isTargetConnected ? (
              <div className="flex items-center gap-2 w-full">
                <button
                  id="btn-connect-target-oauth"
                  onClick={() => handleConnectOAuth('target')}
                  disabled={loadingTenant === 'target'}
                  className="flex-1 flex items-center justify-center space-x-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>{loadingTenant === 'target' ? 'Opening MSAL...' : 'OAuth Admin Consent'}</span>
                </button>
                <button
                  id="btn-target-manual-connect"
                  onClick={() => setShowConfigModal('TARGET')}
                  className="px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                >
                  Domain Setup
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full">
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Shield className="h-3 w-3 text-emerald-500" /> AES-256 Encrypted Session
                </span>
                <button
                  id="btn-disconnect-target"
                  onClick={() => handleDisconnect('TARGET')}
                  className="flex items-center space-x-1 px-2.5 py-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 rounded text-xs transition-colors cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Disconnect</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Manual Domain / Sandbox Config Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
              Configure {showConfigModal === 'SOURCE' ? 'Source' : 'Target'} Tenant
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Enter your enterprise tenant primary domain or choose from predefined corporate tenants.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Tenant Primary Domain
                </label>
                <input
                  type="text"
                  placeholder={showConfigModal === 'SOURCE' ? 'e.g. contoso.onmicrosoft.com' : 'e.g. fabrikam-corp.com'}
                  value={manualDomain}
                  onChange={(e) => setManualDomain(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Display Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder={showConfigModal === 'SOURCE' ? 'Contoso Enterprise Corp' : 'Fabrikam Global Cloud'}
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-2 font-medium">
                  Preset Domains:
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setManualDomain(showConfigModal === 'SOURCE' ? 'contoso.onmicrosoft.com' : 'fabrikam.com');
                      setManualName(showConfigModal === 'SOURCE' ? 'Contoso Enterprise' : 'Fabrikam Corp');
                    }}
                    className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:bg-slate-700 text-blue-400 rounded text-xs border border-slate-200 dark:border-slate-700"
                  >
                    {showConfigModal === 'SOURCE' ? 'contoso.onmicrosoft.com' : 'fabrikam.com'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setManualDomain(showConfigModal === 'SOURCE' ? 'megacorp.onmicrosoft.com' : 'futurecloud.io');
                      setManualName(showConfigModal === 'SOURCE' ? 'MegaCorp Global' : 'FutureCloud Tech');
                    }}
                    className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:bg-slate-700 text-blue-400 rounded text-xs border border-slate-200 dark:border-slate-700"
                  >
                    {showConfigModal === 'SOURCE' ? 'megacorp.onmicrosoft.com' : 'futurecloud.io'}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowConfigModal(null)}
                className="px-3 py-2 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!manualDomain || isSubmitting}
                onClick={() => handleDirectConnect(showConfigModal, manualDomain, manualName)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-slate-900 dark:text-white text-xs font-semibold rounded-lg shadow-sm"
              >
                {isSubmitting ? 'Saving...' : 'Save & Connect'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
