# Platform v2 rollout
Platform v2 is a separate backend; legacy React remains unchanged until feature parity is verified.
## Running independently
1. Install Node.js 20+ and Docker.
2. Run `docker compose up -d` inside platform/.
3. Copy .env.example to .env, configure PostgreSQL, Redis, issuer, audience, source tenant credentials and a random 32-byte hex CREDENTIAL_ENCRYPTION_KEY.
4. Run `npm install`, `npm run db:generate`, `npx prisma migrate dev --name initial` on a fresh development DB.
5. Run `npm run check`, `npm test`, `npm run dev`, and in another process `npm run worker`.
6. Provision trusted Organization and Membership records through administrative bootstrap; never create global admins through self signup.
7. Connect using OAuth access token issued for the v2 API and X-Organization-Id: <authorized organization ID>.
8. Create a project POST /api/v2/projects with name and sourceTenantId, assign credentials PUT /api/v2/projects/{id}/credentials, then request a scan.
## Data safety
Do not reuse the legacy SQLite data automatically. Review mapping of legacy customers/tenants, and only migrate data with verified provenance. This code does not transfer Microsoft 365 content.
## Current limitations
The first iteration uses app credentials encrypted by a deployment key; managed key vault and service principals with certificate auth are recommended for production. JWT issuer/JWKS binding must be configured to a trusted issuer. Discovery queue retry attempts can re-execute partial item upserts idempotently. Recovery is not yet equivalent to a fully durable per-page checkpoint workflow. Build and test execution not yet verified.
