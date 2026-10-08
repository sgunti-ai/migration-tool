import type {GraphClient} from './graph.js';
import {db} from './db.js';
import {allowGraphUrl} from './graph.js';

export type DeltaWorkload='Users'|'Groups';
const endpoints:Record<DeltaWorkload,string>={
 Users:'/v1.0/users/delta?$select=id,userPrincipalName,displayName,department,accountEnabled',
 Groups:'/v1.0/groups/delta?$select=id,displayName,mail,securityEnabled,groupTypes'
};
export async function executeDeltaScan(ctx:{scanId:string;organizationId:string;projectId:string;sourceTenantId:string},workload:DeltaWorkload,graph:GraphClient){
 const {scanId,organizationId,projectId,sourceTenantId}=ctx;
 const cursor=await db.discoveryCursor.findUnique({where:{projectId_sourceTenantId_workload:{projectId,sourceTenantId,workload}}});
 // Never pass a cursor from another project or source tenant.
 if(cursor && cursor.organizationId!==organizationId)throw new Error('Discovery cursor organization mismatch');
 const prior=cursor?.deltaLink;
 const start=prior?allowGraphUrl(prior):endpoints[workload];
 const record=await db.discoveryScanWorkload.upsert({
  where:{scanId_workload:{scanId,workload}},
  create:{scanId,organizationId,projectId,sourceTenantId,workload,status:'RUNNING',startedAt:new Date()},
  update:{status:'RUNNING',startedAt:new Date(),errorMessage:null}
 });
 let pages=0, seen=0, deleted=0;
 let finalLink:string|undefined;
 try {
  for await(const page of graph.listPages(start)){
   pages++;
   for(const entry of page.items){
    if(!entry.id)throw new Error('Graph delta item missing ID');
    const sourceId=String(entry.id);
    const isDeleted=!!entry['@removed'];
    const name=isDeleted?null:String(entry.displayName||entry.userPrincipalName||sourceId);
    // Upserts are safe if a complete delta round is retried. No cursor advances until its final page.
    await db.inventoryItem.upsert({
     where:{scanId_workload_sourceId:{scanId,workload,sourceId}},
     create:{scanId,organizationId,projectId,sourceTenantId,workload,sourceId,name,metadata:entry,isDeleted,observedAt:new Date()},
     update:{name,metadata:entry,isDeleted,observedAt:new Date()}
    });
    seen++;if(isDeleted)deleted++;
   }
   if(page.deltaLink)finalLink=page.deltaLink;
   // The page counts are recorded only after the page's writes completed.
   await db.discoveryScanWorkload.update({where:{id:record.id},data:{itemsSeen:seen,itemsDeleted:deleted,pagesRead:pages}});
  }
  if(!finalLink)throw new Error('Graph delta session ended without final deltaLink');
  await db.$transaction(async tx=>{
   await tx.discoveryCursor.upsert({
    where:{projectId_sourceTenantId_workload:{projectId,sourceTenantId,workload}},
    create:{organizationId,projectId,sourceTenantId,workload,deltaLink:finalLink},
    update:{deltaLink:finalLink}
   });
   await tx.discoveryScanWorkload.update({where:{id:record.id},data:{status:'COMPLETED',completedAt:new Date()}});
  });
  return {seen,deleted,pages,mode:prior?'INCREMENTAL':'INITIAL_FULL'};
 }catch(error){
  await db.discoveryScanWorkload.update({where:{id:record.id},data:{status:'FAILED',errorMessage:error instanceof Error?error.message:'Unknown error',completedAt:new Date()}});
  throw error;
 }
}
