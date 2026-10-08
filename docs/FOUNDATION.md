# Security foundation
Google and Microsoft OAuth sign-in are **console identity providers only**. They do not grant Microsoft 365 workload access.
Configure APP_URL, ADMIN_EMAILS (comma-separated approved email addresses), GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET.
Register exact redirect URIs: APP_URL/auth/google/callback and APP_URL/auth/microsoft/callback.
Use HTTPS, a production session database, separate consent flows for source/target tenant workload permissions, and an external secret vault.
Demo mode is the default. LIVE_MIGRATION_ENABLED must remain false until actual workload data transfer and object verification exist.
Existing simulated tenant consent and preflight routes must not be mistaken for production readiness; this branch blocks the legacy tenant connection routes rather than pretending they are secure.
Before deploying: test provider sign-in, session expiry, logout, CSRF/origin rejection, unauthorized API/WebSocket access, and admin allowlist enforcement.
