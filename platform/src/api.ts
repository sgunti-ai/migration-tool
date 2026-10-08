import express from 'express';
import {z} from 'zod';
import {config} from './config.js';
import {db} from './db.js';
import {requireIdentity,requireRole} from './auth.js';
import {startScan} from './service.js';
import {setProjectCredential} from './credentials.js';
import {workloads,type Workload} from './adapters.js';
const app=express();
app.disable('x-powered-by');
app.use(express.json({limit:'128kb'}));
app.get('/health/live',(_req,res)=>res.json({status:'up'}));
app.use('/api/v2',requireIdentity);
app.get('/api/v2/projects',async(req,res)=>{
 res.json(await db.project.findMany({where:{organizationId:req.principal!.organizationId},select:{id:true,name:true,sourceTenantId:true}}));
});
app.post('/api/v2/projects',requireRole('ADMIN'),async(req,res)=>{
 const body=z.object({name:z.string().min(1).max(150),sourceTenantId:z.string().uuid()}).safeParse(req.body);
 if(!body.success)return res.status(400).json({error:'Invalid project'});
 const record=await db.project.create({data:{organizationId:req.principal!.organizationId,...body.data}});
 res.status(201).json(record);
});
app.put('/api/v2/projects/:projectId/credentials',requireRole('ADMIN'),async(req,res)=>{
 const body=z.object({tenantId:z.string().uuid(),clientId:z.string().uuid(),clientSecret:z.string().min(1)}).safeParse(req.body);
 if(!body.success)return res.status(400).json({error:'Invalid source tenant credential'});
 try {const result=await setProjectCredential(req.principal!.organizationId,req.params.projectId,body.data.tenantId,body.data.clientId,body.data.clientSecret);res.json(result);}
 catch{res.status(400).json({error:'Unable to save source tenant credentials for this project'});}
});
app.post('/api/v2/projects/:projectId/scans',requireRole('ADMIN','OPERATOR'),async(req,res)=>{
 const body=z.object({workloads:z.array(z.enum(['Users','Groups','SharePoint','Teams','OneDrive'])).nonempty()}).safeParse(req.body);
 if(!body.success)return res.status(400).json({error:'Invalid workloads',supported:workloads});
 try{res.status(202).json(await startScan(req.principal!.organizationId,req.params.projectId,body.data.workloads as Workload[]));}
 catch(e){res.status(400).json({error:e instanceof Error?e.message:'Unable to start scan'});}
});
app.get('/api/v2/projects/:projectId/scans',async(req,res)=>{
 const project=await db.project.findFirst({where:{id:req.params.projectId,organizationId:req.principal!.organizationId}});
 if(!project)return res.sendStatus(404);
 res.json(await db.scan.findMany({where:{projectId:project.id,organizationId:project.organizationId},orderBy:{createdAt:'desc'},take:100}));
});
app.get('/api/v2/projects/:projectId/scans/:scanId/provenance',async(req,res)=>{
 const {organizationId}=req.principal!;
 const scan=await db.scan.findFirst({where:{id:req.params.scanId,projectId:req.params.projectId,organizationId}});
 if(!scan)return res.sendStatus(404);
 const workloads=await db.discoveryScanWorkload.findMany({where:{scanId:scan.id,projectId:scan.projectId,organizationId},select:{workload:true,status:true,itemsSeen:true,itemsDeleted:true,pagesRead:true,startedAt:true,completedAt:true,errorMessage:true}});
 // Never return deltaLink: opaque Graph tokens can expose tenant discovery state.
 res.json({scanId:scan.id,organizationId,projectId:scan.projectId,sourceTenantId:scan.sourceTenantId,mode:scan.mode,scanType:scan.scanType,apiProvider:scan.apiProvider,status:scan.status,startedAt:scan.startedAt,finishedAt:scan.finishedAt,workloads});
});
app.get('/api/v2/projects/:projectId/inventory/current',async(req,res)=>{
 const organizationId=req.principal!.organizationId;
 const project=await db.project.findFirst({where:{id:req.params.projectId,organizationId}});
 if(!project)return res.sendStatus(404);
 const page=Math.max(0,Math.min(100000,Number(req.query.page)||0));
 const workload=typeof req.query.workload==='string'&&workloads.includes(req.query.workload as Workload)?req.query.workload:undefined;
 const includeDeleted=req.query.includeDeleted==='true';
 const where={organizationId,projectId:project.id,sourceTenantId:project.sourceTenantId,...(workload?{workload}:{}),...(!includeDeleted?{isDeleted:false}:{})};
 const [count,items]=await Promise.all([db.currentInventoryItem.count({where}),db.currentInventoryItem.findMany({where,skip:page*100,take:100,orderBy:{sourceId:'asc'},select:{workload:true,sourceId:true,name:true,isDeleted:true,lastScanId:true,observedAt:true}})]);
 res.json({count,page,pageSize:100,items,scope:{projectId:project.id,sourceTenantId:project.sourceTenantId},source:'LIVE_MICROSOFT_GRAPH'});
});
app.get('/api/v2/projects/:projectId/scans/:scanId/items',async(req,res)=>{
 const scan=await db.scan.findFirst({where:{id:req.params.scanId,projectId:req.params.projectId,organizationId:req.principal!.organizationId}});
 if(!scan)return res.sendStatus(404);
 const page=Math.max(0,Math.min(100000,Number(req.query.page)||0));
 const take=100;
 const [count,items]=await Promise.all([db.inventoryItem.count({where:{scanId:scan.id,organizationId:scan.organizationId}}),db.inventoryItem.findMany({where:{scanId:scan.id,organizationId:scan.organizationId},skip:page*take,take,select:{id:true,workload:true,sourceId:true,name:true}})]);
 res.json({count,page,take,items});
});
app.use((error:unknown,_req:express.Request,res:express.Response,_next:express.NextFunction)=>{console.error(error);res.status(500).json({error:'Internal server error'});});
app.listen(config.PORT,()=>console.log(`Migration v2 API on port ${config.PORT}`));
