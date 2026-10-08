# Live source discovery (first production adapter)
This implementation scans **real** Microsoft Graph inventories for Users, Groups, SharePoint sites, and Teams backed by M365 groups. It requires DEMO_MODE=false and explicit application credentials. Authentication to the management console is independent.

## Configure
- SOURCE_TENANT_ID: the verified Microsoft Entra tenant GUID.
- SOURCE_DISCOVERY_CLIENT_ID: dedicated source discovery app registration client ID.
- SOURCE_DISCOVERY_CLIENT_SECRET: source discovery app secret (store in an external secrets manager).
- APP_URL, ADMIN_EMAILS and console login credentials must also be configured.
- Grant tenant admin consent for Graph **application** permissions User.Read.All, Group.Read.All, Sites.Read.All, Organization.Read.All. Depending on tenant and endpoint, Teams/group listing may require additional access; verify with least privilege.
- Use a test tenant first. Enable HTTPS and restrict the server to approved administrators.

## API
POST /api/discovery/start with body {"workloads":["Users","Groups"]}. This is an authenticated same-origin endpoint. GET /api/discovery/status and existing discovery inventory views expose results from Prisma.
The process refuses unsupported workloads instead of fabricating mailbox or OneDrive metrics.
Errors are recorded as FAILED and never converted into successful scans.
All pagination is constrained to graph.microsoft.com/v1.0, transient 429/503/504 errors honor Retry-After where possible, and 30-second request timeouts apply.

## Honest limitations before large enterprise deployment
- Database inventory tables are not scoped by project or tenant; do not reuse the database across distinct customers or source tenants. Introduce organization/tenant keys and unique composite indexes before MSP/SaaS release.
- Workload counts are item counts, not a complete tenant assessment. File totals, mailbox metrics, permission ACLs, licensing requirements and OneDrive sizes are **not measured**.
- No durable external queue: server restart interrupts scans; a RUNNING record requires administrator reconciliation.
- The scan currently performs per-item upserts. Add bulk transactions, tombstone/delta handling, cancellation and periodic token refresh for large tenants.
- The current dashboard may contain legacy demo fields; do not present unmeasured attributes as validated. Remove demo records from production databases.
- The Microsoft Graph availability of getAllSites and permissions may vary by tenant. Validate endpoint-specific support and error behavior.
- No integration or load test has been executed against a real tenant in this branch.
