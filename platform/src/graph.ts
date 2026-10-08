import type {TenantAuth} from './credentials.js';
export class GraphError extends Error {constructor(public readonly status:number, public readonly path:string){super(`Graph HTTP ${status} at ${path}`);}}
const wait=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));
export function allowGraphUrl(value:string){
 const url=new URL(value,'https://graph.microsoft.com');
 if(url.protocol!=='https:'||url.hostname!=='graph.microsoft.com'||!url.pathname.startsWith('/v1.0/'))throw new Error('Untrusted Graph URL');
 return url.toString();
}
export class TokenProvider {
 constructor(private readonly identity:TenantAuth){}
 private current?:{token:string;expires:number};
 async get(force=false){
  if(!force&&this.current&&this.current.expires-Date.now()>300000)return this.current.token;
  const endpoint=`https://login.microsoftonline.com/${this.identity.tenantId}/oauth2/v2.0/token`;
  const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:this.identity.clientId,client_secret:this.identity.clientSecret,scope:'https://graph.microsoft.com/.default',grant_type:'client_credentials'}),signal:AbortSignal.timeout(30000)});
  if(!response.ok)throw new Error(`Microsoft Entra token exchange failed: ${response.status}`);
  const body=await response.json() as {access_token:string;expires_in:number};
  if(!body.access_token)throw new Error('Empty Entra token');
  this.current={token:body.access_token,expires:Date.now()+Math.max(60,body.expires_in)*1000};
  return body.access_token;
 }
}
export class GraphClient {
 constructor(private readonly tokens:TokenProvider){}
 async get(path:string):Promise<any>{
  const url=allowGraphUrl(path);
  for(let attempt=0;attempt<6;attempt++){
   const response=await fetch(url,{headers:{Authorization:`Bearer ${await this.tokens.get()}`,Accept:'application/json'},signal:AbortSignal.timeout(30000)});
   if(response.ok)return response.json();
   if(response.status===401&&attempt===0){await this.tokens.get(true);continue;}
   if([429,503,504].includes(response.status)&&attempt<5){
    const retry=response.headers.get('retry-after');
    const seconds=retry&&/^\d+$/.test(retry)?Number(retry):2**(attempt+1);
    await wait(Math.min(60000,seconds*1000)+Math.floor(Math.random()*300));
    continue;
   }
   throw new GraphError(response.status,new URL(url).pathname);
  }
  throw new Error('Graph retry budget exhausted');
 }
 async *list(path:string):AsyncGenerator<any>{
  let next:string|undefined=path;
  const visited=new Set<string>();
  while(next){
   const url=allowGraphUrl(next);
   if(visited.has(url)||visited.size>=100000)throw new Error('Invalid Graph paging cycle/limit');
   visited.add(url);
   const page=await this.get(url);
   if(!Array.isArray(page.value))throw new Error('Invalid Graph list payload');
   for(const item of page.value)yield item;
   next=page['@odata.nextLink'];
  }
 }
}
