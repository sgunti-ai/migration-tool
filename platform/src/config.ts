import { z } from 'zod';
const schema=z.object({
 NODE_ENV:z.enum(['development','test','production']).default('development'),
 PORT:z.coerce.number().int().min(1).max(65535).default(3100),
 DATABASE_URL:z.string().startsWith('postgresql://'),
 REDIS_URL:z.string().url(),
 OIDC_ISSUER:z.string().url(),
 OIDC_AUDIENCE:z.string().min(1),
 OIDC_JWKS_URL:z.string().url(),
 CREDENTIAL_ENCRYPTION_KEY:z.string().regex(/^[a-fA-F0-9]{64}$/),
 DEMO_MODE:z.enum(['false']).default('false')
});
export const config=schema.parse(process.env);
