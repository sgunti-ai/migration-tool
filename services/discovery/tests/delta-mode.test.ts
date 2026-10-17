import test from 'node:test';
import assert from 'node:assert/strict';
import {deltaMode,isExpiredDeltaCursor} from '../src/deltaDiscovery.js';
import {GraphError} from '../src/graph.js';
test('first scan is initial full',()=>assert.equal(deltaMode(null),'INITIAL_FULL'));
test('saved cursor denotes incremental scan',()=>assert.equal(deltaMode('https://graph.microsoft.com/v1.0/users/delta?$deltatoken=a'),'INCREMENTAL'));

test('only Graph 410 is treated as an expired delta cursor',()=>{
 assert.equal(isExpiredDeltaCursor(new GraphError(410,'/v1.0/users/delta')),true);
 assert.equal(isExpiredDeltaCursor(new GraphError(401,'/v1.0/users/delta')),false);
 assert.equal(isExpiredDeltaCursor(new GraphError(429,'/v1.0/users/delta')),false);
 assert.equal(isExpiredDeltaCursor(new Error('410')),false);
});
