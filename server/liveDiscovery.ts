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

async function token() {
  const tid=validateTenant();
  const response=await fetch(`https://login.microsoftonline.com/${tid}/oauth2/v2.0/token`,{
    method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},
    body:new URLSearchParams({client_id:env('SOURCE_DISCOVERY_CLIENT_ID'),client_secret:env('SOURCE_DISCOVERY_CLIENT_SECRET'),grant_type:'client_credentials',scope:'https://graph.microsoft.com/.default'}),
    signal:AbortSignal.timeout(timeoutMs)
  });
  if(!response.ok)throw new Error(`Microsoft identity token request failed (${response.status})`);
  const result=await response.json() as {access_token?:string};
  if(!result.access_token)throw new Error('Microsoft identity returned no access token');
  return result.access_token;
}

async function graphGet(url:string,accessToken:string) {
  let next=url.startsWith('/')?GRAPH+url:url;
  for(let attempt=0;attempt<6;attempt++){
    const parsed=new URL(next);
    if(parsed.protocol!=='https:' || parsed.hostname!=='graph.microsoft.com' || !parsed.pathname.startsWith('/v1.0/'))throw new Error('Graph pagination URL rejected');
    const response=await fetch(next,{headers:{Authorization:`Bearer ${accessToken}`,Accept:'application/json'},signal:AbortSignal.timeout(timeoutMs)});
    if(response.ok)return await response.json() as any;
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
export async function startLiveDiscovery(requested:unknown,actor:string) {
  if(process.env.DEMO_MODE==='true')throw new Error('Disable DEMO_MODE before live discovery');
  if(running)throw new Error('A live discovery scan is already running in this process');
  const workloads=Array.isArray(requested)?requested:supported;
  if(!workloads.length||workloads.some(x=>!supported.includes(x)))throw new Error('Supported live workloads: Users, Groups, SharePoint, Teams. Mailboxes, OneDrive and distribution lists require separate verified adapters.');
  const accessToken=await token();
  const org=await graphGet('/organization?$select=id,displayName,verifiedDomains',accessToken);
  const actualId=org.value?.[0]?.id;
  if(!actualId||actualId.toLowerCase()!==tenant().toLowerCase())throw new Error('Connected Graph organization does not match SOURCE_TENANT_ID');
  const previous=await prisma.discoveryScan.findFirst({where:{status:'RUNNING'},orderBy:{startedAt:'desc'}});
  if(previous)throw new Error('An unfinished scan exists. Resolve it before starting another.');
  const scan=await prisma.discoveryScan.create({data:{scanType:'FULL',status:'RUNNING',workloads:JSON.stringify(workloads),currentStage:'LIVE: Verified source organization',progress:0}});
  running=true;
  void execute(scan.id,workloads as Workload[],accessToken,actor).finally(()=>{running=false;});
  return {...scan,sourceTenantId:actualId,mode:'LIVE'};
}
async function execute(scanId:string,workloads:Workload[],accessToken:string,actor:string){
  const counts={usersDiscovered:0,groupsDiscovered:0,sharePointSitesDiscovered:0,teamsDiscovered:0};
  try {
    for(let index=0;index<workloads.length;index++){
      const w=workloads[index];
      await prisma.discoveryScan.update({where:{id:scanId},data:{currentStage:`LIVE: Discovering ${w}`,progress:Math.floor(index/workloads.length*100)}});
      const now=new Date();
      if(w==='Users'){
        for await(const u of pages('/users?$select=id,userPrincipalName,displayName,department,jobTitle,accountEnabled,usageLocation,assignedLicenses&$top=100',accessToken)){
          if(!u.userPrincipalName)continue;
          await prisma.discoveryUser.upsert({where:{upn:u.userPrincipalName},create:{upn:u.userPrincipalName,displayName:u.displayName||u.userPrincipalName,department:u.department,jobTitle:u.jobTitle,accountEnabled:u.accountEnabled??true,usageLocation:u.usageLocation||null,licenses:JSON.stringify((u.assignedLicenses||[]).map((x:any)=>x.skuId)),lastScannedAt:now},update:{displayName:u.displayName||u.userPrincipalName,department:u.department,jobTitle:u.jobTitle,accountEnabled:u.accountEnabled??true,usageLocation:u.usageLocation||null,licenses:JSON.stringify((u.assignedLicenses||[]).map((x:any)=>x.skuId)),lastScannedAt:now}});
          counts.usersDiscovered++;
        }
      }else if(w==='Groups'){
        for await(const g of pages('/groups?$select=id,displayName,mail,mailEnabled,securityEnabled,groupTypes&$top=100',accessToken)){
          if(!g.id)continue;
          await prisma.discoveryGroup.upsert({where:{groupId:g.id},create:{groupId:g.id,name:g.displayName||g.id,email:g.mail,groupType:g.groupTypes?.includes('Unified')?'Microsoft 365':'Security',isMailEnabled:!!g.mailEnabled,isSecurityEnabled:!!g.securityEnabled,lastScannedAt:now},update:{name:g.displayName||g.id,email:g.mail,groupType:g.groupTypes?.includes('Unified')?'Microsoft 365':'Security',isMailEnabled:!!g.mailEnabled,isSecurityEnabled:!!g.securityEnabled,lastScannedAt:now}});
          counts.groupsDiscovered++;
        }
      }else if(w==='SharePoint'){
        for await(const s of pages('/sites/getAllSites?$select=id,displayName,webUrl,lastModifiedDateTime&$top=100',accessToken)){
          if(!s.webUrl)continue;
          await prisma.discoverySharePointSite.upsert({where:{siteUrl:s.webUrl},create:{siteUrl:s.webUrl,siteTitle:s.displayName||s.webUrl,lastModified:graphDate(s.lastModifiedDateTime),lastScannedAt:now},update:{siteTitle:s.displayName||s.webUrl,lastModified:graphDate(s.lastModifiedDateTime),lastScannedAt:now}});
          counts.sharePointSitesDiscovered++;
        }
      }else if(w==='Teams'){
        for await(const t of pages('/groups?$filter=resourceProvisioningOptions/Any(x:x eq \'Team\')&$select=id,displayName,description,visibility&$top=100',accessToken)){
          if(!t.id)continue;
          await prisma.discoveryTeam.upsert({where:{teamId:t.id},create:{teamId:t.id,teamName:t.displayName||t.id,description:t.description,visibility:t.visibility||'Private',lastScannedAt:now},update:{teamName:t.displayName||t.id,description:t.description,visibility:t.visibility||'Private',lastScannedAt:now}});
          counts.teamsDiscovered++;
        }
      }
      await prisma.discoveryScan.update({where:{id:scanId},data:{...counts,totalItemsDiscovered:Object.values(counts).reduce((a,b)=>a+b,0),progress:Math.floor((index+1)/workloads.length*100)}});
    }
    await prisma.discoveryScan.update({where:{id:scanId},data:{status:'COMPLETED',currentStage:'LIVE: Discovery completed (inventory only; advanced workload metrics not verified)',completedAt:new Date(),progress:100}});
    await recordAuditLog({actorEmail:actor,actorRole:'GLOBAL_ADMIN',action:'LIVE_DISCOVERY_COMPLETED',resource:`DiscoveryScan:${scanId}`,status:'SUCCESS',details:JSON.stringify(counts)});
  }catch(e:any){
    await prisma.discoveryScan.update({where:{id:scanId},data:{status:'FAILED',errorMessage:e?.message||'Discovery failed',currentStage:'LIVE: Failed',completedAt:new Date()}}).catch(console.error);
    await recordAuditLog({actorEmail:actor,actorRole:'GLOBAL_ADMIN',action:'LIVE_DISCOVERY_FAILED',resource:`DiscoveryScan:${scanId}`,status:'FAILED',details:String(e?.message||e)});
  }
}
