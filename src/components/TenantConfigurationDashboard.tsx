import React, { useState } from 'react';
import { 
  Building2, Save, RotateCcw, HelpCircle, Key, Globe, CheckCircle, 
  Settings2, FileType, HardDrive, AlertTriangle, Calendar, Users, 
  Wand2, Shield, Play, Lock, FileClock, History, Link
} from 'lucide-react';

export const TenantConfigurationDashboard = () => {
  const [activeSubTab, setActiveSubTab] = useState<'config' | 'policies' | 'mapping'>('config');
  const [showConfirm, setShowConfirm] = useState<'save' | 'reset' | null>(null);

  // Forms state
  const [configState, setConfigState] = useState({
    sourceClientId: 'a8b9c0d1-e2f3-4g5h-6i7j-8k9l0m1n2o3p',
    sourceTenantId: 'contoso.onmicrosoft.com',
    targetClientId: 'b1c2d3e4-f5g6-7h8i-9j0k-1l2m3n4o5p6q',
    targetTenantId: 'fabrikam.onmicrosoft.com'
  });

  const [policyState, setPolicyState] = useState({
    preservePermissions: true,
    preserveVersions: true,
    preserveTimestamps: true,
    excludeExtensions: '.exe, .dll, .tmp',
    maxFileSize: 15,
    quotaLimit: 50,
    conflictResolution: 'skip',
    scheduleWindow: 'off-peak'
  });

  const [mappingState, setMappingState] = useState({
    template: 'upn-match',
    domainTransformSource: '@contoso.com',
    domainTransformTarget: '@fabrikam.com',
    algorithm: 'fuzzy-match',
    manualOverride: true
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
      {/* Header */}
      <div className="px-6 py-5 bg-white border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Tenant Configurations</h1>
          <p className="text-sm text-slate-500 mt-1">Manage connections, migration policies, and user mapping rules.</p>
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
          onClick={() => setActiveSubTab('config')} 
          className={`px-4 py-3 text-sm font-medium border-b-2 flex items-center space-x-2 ${activeSubTab === 'config' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-600 hover:text-slate-800'}`}
        >
          <Building2 className="h-4 w-4" />
          <span>Tenant Configuration</span>
        </button>
        <button 
          onClick={() => setActiveSubTab('policies')} 
          className={`px-4 py-3 text-sm font-medium border-b-2 flex items-center space-x-2 ${activeSubTab === 'policies' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-600 hover:text-slate-800'}`}
        >
          <Settings2 className="h-4 w-4" />
          <span>Migration Policies</span>
        </button>
        <button 
          onClick={() => setActiveSubTab('mapping')} 
          className={`px-4 py-3 text-sm font-medium border-b-2 flex items-center space-x-2 ${activeSubTab === 'mapping' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-600 hover:text-slate-800'}`}
        >
          <Users className="h-4 w-4" />
          <span>User Mapping Rules</span>
        </button>
      </div>

      <div className="p-6 overflow-y-auto flex-1">
        
        {/* Tenant Configuration */}
        {activeSubTab === 'config' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Source Tenant */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-slate-800 flex items-center"><Building2 className="w-5 h-5 mr-2 text-blue-600" /> Source Tenant</h3>
                  <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full flex items-center"><CheckCircle className="w-3 h-3 mr-1" /> Connected</span>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center justify-between">
                      Tenant ID / Domain
                      <HelpCircle className="w-4 h-4 text-slate-400" title="The primary domain or directory ID of the source Azure AD" />
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="text" value={configState.sourceTenantId} onChange={e => setConfigState({...configState, sourceTenantId: e.target.value})} className="pl-9 w-full border border-slate-300 rounded p-2 text-sm focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center justify-between">
                      App Registration Client ID
                      <HelpCircle className="w-4 h-4 text-slate-400" title="The Client ID of the enterprise application registered for migration" />
                    </label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="text" value={configState.sourceClientId} onChange={e => setConfigState({...configState, sourceClientId: e.target.value})} className="pl-9 w-full border border-slate-300 rounded p-2 text-sm focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                  </div>
                  <button className="mt-2 w-full py-2 bg-slate-50 border border-slate-200 text-slate-700 rounded text-sm font-medium hover:bg-slate-100 flex items-center justify-center">
                    <Play className="w-4 h-4 mr-2" /> Test Connection
                  </button>
                </div>
              </div>

              {/* Target Tenant */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-slate-800 flex items-center"><Building2 className="w-5 h-5 mr-2 text-indigo-600" /> Target Tenant</h3>
                  <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full flex items-center"><CheckCircle className="w-3 h-3 mr-1" /> Connected</span>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center justify-between">
                      Tenant ID / Domain
                      <HelpCircle className="w-4 h-4 text-slate-400" title="The primary domain or directory ID of the target Azure AD" />
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="text" value={configState.targetTenantId} onChange={e => setConfigState({...configState, targetTenantId: e.target.value})} className="pl-9 w-full border border-slate-300 rounded p-2 text-sm focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center justify-between">
                      App Registration Client ID
                      <HelpCircle className="w-4 h-4 text-slate-400" title="The Client ID of the enterprise application registered for migration in target" />
                    </label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="text" value={configState.targetClientId} onChange={e => setConfigState({...configState, targetClientId: e.target.value})} className="pl-9 w-full border border-slate-300 rounded p-2 text-sm focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                  </div>
                  <button className="mt-2 w-full py-2 bg-slate-50 border border-slate-200 text-slate-700 rounded text-sm font-medium hover:bg-slate-100 flex items-center justify-center">
                    <Play className="w-4 h-4 mr-2" /> Test Connection
                  </button>
                </div>
              </div>
            </div>

            {/* Permission Validation Checklist */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
              <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center"><Shield className="w-5 h-5 mr-2 text-emerald-600" /> Permission Validation Checklist</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: 'Files.ReadWrite.All', desc: 'Allows migration of SharePoint and OneDrive files' },
                  { label: 'Mail.ReadWrite', desc: 'Allows reading and writing to Exchange mailboxes' },
                  { label: 'Directory.ReadWrite.All', desc: 'Allows user mapping and profile sync' },
                  { label: 'Sites.FullControl.All', desc: 'Allows provisioning and structuring SharePoint sites' }
                ].map(perm => (
                  <div key={perm.label} className="flex items-start p-3 bg-slate-50 border border-slate-100 rounded">
                    <CheckCircle className="w-5 h-5 text-emerald-500 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-sm font-semibold text-slate-700">{perm.label}</div>
                      <div className="text-xs text-slate-500">{perm.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Migration Policies */}
        {activeSubTab === 'policies' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Defaults */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
              <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center"><Settings2 className="w-5 h-5 mr-2 text-blue-600" /> Default Migration Settings</h3>
              <div className="space-y-4">
                <label className="flex items-center space-x-3 cursor-pointer p-3 hover:bg-slate-50 rounded border border-transparent hover:border-slate-100">
                  <input type="checkbox" checked={policyState.preservePermissions} onChange={e => setPolicyState({...policyState, preservePermissions: e.target.checked})} className="rounded text-blue-600 w-5 h-5" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-700 flex items-center">Preserve Permissions <HelpCircle className="w-4 h-4 ml-2 text-slate-400" title="Retain original sharing links and access rights" /></div>
                    <div className="text-xs text-slate-500">Migrates item-level permissions (ACLs) to target environment.</div>
                  </div>
                  <Lock className="w-5 h-5 text-slate-400" />
                </label>
                <label className="flex items-center space-x-3 cursor-pointer p-3 hover:bg-slate-50 rounded border border-transparent hover:border-slate-100">
                  <input type="checkbox" checked={policyState.preserveVersions} onChange={e => setPolicyState({...policyState, preserveVersions: e.target.checked})} className="rounded text-blue-600 w-5 h-5" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-700 flex items-center">Preserve Version History <HelpCircle className="w-4 h-4 ml-2 text-slate-400" title="Migrate multiple versions of files" /></div>
                    <div className="text-xs text-slate-500">Brings over file history. May increase migration duration.</div>
                  </div>
                  <History className="w-5 h-5 text-slate-400" />
                </label>
                <label className="flex items-center space-x-3 cursor-pointer p-3 hover:bg-slate-50 rounded border border-transparent hover:border-slate-100">
                  <input type="checkbox" checked={policyState.preserveTimestamps} onChange={e => setPolicyState({...policyState, preserveTimestamps: e.target.checked})} className="rounded text-blue-600 w-5 h-5" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-700 flex items-center">Preserve Timestamps <HelpCircle className="w-4 h-4 ml-2 text-slate-400" title="Keep original created/modified dates" /></div>
                    <div className="text-xs text-slate-500">Maintains original "Created By" and "Modified At" metadata.</div>
                  </div>
                  <FileClock className="w-5 h-5 text-slate-400" />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
                <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center"><FileType className="w-5 h-5 mr-2 text-indigo-600" /> File Type & Limits</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Excluded Extensions</label>
                    <input type="text" value={policyState.excludeExtensions} onChange={e => setPolicyState({...policyState, excludeExtensions: e.target.value})} className="w-full border border-slate-300 rounded p-2 text-sm" placeholder=".exe, .dll" />
                  </div>
                  <div className="flex space-x-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Max File Size (GB)</label>
                      <input type="number" value={policyState.maxFileSize} onChange={e => setPolicyState({...policyState, maxFileSize: Number(e.target.value)})} className="w-full border border-slate-300 rounded p-2 text-sm" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Quota Warning (%)</label>
                      <input type="number" value={policyState.quotaLimit} onChange={e => setPolicyState({...policyState, quotaLimit: Number(e.target.value)})} className="w-full border border-slate-300 rounded p-2 text-sm" />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
                <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center"><Calendar className="w-5 h-5 mr-2 text-emerald-600" /> Scheduling & Conflicts</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Conflict Resolution</label>
                    <select value={policyState.conflictResolution} onChange={e => setPolicyState({...policyState, conflictResolution: e.target.value})} className="w-full border border-slate-300 rounded p-2 text-sm bg-white">
                      <option value="skip">Skip existing files</option>
                      <option value="overwrite">Overwrite in target</option>
                      <option value="rename">Rename automatically (append _1)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Allowed Schedule Window</label>
                    <select value={policyState.scheduleWindow} onChange={e => setPolicyState({...policyState, scheduleWindow: e.target.value})} className="w-full border border-slate-300 rounded p-2 text-sm bg-white">
                      <option value="any">Anytime (24/7)</option>
                      <option value="off-peak">Off-peak only (6PM - 6AM)</option>
                      <option value="weekend">Weekends only</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* User Mapping Rules */}
        {activeSubTab === 'mapping' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
              <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center"><Wand2 className="w-5 h-5 mr-2 text-blue-600" /> Automatic Mapping Algorithms</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Attribute Mapping Template</label>
                  <select value={mappingState.template} onChange={e => setMappingState({...mappingState, template: e.target.value})} className="w-full border border-slate-300 rounded p-2 text-sm bg-white">
                    <option value="upn-match">Exact UPN Match</option>
                    <option value="email-match">Primary Email Match</option>
                    <option value="employee-id">EmployeeID Match</option>
                    <option value="custom">Custom JSON Template</option>
                  </select>
                  <p className="text-xs text-slate-500 mt-2">Defines which attribute is used as the primary key when linking source users to target users.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Matching Algorithm</label>
                  <select value={mappingState.algorithm} onChange={e => setMappingState({...mappingState, algorithm: e.target.value})} className="w-full border border-slate-300 rounded p-2 text-sm bg-white">
                    <option value="strict">Strict (Exact string equality)</option>
                    <option value="fuzzy-match">Fuzzy (Ignores case, trims whitespace)</option>
                    <option value="heuristic">Heuristic (AI-assisted suggestion)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
              <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center"><Link className="w-5 h-5 mr-2 text-indigo-600" /> Domain Transformation</h3>
              <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="flex-1 w-full">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Source Suffix/Domain</label>
                  <input type="text" value={mappingState.domainTransformSource} onChange={e => setMappingState({...mappingState, domainTransformSource: e.target.value})} className="w-full border border-slate-300 rounded p-2 text-sm" />
                </div>
                <div className="text-slate-400 font-bold hidden sm:block mt-6">➔</div>
                <div className="flex-1 w-full">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Target Suffix/Domain</label>
                  <input type="text" value={mappingState.domainTransformTarget} onChange={e => setMappingState({...mappingState, domainTransformTarget: e.target.value})} className="w-full border border-slate-300 rounded p-2 text-sm" />
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-4">For example, automatically map <code className="bg-slate-100 px-1 rounded">john.doe@contoso.com</code> to <code className="bg-slate-100 px-1 rounded">john.doe@fabrikam.com</code>.</p>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" checked={mappingState.manualOverride} onChange={e => setMappingState({...mappingState, manualOverride: e.target.checked})} className="rounded text-blue-600 w-5 h-5" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-700">Allow Manual Overrides</div>
                  <div className="text-xs text-slate-500">Permit migration operators to manually override auto-mapped user identities via CSV upload.</div>
                </div>
              </label>
            </div>

          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-2">
              {showConfirm === 'save' ? 'Save Configurations' : 'Reset Defaults'}
            </h3>
            <p className="text-sm text-slate-600 mb-6">
              {showConfirm === 'save' 
                ? 'Are you sure you want to apply these changes? This may impact active migration jobs.' 
                : 'Are you sure you want to reset all configurations to their default values? This action cannot be undone.'}
            </p>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setShowConfirm(null)} className="px-4 py-2 border border-slate-300 rounded text-slate-700 font-medium text-sm hover:bg-slate-50 transition-colors">Cancel</button>
              <button onClick={showConfirm === 'save' ? handleSave : handleReset} className={`px-4 py-2 rounded text-white font-medium text-sm transition-colors ${showConfirm === 'save' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'}`}>
                {showConfirm === 'save' ? 'Confirm Save' : 'Confirm Reset'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
