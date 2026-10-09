import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {db} from '../src/db.js';
import {acquireLease,renewLease,assertLease,finalizeLease,leaseExpired} from '../src/leases.js';

test('lease expiry predicate',()=>{
 const now=new Date('2026-10-09T00:00:00Z');
 assert.equal(leaseExpired(null,now),true);
 assert.equal(leaseExpired(new Date(now.getTime()-1),now),true);
 assert.equal(leaseExpired(new Date(now.getTime()+100),now),false);
});
test('database lease is exclusive, fenced and recoverable after expiry',async()=>{
 const org=await db.organization.create({data:{name:'lease-test-'+randomUUID()}});
 const project=await db.project.create({data:{organizationId:org.id,name:'Test',sourceTenantId:randomUUID()}});
 const scan=await db.scan.create({data:{organizationId:org.id,projectId:project.id,sourceTenantId:project.sourceTenantId,workloads:'["Users"]'}});
 try{
  const [a,b]=await Promise.all([acquireLease(scan.id),acquireLease(scan.id)]);
  assert.equal([a,b].filter(Boolean).length,1);
  const first=a||b!;
  assert.equal(await renewLease(first),true);
  await db.$transaction(tx=>assertLease(tx,first));
  await db.scan.update({where:{id:scan.id},data:{leaseExpiresAt:new Date(Date.now()-1000)}});
  assert.equal(await renewLease(first),false);
  await assert.rejects(db.$transaction(tx=>assertLease(tx,first)),/SCAN_LEASE_LOST/);
  const second=await acquireLease(scan.id);
  assert.ok(second);
  assert.equal(second!.epoch,first.epoch+1);
  assert.notEqual(second!.owner,first.owner);
  assert.equal((await finalizeLease(first,'COMPLETED')).count,0);
  assert.equal((await finalizeLease(second!,'COMPLETED')).count,1);
  assert.equal((await db.scan.findUniqueOrThrow({where:{id:scan.id}})).status,'COMPLETED');
 }finally{
  await db.scan.delete({where:{id:scan.id}});
  await db.project.delete({where:{id:project.id}});
  await db.organization.delete({where:{id:org.id}});
 }
});
