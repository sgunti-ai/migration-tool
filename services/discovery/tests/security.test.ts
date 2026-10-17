import assert from 'node:assert/strict';
import test from 'node:test';
import {allowGraphUrl} from '../src/graph.js';
test('allow only Microsoft Graph v1 HTTPS requests',()=>{
 assert.equal(allowGraphUrl('/v1.0/users'),'https://graph.microsoft.com/v1.0/users');
 for(const url of ['https://evil.example/v1.0/users','http://graph.microsoft.com/v1.0/users','https://graph.microsoft.com/beta/users','https://graph.microsoft.com.evil.test/v1.0/users'])assert.throws(()=>allowGraphUrl(url));
});
