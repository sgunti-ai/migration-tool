import {Queue} from 'bullmq';
import IORedis from 'ioredis';
import {config} from './config.js';
export const redis=new IORedis(config.REDIS_URL,{maxRetriesPerRequest:null});
export const discoveryQueue=new Queue('discovery-v2',{connection:redis,defaultJobOptions:{attempts:3,backoff:{type:'exponential',delay:3000},removeOnComplete:{age:604800,count:10000},removeOnFail:{age:2592000,count:10000}}});
