import { SignInPage } from './components/SignInPage';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sun, Moon, Sparkles } from 'lucide-react';
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
import { MigrationToolDashboard } from './components/dashboard/MigrationToolDashboard';
import { MigrationAdvisorWidget } from './components/advisor/MigrationAdvisorWidget';
import { WorkloadMigrationWizardModal } from './components/WorkloadMigrationWizardModal';
import {
  TenantStatusResponse,
  MigrationJob,
  CSVUserRow,
  AdminRole,
  SystemMetrics,
} from './types';

export type PrimaryTab = 'home' | 'discovery' | 'tenants' | 'migrate' | 'recover' | 'audit' | 'security' | 'reports' | 'settings';
export type MigrateSubTab = 'projects' | 'workload_wizard' | 'active_directory' | 'ad_express' | 'mailboxes' | 'directory_sync' | 'domain_rewrite' | 'domain_move' | 'onedrive' | 'error_management';

export default function App() {
  const [session, setSession] = useState<{ email: string; role: AdminRole } | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  useEffect(() => { fetch('/api/session').then(r => r.ok ? r.json() : null).then(setSession).catch(() => setSession(null)).finally(() => setSessionLoading(false)); }, []);

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return true; // Default to dark mode
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const [activeTab, setActiveTab] = useState<PrimaryTab>('home');
  const [migrateSubTab, setMigrateSubTab] = useState<MigrateSubTab>('ad_express');
  const [discoverySubTab, setDiscoverySubTab] = useState<string>('dashboard');
  const [currentRole, setCurrentRole] = useState<AdminRole>('GLOBAL_ADMIN');
  const [tenantStatus, setTenantStatus] = useState<TenantStatusResponse>({
    source: { connected: false },
    target: { connected: false },
  });
  const [activeJob, setActiveJob] = useState<MigrationJob | null>(null);
  const [isAdvisorOpen, setIsAdvisorOpen] = useState(false);
  const [recentJobs, setRecentJobs] = useState<MigrationJob[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [isInitializingJob, setIsInitializingJob] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);
  const activeJobRef = useRef<MigrationJob | null>(null);

  useEffect(() => {
    activeJobRef.current = activeJob;
  }, [activeJob]);

  // Resilient fetch helper with retry for cold start and transient network issues
  const fetchWithRetry = useCallback(async <T,>(url: string, retries = 2, delayMs = 1200): Promise<T | null> => {
    for (let i = 0; i <= retries; i++) {
      try {
        const res = await fetch(url);
        if (res.ok) {
          return (await res.json()) as T;
        }
        if (res.status >= 500 && i < retries) {
          await new Promise((r) => setTimeout(r, delayMs));
          continue;
        }
        return null;
      } catch {
        if (i < retries) {
          await new Promise((r) => setTimeout(r, delayMs));
        } else {
          return null;
        }
      }
    }
    return null;
  }, []);

  // Fetch tenant status with retry
  const fetchTenantStatus = useCallback(async () => {
    const data = await fetchWithRetry<TenantStatusResponse>('/api/auth/status');
    if (data) {
      setTenantStatus(data);
    }
  }, [fetchWithRetry]);

  // Fetch active job details with retry
  const fetchJobDetails = useCallback(async (jobId?: string) => {
    const idToFetch = jobId || activeJobRef.current?.id;
    if (!idToFetch) return;

    const data = await fetchWithRetry<MigrationJob>(`/api/jobs/${idToFetch}`);
    if (data) {
      setActiveJob(data);
    }
  }, [fetchWithRetry]);

  // Fetch recent jobs list with retry
  const fetchRecentJobs = useCallback(async () => {
    const data = await fetchWithRetry<MigrationJob[]>('/api/jobs');
    if (data && Array.isArray(data)) {
      setRecentJobs(data);
      if (!activeJobRef.current && data.length > 0) {
        const latest = data[0];
        fetchJobDetails(latest.id);
      }
    }
  }, [fetchWithRetry, fetchJobDetails]);

  // Fetch system health & latency metrics with retry
  const fetchMetrics = useCallback(async () => {
    const data = await fetchWithRetry<SystemMetrics>('/api/system/health');
    if (data) {
      setMetrics(data);
    }
  }, [fetchWithRetry]);

  // Set up real-time WebSocket connection
  const setupWebSocket = useCallback(() => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    if (!host) return;
    const wsUrl = `${protocol}//${host}/ws`;

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
        try {
          ws.close();
        } catch (_) {}
      };
    } catch (err) {
      console.warn('WebSocket connection initialization error:', err);
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
          sourceTenantDomain: tenantStatus?.source?.domain || 'contoso.onmicrosoft.com',
          targetTenantDomain: tenantStatus?.target?.domain || 'fabrikam.com',
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
      setActiveTab('migrate');
      setMigrateSubTab('projects');
    } catch (err: any) {
      console.error('Job initialization error:', err);
      alert(`Error initializing pipeline: ${err.message}`);
    } finally {
      setIsInitializingJob(false);
    }
  };

  if (sessionLoading) return <div className="min-h-screen flex items-center justify-center dark:bg-slate-950">Checking sign-in...</div>;
  if (!session) return <SignInPage />;
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex transition-colors duration-200 font-sans antialiased selection:bg-blue-600 selection:text-white">
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
        {/* Application Header */}
        <header className="flex items-center justify-end px-6 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800/80 transition-colors">
          <div className="flex items-center space-x-4"><span className="text-sm text-slate-500">{session.email}</span><button className="text-sm underline" onClick={async () => { await fetch('/api/logout',{method:'POST'}); location.reload(); }}>Sign out</button>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Toggle Theme"
              aria-label="Toggle Theme"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* Main Container */}

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* TENANTS */}
        {activeTab === 'tenants' && (
           <div className="h-full animate-fadeIn">
             <TenantConfigurationDashboard 
               tenantStatus={tenantStatus}
               onRefresh={fetchTenantStatus}
               currentRole={currentRole}
               onNavigateTab={(tab, subTab) => {
                 setActiveTab(tab);
                 if (subTab) setMigrateSubTab(subTab);
               }}
             />
           </div>
         )}

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
            
            {migrateSubTab === 'workload_wizard' && (
              <div className="animate-fadeIn">
                <WorkloadMigrationWizardModal
                  isOpen={true}
                  onClose={() => setMigrateSubTab('projects')}
                  tenantStatus={tenantStatus}
                  onJobStarted={(newJob) => {
                    fetchRecentJobs();
                    if (newJob?.id) fetchJobDetails(newJob.id);
                    setMigrateSubTab('projects');
                  }}
                />
              </div>
            )}

            {migrateSubTab === 'projects' && (
              <div className="animate-fadeIn">
                <MigrationProjectDashboard
                  currentRole={currentRole}
                  tenantStatus={tenantStatus}
                  activeJob={activeJob}
                  recentJobs={recentJobs}
                  onSelectJob={(id) => {
                    fetchJobDetails(id);
                    setActiveTab('migrate');
                    setMigrateSubTab('active_directory');
                  }}
                  onNavigateTab={(tab, subTab) => {
                    setActiveTab(tab);
                    if (subTab) setMigrateSubTab(subTab);
                  }}
                  onRefreshJobs={() => {
                    fetchRecentJobs();
                    if (activeJob) fetchJobDetails();
                  }}
                />
              </div>
            )}

            {migrateSubTab === 'mailboxes' && (
              <div className="animate-fadeIn">
                <MailboxMigrationDashboard />
              </div>
            )}

            {migrateSubTab === 'onedrive' && (
              <div className="animate-fadeIn -m-4">
                <OneDriveMonitoringDashboard
                  tenantStatus={tenantStatus}
                  onJobStarted={(newJob) => {
                    fetchRecentJobs();
                    if (newJob?.id) fetchJobDetails(newJob.id);
                  }}
                />
              </div>
            )}

            {migrateSubTab === 'error_management' && (
              <div className="animate-fadeIn -m-4">
                <ErrorManagementDashboard />
              </div>
            )}

            {/* Placeholder for other migrate sub-tabs */}
            {['directory_sync', 'domain_rewrite', 'domain_move'].includes(migrateSubTab) && (
              <div className="flex items-center justify-center h-64 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-500">
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

        {/* DASHBOARD (HOME) */}
        {activeTab === 'home' && (
          <div className="animate-fadeIn">
            <MigrationToolDashboard
              currentRole={currentRole}
              tenantStatus={tenantStatus}
              onOpenAdvisor={() => setIsAdvisorOpen(true)}
              onNavigateTab={(tab, subTab) => {
                setActiveTab(tab);
                if (subTab) setMigrateSubTab(subTab);
              }}
            />
          </div>
        )}

        {/* RECOVER */}
        {activeTab === 'recover' && (
           <div className="animate-fadeIn">
             <ErrorManagementDashboard />
           </div>
        )}

        {activeTab === 'settings' && (
          <div className="h-full animate-fadeIn -m-4">
            <SettingsDashboard />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/60 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>System Operational</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-emerald-400/90 font-mono">TLS 1.3 & AES-256-GCM</span>
            <span className="text-slate-500 dark:text-slate-400">Failover Ready</span>
          </div>
        </div>
      </footer>
      
      {/* Global AI Advisor FAB */}
      <button
        onClick={() => setIsAdvisorOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full p-4 shadow-xl hover:shadow-2xl hover:scale-105 transition-all flex items-center justify-center group"
      >
        <Sparkles className="w-6 h-6 group-hover:animate-pulse" />
        <span className="absolute right-full mr-4 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity shadow-lg">
          AI Migration Advisor
        </span>
      </button>

      {/* Advisor Slide-out Widget */}
      {isAdvisorOpen && (
        <MigrationAdvisorWidget 
          activeJob={activeJob} 
          onClose={() => setIsAdvisorOpen(false)} 
        />
      )}
      </div>
    </div>
  );
}
