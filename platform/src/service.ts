import {db} from './db.js';
import {discoveryQueue} from './queue.js';
import {adapters,workloads,type Workload} from './adapters.js';
import {GraphClient,TokenProvider} from './graph.js';
import {executeDeltaScan} from './deltaDiscovery.js';
import { getProjectCredential } from './credentials.js';
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
 const scan=await db.scan.findUnique({where:{id:scanId}});
 if(!scan)throw new Error('Scan not found');
 const credential=await getProjectCredential(scan.organizationId,scan.projectId,scan.sourceTenantId);
 const changed=await db.scan.updateMany({where:{id:scanId,status:{in:['QUEUED','RETRYING','FAILED']}},data:{status:'RUNNING',startedAt:new Date()}});
 if(changed.count===0) return;
 const selected=JSON.parse(scan.workloads) as Workload[];
 const graph=new GraphClient(new TokenProvider(credential));
 try {
  const organization=await graph.get('/v1.0/organization?$select=id,displayName');
  if(organization.value?.[0]?.id?.toLowerCase()!==scan.sourceTenantId.toLowerCase())throw new Error('Graph tenant did not match project source tenant');
  for(let index=0;index<selected.length;index++){
   const adapter=adapters[selected[index]];
   if(adapter.workload==='Users'||adapter.workload==='Groups') {
    await executeDeltaScan({scanId,organizationId:scan.organizationId,projectId:scan.projectId,sourceTenantId:scan.sourceTenantId},adapter.workload,graph);
   } else {
    await db.discoveryScanWorkload.upsert({where:{scanId_workload:{scanId,workload:adapter.workload}},create:{scanId,organizationId:scan.organizationId,projectId:scan.projectId,sourceTenantId:scan.sourceTenantId,workload:adapter.workload,status:'RUNNING',startedAt:new Date()},update:{status:'RUNNING',startedAt:new Date()}});
    for await(const item of adapter.discover(graph)){
    await db.$transaction(async tx=>{
      await tx.inventoryItem.upsert({where:{scanId_workload_sourceId:{scanId,workload:item.workload,sourceId:item.sourceId}},create:{scanId,organizationId:scan.organizationId,projectId:scan.projectId,sourceTenantId:scan.sourceTenantId,workload:item.workload,sourceId:item.sourceId,name:item.name,metadata:item.metadata as any},update:{name:item.name,metadata:item.metadata as any}});
      await tx.currentInventoryItem.upsert({where:{projectId_sourceTenantId_workload_sourceId:{projectId:scan.projectId,sourceTenantId:scan.sourceTenantId,workload:item.workload,sourceId:item.sourceId}},create:{organizationId:scan.organizationId,projectId:scan.projectId,sourceTenantId:scan.sourceTenantId,workload:item.workload,sourceId:item.sourceId,name:item.name,metadata:item.metadata as any,lastScanId:scanId,isDeleted:false},update:{name:item.name,metadata:item.metadata as any,lastScanId:scanId,isDeleted:false,observedAt:new Date()}});
    });
    }
    await db.discoveryScanWorkload.update({where:{scanId_workload:{scanId,workload:adapter.workload}},data:{status:'COMPLETED',completedAt:new Date()}});
   }
   await db.scan.update({where:{id:scanId},data:{progress:Math.floor((index+1)/selected.length*100)}});
  }
  await db.scan.update({where:{id:scanId},data:{status:'COMPLETED',finishedAt:new Date(),progress:100}});
 }catch(error){
  await db.scan.update({where:{id:scanId},data:{status:'FAILED',errorCode:'DISCOVERY_ERROR',errorMessage:error instanceof Error?error.message:'Unknown discovery failure',finishedAt:new Date()}});
  throw error;
 }
}
