/** Shared wire-format contracts. Data is owned by the Discovery service. */
export type DiscoveryProject={id:string;name:string;sourceTenantId:string};
export type DiscoveryScan={id:string;status:string;progress:number;scanType:string;createdAt:string;errorMessage?:string|null};
export type DiscoveryInventory={count:number;items:Array<{workload:string;sourceId:string;name:string|null;isDeleted:boolean}>};
export type DiscoveryReport={status:string;workloads:Array<{workload:string;status:string;itemsRecorded:number;errorMessage?:string|null}>;unsupportedWorkloads:Array<{workload:string;status:string}>};
