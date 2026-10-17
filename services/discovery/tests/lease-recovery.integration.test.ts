import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {db} from '../src/db.js';
import {acquireLease,renewLease,assertLease,listRecoverable} from '../src/leases.js';

test('expired lease can be recovered and stale worker cannot publish',async()=>{
 const org=await db.organization.create({data:{name:'lease-test-'+randomUUID()}});
 const project=await db.project.create({data:{organizationId:org.id,name:'Recovery',sourceTenantId:randomUUID()}});
 const scan=await db.scan.create({data:{organizationId:org.id,projectId:project.id,sourceTenantId:project.sourceTenantId,workloads:'["Users"]'}});
 try{
  const old=await acquireLease(scan.id);
  assert.ok(old);
  await db.scan.update({where:{id:scan.id},data:{leaseExpiresAt:new Date(Date.now()-1000)}});
  assert.equal(await renewLease(old!),false);
  const recoverable=await listRecoverable();
  assert.ok(recoverable.some(item=>item.id===scan.id));
  const replacement=await acquireLease(scan.id);
  assert.ok(replacement);
  assert.notEqual(replacement!.epoch,old!.epoch);
  await assert.rejects(db.$transaction(tx=>assertLease(tx,old!)),/SCAN_LEASE_LOST/);
  await db.$transaction(tx=>assertLease(tx,replacement!));
 }finally{
  await db.scan.delete({where:{id:scan.id}});
  await db.project.delete({where:{id:project.id}});
  await db.organization.delete({where:{id:org.id}});
 }
});
