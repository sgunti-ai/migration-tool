/** Typed client for the isolated Discovery service via the authenticated console gateway.
 * Credentials never leave the server: the console session cookie authenticates calls.
 */
export type V2Project={id:string;name:string;sourceTenantId:string};
export type V2Scan={id:string;status:string;progress:number;scanType:string;createdAt:string;errorMessage?:string|null};
export type V2Inventory={count:number;items:Array<{workload:string;sourceId:string;name:string|null;isDeleted:boolean}>};
export type V2Report={status:string;workloads:Array<{workload:string;status:string;itemsRecorded:number;errorMessage?:string|null}>;unsupportedWorkloads:Array<{workload:string;status:string}>};

export class PlatformV2Client{
 constructor(private readonly base='/api/discovery-service'){}
 async request<T>(path:string,options?:RequestInit):Promise<T>{
  const response=await fetch(this.base+path,{...options,headers:{'Content-Type':'application/json',...options?.headers}});
  if(!response.ok){
   const body=await response.json().catch(()=>null);
   throw new Error(body?.error||'Discovery API HTTP '+response.status);
  }
  return response.json() as Promise<T>;
 }
 listProjects(){return this.request<V2Project[]>('/projects');}
 createProject(name:string,sourceTenantId:string){return this.request<V2Project>('/projects',{method:'POST',body:JSON.stringify({name,sourceTenantId})});}
 saveCredentials(projectId:string,tenantId:string,clientId:string,clientSecret:string){return this.request('/projects/'+encodeURIComponent(projectId)+'/credentials',{method:'PUT',body:JSON.stringify({tenantId,clientId,clientSecret})});}
 listScans(projectId:string){return this.request<V2Scan[]>('/projects/'+encodeURIComponent(projectId)+'/scans');}
 startScan(projectId:string,workloads:string[]){return this.request<V2Scan>('/projects/'+encodeURIComponent(projectId)+'/scans',{method:'POST',body:JSON.stringify({workloads})});}
 getInventory(projectId:string){return this.request<V2Inventory>('/projects/'+encodeURIComponent(projectId)+'/inventory/current');}
 getReport(projectId:string,scanId:string){return this.request<V2Report>('/projects/'+encodeURIComponent(projectId)+'/scans/'+encodeURIComponent(scanId)+'/report');}
}
export const discoveryClient=new PlatformV2Client();
