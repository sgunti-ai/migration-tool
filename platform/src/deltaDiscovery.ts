import type {GraphClient} from './graph.js';
import {db} from './db.js';
import {allowGraphUrl} from './graph.js';

export type DeltaWorkload='Users'|'Groups';
const endpoints:Record<DeltaWorkload,string>={
 Users:'/v1.0/users/delta?$select=id,userPrincipalName,displayName,department,accountEnabled',
 Groups:'/v1.0/groups/delta?$select=id,displayName,mail,securityEnabled,groupTypes'
};
export const deltaMode=(cursor:string|null|undefined)=>cursor?'INCREMENTAL':'INITIAL_FULL';
export type DeltaContext={scanId:string;organizationId:string;projectId:string;sourceTenantId:string};
export async function executeDeltaScan(ctx:DeltaContext,workload:DeltaWorkload,graph:Pick<GraphClient,'listPages'>){
 const {scanId,organizationId,projectId,sourceTenantId}=ctx;
 const cursor=await db.discoveryCursor.findUnique({where:{projectId_sourceTenantId_workload:{projectId,sourceTenantId,workload}}});
 if(cursor && cursor.organizationId!==organizationId)throw new Error('Discovery cursor organization mismatch');
 const prior=cursor?.deltaLink;
 const mode=deltaMode(prior);
 const start=prior?allowGraphUrl(prior):endpoints[workload];
 const record=await db.discoveryScanWorkload.upsert({
  where:{scanId_workload:{scanId,workload}},
  create:{scanId,organizationId,projectId,sourceTenantId,workload,status:'RUNNING',startedAt:new Date()},
  update:{status:'RUNNING',startedAt:new Date(),errorMessage:null,itemsSeen:0,itemsDeleted:0,pagesRead:0}
 });
 let pages=0,seen=0,deleted=0;
 let finalLink:string|undefined;
 try{
  for await(const page of graph.listPages(start)){
   pages++;
   // A page and its observations commit together; the delta cursor advances only on a complete session.
   await db.$transaction(async tx=>{
    for(const entry of page.items){
     if(!entry.id)throw new Error('Graph delta item missing ID');
     const sourceId=String(entry.id);
     const isDeleted=!!entry['@removed'];
     const name=isDeleted?null:String(entry.displayName||entry.userPrincipalName||sourceId);
     const metadata=entry as any;
     await tx.inventoryItem.upsert({
      where:{scanId_workload_sourceId:{scanId,workload,sourceId}},
      create:{scanId,organizationId,projectId,sourceTenantId,workload,sourceId,name,metadata,isDeleted,observedAt:new Date()},
      update:{name,metadata,isDeleted,observedAt:new Date()}
     });
     await tx.currentInventoryItem.upsert({
      where:{projectId_sourceTenantId_workload_sourceId:{projectId,sourceTenantId,workload,sourceId}},
      create:{organizationId,projectId,sourceTenantId,workload,sourceId,name,metadata,isDeleted,lastScanId:scanId,observedAt:new Date()},
      update:{name,metadata,isDeleted,lastScanId:scanId,observedAt:new Date()}
     });
     seen++;if(isDeleted)deleted++;
    }
    await tx.discoveryScanWorkload.update({where:{id:record.id},data:{itemsSeen:seen,itemsDeleted:deleted,pagesRead:pages}});
   });
   if(page.deltaLink)finalLink=page.deltaLink;
  }
  if(!finalLink)throw new Error('Graph delta session ended without final deltaLink');
  // Successful initial baseline or incremental reconciliation is the only point where the cursor advances.
  await db.$transaction(async tx=>{
   await tx.discoveryCursor.upsert({
    where:{projectId_sourceTenantId_workload:{projectId,sourceTenantId,workload}},
    create:{organizationId,projectId,sourceTenantId,workload,deltaLink:finalLink},
    update:{deltaLink:finalLink}
   });
   await tx.discoveryScanWorkload.update({where:{id:record.id},data:{status:'COMPLETED',completedAt:new Date()}});
  });
  return {seen,deleted,pages,mode};
 }catch(error){
  await db.discoveryScanWorkload.update({where:{id:record.id},data:{status:'FAILED',errorMessage:error instanceof Error?error.message:'Unknown error',completedAt:new Date()}});
  throw error;
 }
}
