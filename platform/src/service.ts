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
 const scan=await db.scan.create({data:{projectId,organizationId,sourceTenantId:project.sourceTenantId,workloads:JSON.stringify(requested),status:'QUEUED',mode:'LIVE',scanType:'FULL',apiProvider:'MICROSOFT_GRAPH_V1'}});
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
    await db.inventoryItem.upsert({where:{scanId_workload_sourceId:{scanId,workload:item.workload,sourceId:item.sourceId}},create:{scanId,organizationId:scan.organizationId,projectId:scan.projectId,sourceTenantId:scan.sourceTenantId,workload:item.workload,sourceId:item.sourceId,name:item.name,metadata:item.metadata as any},update:{name:item.name,metadata:item.metadata as any}});
   }
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
