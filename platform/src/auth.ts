import { createRemoteJWKSet, jwtVerify, SignJWT } from 'jose';
import { timingSafeEqual } from 'node:crypto';
import type { Request,Response,NextFunction } from 'express';
import { config } from './config.js';
import { db } from './db.js';
const keys=createRemoteJWKSet(new URL(config.OIDC_JWKS_URL));
const localSubject='local-development-admin';
const localIssuer='migration-tool-local';
const localKey=new TextEncoder().encode(config.CREDENTIAL_ENCRYPTION_KEY);
export async function localAdminLogin(username:string,password:string) {
 if(config.NODE_ENV==='production'||!config.LOCAL_ADMIN_USERNAME||!config.LOCAL_ADMIN_PASSWORD) return null;
 const a=Buffer.from(username),b=Buffer.from(config.LOCAL_ADMIN_USERNAME);
 const c=Buffer.from(password),d=Buffer.from(config.LOCAL_ADMIN_PASSWORD);
 if(a.length!==b.length||c.length!==d.length||!timingSafeEqual(a,b)||!timingSafeEqual(c,d))return null;
 const org=await db.organization.upsert({where:{id:'local-development'},update:{},create:{id:'local-development',name:'Local Development'}});
 await db.membership.upsert({where:{organizationId_subject:{organizationId:org.id,subject:localSubject}},update:{role:'ADMIN'},create:{organizationId:org.id,subject:localSubject,role:'ADMIN'}});
 const token=await new SignJWT({email:username,organizationId:org.id,role:'ADMIN'}).setProtectedHeader({alg:'HS256'}).setSubject(localSubject).setIssuer(localIssuer).setAudience('migration-tool-local').setIssuedAt().setExpirationTime('8h').sign(localKey);
 return {accessToken:token,tokenType:'Bearer',expiresIn:28800,organizationId:org.id};
}
export type Principal={sub:string;email:string;organizationId:string;role:string};
declare global { namespace Express { interface Request { principal?:Principal } } }
export async function requireIdentity(req:Request,res:Response,next:NextFunction) {
 try {
  // Local development preview only. Never bypass identity in production or over a network.
  const remote=req.socket.remoteAddress||'';
  const loopback=remote==='127.0.0.1'||remote==='::1'||remote==='::ffff:127.0.0.1';
  if(config.NODE_ENV==='development'&&loopback) {
   const org=await db.organization.upsert({where:{id:'local-development'},update:{},create:{id:'local-development',name:'Local Development'}});
   await db.membership.upsert({where:{organizationId_subject:{organizationId:org.id,subject:localSubject}},update:{role:'ADMIN'},create:{organizationId:org.id,subject:localSubject,role:'ADMIN'}});
   req.principal={sub:localSubject,email:'local-admin@localhost',organizationId:org.id,role:'ADMIN'};
   return next();
  }
  const match=/^Bearer (.+)$/i.exec(req.headers.authorization||'');
  if(!match)return res.status(401).json({error:'Bearer access token required'});
  const isLocal=config.NODE_ENV!=='production'&&match[1].split('.')[0]!==undefined;
  let payload;
  try {({payload}=await jwtVerify(match[1],keys,{issuer:config.OIDC_ISSUER,audience:config.OIDC_AUDIENCE,algorithms:['RS256']}));}
  catch(error) {
   if(!isLocal||!config.LOCAL_ADMIN_USERNAME||!config.LOCAL_ADMIN_PASSWORD)throw error;
   ({payload}=await jwtVerify(match[1],localKey,{issuer:localIssuer,audience:'migration-tool-local',algorithms:['HS256']}));
   if(payload.sub!==localSubject)throw new Error('Invalid local principal');
  }
  const subject=String(payload.sub||'');
  const organizationId=String(req.header('x-organization-id')||(payload.iss===localIssuer?payload.organizationId:'')||'');
  if(!subject||!organizationId)return res.status(403).json({error:'Organization context required'});
  const membership=await db.membership.findUnique({where:{organizationId_subject:{organizationId,subject}}});
  if(!membership)return res.status(403).json({error:'Not a member of organization'});
  req.principal={sub:subject,email:String(payload.email||''),organizationId,role:membership.role};
  next();
 }catch{res.status(401).json({error:'Invalid access token'});}
}
export function requireRole(...roles:string[]) {
 return (req:Request,res:Response,next:NextFunction)=>{
  if(!req.principal||!roles.includes(req.principal.role))return res.status(403).json({error:'Insufficient permission'});
  next();
 };
}
