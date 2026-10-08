# Live discovery, Microsoft Graph pagination and delta cursors

## Changes
- Legacy `server/discovery.ts` seeded/sample scans are restricted to `DEMO_MODE=true` in non-production. Production rejects seeding or simulated scan creation.
- Platform v2 uses **live Graph** data only. Project and tenant scope is attached to scan, inventory items and cursor records.
- Users and Groups use Microsoft's `/users/delta` and `/groups/delta` endpoints; Graph pagination follows @odata.nextLink until the final @odata.deltaLink. Delta cursors are stored by project, source tenant and workload.
- Delta records with `@removed` are represented as tombstones (`isDeleted=true`), never silently discarded.
- Source authentication is independent of the management-console sign-in and scoped to the project.
- Per-workload provenance persists item counts, removed counts, page counts, status and timings. GET /api/v2/projects/:projectId/scans/:scanId/provenance returns this information without exposing delta tokens.

## Notes on semantics
Delta scan results are *changes observed in that scan*, not a reconstructed full tenant inventory. For a current-state inventory, implement a tenant-scoped materialized object table and apply changes transactionally. Other workloads still use full enumeration and do not claim Graph delta support.

## Production blockers
- The current cursor progression is only saved at the end of a complete delta round. If the next workload fails, earlier successful workload cursors are committed; this is expected per-workload commit behavior.
- Scan retries must be reconciled against queue/job state, and concurrent per-project scans require a database lease or unique active-scan constraint.
- An expired or invalid Graph delta token needs a deliberate full-resync path; do not reset silently.
- The first delta scan of users and groups may require many Graph pages and database writes; performance/batch transaction optimization remains.
- Tenant-scoped credential key rotation and vault integration are pending.
- External Graph integration testing, scale tests, schema migration generation, and production deployment validation are outstanding.
- Historical demo records already stored in a DB are not automatically purged. Back up and isolate or delete them deliberately after review.

## Microsoft API reference
- https://learn.microsoft.com/en-us/graph/delta-query-overview
- https://learn.microsoft.com/en-us/graph/api/user-delta?view=graph-rest-1.0
- https://learn.microsoft.com/en-us/graph/api/group-delta?view=graph-rest-1.0
