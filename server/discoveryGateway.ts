import type {Request,Response,NextFunction} from 'express';
import {SignJWT} from 'jose';

const servicePath=(path:string)=>{
 const parts=path.split('/').filter(Boolean);
 if(parts[0]!=='projects')return false;
 if(parts.length===1)return true;
 if(!/^[a-zA-Z0-9_-]+$/.test(parts[1]))return false;
 if(parts.length===2)return true;
 if(parts.length===3)return parts[2]==='scans'||parts[2]==='credentials';
 if(parts.length===4)return parts[2]==='inventory'&&parts[3]==='current'
  ||parts[2]==='scans'&&/^[a-zA-Z0-9_-]+$/.test(parts[3]);
 return parts.length===5&&parts[2]==='scans'&&/^[a-zA-Z0-9_-]+$/.test(parts[3])&&['items','report','provenance'].includes(parts[4]);
};

/** Server-side authenticated gateway; browser never receives discovery credentials. */
export async function discoveryServiceGateway(req:Request,res:Response,_next:NextFunction){
 const endpoint=process.env.DISCOVERY_SERVICE_URL;
 const secret=process.env.DISCOVERY_GATEWAY_SECRET;
 if(!endpoint||!secret||secret.length<32)return res.status(503).json({error:'Discovery service is not configured'});
 if(!['GET','POST','PUT'].includes(req.method)||!servicePath(req.path))return res.sendStatus(404);
 try {
  const base=new URL(endpoint);
  if(base.username||base.password||base.search||base.hash||!['http:','https:'].includes(base.protocol))throw Error('Invalid discovery upstream');
  if(process.env.NODE_ENV==='production'&&base.protocol!=='https:')throw Error('Discovery service HTTPS required');
  const user=(req as any).user as {email?:string;role?:string}|undefined;
  if(!user||user.role!=='GLOBAL_ADMIN')return res.sendStatus(403);
  const token=await new SignJWT({organizationId:process.env.DISCOVERY_ORGANIZATION_ID||'console-default',role:'ADMIN',email:user.email||''})
   .setProtectedHeader({alg:'HS256'}).setSubject('console-gateway').setIssuer('migration-console')
   .setAudience('discovery-service').setIssuedAt().setExpirationTime('60s')
   .sign(new TextEncoder().encode(secret));
  const upstream=new URL('/api/v2'+req.path+new URL(req.originalUrl,'http://localhost').search,base);
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),30000);
  try {
   const response=await fetch(upstream,{method:req.method,headers:{Authorization:'Bearer '+token,Accept:'application/json',...(req.method!=='GET'?{'Content-Type':'application/json'}:{})},...(req.method!=='GET'?{body:JSON.stringify(req.body||{})}:{}),signal:controller.signal});
   const body=await response.text();
   res.status(response.status).setHeader('Cache-Control','no-store');
   res.type(response.headers.get('content-type')?.includes('application/json')?'application/json':'text/plain').send(body);
  }finally{clearTimeout(timeout);}
 }catch(e){
  console.error('Discovery service gateway failure',e instanceof Error?e.message:'Unknown error');
  res.status(502).json({error:'Discovery service unavailable'});
 }
}
