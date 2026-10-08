# Validate Platform v2 against Windows Docker Desktop

These checks have NOT yet been run against your containers. Use a non-production Microsoft 365 tenant and never print app credentials or delta tokens.

## Prerequisites
PostgreSQL published at 127.0.0.1:5432, Redis published at 127.0.0.1:6379. Configure platform/.env per platform/.env.example; use a fresh database for v2. Node.js 20+ and npm required.

From platform/:
```powershell
docker exec migration-postgres pg_isready -U migration_admin
docker exec m365-redis redis-cli ping
npm install
npx prisma validate
npx prisma generate
npx prisma migrate dev --name initial
npm run check
npm test
npm run dev
```
In another terminal start `npm run worker`. Note: deployment migrations should be committed and run with `prisma migrate deploy`; generating an initial migration on the developer machine is not a substitute for reviewing/committing versioned SQL.

## Test sequence
1. Create a project scoped to a test source tenant; provision credentials using PUT /api/v2/projects/{projectId}/credentials.
2. Trigger users/groups scan POST /api/v2/projects/{projectId}/scans with workloads Users and Groups.
3. Query GET /api/v2/projects/{projectId}/scans and /scans/{scanId}/provenance. First scan should show INITIAL_FULL.
4. GET /api/v2/projects/{projectId}/inventory/current?workload=Users should reflect non-deleted current-state objects.
5. Change a test user's display name and delete a disposable test group (not a production identity). Trigger another scan: scanType should be INCREMENTAL; compare tombstones using includeDeleted=true.
6. Ensure lastScanned inventory values are sourced from Graph and that no synthetic tenant seed records appear.
7. Stop worker mid-job, restart it, verify retry behavior and ensure the delta cursor does not advance after an incomplete session.
8. Test source project isolation: cross-organization requests must fail and current inventory must not mix tenants.
9. Test Graph pagination with >100 users/groups in a nonproduction tenant, 429 retry, 401 token refresh, and malformed nextLink rejection.

## Remaining limitations
This initial implementation uses transactions per Graph page, but **does not provide full transactional isolation across an entire delta round**. A later failed page can leave current inventory partially updated even though its delta cursor has not advanced; rerunning the round reconciles idempotently.
Initial Graph delta baseline also does not prune records from a separately imported legacy inventory. Full adapters do not reconcile vanished objects yet.
No external live Graph integration, performance/load or real Windows-container tests have been executed by ChatGPT. The v2 project has not been verified as buildable.
