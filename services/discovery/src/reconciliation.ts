import type {Prisma} from '@prisma/client';
import {db} from './db.js';
import {assertLease,type Lease} from './leases.js';

export const RECONCILE_BATCH_SIZE=100;
export type ReconcileScope={scanId:string;organizationId:string;projectId:string;sourceTenantId:string};

/**
 * A bounded cursor over staging records. Never load a whole tenant into memory.
 * Callers must hold a valid lease before and after each batch.
 */
export async function* stagedBatches(scope:ReconcileScope,types:string[],batchSize=RECONCILE_BATCH_SIZE){
 let cursor:string|undefined;
 while(true){
  const items=await db.inventoryItem.findMany({
   where:{scanId:scope.scanId,organizationId:scope.organizationId,projectId:scope.projectId,sourceTenantId:scope.sourceTenantId,workload:{in:types}},
   orderBy:{id:'asc'},take:batchSize,...(cursor?{cursor:{id:cursor},skip:1}:{})
  });
  if(!items.length)break;
  cursor=items[items.length-1].id;
  yield items;
 }
}

/**
 * Publication must remain atomic. Batches are processed within ONE transaction
 * so readers cannot observe a partially updated current inventory. The timeout
 * is intentionally configurable; a future version should use versioned snapshots
 * for very large tenants instead of extending this transaction indefinitely.
 */
export async function publishStagedInventory(scope:ReconcileScope,types:string[],lease:Lease,options?:{
 baseline?:boolean;deltaLink?:string;cursorWorkload?:string;
}){
 const {scanId,organizationId,projectId,sourceTenantId}=scope;
 await db.$transaction(async tx=>{
  await assertLease(tx,lease);
  // Bounded memory even though publication is one atomic database transaction.
  let cursor:string|undefined;
  while(true){
   const items=await tx.inventoryItem.findMany({
    where:{scanId,organizationId,projectId,sourceTenantId,workload:{in:types}},
    orderBy:{id:'asc'},take:RECONCILE_BATCH_SIZE,...(cursor?{cursor:{id:cursor},skip:1}:{})
   });
   if(!items.length)break;
   cursor=items[items.length-1].id;
   for(const item of items){
    await tx.currentInventoryItem.upsert({
     where:{projectId_sourceTenantId_workload_sourceId:{projectId,sourceTenantId,workload:item.workload,sourceId:item.sourceId}},
     create:{organizationId,projectId,sourceTenantId,workload:item.workload,sourceId:item.sourceId,name:item.name,metadata:item.metadata as Prisma.InputJsonValue,isDeleted:item.isDeleted,lastScanId:scanId,observedAt:item.observedAt},
     update:{name:item.name,metadata:item.metadata as Prisma.InputJsonValue,isDeleted:item.isDeleted,lastScanId:scanId,observedAt:item.observedAt}
    });
   }
  }
  if(options?.baseline){
   await tx.currentInventoryItem.updateMany({
    where:{organizationId,projectId,sourceTenantId,workload:{in:types},lastScanId:{not:scanId},isDeleted:false},
    data:{isDeleted:true,lastScanId:scanId,observedAt:new Date()}
   });
  }
  if(options?.deltaLink&&options.cursorWorkload){
   await tx.discoveryCursor.upsert({
    where:{projectId_sourceTenantId_workload:{projectId,sourceTenantId,workload:options.cursorWorkload}},
    create:{organizationId,projectId,sourceTenantId,workload:options.cursorWorkload,deltaLink:options.deltaLink},
    update:{deltaLink:options.deltaLink}
   });
  }
 },{timeout:120000});
}
