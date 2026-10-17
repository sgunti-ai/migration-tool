import type {Workload} from './adapters.js';

/** Inventory records produced by each scanner; Teams emits channels as child records. */
export const inventoryTypesFor=(workload:Workload):string[]=>
 workload==='Teams'?['Teams','TeamsChannel']:[workload];

export const isDeltaWorkload=(workload:Workload):workload is 'Users'|'Groups'=>
 workload==='Users'||workload==='Groups';

export const normalizeWorkloads=(requested:Workload[]):Workload[]=>
 [...new Set(requested)];
