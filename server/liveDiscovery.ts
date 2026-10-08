import { prisma } from './db.js';
import { recordAuditLog } from './audit.js';

type Workload = 'Users' | 'Groups' | 'SharePoint' | 'Teams';
const supported: Workload[] = ['Users','Groups','SharePoint','Teams'];
const GRAPH = 'https://graph.microsoft.com/v1.0';
const timeoutMs = 30000;
const sleep = (ms:number) => new Promise(r=>setTimeout(r,ms));
const env = (name:string) => { const value=process.env[name]; if(!value)throw new Error(`Missing ${name}`);return value; };
const tenant = () => env('SOURCE_TENANT_ID');
const validateTenant = () => { const v=tenant();if(!/^[a-f0-9-]{36}$/i.test(v))throw new Error('SOURCE_TENANT_ID must be a GUID');return v; };

let cachedToken: {value:string; expiresAt:number} | null=null;
async function token() {
  if(cachedToken && cachedToken.expiresAt > Date.now()+300000) return cachedToken.value;
  const tid=validateTenant();
  const response=await fetch(`https://login.microsoftonline.com/${tid}/oauth2/v2.0/token`,{
    method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},
    body:new URLSearchParams({client_id:env('SOURCE_DISCOVERY_CLIENT_ID'),client_secret:env('SOURCE_DISCOVERY_CLIENT_SECRET'),grant_type:'client_credentials',scope:'https://graph.microsoft.com/.default'}),
    signal:AbortSignal.timeout(timeoutMs)
  });
  if(!response.ok)throw new Error(`Microsoft identity token request failed (${response.status})`);
  const result=await response.json() as {access_token?:string;expires_in?:number};
  if(!result.access_token)throw new Error('Microsoft identity returned no access token');
  cachedToken={value:result.access_token,expiresAt:Date.now()+Math.max(300,Math.min(3600,Number(result.expires_in)||3600))*1000};
  return cachedToken.value;
}

async function graphGet(url:string,_accessToken?:string) {
  let next=url.startsWith('/')?GRAPH+url:url;
  for(let attempt=0;attempt<6;attempt++){
    const parsed=new URL(next);
    if(parsed.protocol!=='https:' || parsed.hostname!=='graph.microsoft.com' || !parsed.pathname.startsWith('/v1.0/'))throw new Error('Graph pagination URL rejected');
    const response=await fetch(next,{headers:{Authorization:`Bearer ${await token()}`,Accept:'application/json'},signal:AbortSignal.timeout(timeoutMs)});
    if(response.ok)return await response.json() as any;
    if(response.status===401 && attempt<1) { cachedToken=null; continue; }
    if((response.status===429||response.status===503||response.status===504)&&attempt<5){
      const header=response.headers.get('Retry-After');
      const sec=header&&/^\d+$/.test(header)?Number(header):Math.pow(2,attempt+1);
      await sleep(Math.min(Math.max(sec,1),60)*1000+Math.floor(Math.random()*400));
      continue;
    }
    throw new Error(`Microsoft Graph request failed (${response.status})`);
  }
  throw new Error('Graph retries exhausted');
}
async function* pages(path:string, accessToken:string){
  let next:string|null=path;let count=0;
  while(next){
    if(++count>10000)throw new Error('Discovery exceeded 10,000 pages');
    const page=await graphGet(next,accessToken);
    if(!Array.isArray(page.value))throw new Error('Invalid Microsoft Graph list response');
    for(const entry of page.value)yield entry as any;
    next=page['@odata.nextLink']||null;
  }
}
function graphDate(value:any){if(!value)return null;const parsed=new Date(value);return Number.isNaN(parsed.getTime())?null:parsed;}
let running=false;

/** Explicit real-only discovery. Never mixes seeded demo data with live records. */
export async function startLiveDiscovery(requested:unknown,actor:string,projectId:string) {
  if(!projectId) throw new Error('projectId is required');
  const project=await prisma.discoveryProject.findUnique({where:{id:projectId},include:{organization:true}});
  if(!project || project.sourceTenantId.toLowerCase()!==validateTenant().toLowerCase())throw new Error('Project not found or source tenant mismatch');
  if(process.env.DEMO_MODE==='true')throw new Error('Disable DEMO_MODE before live discovery');
  if(running)throw new Error('A live discovery scan is already running in this process');
  const workloads=Array.isArray(requested)?requested:supported;
  if(!workloads.length||workloads.some(x=>!supported.includes(x)))throw new Error('Supported live workloads: Users, Groups, SharePoint, Teams. Mailboxes, OneDrive and distribution lists require separate verified adapters.');
  const accessToken=await token();
  const org=await graphGet('/organization?$select=id,displayName,verifiedDomains',accessToken);
  const actualId=org.value?.[0]?.id;
  if(!actualId||actualId.toLowerCase()!==tenant().toLowerCase())throw new Error('Connected Graph organization does not match SOURCE_TENANT_ID');
  const previous=await prisma.scopedDiscoveryScan.findFirst({where:{projectId,status:'RUNNING'},orderBy:{startedAt:'desc'}});
  if(previous)throw new Error('An unfinished scan exists. Resolve it before starting another.');
  const scan=await prisma.scopedDiscoveryScan.create({data:{projectId,tenantId:actualId,status:'RUNNING',workloads:JSON.stringify(workloads),currentStage:'LIVE: Verified source organization'}});
  running=true;
  void execute(scan.id,projectId,actualId,workloads as Workload[],accessToken,actor).finally(()=>{running=false;});
  return {...scan,sourceTenantId:actualId,mode:'LIVE'};
}
async function execute(scanId:string,projectId:string,tenantId:string,workloads:Workload[],accessToken:string,actor:string){
  const counts={usersDiscovered:0,groupsDiscovered:0,sharePointSitesDiscovered:0,teamsDiscovered:0};
  try {
    for(let index=0;index<workloads.length;index++){
      const w=workloads[index];
      await prisma.scopedDiscoveryScan.update({where:{id:scanId},data:{currentStage:`LIVE: Discovering ${w}`}});
      const paths: Record<Workload,string> = {
        Users:'/users?$select=id,userPrincipalName,displayName,department,jobTitle,accountEnabled,usageLocation&$top=100',
        Groups:'/groups?$select=id,displayName,mail,mailEnabled,securityEnabled,groupTypes&$top=100',
        SharePoint:'/sites/getAllSites?$select=id,displayName,webUrl,lastModifiedDateTime&$top=100',
        Teams:"/groups?$filter=resourceProvisioningOptions/Any(x:x eq 'Team')&$select=id,displayName,description,visibility&$top=100"
      };
      for await(const item of pages(paths[w],accessToken)){
        const sourceId=String(item.id||'');
        if(!sourceId)continue;
        const displayName=String(item.displayName||item.userPrincipalName||item.webUrl||sourceId);
        // Inventory is a per-scan snapshot. Nothing can overwrite another project's entries.
        await prisma.scopedDiscoveryItem.upsert({
          where:{scanId_workload_sourceId:{scanId,workload:w,sourceId}},
          create:{scanId,projectId,tenantId,workload:w,sourceId,displayName,rawMetadata:JSON.stringify(item)},
          update:{displayName,rawMetadata:JSON.stringify(item)}
        });
        if(w==='Users')counts.usersDiscovered++;
        if(w==='Groups')counts.groupsDiscovered++;
        if(w==='SharePoint')counts.sharePointSitesDiscovered++;
        if(w==='Teams')counts.teamsDiscovered++;
      }
    }
    await prisma.scopedDiscoveryScan.update({where:{id:scanId},data:{status:'COMPLETED',currentStage:'LIVE: Inventory snapshot completed; advanced metrics not assessed',completedAt:new Date()}});
    await recordAuditLog({actorEmail:actor,actorRole:'GLOBAL_ADMIN',action:'LIVE_DISCOVERY_COMPLETED',resource:`DiscoveryScan:${scanId}`,status:'SUCCESS',details:JSON.stringify({projectId,tenantId,...counts})});
  }catch(e:any){
    await prisma.scopedDiscoveryScan.update({where:{id:scanId},data:{status:'FAILED',errorMessage:e?.message||'Discovery failed',currentStage:'LIVE: Failed',completedAt:new Date()}}).catch(console.error);
    await recordAuditLog({actorEmail:actor,actorRole:'GLOBAL_ADMIN',action:'LIVE_DISCOVERY_FAILED',resource:`DiscoveryScan:${scanId}`,status:'FAILED',details:String(e?.message||e)});
  }
}
