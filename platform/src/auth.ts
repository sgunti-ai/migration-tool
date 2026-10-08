import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { Request,Response,NextFunction } from 'express';
import { config } from './config.js';
import { db } from './db.js';
const keys=createRemoteJWKSet(new URL(config.OIDC_JWKS_URL));
export type Principal={sub:string;email:string;organizationId:string;role:string};
declare global { namespace Express { interface Request { principal?:Principal } } }
export async function requireIdentity(req:Request,res:Response,next:NextFunction) {
 try {
  const match=/^Bearer (.+)$/i.exec(req.headers.authorization||'');
  if(!match)return res.status(401).json({error:'Bearer access token required'});
  const {payload}=await jwtVerify(match[1],keys,{issuer:config.OIDC_ISSUER,audience:config.OIDC_AUDIENCE,algorithms:['RS256']});
  const subject=String(payload.sub||'');
  const organizationId=String(req.header('x-organization-id')||'');
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
