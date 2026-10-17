import test from 'node:test';
import assert from 'node:assert/strict';
import {inventoryTypesFor,isDeltaWorkload,normalizeWorkloads} from '../src/discoveryWorkloads.js';

test('duplicate workload selections are scanned once in request order',()=>{
 assert.deepEqual(normalizeWorkloads(['Users','Teams','Users','Groups','Teams']),['Users','Teams','Groups']);
});
test('Teams owns both team and channel inventory records',()=>{
 assert.deepEqual(inventoryTypesFor('Teams'),['Teams','TeamsChannel']);
 assert.deepEqual(inventoryTypesFor('SharePoint'),['SharePoint']);
});
test('only Users and Groups use Graph delta reconciliation',()=>{
 assert.equal(isDeltaWorkload('Users'),true);
 assert.equal(isDeltaWorkload('Groups'),true);
 assert.equal(isDeltaWorkload('OneDrive'),false);
});
