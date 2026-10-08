import React from 'react';
import {
  Home,
  Layers,
  LogOut,
  History,
  Search,
  Shield,
  Globe,
  Wrench,
  ChevronDown,
  Kanban,
  Cloud,
  Triangle,
  RefreshCw,
  Mail,
  ArrowRightSquare,
  HardDrive,
  AlertOctagon,
  Compass,
  Users,
  MessageSquare,
  ListTree,
  LayoutDashboard,
  FileText,
  PlusCircle
} from 'lucide-react';
import { AdminRole, SystemMetrics } from '../types';
import { PrimaryTab, MigrateSubTab } from '../App';

interface SidebarProps {
  activeTab: PrimaryTab;
  setActiveTab: (tab: PrimaryTab) => void;
  migrateSubTab: MigrateSubTab;
  setMigrateSubTab: (tab: MigrateSubTab) => void;
  discoverySubTab?: string;
  setDiscoverySubTab?: (tab: string) => void;
  currentRole: AdminRole;
  setCurrentRole: (role: AdminRole) => void;
  metrics: SystemMetrics | null;
  hasActiveJob: boolean;
  wsConnected: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  migrateSubTab,
  setMigrateSubTab,
  discoverySubTab = 'dashboard',
  setDiscoverySubTab,
  currentRole,
  setCurrentRole,
  metrics,
  hasActiveJob,
  wsConnected,
}) => {
  const primaryTabs: { id: PrimaryTab; label: string; icon: React.FC<any> }[] = [
    { id: 'home', label: 'Dashboard', icon: Home },
    { id: 'tenants', label: 'Tenants', icon: Layers },
    { id: 'discovery', label: 'Discovery', icon: Compass },
    { id: 'migrate', label: 'Migrate', icon: LogOut },
    { id: 'recover', label: 'Recover', icon: History },
    { id: 'audit', label: 'Audit', icon: Search },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'reports', label: 'Reports', icon: Globe },
    { id: 'settings', label: 'Settings', icon: Wrench },
  ];

  const migrateTabs: { id: MigrateSubTab; label: string; icon: React.FC<any> }[] = [
    { id: 'projects', label: 'Projects', icon: Kanban },
    { id: 'workload_wizard', label: 'New Migration Job', icon: PlusCircle },
    { id: 'active_directory', label: 'Active Directory', icon: Cloud },
    { id: 'ad_express', label: 'AD Express', icon: Triangle },
    { id: 'mailboxes', label: 'Mailboxes', icon: Mail },
    { id: 'onedrive', label: 'OneDrive', icon: HardDrive },
    { id: 'directory_sync', label: 'Directory Sync', icon: RefreshCw },
    { id: 'domain_rewrite', label: 'Domain Rewrite', icon: Mail },
    { id: 'domain_move', label: 'Domain Move', icon: ArrowRightSquare },
    { id: 'error_management', label: 'Error Manager', icon: AlertOctagon },
  ];

  const discoveryTabs = [
    { id: 'dashboard', label: 'Workloads Overview', icon: LayoutDashboard },
    { id: 'exchange', label: 'Mailboxes', icon: Mail },
    { id: 'users', label: 'User Accounts', icon: Users },
    { id: 'groups', label: 'Groups', icon: Layers },
    { id: 'distributionlists', label: 'Distribution Lists', icon: ListTree },
    { id: 'onedrive', label: 'OneDrive Accounts', icon: HardDrive },
    { id: 'sharepoint', label: 'SharePoint Sites', icon: Globe },
    { id: 'teams', label: 'Teams Data', icon: MessageSquare },
    { id: 'reports', label: 'Reports', icon: FileText },
  ];


  return (
    <div className="flex h-screen sticky top-0 z-40 bg-slate-50 dark:bg-slate-900">
      {/* Primary Sidebar (Thin) */}
      <aside className="w-24 bg-slate-100 dark:bg-[#323232] flex flex-col items-center border-r border-slate-200 dark:border-[#404040] py-2 shrink-0">
        <nav className="flex-1 w-full space-y-1">
          {primaryTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex flex-col items-center justify-center py-4 relative group transition-colors ${
                  isActive ? 'bg-blue-50 dark:bg-[#2b2b2b] text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-[#3a3a3a]'
                }`}
              >
                {/* Active Indicator Line */}
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500" />
                )}
                <tab.icon className={`h-6 w-6 mb-1 ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200'}`} />
                <span className="text-[11px] font-medium tracking-wide">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Secondary Sidebar (Expandable based on context) */}
      {activeTab === 'discovery' && (
        <aside className="w-56 bg-white dark:bg-[#3a3a3a] border-r border-slate-200 dark:border-[#454545] flex flex-col shrink-0 animate-fadeIn">
          <div className="px-3 pt-4 pb-1">
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Discovered Workloads
            </span>
          </div>
          <nav className="flex-1 px-2 py-2 space-y-1">
            {discoveryTabs.map((tab) => {
              const isActive = discoverySubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`side-discovery-${tab.id}`}
                  onClick={() => setDiscoverySubTab && setDiscoverySubTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded text-sm transition-colors ${
                    isActive
                      ? 'bg-blue-50 dark:bg-[#2b2b2b] text-slate-900 dark:text-white font-medium shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#454545] hover:text-slate-900 dark:text-white'
                  }`}
                >
                  <tab.icon className="h-4 w-4 shrink-0 text-blue-400" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
          
          {/* Footer Area - Role Switcher & System Health */}
          <div className="p-3 border-t border-slate-200 dark:border-[#2b2b2b] space-y-3 bg-slate-100 dark:bg-[#323232]">
            {/* System Health */}
            <div className="flex items-center justify-between text-[11px] bg-blue-50 dark:bg-[#2b2b2b] px-2 py-1.5 rounded border border-slate-200 dark:border-[#404040]">
              <div className="flex items-center space-x-1.5">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    wsConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                  }`}
                />
                <span className="text-slate-600 dark:text-slate-300">
                  {wsConnected ? 'WS Live' : 'Polling'}
                </span>
              </div>
              <span className="text-slate-500 dark:text-slate-400 font-mono">
                {metrics?.currentLatencyMs || 42}ms
              </span>
            </div>

            {/* Role Switcher RBAC */}
            <div className="relative group">
              <div className="flex items-center justify-between text-[11px] bg-blue-50 dark:bg-[#2b2b2b] hover:bg-slate-200 dark:hover:bg-[#404040] px-2 py-1.5 rounded border border-slate-200 dark:border-[#404040] cursor-pointer transition-colors">
                <div className="flex flex-col">
                  <span className="text-slate-500 text-[9px] uppercase tracking-wider font-semibold">Active Role</span>
                  <span
                    className={`font-semibold ${
                      currentRole === 'GLOBAL_ADMIN'
                        ? 'text-purple-300'
                        : currentRole === 'MIGRATION_OPERATOR'
                        ? 'text-blue-300'
                        : 'text-emerald-300'
                    }`}
                  >
                    {currentRole === 'GLOBAL_ADMIN'
                      ? 'Global Admin'
                      : currentRole === 'MIGRATION_OPERATOR'
                      ? 'Operator'
                      : 'Auditor'}
                  </span>
                </div>
                <ChevronDown className="h-3 w-3 text-slate-500 dark:text-slate-400" />
              </div>

              {/* Dropdown menu */}
              <div className="absolute bottom-full mb-1 left-0 w-full bg-blue-50 dark:bg-[#2b2b2b] border border-slate-200 dark:border-[#404040] rounded shadow-xl p-1 hidden group-hover:block z-50">
                <button
                  onClick={() => setCurrentRole('GLOBAL_ADMIN')}
                  className={`w-full text-left px-2 py-1.5 rounded text-[11px] transition-colors ${
                    currentRole === 'GLOBAL_ADMIN'
                      ? 'bg-purple-950/40 text-purple-200 border-l-2 border-purple-500'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#404040]'
                  }`}
                >
                  <span className="font-semibold">Global Admin</span>
                </button>
                <button
                  onClick={() => setCurrentRole('MIGRATION_OPERATOR')}
                  className={`w-full text-left px-2 py-1.5 rounded text-[11px] transition-colors ${
                    currentRole === 'MIGRATION_OPERATOR'
                      ? 'bg-blue-950/40 text-blue-200 border-l-2 border-blue-500'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#404040]'
                  }`}
                >
                  <span className="font-semibold">Operator</span>
                </button>
                <button
                  onClick={() => setCurrentRole('AUDITOR')}
                  className={`w-full text-left px-2 py-1.5 rounded text-[11px] transition-colors ${
                    currentRole === 'AUDITOR'
                      ? 'bg-emerald-950/40 text-emerald-200 border-l-2 border-emerald-500'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#404040]'
                  }`}
                >
                  <span className="font-semibold">Auditor</span>
                </button>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* Secondary Sidebar (Expandable based on context) */}
      {activeTab === 'migrate' && (
        <aside className="w-56 bg-white dark:bg-[#3a3a3a] border-r border-slate-200 dark:border-[#454545] flex flex-col shrink-0 animate-fadeIn">
          <nav className="flex-1 px-2 py-4 space-y-1">
            {migrateTabs.map((tab) => {
              const isActive = migrateSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setMigrateSubTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded text-sm transition-colors ${
                    isActive
                      ? 'bg-blue-50 dark:bg-[#2b2b2b] text-slate-900 dark:text-white font-medium shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#454545] hover:text-slate-900 dark:text-white'
                  }`}
                >
                  <tab.icon className="h-4 w-4 shrink-0" />
                  <span>{tab.label}</span>
                  {hasActiveJob && tab.id === 'projects' && (
                    <span className="absolute right-3 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
          
          {/* Footer Area - Role Switcher & System Health */}
          <div className="p-3 border-t border-slate-200 dark:border-[#2b2b2b] space-y-3 bg-slate-100 dark:bg-[#323232]">
            {/* System Health */}
            <div className="flex items-center justify-between text-[11px] bg-blue-50 dark:bg-[#2b2b2b] px-2 py-1.5 rounded border border-slate-200 dark:border-[#404040]">
              <div className="flex items-center space-x-1.5">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    wsConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                  }`}
                />
                <span className="text-slate-600 dark:text-slate-300">
                  {wsConnected ? 'WS Live' : 'Polling'}
                </span>
              </div>
              <span className="text-slate-500 dark:text-slate-400 font-mono">
                {metrics?.currentLatencyMs || 42}ms
              </span>
            </div>

            {/* Role Switcher RBAC */}
            <div className="relative group">
              <div className="flex items-center justify-between text-[11px] bg-blue-50 dark:bg-[#2b2b2b] hover:bg-slate-200 dark:hover:bg-[#404040] px-2 py-1.5 rounded border border-slate-200 dark:border-[#404040] cursor-pointer transition-colors">
                <div className="flex flex-col">
                  <span className="text-slate-500 text-[9px] uppercase tracking-wider font-semibold">Active Role</span>
                  <span
                    className={`font-semibold ${
                      currentRole === 'GLOBAL_ADMIN'
                        ? 'text-purple-300'
                        : currentRole === 'MIGRATION_OPERATOR'
                        ? 'text-blue-300'
                        : 'text-emerald-300'
                    }`}
                  >
                    {currentRole === 'GLOBAL_ADMIN'
                      ? 'Global Admin'
                      : currentRole === 'MIGRATION_OPERATOR'
                      ? 'Operator'
                      : 'Auditor'}
                  </span>
                </div>
                <ChevronDown className="h-3 w-3 text-slate-500 dark:text-slate-400" />
              </div>

              {/* Dropdown menu */}
              <div className="absolute bottom-full mb-1 left-0 w-full bg-blue-50 dark:bg-[#2b2b2b] border border-slate-200 dark:border-[#404040] rounded shadow-xl p-1 hidden group-hover:block z-50">
                <button
                  onClick={() => setCurrentRole('GLOBAL_ADMIN')}
                  className={`w-full text-left px-2 py-1.5 rounded text-[11px] transition-colors ${
                    currentRole === 'GLOBAL_ADMIN'
                      ? 'bg-purple-950/40 text-purple-200 border-l-2 border-purple-500'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#404040]'
                  }`}
                >
                  <span className="font-semibold">Global Admin</span>
                </button>
                <button
                  onClick={() => setCurrentRole('MIGRATION_OPERATOR')}
                  className={`w-full text-left px-2 py-1.5 rounded text-[11px] transition-colors ${
                    currentRole === 'MIGRATION_OPERATOR'
                      ? 'bg-blue-950/40 text-blue-200 border-l-2 border-blue-500'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#404040]'
                  }`}
                >
                  <span className="font-semibold">Operator</span>
                </button>
                <button
                  onClick={() => setCurrentRole('AUDITOR')}
                  className={`w-full text-left px-2 py-1.5 rounded text-[11px] transition-colors ${
                    currentRole === 'AUDITOR'
                      ? 'bg-emerald-950/40 text-emerald-200 border-l-2 border-emerald-500'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#404040]'
                  }`}
                >
                  <span className="font-semibold">Auditor</span>
                </button>
              </div>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
};
