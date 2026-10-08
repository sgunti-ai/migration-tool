/** Opt-in v2 API client. The existing UI continues using legacy endpoints until each view is migrated. */
export type V2Project={id:string;name:string;sourceTenantId:string};
export type V2Scan={id:string;status:string;progress:number;createdAt:string};
export class PlatformV2Client {
 constructor(private readonly origin:string,private readonly token:()=>Promise<string>,private readonly organizationId:()=>string){}
 private async get<T>(path:string,options?:RequestInit):Promise<T>{
  const value=await this.token();
  const response=await fetch(new URL('/api/v2'+path,this.origin),{...options,headers:{Authorization:'Bearer '+value,'X-Organization-Id':this.organizationId(),'Content-Type':'application/json',...options?.headers}});
  if(!response.ok)throw new Error('Platform v2 HTTP '+response.status);
  return response.json() as Promise<T>;
 }
 listProjects(){return this.get<V2Project[]>('/projects');}
 listScans(projectId:string){return this.get<V2Scan[]>('/projects/'+encodeURIComponent(projectId)+'/scans');}
 startScan(projectId:string,workloads:string[]){return this.get<V2Scan>('/projects/'+encodeURIComponent(projectId)+'/scans',{method:'POST',body:JSON.stringify({workloads})});}
}
