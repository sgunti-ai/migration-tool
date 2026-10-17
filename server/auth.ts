import crypto from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { createRemoteJWKSet, decodeJwt, jwtVerify } from 'jose';
import { prisma } from './db.js';

type Provider = 'google' | 'microsoft';
const cookieName = 'migration_session';
const stateCookie = 'migration_oauth_state';
const isProd = process.env.NODE_ENV === 'production';
const baseUrl = () => {
  const value = process.env.APP_URL;
  if (!value) throw new Error('APP_URL must be configured for OAuth');
  return new URL(value).origin;
};
const random = () => crypto.randomBytes(32).toString('base64url');
const hash = (value: string) => crypto.createHash('sha256').update(value).digest('hex');
const allowedAdmins = () => (process.env.ADMIN_EMAILS || '').split(',').map(x => x.trim().toLowerCase()).filter(Boolean);
const config = (provider: Provider) => provider === 'google'
  ? { id: process.env.GOOGLE_CLIENT_ID, secret: process.env.GOOGLE_CLIENT_SECRET, issuer: 'https://accounts.google.com', authorization: 'https://accounts.google.com/o/oauth2/v2/auth', token: 'https://oauth2.googleapis.com/token', jwks: 'https://www.googleapis.com/oauth2/v3/certs' }
  : { id: process.env.MICROSOFT_CLIENT_ID, secret: process.env.MICROSOFT_CLIENT_SECRET, issuer: 'https://login.microsoftonline.com/common/v2.0', authorization: 'https://login.microsoftonline.com/organizations/oauth2/v2.0/authorize', token: 'https://login.microsoftonline.com/organizations/oauth2/v2.0/token', jwks: '' };
const redirect = (provider: Provider) => `${baseUrl()}/auth/${provider}/callback`;
const cookieOpts = { httpOnly: true, secure: isProd, sameSite: 'lax' as const, path: '/' };
/** Local preview access is never available in production or from a non-loopback client. */
export function isLocalDevelopmentRequest(req: Request): boolean {
  const remote = req.socket.remoteAddress || '';
  const loopback = remote === '127.0.0.1' || remote === '::1' || remote === '::ffff:127.0.0.1';
  const host = (req.headers.host || '').split(':')[0].toLowerCase();
  return !isProd && process.env.NODE_ENV === 'development' && loopback &&
    (host === 'localhost' || host === '127.0.0.1' || host === '[::1]');
}


export function authRoutes(app: import('express').Express) {
  app.get('/auth/:provider/start', (req, res) => {
    const provider = req.params.provider as Provider;
    if (provider !== 'google' && provider !== 'microsoft') return res.sendStatus(404);
    const c = config(provider);
    if (!c.id || !c.secret) return res.status(503).send('Sign-in provider not configured');
    const state = random(), verifier = random();
    const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
    res.cookie(stateCookie, Buffer.from(JSON.stringify({ state, verifier, provider, created: Date.now() })).toString('base64url'), { ...cookieOpts, maxAge: 600000 });
    const url = new URL(c.authorization);
    for (const [k,v] of Object.entries({ client_id: c.id, response_type:'code', redirect_uri:redirect(provider), scope:'openid email profile', state, code_challenge:challenge, code_challenge_method:'S256', prompt:'select_account' })) url.searchParams.set(k,v);
    res.redirect(url.toString());
  });
  app.get('/auth/:provider/callback', async (req,res) => {
    res.clearCookie(stateCookie, cookieOpts);
    try {
      const provider = req.params.provider as Provider;
      if (provider !== 'google' && provider !== 'microsoft') return res.sendStatus(404);
      const stored = JSON.parse(Buffer.from(String(req.cookies[stateCookie] || ''),'base64url').toString());
      if (!stored || stored.provider !== provider || typeof stored.state !== 'string' || stored.state !== req.query.state || Date.now()-stored.created > 600000) return res.sendStatus(403);
      if (typeof req.query.code !== 'string') return res.sendStatus(400);
      const c = config(provider);
      if (!c.id || !c.secret) return res.sendStatus(503);
      const body = new URLSearchParams({ grant_type:'authorization_code', client_id:c.id, client_secret:c.secret, code:req.query.code, redirect_uri:redirect(provider), code_verifier:stored.verifier });
      const tokenResponse = await fetch(c.token,{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body});
      if(!tokenResponse.ok) return res.status(401).send('Identity provider rejected authorization');
      const tokens = await tokenResponse.json() as {id_token?:string};
      if(!tokens.id_token) return res.sendStatus(401);
      const claims = decodeJwt(tokens.id_token);
      let keys, issuer: string;
      if (provider === 'google') {
        keys = createRemoteJWKSet(new URL(c.jwks));
        issuer = c.issuer;
      } else {
        const tid = String(claims.tid || '');
        if (!/^[0-9a-f-]{36}$/i.test(tid)) return res.sendStatus(401);
        issuer = `https://login.microsoftonline.com/${tid}/v2.0`;
        keys = createRemoteJWKSet(new URL(`https://login.microsoftonline.com/${tid}/discovery/v2.0/keys`));
      }
      const verified = (await jwtVerify(tokens.id_token,keys,{issuer,audience:c.id,algorithms:['RS256']})).payload;
      const email = String(verified.email || verified.preferred_username || '').toLowerCase();
      if (!email || !verified.sub || (provider === 'google' && verified.email_verified !== true)) return res.sendStatus(403);
      // Access is restricted to an explicit allowlist, never granted by self-registration.
      if (!allowedAdmins().includes(email)) return res.status(403).send('Your account is not approved for migration console access');
      const role = 'GLOBAL_ADMIN';
      const raw = random();
      await prisma.appSession.create({data:{tokenHash:hash(raw),email,provider,subject:String(verified.sub),role,expiresAt:new Date(Date.now()+8*3600000)}});
      res.cookie(cookieName,raw,{...cookieOpts,maxAge:8*3600000});
      return res.redirect('/');
    } catch (err) {
      console.error('OAuth callback rejected:',err);
      return res.status(401).send('Authentication failed');
    }
  });
  app.get('/api/session',requireAuth,(req,res) => res.json({email:(req as any).user.email,role:(req as any).user.role}));
  app.post('/api/logout',requireAuth,async(req,res)=>{
    await prisma.appSession.deleteMany({where:{tokenHash:hash(String(req.cookies[cookieName]))}});
    res.clearCookie(cookieName,cookieOpts);
    res.json({ok:true});
  });
}
export async function requireAuth(req: Request,res:Response,next:NextFunction) {
  try {
    if (isLocalDevelopmentRequest(req)) {
      (req as any).user = { email: 'local-admin@localhost', role: 'GLOBAL_ADMIN' };
      return next();
    }
    const token = req.cookies?.[cookieName];
    if(typeof token!=='string'||token.length<30)return res.status(401).json({error:'Sign in required'});
    const session=await prisma.appSession.findUnique({where:{tokenHash:hash(token)}});
    if(!session||session.expiresAt.getTime()<Date.now()||!allowedAdmins().includes(session.email.toLowerCase())) return res.status(401).json({error:'Session invalid or expired'});
    (req as any).user={email:session.email,role:session.role};
    next();
  } catch(err){next(err);}
}
export function requireSameOrigin(req:Request,res:Response,next:NextFunction) {
  if(!['POST','PATCH','PUT','DELETE'].includes(req.method))return next();
  const origin=req.headers.origin;
  if (isLocalDevelopmentRequest(req) && origin === 'http://' + req.headers.host) return next();
  const expected=process.env.APP_URL ? new URL(process.env.APP_URL).origin : '';
  if(!expected||origin!==expected)return res.status(403).json({error:'Invalid request origin'});
  next();
}
