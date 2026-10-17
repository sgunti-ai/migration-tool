import test from 'node:test';
import assert from 'node:assert/strict';
import {GraphClient,GraphError,allowGraphUrl} from '../src/graph.js';

test('Graph throttling 429 retries using Retry-After',async()=>{
 const original=globalThis.fetch;
 let attempts=0;
 globalThis.fetch=(async()=>{
  attempts++;
  if(attempts===1)return new Response('',{status:429,headers:{'retry-after':'0'}});
  return Response.json({value:[{id:'ok'}]});
 }) as typeof fetch;
 try{
  const client=new GraphClient({get:async()=> 'fake-token'} as any);
  assert.deepEqual((await client.get('/v1.0/users')).value,[{id:'ok'}]);
  assert.equal(attempts,2);
 }finally{globalThis.fetch=original;}
});
test('Graph 403 does not retry',async()=>{
 const original=globalThis.fetch;
 let attempts=0;
 globalThis.fetch=(async()=>{attempts++;return new Response('',{status:403});}) as typeof fetch;
 try{
  const client=new GraphClient({get:async()=> 'fake-token'} as any);
  await assert.rejects(client.get('/v1.0/users'),(error:unknown)=>error instanceof GraphError&&error.status===403);
  assert.equal(attempts,1);
 }finally{globalThis.fetch=original;}
});
test('Graph paging refuses untrusted nextLink',async()=>{
 const original=globalThis.fetch;
 globalThis.fetch=(async()=>Response.json({value:[],'@odata.nextLink':'https://evil.example/v1.0/users'})) as typeof fetch;
 try{
  const client=new GraphClient({get:async()=> 'fake-token'} as any);
  await assert.rejects(async()=>{for await(const _page of client.listPages('/v1.0/users')){}},/Untrusted Graph URL/);
 }finally{globalThis.fetch=original;}
});
test('Graph URL rejects unexpected hosts',()=>assert.throws(()=>allowGraphUrl('https://evil.example/v1.0/users'),/Untrusted/));
