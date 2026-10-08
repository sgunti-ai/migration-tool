import type {GraphClient} from './graph.js';
export type Workload='Users'|'Groups'|'SharePoint'|'Teams'|'OneDrive';
export const workloads:Workload[]=['Users','Groups','SharePoint','Teams','OneDrive'];
export type DiscoveryItem={workload:string;sourceId:string;name:string;metadata:Record<string,unknown>};
export interface DiscoveryAdapter {
 workload:Workload;
 discover(graph:GraphClient):AsyncGenerator<DiscoveryItem>;
}
const basic=(workload:Workload,path:string):DiscoveryAdapter=>({
 workload,
 async *discover(graph){
  for await(const item of graph.list(path)){
   if(!item.id)continue;
   yield {workload,sourceId:item.id,name:item.displayName||item.userPrincipalName||item.webUrl||item.id,metadata:item};
  }
 }
});
export const adapters:Record<Workload,DiscoveryAdapter>={
 Users:basic('Users','/v1.0/users?$select=id,userPrincipalName,displayName,department,accountEnabled&$top=100'),
 Groups:basic('Groups','/v1.0/groups?$select=id,displayName,mail,securityEnabled,groupTypes&$top=100'),
 SharePoint:basic('SharePoint','/v1.0/sites/getAllSites?$select=id,displayName,webUrl&$top=100'),
 Teams:{
  workload:'Teams',async *discover(graph){
   for await(const team of graph.list("/v1.0/groups?$filter=resourceProvisioningOptions/Any(x:x eq 'Team')&$select=id,displayName,description&$top=100")){
    if(!team.id)continue;
    yield {workload:'Teams',sourceId:team.id,name:team.displayName||team.id,metadata:team};
    for await(const channel of graph.list(`/v1.0/teams/${encodeURIComponent(team.id)}/allChannels`)){
     if(channel.id)yield {workload:'TeamsChannel',sourceId:`${team.id}:${channel.id}`,name:channel.displayName||channel.id,metadata:{teamId:team.id,channel}};
    }
   }
  }
 },
 OneDrive:{
  workload:'OneDrive',async *discover(graph){
   for await(const user of graph.list('/v1.0/users?$select=id,userPrincipalName&$top=100')){
    if(!user.id)continue;
    // Graph may return 404 for users whose OneDrive has never been provisioned.
    try {
     const drive=await graph.get(`/v1.0/users/${encodeURIComponent(user.id)}/drive`);
     if(drive.id)yield {workload:'OneDrive',sourceId:drive.id,name:user.userPrincipalName||drive.name||drive.id,metadata:{ownerId:user.id,webUrl:drive.webUrl,quota:drive.quota||null}};
    }catch(e){if(!(e instanceof Error && 'status' in e && (e as any).status===404))throw e;}
   }
  }
 }
};
