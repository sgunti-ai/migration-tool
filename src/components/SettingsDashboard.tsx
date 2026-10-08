import React, { useState } from 'react';
import { 
  Settings2, Bell, Shield, Webhook, Save, RotateCcw, HelpCircle, 
  Mail, MessageSquare, AlertTriangle, Lock, FileClock, Users, FileText,
  Code2, Key, Terminal, Puzzle
} from 'lucide-react';

export const SettingsDashboard = () => {
  const [activeSubTab, setActiveSubTab] = useState<'notifications' | 'security' | 'api'>('notifications');
  const [showConfirm, setShowConfirm] = useState<'save' | 'reset' | null>(null);

  const [notificationState, setNotificationState] = useState({
    emailTemplates: 'default',
    webhookUrl: 'https://api.contoso.com/webhooks/migration',
    teamsIntegration: true,
    slackIntegration: false,
    alertThresholdCritical: 5,
    alertThresholdWarning: 20
  });

  const [securityState, setSecurityState] = useState({
    dataEncryption: 'AES-256',
    auditRetention: '90',
    rbacEnforced: true,
    complianceReport: 'GDPR'
  });

  const [apiState, setApiState] = useState({
    apiKey: 'sk_live_1234567890abcdef',
    powerShellModule: 'v2.4.1',
    thirdPartySync: true
  });

  const handleSave = () => {
    alert('Settings saved successfully!');
    setShowConfirm(null);
  };

  const handleReset = () => {
    alert('Settings reset to defaults!');
    setShowConfirm(null);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 min-h-[800px] border border-slate-200 rounded-md shadow-sm">
      <div className="px-6 py-5 bg-white border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">System Settings</h1>
          <p className="text-sm text-slate-500 mt-1">Configure notifications, security compliance, and integrations.</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => setShowConfirm('reset')}
            className="flex items-center space-x-2 px-3 py-2 bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-50 transition-colors text-sm font-medium"
          >
            <RotateCcw className="h-4 w-4" /> <span>Reset Defaults</span>
          </button>
          <button 
            onClick={() => setShowConfirm('save')}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
          >
            <Save className="h-4 w-4" /> <span>Save Changes</span>
          </button>
        </div>
      </div>

      <div className="flex border-b border-slate-200 bg-white px-4">
        <button 
          onClick={() => setActiveSubTab('notifications')} 
          className={`px-4 py-3 text-sm font-medium border-b-2 flex items-center space-x-2 ${activeSubTab === 'notifications' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-600 hover:text-slate-800'}`}
        >
          <Bell className="h-4 w-4" />
          <span>Notifications & Alerts</span>
        </button>
        <button 
          onClick={() => setActiveSubTab('security')} 
          className={`px-4 py-3 text-sm font-medium border-b-2 flex items-center space-x-2 ${activeSubTab === 'security' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-600 hover:text-slate-800'}`}
        >
          <Shield className="h-4 w-4" />
          <span>Security & Compliance</span>
        </button>
        <button 
          onClick={() => setActiveSubTab('api')} 
          className={`px-4 py-3 text-sm font-medium border-b-2 flex items-center space-x-2 ${activeSubTab === 'api' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-600 hover:text-slate-800'}`}
        >
          <Webhook className="h-4 w-4" />
          <span>API & Integrations</span>
        </button>
      </div>

      <div className="p-6 overflow-y-auto flex-1">
        
        {activeSubTab === 'notifications' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
                <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center"><Mail className="w-5 h-5 mr-2 text-blue-600" /> Messaging & Hooks</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center justify-between">
                      Email Notification Templates
                      <span title="Choose the template used for automated emails"><HelpCircle className="w-4 h-4 text-slate-500 dark:text-slate-400" /></span>
                    </label>
                    <select value={notificationState.emailTemplates} onChange={e => setNotificationState({...notificationState, emailTemplates: e.target.value})} className="w-full border border-slate-300 rounded p-2 text-sm bg-white">
                      <option value="default">Default Template</option>
                      <option value="verbose">Verbose (Includes full logs)</option>
                      <option value="compact">Compact (Status only)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center justify-between">
                      Global Webhook URL
                      <span title="Endpoint to receive JSON payloads for migration events"><HelpCircle className="w-4 h-4 text-slate-500 dark:text-slate-400" /></span>
                    </label>
                    <input type="text" value={notificationState.webhookUrl} onChange={e => setNotificationState({...notificationState, webhookUrl: e.target.value})} className="w-full border border-slate-300 rounded p-2 text-sm" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
                <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center"><MessageSquare className="w-5 h-5 mr-2 text-indigo-600" /> Chat Integrations</h3>
                <div className="space-y-4">
                  <label className="flex items-center space-x-3 cursor-pointer p-3 hover:bg-slate-50 rounded border border-transparent hover:border-slate-100">
                    <input type="checkbox" checked={notificationState.teamsIntegration} onChange={e => setNotificationState({...notificationState, teamsIntegration: e.target.checked})} className="rounded text-blue-600 w-5 h-5" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-700">Microsoft Teams Integration</div>
                      <div className="text-xs text-slate-500">Send notifications directly to connected Teams channels.</div>
                    </div>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer p-3 hover:bg-slate-50 rounded border border-transparent hover:border-slate-100">
                    <input type="checkbox" checked={notificationState.slackIntegration} onChange={e => setNotificationState({...notificationState, slackIntegration: e.target.checked})} className="rounded text-blue-600 w-5 h-5" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-700">Slack Integration</div>
                      <div className="text-xs text-slate-500">Send notifications to Slack workspaces via Incoming Webhook.</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
              <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center"><AlertTriangle className="w-5 h-5 mr-2 text-amber-500" /> Alert Thresholds</h3>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center justify-between">
                    Critical Error Threshold (%)
                    <span title="Trigger alerts when critical failures exceed this percentage of total jobs"><HelpCircle className="w-4 h-4 text-slate-500 dark:text-slate-400" /></span>
                  </label>
                  <input type="number" value={notificationState.alertThresholdCritical} onChange={e => setNotificationState({...notificationState, alertThresholdCritical: Number(e.target.value)})} className="w-full border border-slate-300 rounded p-2 text-sm" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center justify-between">
                    Warning Threshold (%)
                    <span title="Trigger alerts when warning limits exceed this percentage"><HelpCircle className="w-4 h-4 text-slate-500 dark:text-slate-400" /></span>
                  </label>
                  <input type="number" value={notificationState.alertThresholdWarning} onChange={e => setNotificationState({...notificationState, alertThresholdWarning: Number(e.target.value)})} className="w-full border border-slate-300 rounded p-2 text-sm" />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSubTab === 'security' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
                <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center"><Lock className="w-5 h-5 mr-2 text-blue-600" /> Encryption & Logs</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center justify-between">
                      Data Encryption Standards
                      <span title="Standard used for data at rest"><HelpCircle className="w-4 h-4 text-slate-500 dark:text-slate-400" /></span>
                    </label>
                    <select value={securityState.dataEncryption} onChange={e => setSecurityState({...securityState, dataEncryption: e.target.value})} className="w-full border border-slate-300 rounded p-2 text-sm bg-white">
                      <option value="AES-256">AES-256-GCM</option>
                      <option value="ChaCha20">ChaCha20-Poly1305</option>
                      <option value="None">None (Not Recommended)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center justify-between">
                      Audit Log Retention (Days)
                      <span title="Number of days to keep migration audit logs before auto-pruning"><HelpCircle className="w-4 h-4 text-slate-500 dark:text-slate-400" /></span>
                    </label>
                    <select value={securityState.auditRetention} onChange={e => setSecurityState({...securityState, auditRetention: e.target.value})} className="w-full border border-slate-300 rounded p-2 text-sm bg-white">
                      <option value="30">30 Days</option>
                      <option value="90">90 Days</option>
                      <option value="365">1 Year</option>
                      <option value="infinite">Indefinitely</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
                <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center"><Users className="w-5 h-5 mr-2 text-indigo-600" /> Access & Compliance</h3>
                <div className="space-y-4">
                  <label className="flex items-center space-x-3 cursor-pointer p-3 hover:bg-slate-50 rounded border border-transparent hover:border-slate-100">
                    <input type="checkbox" checked={securityState.rbacEnforced} onChange={e => setSecurityState({...securityState, rbacEnforced: e.target.checked})} className="rounded text-blue-600 w-5 h-5" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-700">Enforce Strict RBAC</div>
                      <div className="text-xs text-slate-500">Require specific Global Admin or Migration Operator roles to initiate jobs.</div>
                    </div>
                  </label>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center justify-between">
                      Compliance Reporting Mode
                      <span title="Generates specific report formats tailored to compliance frameworks"><HelpCircle className="w-4 h-4 text-slate-500 dark:text-slate-400" /></span>
                    </label>
                    <select value={securityState.complianceReport} onChange={e => setSecurityState({...securityState, complianceReport: e.target.value})} className="w-full border border-slate-300 rounded p-2 text-sm bg-white">
                      <option value="GDPR">GDPR - Right to Erasure / Portability</option>
                      <option value="HIPAA">HIPAA - PHI Transfer Logs</option>
                      <option value="SOC2">SOC2 - Security & Availability</option>
                      <option value="Standard">Standard Organizational Policies</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSubTab === 'api' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
              <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center"><Code2 className="w-5 h-5 mr-2 text-blue-600" /> Developer Integrations</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center justify-between">
                    API Key Management
                    <span title="Key used for authorizing programmatic REST API access"><HelpCircle className="w-4 h-4 text-slate-500 dark:text-slate-400" /></span>
                  </label>
                  <div className="flex space-x-2">
                    <div className="relative flex-1">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-slate-400" />
                      <input type="password" value={apiState.apiKey} onChange={e => setApiState({...apiState, apiKey: e.target.value})} className="pl-9 w-full border border-slate-300 rounded p-2 text-sm font-mono" />
                    </div>
                    <button className="px-4 py-2 bg-slate-100 text-slate-700 border border-slate-200 rounded text-sm font-medium hover:bg-slate-200">Rotate Key</button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center justify-between">
                      PowerShell Module Version
                      <span title="Target version of the migration PS modules"><HelpCircle className="w-4 h-4 text-slate-500 dark:text-slate-400" /></span>
                    </label>
                    <div className="relative">
                      <Terminal className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-slate-400" />
                      <select value={apiState.powerShellModule} onChange={e => setApiState({...apiState, powerShellModule: e.target.value})} className="pl-9 w-full border border-slate-300 rounded p-2 text-sm bg-white">
                        <option value="v2.4.1">v2.4.1 (Latest Stable)</option>
                        <option value="v2.3.0">v2.3.0 (Legacy Support)</option>
                        <option value="v3.0.0-beta">v3.0.0-beta (Preview)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="flex items-center space-x-3 cursor-pointer p-3 mt-4 hover:bg-slate-50 rounded border border-transparent hover:border-slate-100">
                      <input type="checkbox" checked={apiState.thirdPartySync} onChange={e => setApiState({...apiState, thirdPartySync: e.target.checked})} className="rounded text-blue-600 w-5 h-5" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-slate-700">Third-Party Extensions</div>
                        <div className="text-xs text-slate-500">Allow external tools (e.g. ServiceNow, Jira) to query migration status.</div>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <a href="#" className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center">
                    <FileText className="w-4 h-4 mr-2" /> View REST API Documentation
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-2">
              {showConfirm === 'save' ? 'Save Settings' : 'Reset Defaults'}
            </h3>
            <p className="text-sm text-slate-600 mb-6">
              {showConfirm === 'save' 
                ? 'Apply the modified system settings globally?' 
                : 'Reset all system settings back to original defaults?'}
            </p>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setShowConfirm(null)} className="px-4 py-2 border border-slate-300 rounded text-slate-700 font-medium text-sm hover:bg-slate-50 transition-colors">Cancel</button>
              <button onClick={showConfirm === 'save' ? handleSave : handleReset} className={`px-4 py-2 rounded text-slate-900 dark:text-white font-medium text-sm transition-colors ${showConfirm === 'save' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'}`}>
                {showConfirm === 'save' ? 'Confirm Save' : 'Confirm Reset'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
