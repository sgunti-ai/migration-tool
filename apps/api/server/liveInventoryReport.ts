import { prisma } from './db.js';

export const liveWorkloads = ['Users','Groups','SharePoint','Teams','OneDrive'] as const;
export const pendingWorkloads = ['Exchange','DistributionLists','SecurityCompliance'] as const;
const fields:Record<string,string[]>={
 Users:['userPrincipalName','displayName','department','jobTitle','accountEnabled','usageLocation'],
 Groups:['displayName','mail','mailEnabled','securityEnabled','groupTypes'],
 SharePoint:['displayName','webUrl','lastModifiedDateTime'],
 Teams:['displayName','description','visibility'],
 TeamsChannel:['teamId','channelId','membershipType'],
 OneDrive:['driveId','ownerUPN','webUrl','quota']
};
export async function buildLiveInventoryReport(projectId:string,scanId:string){
 const project=await prisma.discoveryProject.findUnique({where:{id:projectId}});
 if(!project) return null;
 const scan=await prisma.scopedDiscoveryScan.findFirst({where:{id:scanId,projectId,tenantId:project.sourceTenantId}});
 if(!scan)return null;
 const requested=JSON.parse(scan.workloads) as string[];
 const grouped=await prisma.scopedDiscoveryItem.groupBy({by:['workload'],where:{scanId,projectId,tenantId:scan.tenantId},_count:{_all:true}});
 const counts=new Map(grouped.map(x=>[x.workload,x._count._all]));
 const reports=liveWorkloads.map(workload=>({
  workload,
  status:requested.includes(workload)?scan.status==='COMPLETED'?'COMPLETED':scan.status:'NOT_SCANNED',
  count:counts.get(workload)||0,
  capturedFields:fields[workload],
  notes:workload==='OneDrive'?'Drive metadata only; full file enumeration and sharing audit not yet implemented':workload==='SharePoint'?'Site metadata only; libraries, permissions and storage usage not yet enumerated':workload==='Teams'?'Teams and channels only; tabs, apps and membership not yet enumerated':workload==='Users'?'Directory profile only; sign-in, MFA, roles and licenses not yet enriched':'Group metadata only; membership and ownership not yet enumerated'
 }));
 const channels={workload:'TeamsChannel',status:requested.includes('Teams')?scan.status:'NOT_SCANNED',count:counts.get('TeamsChannel')||0,capturedFields:fields.TeamsChannel};
 return {
  reportType:'LIVE_INVENTORY',source:'MICROSOFT_GRAPH',isEstimated:false,
  projectId,scanId,tenantId:scan.tenantId,scanStatus:scan.status,
  startedAt:scan.startedAt,completedAt:scan.completedAt,errorMessage:scan.errorMessage,
  requestedWorkloads:requested,workloads:[...reports,channels],
  notImplemented:pendingWorkloads.map(workload=>({workload,status:'NOT_IMPLEMENTED',count:null})),
  completeness:scan.status==='COMPLETED'?'Selected workload enumeration finished; detailed workload enrichment remains incomplete':'Partial or unfinished scan; counts must not be interpreted as a complete tenant inventory'
 };
}
