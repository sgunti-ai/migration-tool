import assert from 'node:assert/strict';
import test from 'node:test';
import {adapters,workloads} from '../src/adapters.js';
test('registered workload adapters implement discovery',()=>{
 assert.deepEqual(workloads,['Users','Groups','SharePoint','Teams','OneDrive']);
 for(const w of workloads)assert.equal(typeof adapters[w].discover,'function');
});
test('users adapter skips entries without IDs',async()=>{
 const fake={async *list(){yield {id:'u1',displayName:'User'};yield {displayName:'No ID'};}} as any;
 const results=[];for await(const item of adapters.Users.discover(fake))results.push(item);
 assert.equal(results.length,1);
 assert.equal(results[0].sourceId,'u1');
});
