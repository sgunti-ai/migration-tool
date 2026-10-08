import {Worker} from 'bullmq';
import IORedis from 'ioredis';
import {config} from './config.js';
import {executeScan} from './service.js';
import {db} from './db.js';
import {redis} from './queue.js';
const worker=new Worker('discovery-v2',async job=>{
 if(typeof job.data.scanId!=='string')throw new Error('Invalid scan ID');
 await executeScan(job.data.scanId);
},{connection:new IORedis(config.REDIS_URL,{maxRetriesPerRequest:null}),concurrency:2});
worker.on('failed',(job,error)=>console.error('Discovery failed',job?.id,error.message));
worker.on('error',error=>console.error('Worker error',error.message));
// Jobs active during a process failure are retried by BullMQ stall recovery.
// Persistent QUEUED scans may be re-enqueued during startup reconciliation.
async function reconcile(){
 const queued=await db.scan.findMany({where:{status:'QUEUED'},take:100});
 for(const scan of queued)await (await import('./queue.js')).discoveryQueue.add('scan',{scanId:scan.id,organizationId:scan.organizationId},{jobId:scan.id});
}
await reconcile();
async function stop(){await worker.close();await redis.quit();await db.$disconnect();process.exit(0);}
process.once('SIGTERM',stop);process.once('SIGINT',stop);
