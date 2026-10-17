import React,{useCallback,useEffect,useState} from 'react';
import {RefreshCw,Play,Database,Plus,ShieldCheck} from 'lucide-react';

type Project={id:string;name:string;sourceTenantId:string};
type Scan={id:string;status:string;progress:number;scanType:string;createdAt:string;errorMessage?:string|null};
type Inventory={count:number;items:Array<{workload:string;sourceId:string;name:string|null;isDeleted:boolean}>};
type Report={status:string;workloads:Array<{workload:string;status:string;itemsRecorded:number;errorMessage?:string|null}>;unsupportedWorkloads:Array<{workload:string;status:string}>};
const workloads=['Users','Groups','SharePoint','Teams','OneDrive'] as const;
const api=async<T,>(path:string,init?:RequestInit):Promise<T>=>{
 const res=await fetch('/api/discovery-service'+path,{...init,headers:{'Content-Type':'application/json',...init?.headers}});
 if(!res.ok){let message='Discovery API HTTP '+res.status;try{const body=await res.json();message=body.error||message;}catch{}throw new Error(message);}
 return res.json() as Promise<T>;
};

export const DiscoveryServiceDashboard:React.FC=()=>{
 const [projects,setProjects]=useState<Project[]>([]);
 const [projectId,setProjectId]=useState('');
 const [scans,setScans]=useState<Scan[]>([]);
 const [report,setReport]=useState<Report|null>(null);
 const [inventory,setInventory]=useState<Inventory|null>(null);
 const [name,setName]=useState('');
 const [tenantId,setTenantId]=useState('');
 const [clientId,setClientId]=useState('');
 const [clientSecret,setClientSecret]=useState('');
 const [selected,setSelected]=useState<string[]>(['Users','Groups']);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [notice,setNotice]=useState('');
 const [scanId,setScanId]=useState('');
 const refreshProjects=useCallback(async()=>{
  try{const records=await api<Project[]>('/projects');setProjects(records);setProjectId(prev=>prev&&records.some(p=>p.id===prev)?prev:records[0]?.id||'');setError('');}
  catch(e){setError(e instanceof Error?e.message:'Discovery service unavailable');}
 },[]);
 const refresh=useCallback(async()=>{
  if(!projectId){setScans([]);setInventory(null);setReport(null);return;}
  try{
   const [history,items]=await Promise.all([api<Scan[]>('/projects/'+encodeURIComponent(projectId)+'/scans'),api<Inventory>('/projects/'+encodeURIComponent(projectId)+'/inventory/current')]);
   setScans(history);setInventory(items);
   const reportId=scanId||history[0]?.id;
   if(reportId){setReport(await api<Report>('/projects/'+encodeURIComponent(projectId)+'/scans/'+encodeURIComponent(reportId)+'/report'));}
   else setReport(null);
   setError('');
  }catch(e){setError(e instanceof Error?e.message:'Unable to load discovery');}
 },[projectId,scanId]);
 useEffect(()=>{void refreshProjects();},[refreshProjects]);
 useEffect(()=>{setScanId('');setReport(null);},[projectId]);
 useEffect(()=>{void refresh();},[refresh]);
 useEffect(()=>{if(!scans.some(s=>['RUNNING','QUEUED','RETRYING'].includes(s.status)))return;const t=setInterval(()=>void refresh(),3000);return()=>clearInterval(t);},[scans,refresh]);
 const run=async(task:()=>Promise<void>)=>{setBusy(true);setError('');setNotice('');try{await task();}catch(e){setError(e instanceof Error?e.message:'Operation failed');}finally{setBusy(false);}};
 const createProject=()=>void run(async()=>{const p=await api<Project>('/projects',{method:'POST',body:JSON.stringify({name,sourceTenantId:tenantId})});setName('');setTenantId('');await refreshProjects();setProjectId(p.id);setNotice('Project created in the dedicated Discovery database.');});
 const saveCredential=()=>void run(async()=>{await api('/projects/'+encodeURIComponent(projectId)+'/credentials',{method:'PUT',body:JSON.stringify({tenantId:projects.find(p=>p.id===projectId)?.sourceTenantId,clientId,clientSecret})});setClientSecret('');setNotice('Tenant credentials securely saved to Discovery.');});
 const start=()=>void run(async()=>{if(!selected.length)throw new Error('Select at least one workload');await api('/projects/'+encodeURIComponent(projectId)+'/scans',{method:'POST',body:JSON.stringify({workloads:selected})});setScanId('');await refresh();setNotice('Live Graph discovery queued.');});
 const input='rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-sm w-full text-slate-900 dark:text-slate-100';
 const button='rounded-lg px-4 py-2 text-sm font-semibold bg-blue-700 text-white hover:bg-blue-800 disabled:opacity-50';
 return <section className="space-y-6 text-slate-900 dark:text-slate-100">
  <div className="flex flex-wrap gap-3 items-center justify-between"><div><h1 className="text-2xl font-bold flex items-center gap-2"><Database size={24}/> Discovery Service</h1><p className="text-sm text-slate-500 dark:text-slate-400">Independent PostgreSQL inventory · Microsoft Graph live scans</p></div><button className={button} onClick={()=>void refresh()} disabled={busy}><RefreshCw size={16} className="inline mr-2"/>Refresh</button></div>
  {error&&<p role="alert" className="rounded-lg border border-red-400 bg-red-50 dark:bg-red-950 p-3 text-red-800 dark:text-red-200">{error}</p>}
  {notice&&<p role="status" className="rounded-lg border border-green-400 bg-green-50 dark:bg-green-950 p-3 text-green-800 dark:text-green-200">{notice}</p>}
  <div className="grid gap-5 xl:grid-cols-2">
   <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-5 space-y-3"><h2 className="font-semibold">Discovery projects</h2><select aria-label="Discovery project" className={input} value={projectId} onChange={e=>setProjectId(e.target.value)}><option value="">Choose a project</option>{projects.map(p=><option key={p.id} value={p.id}>{p.name} ({p.sourceTenantId})</option>)}</select><div className="grid sm:grid-cols-2 gap-2"><input aria-label="Project name" placeholder="New project name" className={input} value={name} onChange={e=>setName(e.target.value)}/><input aria-label="Source tenant ID" placeholder="Source tenant UUID" className={input} value={tenantId} onChange={e=>setTenantId(e.target.value)}/></div><button className={button} disabled={busy||!name||!tenantId} onClick={createProject}><Plus size={16} className="inline mr-2"/>Create project</button></div>
   <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-5 space-y-3"><h2 className="font-semibold flex gap-2 items-center"><ShieldCheck size={18}/> Microsoft Entra credentials</h2><p className="text-xs text-slate-500 dark:text-slate-400">Application ID and client secret are stored encrypted by the Discovery service. Never save credentials in the browser.</p><input aria-label="Microsoft Entra application ID" placeholder="Application (client) ID" className={input} value={clientId} onChange={e=>setClientId(e.target.value)}/><input aria-label="Client secret" type="password" autoComplete="off" placeholder="Client secret" className={input} value={clientSecret} onChange={e=>setClientSecret(e.target.value)}/><button className={button} disabled={busy||!projectId||!clientId||!clientSecret} onClick={saveCredential}>Save source credentials</button></div>
  </div>
  <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-5 space-y-4"><h2 className="font-semibold">Launch live discovery</h2><div className="flex flex-wrap gap-4">{workloads.map(w=><label key={w} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={selected.includes(w)} onChange={e=>setSelected(prev=>e.target.checked?[...prev,w]:prev.filter(x=>x!==w))}/>{w}</label>)}</div><button className={button} disabled={busy||!projectId||!selected.length} onClick={start}><Play size={16} className="inline mr-2"/>Start scan</button></div>
  <div className="grid gap-5 xl:grid-cols-2">
   <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-5"><h2 className="font-semibold mb-3">Scan history</h2><div className="space-y-2">{scans.map(scan=><button key={scan.id} onClick={()=>setScanId(scan.id)} className={'text-left w-full p-3 border rounded-lg dark:border-slate-700 '+(scan.id===scanId?'border-blue-500 bg-blue-50 dark:bg-blue-950':'border-slate-200')}><div className="flex justify-between text-sm"><span>{scan.scanType}</span><strong>{scan.status}</strong></div><p className="text-xs text-slate-500 dark:text-slate-400">{new Date(scan.createdAt).toLocaleString()} · {scan.progress}%</p>{scan.errorMessage&&<p className="text-sm text-red-600 dark:text-red-400">{scan.errorMessage}</p>}</button>)}{!scans.length&&<p className="text-sm text-slate-500">No discovery scans.</p>}</div></div>
   <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-5"><h2 className="font-semibold mb-3">Evidence-based workload report</h2>{report?.workloads.map(w=><div key={w.workload} className="flex justify-between border-b border-slate-200 dark:border-slate-700 py-2 text-sm"><span>{w.workload} · {w.status}</span><strong>{w.itemsRecorded} items</strong></div>)}{!report&&<p className="text-sm text-slate-500">Select or run a scan to see the report.</p>}{report?.unsupportedWorkloads?.length?<p className="text-xs text-amber-700 dark:text-amber-400 mt-3">Not implemented: {report.unsupportedWorkloads.map(w=>w.workload).join(', ')}</p>:null}</div>
  </div>
  <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-5"><h2 className="font-semibold mb-3">Current inventory ({inventory?.count??0})</h2><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr><th className="p-2">Workload</th><th className="p-2">Name</th><th className="p-2">Source ID</th></tr></thead><tbody>{inventory?.items.map(item=><tr key={item.workload+item.sourceId} className="border-t border-slate-200 dark:border-slate-700"><td className="p-2">{item.workload}</td><td className="p-2">{item.name||'—'}</td><td className="p-2 font-mono text-xs">{item.sourceId}</td></tr>)}</tbody></table></div><p className="text-xs text-slate-500 mt-2">First 100 records. Inventory is scoped to the selected project.</p></div>
 </section>;
};
