import {randomUUID} from 'node:crypto';
import {db} from './db.js';
import type {Prisma} from '@prisma/client';
export const LEASE_MS=90_000;
export type Lease={scanId:string;owner:string;epoch:number};
export const leaseExpired=(expiry:Date|null,now:Date)=>!expiry||expiry.getTime()<=now.getTime();
export async function acquireLease(scanId:string):Promise<Lease|null>{
 const owner=randomUUID(),now=new Date(),expires=new Date(now.getTime()+LEASE_MS);
 // Compare-and-swap: exactly one worker can claim a queued/retry or expired running job.
 const result=await db.scan.updateMany({where:{id:scanId,OR:[{status:{in:['QUEUED','RETRYING']}},{status:'RUNNING',leaseExpiresAt:{lt:now}},{status:'RUNNING',leaseExpiresAt:null}]},data:{status:'RUNNING',leaseOwner:owner,leaseExpiresAt:expires,leaseEpoch:{increment:1},startedAt:now}});
 if(!result.count)return null;
 const claimed=await db.scan.findUniqueOrThrow({where:{id:scanId}});
 return {scanId,owner,epoch:claimed.leaseEpoch};
}
export async function renewLease(lease:Lease):Promise<boolean>{
 const update=await db.scan.updateMany({where:{id:lease.scanId,leaseOwner:lease.owner,leaseEpoch:lease.epoch,status:'RUNNING',leaseExpiresAt:{gt:new Date()}},data:{leaseExpiresAt:new Date(Date.now()+LEASE_MS)}});
 return update.count===1;
}
export async function assertLease(tx:Prisma.TransactionClient,lease:Lease):Promise<void>{
 const updated=await tx.scan.updateMany({where:{id:lease.scanId,leaseOwner:lease.owner,leaseEpoch:lease.epoch,status:'RUNNING',leaseExpiresAt:{gt:new Date()}},data:{leaseOwner:lease.owner}});
 if(updated.count!==1)throw new Error('SCAN_LEASE_LOST');
}
export async function finalizeLease(lease:Lease,status:'COMPLETED'|'FAILED',error?:string){
 return db.scan.updateMany({where:{id:lease.scanId,leaseOwner:lease.owner,leaseEpoch:lease.epoch,status:'RUNNING',leaseExpiresAt:{gt:new Date()}},data:{status,leaseOwner:null,leaseExpiresAt:null,finishedAt:new Date(),...(status==='COMPLETED'?{progress:100,errorMessage:null,errorCode:null}:{errorCode:'DISCOVERY_ERROR',errorMessage:error||'Discovery failed'})}});
}
export async function listRecoverable(take=100){
 return db.scan.findMany({where:{OR:[{status:'QUEUED'},{status:'RETRYING'},{status:'RUNNING',leaseExpiresAt:{lt:new Date()}},{status:'RUNNING',leaseExpiresAt:null}]},orderBy:{createdAt:'asc'},take,select:{id:true,organizationId:true,leaseEpoch:true,status:true}});
}
