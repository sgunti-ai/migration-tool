# Migration Platform v2 — Independent backend
A separate, non-destructive backend prototype under `platform/`. The existing React application and legacy backend are unchanged.
## Modules
- `api.ts`: authenticated, organization-scoped REST API
- `auth.ts`: JWT verification against a fixed, trusted issuer and JWKS; membership-based roles
- `service.ts`: job creation and discovery orchestrator
- `worker.ts`: queue-backed execution and restart reconciliation
- `adapters.ts`: Microsoft Graph discovery workload adapters
- `graph.ts`: token acquisition/renewal, controlled pagination, throttling and request timeouts
- `prisma/schema.prisma`: PostgreSQL tenant/project/scan/inventory persistence

## Setup
`npm install`, configure `.env` from `.env.example`, `npm run db:generate`, `npx prisma migrate dev` (development only), then start API with `npm run dev` and worker with `npm run worker`. PostgreSQL and Redis must be running. Configure Entra ID app and grant appropriate admin-consented Microsoft Graph application permissions. The source tenant ID MUST match the project tenant. Set up membership records through a trusted administrative bootstrap, not anonymous signup.

## Security and product boundaries
- No hardcoded credentials, demo seed, fallback admin or synthetic migration success.
- A valid OAuth access token alone does not grant access: the caller requires organization membership in the database. The API does not create organizations/memberships anonymously.
- This release supports inventory discovery, **not migration**. It does not assert mailbox statistics, all permissions or universal object completeness.
- The new API uses independently verified Entra-issued bearer tokens, not the legacy Google/Microsoft browser sessions. Integrating Google sign-in requires an identity-broker/token-exchange service with server-verified identities and an auditable organization membership policy; accepting arbitrary Google ID tokens as API tokens would be unsafe.
- This is an initial refactor slice: secret-vault integration, scoped per-tenant credential storage, all Azure clouds, validated least-privilege Graph permissions, bounded scan cancellation, unit/integration/load testing, and finer-grained durable checkpoints remain open.
- The worker currently supports the configured SOURCE_TENANT_ID only; projects for different tenants must use separate worker deployments until per-tenant credential lookup is implemented.
- Prisma schema migrations and external services are needed to run; this branch has NOT been built or deployed.
