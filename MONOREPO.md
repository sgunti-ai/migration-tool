# Monorepo structure

- `apps/web`: React frontend (Vite), independently buildable static site.
- `apps/api`: authenticated main SaaS HTTP/API gateway, legacy migration modules and WebSocket server.
- `services/discovery`: independent Microsoft Graph Discovery API, worker and its own Prisma migrations and PostgreSQL data.
- `packages/contracts`: shared TypeScript API wire contracts only; no database access or secrets.
- `prisma`: **transitional** core SQLite schema and existing database path. Do not move the SQLite schema as part of a code move: Prisma resolves SQLite file paths relative to this schema.

## Compatible commands from repository root

```sh
npm install
npm run dev             # console and API at 127.0.0.1:3000
npm run build           # Prisma generate + Vite static bundle + API bundle
npm run build:web       # standalone frontend build -> dist/
npm run build:api       # standalone API bundle -> dist/server.cjs
npm run check
npm run dev:discovery   # requires configuring separate Discovery environment
```

To deploy Discovery use `cd services/discovery`, configure `discovery.env`, and run Docker Compose as described in `DISCOVERY_SERVICE.md`. Independent DB and Redis ownership are unchanged by this filesystem move.

## Database ownership decision

Do **not** create one PostgreSQL server per service by default. Prefer one managed PostgreSQL cluster with distinct service-owned databases or schemas, permissions, migrations, backups, and no cross-service SQL access. For now **preserve** the root SQLite core database and the Discovery PostgreSQL database: moving schema.prisma or changing providers risks losing existing local data. Migrate core SQLite to PostgreSQL later via a planned, reversible data migration with backup and verification.

## Current boundaries

The root package remains the compatibility toolchain for the console/API; `services/discovery/package.json` is independently managed. This avoids an untested lockfile/workspace rewrite. Legacy discovery code still exists in `apps/api/server/discovery.ts` for compatibility, while the new Discovery UI talks only to the service gateway. Remove that code only after data migration and endpoint consumers are audited.
