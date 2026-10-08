# Scoped discovery implementation status

## Implemented
- Organization -> Project -> ScopedDiscoveryScan -> ScopedDiscoveryItem relationships with restrictive project and tenant lookup.
- Each inventory item has a unique (scanId, workload, sourceId) identity. Separate scans cannot overwrite each other's inventory.
- Live mode disables the legacy global discovery GET endpoints (HTTP 410) and requires projectId to start scans.
- Scoped scan and item read APIs; raw metadata is stored but not exposed by the list endpoint.
- Graph access token cache is refreshed before expiration, and a 401 response causes one refresh attempt.

## Important boundaries
The organization isolation here is **schema and API filter isolation**, not end-to-end multi-customer RBAC. All approved global administrators can access all organizations. Per-customer membership and authorization have NOT been implemented. Do not deploy this as an MSP multi-customer service yet.
SQLite should be replaced with PostgreSQL for concurrent production workers.
Legacy unscoped inventory tables and legacy demo dashboards remain in the schema. Live mode blocks their discovery API endpoints, but other legacy endpoints may expose demonstration data. Do not use legacy assessment or reporting as evidence of real inventory.
The server requires migration of the Prisma schema (prisma db push for development, proper Prisma migrations for deployments).
Source discovery credentials remain configured through environment variables; secret vault storage and automated secret rotation are not implemented.
OneDrive drive inventory (including API-reported quota when available) and Teams channel listings have initial adapters. Exchange mailbox inventory, item-level ACLs, Teams membership counts, full storage assessments, advanced reporting and thorough tenant-wide validation remain pending. Graph API 403/404 failures currently fail the workload scan instead of silently reporting success.
External durable worker, restart recovery, cancellation and real tenant automated tests remain pending.

## Using new endpoints
1. POST /api/organizations with { "name": "Customer" }
2. POST /api/organizations/:organizationId/projects with { "name": "Phase 1", "sourceTenantId": "<actual GUID>" }
3. POST /api/discovery/start with { "projectId": "<project ID>", "workloads": ["Users","Groups","SharePoint","Teams"] }
4. GET /api/scoped-discovery/:projectId/scans
5. GET /api/scoped-discovery/:projectId/scans/:scanId/items?workload=Users&skip=0&take=50

All calls require an authenticated, approved console administrator. POST calls require a same-origin request.
