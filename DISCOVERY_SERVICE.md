# Dedicated Discovery service

The repository has a monorepo layout with a console API and frontend, plus a separate Discovery runtime:

- The migration console (root `npm run dev`, port 3000) owns user sessions and UI.
- The Discovery service (`services/discovery/`, port 3100) owns live Microsoft Graph collection, projects, scan jobs, reports, credentials, and inventory. It uses its **own PostgreSQL database** and **its own Redis**. Its Prisma schema and migrations are under `platform/prisma`.

The console forwards authenticated requests through `/api/discovery-service/projects/...`. Browsers never receive service credentials or directly access the service's internal network.

## Local deployment

From `services/discovery/`:

1. Copy `discovery.env.example` to `discovery.env`.
2. Set real `OIDC_ISSUER`, `OIDC_AUDIENCE`, `OIDC_JWKS_URL`, and `CREDENTIAL_ENCRYPTION_KEY`. The encryption key must be exactly 64 hex characters.
3. Generate a new random gateway secret of at least 32 characters; set `DISCOVERY_GATEWAY_SECRET` to this same value in both the Discovery service environment and the root console environment.
4. Create `services/discovery/.env` containing `DISCOVERY_DB_PASSWORD=<strong-local-password>` for Compose variable interpolation. Use an alphanumeric password or URL-encode special characters in the connection URL.
5. Run `docker compose --env-file .env up --build -d`. Wait for the `migrate` container to exit successfully.
6. Check `http://127.0.0.1:3100/health/live` and `http://127.0.0.1:3100/health/ready`.
7. In the **root console** `.env`, configure:
   ```ini
   DISCOVERY_SERVICE_URL=http://127.0.0.1:3100
   DISCOVERY_GATEWAY_SECRET=<the-same-random-secret>
   DISCOVERY_ORGANIZATION_ID=console-default
   ```
8. Start the root application on port 3000. Open the **Discovery** navigation tab; create a project, configure an Entra application credential with Graph permissions, and start a live scan.

The console gateway will only issue a 60-second signed service token **after** validating the main application's session and administrator role. The service verifies its signature, issuer, audience and organization scope. The root's own `/api` origin protection applies to writes.

## Production deployment

Use TLS for `DISCOVERY_SERVICE_URL`, place the Discovery service on a private network, provide a secret manager for credentials, use separate least-privileged DB accounts, and manage PostgreSQL backups and Redis persistence. Set `NODE_ENV=production` and configure trusted OIDC values. Change the single-console organization mapping before supporting multiple organizations. Never commit real secrets or expose port 3100 publicly without access controls.

## Migration boundary

The new Discovery UI uses only the service API. Old unscoped discovery endpoints are still present for demo-mode compatibility, but live scoped legacy endpoints return HTTP 410 by default. `ENABLE_LEGACY_DISCOVERY=true` temporarily re-enables them while arranging data migration. **Legacy discovery database records are not automatically copied** into the new dedicated PostgreSQL database.

This is a deployment-ready code layout, not a claim that the containers have been launched, that Microsoft Graph admin consent has been granted, or that a real tenant scan has succeeded.
