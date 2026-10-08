import crypto from 'node:crypto';
import {config} from './config.js';
import {db} from './db.js';
export type TenantAuth={tenantId:string;clientId:string;clientSecret:string};
function key(){return Buffer.from(config.CREDENTIAL_ENCRYPTION_KEY,'hex');}
export function seal(value:string){
 const iv=crypto.randomBytes(12);
 const cipher=crypto.createCipheriv('aes-256-gcm',key(),iv);
 const data=Buffer.concat([cipher.update(value,'utf8'),cipher.final()]);
 return Buffer.concat([iv,cipher.getAuthTag(),data]).toString('base64');
}
export function unseal(value:string){
 const bytes=Buffer.from(value,'base64');
 if(bytes.length<29)throw new Error('Invalid encrypted credential');
 const decipher=crypto.createDecipheriv('aes-256-gcm',key(),bytes.subarray(0,12));
 decipher.setAuthTag(bytes.subarray(12,28));
 return Buffer.concat([decipher.update(bytes.subarray(28)),decipher.final()]).toString('utf8');
}
export async function getProjectCredential(organizationId:string,projectId:string,tenantId:string):Promise<TenantAuth>{
 const stored=await db.tenantCredential.findFirst({where:{organizationId,projectId,tenantId}});
 if(!stored)throw new Error('Missing credential for selected project/tenant');
 return {tenantId:stored.tenantId,clientId:stored.clientId,clientSecret:unseal(stored.encryptedSecret)};
}
export async function setProjectCredential(organizationId:string,projectId:string,tenantId:string,clientId:string,clientSecret:string) {
 const project=await db.project.findFirst({where:{id:projectId,organizationId,sourceTenantId:tenantId}});
 if(!project)throw new Error('Project and tenant mismatch');
 return db.tenantCredential.upsert({where:{projectId},create:{organizationId,projectId,tenantId,clientId,encryptedSecret:seal(clientSecret)},update:{tenantId,clientId,encryptedSecret:seal(clientSecret),keyVersion:{increment:1}},select:{id:true,projectId:true,tenantId:true,clientId:true,keyVersion:true,updatedAt:true}});
}
