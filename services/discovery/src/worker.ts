import {Worker} from 'bullmq';
import {Redis} from 'ioredis';
import {config} from './config.js';
import {executeScan} from './service.js';
import {db} from './db.js';
import {redis,discoveryQueue} from './queue.js';
import {listRecoverable} from './leases.js';
const connection=new Redis(config.REDIS_URL,{maxRetriesPerRequest:null});
const worker=new Worker('discovery-v2',async job=>{
 if(typeof job.data.scanId!=='string')throw new Error('Invalid scan ID');
 // BullMQ retries a failed attempt: transition it back into a claimable state.
 if(job.attemptsMade > 0)await db.scan.updateMany({where:{id:job.data.scanId,status:'FAILED'},data:{status:'RETRYING'}});
 await executeScan(job.data.scanId);
},{connection,concurrency:2});
worker.on('failed',(job,error)=>console.error('Discovery failed',job?.id,error.message));
worker.on('error',error=>console.error('Worker error',error.message));

let reconciling=false;
async function reconcile(){
 if(reconciling)return;
 reconciling=true;
 try {
  for(const scan of await listRecoverable()){
   // Recovery IDs are unique so existing completed/failed BullMQ job IDs cannot suppress replay.
   if(scan.status==='RUNNING'){
	const changed=await db.scan.updateMany({where:{id:scan.id,status:'RUNNING',leaseEpoch:scan.leaseEpoch,OR:[{leaseExpiresAt:{lt:new Date()}},{leaseExpiresAt:null}]},data:{status:'RETRYING',leaseOwner:null,leaseExpiresAt:null}});
	if(!changed.count)continue;
   }
   await discoveryQueue.add('scan',{scanId:scan.id,organizationId:scan.organizationId},{jobId:`resume-${scan.id}-${scan.leaseEpoch}`});
  }
 }catch(error){console.error('Scan recovery error',error);}
 finally{reconciling=false;}
}
await reconcile();
const reconciliationTimer=setInterval(()=>void reconcile(),60000);
async function stop(){
 clearInterval(reconciliationTimer);
 await worker.close();
 await connection.quit();
 await redis.quit();
 await db.$disconnect();
 process.exit(0);
}
process.once('SIGTERM',()=>void stop());
process.once('SIGINT',()=>void stop());
