import {db} from './db.js';
import {discoveryQueue} from './queue.js';
import {adapters,workloads,type Workload} from './adapters.js';
import {GraphClient,TokenProvider} from './graph.js';
import {executeDeltaScan} from './deltaDiscovery.js';
import { getProjectCredential } from './credentials.js';
import {acquireLease,renewLease,assertLease,finalizeLease,type Lease} from './leases.js';
export async function startScan(organizationId:string,projectId:string,requested:Workload[]){
 const project=await db.project.findFirst({where:{id:projectId,organizationId}});
 if(!project)throw new Error('Project not found');
 if(!requested.length||requested.some(w=>!workloads.includes(w)))throw new Error('Unsupported workload');
 const existing=await db.scan.findFirst({where:{projectId,organizationId,status:{in:['QUEUED','RUNNING','RETRYING']}}});
 if(existing)throw new Error('Project already has an active scan');
 const delta=requested.filter(w=>w==='Users'||w==='Groups');
 const cursors=await db.discoveryCursor.findMany({where:{organizationId,projectId,sourceTenantId:project.sourceTenantId,workload:{in:delta}}});
 const existingDelta=delta.filter(w=>cursors.some(c=>c.workload===w && !!c.deltaLink)).length;
 const scanType=delta.length===0?'FULL':existingDelta===0?'INITIAL_FULL':existingDelta===delta.length?'INCREMENTAL':'MIXED';
 const scan=await db.scan.create({data:{projectId,organizationId,sourceTenantId:project.sourceTenantId,workloads:JSON.stringify(requested),status:'QUEUED',mode:'LIVE',scanType,apiProvider:'MICROSOFT_GRAPH_V1'}});
 try{await discoveryQueue.add('scan',{scanId:scan.id,organizationId},{jobId:scan.id});}
 catch(error){await db.scan.update({where:{id:scan.id},data:{status:'FAILED',errorCode:'QUEUE_UNAVAILABLE',errorMessage:'Could not enqueue discovery job'}});throw error;}
 return scan;
}
export async function executeScan(scanId:string) {
 const lease=await acquireLease(scanId);
 if(!lease)return; // Another worker holds the lease or scan finished.
 const scan=await db.scan.findUniqueOrThrow({where:{id:scanId}});
 let lost=false;
 const heartbeat=setInterval(()=>{
  void renewLease(lease).then(ok=>{if(!ok)lost=true;}).catch(()=>{lost=true;});
 },20000);
 const guard=async()=>{
  if(lost || !await renewLease(lease)) {lost=true;throw new Error('SCAN_LEASE_LOST');}
 };
 try{
  const credential=await getProjectCredential(scan.organizationId,scan.projectId,scan.sourceTenantId);
  const selected=JSON.parse(scan.workloads) as Workload[];
  const graph=new GraphClient(new TokenProvider(credential));
  const organization=await graph.get('/v1.0/organization?$select=id,displayName');
  if(organization.value?.[0]?.id?.toLowerCase()!==scan.sourceTenantId.toLowerCase())throw new Error('Graph tenant did not match project source tenant');
  for(let index=0;index<selected.length;index++){
   await guard();
   const adapter=adapters[selected[index]];
   if(adapter.workload==='Users'||adapter.workload==='Groups') {
    await executeDeltaScan({scanId,organizationId:scan.organizationId,projectId:scan.projectId,sourceTenantId:scan.sourceTenantId},adapter.workload,graph,lease);
   } else {
    await db.discoveryScanWorkload.upsert({where:{scanId_workload:{scanId,workload:adapter.workload}},create:{scanId,organizationId:scan.organizationId,projectId:scan.projectId,sourceTenantId:scan.sourceTenantId,workload:adapter.workload,status:'RUNNING',startedAt:new Date()},update:{status:'RUNNING',startedAt:new Date()}});
    await db.$transaction(async tx=>{
     await assertLease(tx,lease);
     await tx.inventoryItem.deleteMany({where:{scanId,workload:{in:adapter.workload==='Teams'?['Teams','TeamsChannel']:[adapter.workload]}}});
    });
    for await(const item of adapter.discover(graph)){
     if(lost)throw new Error('SCAN_LEASE_LOST');
     await db.$transaction(async tx=>{
      await assertLease(tx,lease);
      await tx.inventoryItem.upsert({where:{scanId_workload_sourceId:{scanId,workload:item.workload,sourceId:item.sourceId}},create:{scanId,organizationId:scan.organizationId,projectId:scan.projectId,sourceTenantId:scan.sourceTenantId,workload:item.workload,sourceId:item.sourceId,name:item.name,metadata:item.metadata as any},update:{name:item.name,metadata:item.metadata as any}});
      // Stage observations until the workload has completed successfully.
     });
    }
    await guard();
    await db.$transaction(async tx=>{
     await assertLease(tx,lease);
     const staged=await tx.inventoryItem.findMany({where:{scanId,workload:{in:adapter.workload==='Teams'?['Teams','TeamsChannel']:[adapter.workload]}}});
     for(const item of staged.filter(item=>item.workload===adapter.workload|| (adapter.workload==='Teams'&&item.workload==='TeamsChannel'))){
      await tx.currentInventoryItem.upsert({
       where:{projectId_sourceTenantId_workload_sourceId:{projectId:scan.projectId,sourceTenantId:scan.sourceTenantId,workload:item.workload,sourceId:item.sourceId}},
       create:{organizationId:scan.organizationId,projectId:scan.projectId,sourceTenantId:scan.sourceTenantId,workload:item.workload,sourceId:item.sourceId,name:item.name,metadata:item.metadata,lastScanId:scanId,isDeleted:false},
       update:{name:item.name,metadata:item.metadata,lastScanId:scanId,isDeleted:false,observedAt:new Date()}
      });
     }
     const workloadTypes=adapter.workload==='Teams'?['Teams','TeamsChannel']:[adapter.workload];
     await tx.currentInventoryItem.updateMany({where:{organizationId:scan.organizationId,projectId:scan.projectId,sourceTenantId:scan.sourceTenantId,workload:{in:workloadTypes},lastScanId:{not:scanId},isDeleted:false},data:{isDeleted:true,lastScanId:scanId,observedAt:new Date()}});
     await tx.discoveryScanWorkload.update({where:{scanId_workload:{scanId,workload:adapter.workload}},data:{status:'COMPLETED',completedAt:new Date()}});
    },{timeout:120000});
   }
   await guard();
   await db.scan.updateMany({where:{id:scanId,leaseOwner:lease.owner,leaseEpoch:lease.epoch,status:'RUNNING'},data:{progress:Math.floor((index+1)/selected.length*100)}});
  }
  await guard();
  const updated=await finalizeLease(lease,'COMPLETED');
  if(!updated.count)throw new Error('SCAN_LEASE_LOST');
 }catch(error){
  if(!lost)await finalizeLease(lease,'FAILED',error instanceof Error?error.message:'Unknown discovery failure');
  throw error;
 }finally{
  clearInterval(heartbeat);
 }
}
