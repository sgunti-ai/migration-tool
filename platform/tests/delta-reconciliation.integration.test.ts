import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {db} from '../src/db.js';
import {acquireLease} from '../src/leases.js';
import {executeDeltaScan} from '../src/deltaDiscovery.js';
import {GraphError} from '../src/graph.js';

test('delta reconciliation persists updates and tombstones; a failed page never advances cursor',async()=>{
 const org=await db.organization.create({data:{name:'delta-test-'+randomUUID()}});
 const project=await db.project.create({data:{organizationId:org.id,name:'Delta',sourceTenantId:randomUUID()}});
 const scans:string[]=[];
 const context=(scanId:string)=>({scanId,organizationId:org.id,projectId:project.id,sourceTenantId:project.sourceTenantId});
 const makeScan=async()=>{
  const scan=await db.scan.create({data:{organizationId:org.id,projectId:project.id,sourceTenantId:project.sourceTenantId,workloads:'["Users"]'}});
  scans.push(scan.id);
  const lease=await acquireLease(scan.id);
  assert.ok(lease);
  return {scan,lease:lease!};
 };
 const graph=(items:any[],deltaLink?:string,fail=false)=>({async *listPages(){
  yield {items,deltaLink:fail?undefined:deltaLink};
  if(fail)throw new Error('Simulated interrupted pagination');
 }}) as any;
 const a='https://graph.microsoft.com/v1.0/users/delta?$deltatoken=A';
 const b='https://graph.microsoft.com/v1.0/users/delta?$deltatoken=B';
 try{
  const first=await makeScan();
  const result=await executeDeltaScan(context(first.scan.id),'Users',graph([{id:'u1',displayName:'Before'},{id:'u2',displayName:'Delete me'}],a),first.lease);
  assert.equal(result.mode,'INITIAL_FULL');
  assert.equal(await db.currentInventoryItem.count({where:{projectId:project.id,isDeleted:false}}),2);
  const second=await makeScan();
  const updated=await executeDeltaScan(context(second.scan.id),'Users',graph([{id:'u1',displayName:'After'},{id:'u2','@removed':{reason:'deleted'}}],b),second.lease);
  assert.equal(updated.mode,'INCREMENTAL');
  assert.equal(updated.deleted,1);
  const current=await db.currentInventoryItem.findMany({where:{projectId:project.id},orderBy:{sourceId:'asc'}});
  assert.equal(current[0].name,'After');
  assert.equal(current[0].isDeleted,false);
  assert.equal(current[1].isDeleted,true);
  assert.equal(await db.currentInventoryItem.count({where:{projectId:project.id,isDeleted:false}}),1);
  const failed=await makeScan();
  await assert.rejects(executeDeltaScan(context(failed.scan.id),'Users',graph([{id:'u3',displayName:'Partial'}],undefined,true),failed.lease),/Simulated interrupted pagination/);
  const cursor=await db.discoveryCursor.findUniqueOrThrow({where:{projectId_sourceTenantId_workload:{projectId:project.id,sourceTenantId:project.sourceTenantId,workload:'Users'}}});
  assert.equal(cursor.deltaLink,b);
  const third=await makeScan();
  await executeDeltaScan(context(third.scan.id),'Users',graph([{id:'u3',displayName:'Partial'}],b),third.lease);
  assert.equal(await db.currentInventoryItem.count({where:{projectId:project.id,sourceId:'u3'}}),1);
  const recovery=await makeScan();
  const requested:string[]=[];
  const expiredThenBaseline={
   async *listPages(path:string){
    requested.push(path);
    if(path===b)throw new GraphError(410,'/v1.0/users/delta');
    yield {items:[{id:'u1',displayName:'Fresh baseline'}],deltaLink:a};
   }
  } as any;
  const recovered=await executeDeltaScan(context(recovery.scan.id),'Users',expiredThenBaseline,recovery.lease);
  assert.equal(recovered.mode,'INITIAL_FULL');
  assert.equal(requested.length,2);
  assert.equal(requested[0],b);
  assert.match(requested[1],/users\\/delta/);
  assert.equal((await db.currentInventoryItem.findFirstOrThrow({where:{projectId:project.id,sourceId:'u3'}})).isDeleted,true);
  assert.equal((await db.discoveryCursor.findUniqueOrThrow({where:{projectId_sourceTenantId_workload:{projectId:project.id,sourceTenantId:project.sourceTenantId,workload:'Users'}}})).deltaLink,a);

 }finally{
  await db.discoveryScanWorkload.deleteMany({where:{projectId:project.id}});
  await db.discoveryCursor.deleteMany({where:{projectId:project.id}});
  await db.currentInventoryItem.deleteMany({where:{projectId:project.id}});
  await db.inventoryItem.deleteMany({where:{projectId:project.id}});
  await db.scan.deleteMany({where:{projectId:project.id}});
  await db.project.delete({where:{id:project.id}});
  await db.organization.delete({where:{id:org.id}});
 }
});
