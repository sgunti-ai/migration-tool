/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { TenantConfigurationDashboard } from './components/TenantConfigurationDashboard';
import { CsvMappingEngine } from './components/CsvMappingEngine';
import { LiveMonitoringCockpit } from './components/LiveMonitoringCockpit';
import { MigrationProjectDashboard } from './components/MigrationProjectDashboard';
import { OneDriveMonitoringDashboard } from './components/OneDriveMonitoringDashboard';
import { ErrorManagementDashboard } from './components/ErrorManagementDashboard';
import { SecurityComplianceDashboard } from './components/SecurityComplianceDashboard';
import { AuditTrailViewer } from './components/AuditTrailViewer';
import { SettingsDashboard } from './components/SettingsDashboard';
import { ReportGenerationEngine } from './components/ReportGenerationEngine';
import { DiscoveryDashboard } from './components/discovery/DiscoveryDashboard';
import { MailboxMigrationDashboard } from './components/mailboxes/MailboxMigrationDashboard';
import {
  TenantStatusResponse,
  MigrationJob,
  CSVUserRow,
  AdminRole,
  SystemMetrics,
} from './types';

export type PrimaryTab = 'home' | 'discovery' | 'tenants' | 'migrate' | 'recover' | 'audit' | 'security' | 'reports' | 'settings';
export type MigrateSubTab = 'projects' | 'active_directory' | 'ad_express' | 'mailboxes' | 'directory_sync' | 'domain_rewrite' | 'domain_move' | 'onedrive' | 'error_management';

export default function App() {
  const [activeTab, setActiveTab] = useState<PrimaryTab>('discovery');
  const [migrateSubTab, setMigrateSubTab] = useState<MigrateSubTab>('ad_express');
  const [discoverySubTab, setDiscoverySubTab] = useState<string>('users');
  const [currentRole, setCurrentRole] = useState<AdminRole>('GLOBAL_ADMIN');
  const [tenantStatus, setTenantStatus] = useState<TenantStatusResponse>({
    source: { connected: false },
    target: { connected: false },
  });
  const [activeJob, setActiveJob] = useState<MigrationJob | null>(null);
  const [recentJobs, setRecentJobs] = useState<MigrationJob[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [isInitializingJob, setIsInitializingJob] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);

  // Fetch tenant status
  const fetchTenantStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/status');
      if (res.ok) {
        const data = await res.json();
        setTenantStatus(data);
      }
    } catch (err) {
      console.error('Failed to fetch tenant status:', err);
    }
  }, []);

  // Fetch active job details
  const fetchJobDetails = useCallback(async (jobId?: string) => {
    const idToFetch = jobId || activeJob?.id;
    if (!idToFetch) return;

    try {
      const res = await fetch(`/api/jobs/${idToFetch}`);
      if (res.ok) {
        const data = await res.json();
        setActiveJob(data);
      }
    } catch (err) {
      console.error('Failed to fetch job details:', err);
    }
  }, [activeJob?.id]);

  // Fetch recent jobs list
  const fetchRecentJobs = useCallback(async () => {
    try {
      const res = await fetch('/api/jobs');
      if (res.ok) {
        const data: MigrationJob[] = await res.json();
        setRecentJobs(data);
        if (!activeJob && data.length > 0) {
          // If no active job is selected, load the latest one
          const latest = data[0];
          fetchJobDetails(latest.id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch recent jobs:', err);
    }
  }, [activeJob, fetchJobDetails]);

  // Fetch system health & latency metrics
  const fetchMetrics = useCallback(async () => {
    try {
      const res = await fetch('/api/system/health');
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      }
    } catch (err) {
      console.error('Failed to fetch metrics:', err);
    }
  }, []);

  // Set up real-time WebSocket connection
  const setupWebSocket = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          switch (payload.type) {
            case 'JOB_STATUS_CHANGED':
            case 'JOB_COMPLETED':
            case 'MIGRATION_PAUSED':
            case 'MIGRATION_RESUMED':
              fetchJobDetails(payload.data?.jobId);
              fetchRecentJobs();
              break;

            case 'USER_PROGRESS_UPDATE':
              setActiveJob((prev) => {
                if (!prev || prev.id !== payload.data.jobId) return prev;
                const updatedStatuses = (prev.userStatuses || []).map((u) => {
                  if (u.id === payload.data.userId) {
                    return {
                      ...u,
                      ...payload.data,
                      updatedAt: payload.data.updatedAt || new Date().toISOString(),
                    };
                  }
                  return u;
                });
                return {
                  ...prev,
                  userStatuses: updatedStatuses,
                };
              });
              break;

            case 'TENANT_UPDATED':
              fetchTenantStatus();
              break;

            default:
              break;
          }
        } catch (err) {
          console.error('WS message parse error:', err);
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        wsRef.current = null;
        // Auto-reconnect with backoff
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(() => {
          setupWebSocket();
        }, 3000);
      };

      ws.onerror = () => {
        setWsConnected(false);
        ws.close();
      };
    } catch (err) {
      console.error('WebSocket connection initialization error:', err);
    }
  }, [fetchJobDetails, fetchRecentJobs, fetchTenantStatus]);

  // Handle postMessage from OAuth popup (as instructed in oauth-integration skill)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Validate origin is from AI Studio preview or localhost
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
        return;
      }
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        fetchTenantStatus();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [fetchTenantStatus]);

  // Initial load & timers
  useEffect(() => {
    fetchTenantStatus();
    fetchRecentJobs();
    fetchMetrics();
    setupWebSocket();

    const metricsInterval = setInterval(fetchMetrics, 8000);

    return () => {
      clearInterval(metricsInterval);
      clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [fetchTenantStatus, fetchRecentJobs, fetchMetrics, setupWebSocket]);

  // Handle Pipeline Initialization
  const handleInitializeJob = async (mappings: CSVUserRow[]) => {
    if (mappings.length === 0) return;
    setIsInitializingJob(true);

    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-role': currentRole,
        },
        body: JSON.stringify({
          sourceTenantDomain: tenantStatus.source.domain || 'contoso.onmicrosoft.com',
          targetTenantDomain: tenantStatus.target.domain || 'fabrikam.com',
          mappings: mappings.map((m) => ({
            sourceUPN: m.sourceUPN,
            targetUPN: m.targetUPN,
            migrateMailbox: m.migrateMailbox,
            migrateOneDrive: m.migrateOneDrive,
          })),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(`Failed to initialize migration: ${err.error || 'Unknown error'}`);
        return;
      }

      const data = await res.json();
      setActiveJob(data.job);
      fetchRecentJobs();

      // Immediately redirect to Execution Cockpit grid
      setActiveTab('cockpit');
    } catch (err: any) {
      console.error('Job initialization error:', err);
      alert(`Error initializing pipeline: ${err.message}`);
    } finally {
      setIsInitializingJob(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        migrateSubTab={migrateSubTab}
        setMigrateSubTab={setMigrateSubTab}
        discoverySubTab={discoverySubTab}
        setDiscoverySubTab={setDiscoverySubTab}
        currentRole={currentRole}
        setCurrentRole={setCurrentRole}
        metrics={metrics}
        hasActiveJob={!!activeJob && (activeJob.status === 'PROCESSING' || activeJob.status === 'PAUSED')}
        wsConnected={wsConnected}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Main Container */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* DISCOVERY */}
        {activeTab === 'discovery' && (
          <div className="animate-fadeIn">
            <DiscoveryDashboard
              currentRole={currentRole}
              selectedWorkloadTab={discoverySubTab}
              onSelectWorkloadTab={(tab) => setDiscoverySubTab(tab)}
              onNavigateToMigrate={(selectedUsers) => {
                setActiveTab('migrate');
                setMigrateSubTab('ad_express');
              }}
            />
          </div>
        )}

        {/* TENANTS */}
        {activeTab === 'tenants' && (
          <div className="h-full animate-fadeIn -m-4">
            <TenantConfigurationDashboard />
          </div>
        )}

        {/* MIGRATE */}
        {activeTab === 'migrate' && (
          <div className="space-y-8 animate-fadeIn">
            {/* We map the various migrate sub-tabs to the pipeline logic */}
            {migrateSubTab === 'ad_express' && (
              <section aria-labelledby="csv-mapping-title">
                <CsvMappingEngine
                  tenantStatus={tenantStatus}
                  currentRole={currentRole}
                  onInitializeJob={handleInitializeJob}
                  isInitializing={isInitializingJob}
                />
              </section>
            )}
            
            {(migrateSubTab === 'active_directory') && (
              <div className="animate-fadeIn">
                <LiveMonitoringCockpit
                  activeJob={activeJob}
                  onRefreshJob={() => fetchJobDetails()}
                  currentRole={currentRole}
                  wsConnected={wsConnected}
                  onSelectJob={(id) => fetchJobDetails(id)}
                  recentJobs={recentJobs}
                />
              </div>
            )}
            
            {migrateSubTab === 'projects' && (
              <div className="animate-fadeIn -m-4">
                <MigrationProjectDashboard />
              </div>
            )}

            {migrateSubTab === 'mailboxes' && (
              <div className="animate-fadeIn">
                <MailboxMigrationDashboard />
              </div>
            )}

            {migrateSubTab === 'onedrive' && (
              <div className="animate-fadeIn -m-4">
                <OneDriveMonitoringDashboard />
              </div>
            )}

            {migrateSubTab === 'error_management' && (
              <div className="animate-fadeIn -m-4">
                <ErrorManagementDashboard />
              </div>
            )}

            {/* Placeholder for other migrate sub-tabs */}
            {['directory_sync', 'domain_rewrite', 'domain_move'].includes(migrateSubTab) && (
              <div className="flex items-center justify-center h-64 border-2 border-dashed border-slate-800 rounded-xl text-slate-500">
                <p>Module configuration for {migrateSubTab.replace('_', ' ')} is coming soon.</p>
              </div>
            )}
          </div>
        )}

        {/* SECURITY */}
        {activeTab === 'security' && (
          <div className="animate-fadeIn">
            <SecurityComplianceDashboard
              currentRole={currentRole}
              metrics={metrics}
              onRefreshMetrics={fetchMetrics}
            />
          </div>
        )}

        {/* AUDIT */}
        {activeTab === 'audit' && (
          <div className="animate-fadeIn">
            <AuditTrailViewer currentRole={currentRole} />
          </div>
        )}

        {/* REPORTS */}
        {activeTab === 'reports' && (
          <div className="animate-fadeIn">
            <ReportGenerationEngine
              currentRole={currentRole}
              metrics={metrics}
            />
          </div>
        )}

        {/* OTHER TABS */}
        {['home', 'recover'].includes(activeTab) && (
           <div className="flex items-center justify-center h-64 border-2 border-dashed border-slate-800 rounded-xl text-slate-500">
             <p className="capitalize">{activeTab} Dashboard Coming Soon</p>
           </div>
        )}

        {activeTab === 'settings' && (
          <div className="h-full animate-fadeIn -m-4">
            <SettingsDashboard />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/60 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-400">M365 Migration Engine</span>
            <span>•</span>
            <span>Prisma SQLite Persistent State</span>
            <span>•</span>
            <span>Microsoft Graph Client v3</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-emerald-400/90 font-mono">TLS 1.3 & AES-256-GCM</span>
            <span className="text-slate-400">Failover Ready</span>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
}
