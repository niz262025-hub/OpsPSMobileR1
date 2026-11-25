# Deployed staging Edge Function v39

Staging-only snapshot; not a production deployment source. All six files captured from deployed version 39. Existing identity revalidation remains pending.

## index.ts

```ts
import { createClient } from 'npm:@supabase/supabase-js@2';
import { sendMyopsRequest } from './transport.ts';
import { allowedOpspsOrigins } from './origins.ts';
import {assertOpspsPremiumFeature,opspsAccessFromEntitlement,opspsSessionAccessFields,opspsTrialReady} from './trial-policy.ts';
import { centralCompanyLabels,ensureVerifiedMyopsIdentity, validateMyopsAuthority } from './provisioning.ts';
import { readMyopsJson, base64UrlEncode, canonicalMyopsRequest, isMyopsTicket, isUuid, OPSPS_MYOPS_PRODUCT, readSessionIdFromJwt } from './contract.ts';

const PRODUCT = OPSPS_MYOPS_PRODUCT;
const VALID_FOR_MS = 20_000;
const APP_ID = /^[a-z][a-z0-9_-]{1,31}$/;
const USER_REF = /^[A-Za-z0-9_-]{43}$/;
// This build contains the tested staging database adapters. Central MYOPS still
// controls app admission; Production can never enable trials through this gate.
const trialReady=()=>opspsTrialReady(Deno.env.get('SUPABASE_URL')??'',Deno.env.get('OPSPS_TRIAL_ENFORCEMENT')??'true');

type JsonRecord = Record<string, unknown>;
type MyopsAppSession = {
  onboarding_profile?: unknown;
  session_id: string;
  user_ref: string;
  product: string;
};

function corsHeaders(origin: string | null): HeadersInit {
  const allowed = allowedOpspsOrigins(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('OPSPS_ALLOWED_ORIGINS'));
  const headers: Record<string, string> = {
    'Cache-Control': 'no-store',
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff',
    'Vary': 'Origin',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  };
  if (origin && allowed.includes(origin)) headers['Access-Control-Allow-Origin'] = origin;
  return headers;
}

function json(status: number, payload: JsonRecord, headers: HeadersInit): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...Object.fromEntries(new Headers(headers)), 'Content-Type': 'application/json' },
  });
}

function asObject(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function base64UrlDecode(value: string): Uint8Array {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(normalized + '='.repeat((4 - normalized.length % 4) % 4));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function signingConfig() {
  const origin = Deno.env.get('MYOPS_APP_API_ORIGIN') ?? '';
  const appId = Deno.env.get('MYOPS_APP_ID') ?? '';
  const version = Deno.env.get('MYOPS_KEY_VERSION') ?? 'current';
  const keyName = `MYOPS_APP_PRIVATE_KEY_${version.toUpperCase()}`;
  const privateKey = (Deno.env.get(keyName) ?? Deno.env.get('MYOPS_APP_PRIVATE_KEY') ?? '').replace(/\\n/g, '\n');
  let parsedOrigin: URL;
  try {
    parsedOrigin = new URL(origin);
  } catch {
    throw new Error('MYOPS access is not configured');
  }
  if (
    parsedOrigin.protocol !== 'https:'
    || parsedOrigin.username
    || parsedOrigin.password
    || parsedOrigin.search
    || parsedOrigin.hash
    || parsedOrigin.pathname !== '/'
    || !APP_ID.test(appId)
    || !['current', 'next'].includes(version)
    || !privateKey.includes('BEGIN PRIVATE KEY')
  ) {
    throw new Error('MYOPS access is not configured');
  }
  validateMyopsAuthority(Deno.env.get('SUPABASE_URL') ?? '', parsedOrigin.origin);
  return { origin: parsedOrigin, appId, version, privateKey };
}

function supabaseConfig() {
  const url = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? (() => {
    try {
      return JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}').default ?? '';
    } catch {
      return '';
    }
  })();
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? (() => {
    try {
      return JSON.parse(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS') ?? '{}').default ?? '';
    } catch {
      return '';
    }
  })();
  if (!url.startsWith('https://') || !serviceRoleKey || !anonKey) {
    throw new Error('OpsPS server auth is not configured');
  }
  return { url, serviceRoleKey, anonKey };
}

function makeClients() {
  const config = supabaseConfig();
  const admin = createClient(config.url, config.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const auth = createClient(config.url, config.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return { admin, auth };
}

async function signMyopsRequest(
  path: '/api/app/redeem' | '/api/app/entitlement',
  body: JsonRecord,
): Promise<Response> {
  const { origin, appId, version, privateKey } = signingConfig();
  const pem = privateKey.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, '');
  const key = await crypto.subtle.importKey(
    'pkcs8',
    base64UrlDecode(pem.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')),
    { name: 'Ed25519' },
    false,
    ['sign'],
  );
  const timestamp = String(Date.now());
  const nonceBytes = crypto.getRandomValues(new Uint8Array(24));
  const nonce = base64UrlEncode(nonceBytes);
  const message = await canonicalMyopsRequest(path, appId, version, timestamp, nonce, body);
  const signature = base64UrlEncode(await crypto.subtle.sign('Ed25519', key, new TextEncoder().encode(message)));
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8_000);
  try {
    return await sendMyopsRequest(origin.origin, path, {
      method: 'POST',
      cache: 'no-store',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'X-Myops-App-Id': appId,
        'X-Myops-Key-Version': version,
        'X-Myops-Timestamp': timestamp,
        'X-Myops-Nonce': nonce,
        'X-Myops-Signature': signature,
      },
      body: JSON.stringify(body),
    }, {
      projectUrl: Deno.env.get('SUPABASE_URL') ?? '',
      shareToken: Deno.env.get('MYOPS_STAGING_SHARE_TOKEN'),
      automationSecret: Deno.env.get('MYOPS_STAGING_VERCEL_AUTOMATION_SECRET'),
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function redeemTicket(ticket: string, headers: HeadersInit): Promise<Response> {
  if (!isMyopsTicket(ticket)) return json(400, { error: 'Invalid launch ticket' }, headers);
  const redeemed = await readMyopsJson(await signMyopsRequest('/api/app/redeem', { ticket })) as unknown as MyopsAppSession;
  if (
    redeemed.product !== PRODUCT
    || !isUuid(redeemed.session_id)
    || typeof redeemed.user_ref !== 'string'
    || !USER_REF.test(redeemed.user_ref)
  ) {
    return json(403, { error: 'MYOPS access denied' }, headers);
  }

  // Fresh central admission before provisioning or issuing a local session.
  const checked=await readMyopsJson(await signMyopsRequest('/api/app/entitlement',{
    session_id:redeemed.session_id,product:PRODUCT,activity:true,sensitive:true,
  }));
  const access=opspsAccessFromEntitlement(checked,trialReady());
  const { admin, auth } = makeClients();
  const linkResult = await admin.from('myops_identity_links')
    .select('opsps_user_id')
    .eq('myops_user_ref', redeemed.user_ref)
    .maybeSingle();
  if (linkResult.error) throw new Error('Unable to check OpsPS identity');
  let labels: ReturnType<typeof centralCompanyLabels> | null = null;
  if (!linkResult.data?.opsps_user_id && trialReady()) {
    try {
      labels = centralCompanyLabels(redeemed.onboarding_profile);
    } catch {
      console.warn('opsps_app_access_failure', 'onboarding_profile_required');
      return json(422, {
        error: 'Complete your company profile in MYOPS.',
        code: 'onboarding_profile_required',
      }, headers);
    }
  }
  const opspsUserId = linkResult.data?.opsps_user_id ?? await ensureVerifiedMyopsIdentity(
    redeemed.user_ref, Deno.env.get('SUPABASE_URL') ?? '', {
      async getUser(id) {
        const result = await admin.auth.admin.getUserById(id);
        if (result.error && result.error.status !== 404) throw new Error('Unable to check OpsPS identity');
        return result.data.user;
      },
      async createUser(input) {
        const result = await admin.auth.admin.createUser(input);
        if (result.error) throw new Error('Unable to provision OpsPS identity');
        return result.data.user;
      },
      async provision(userRef, userId) {
        const result = await admin.rpc(labels?'opsps_provision_myops_identity_v3':'opsps_provision_myops_identity_v2', { p_user_ref: userRef, p_user_id: userId, p_project_url: Deno.env.get('SUPABASE_URL') ?? '',
          ...(labels?{p_display_name:labels.name,p_company_name:labels.company}:{}) });
        if (result.error || typeof result.data !== 'string') throw new Error('Unable to provision OpsPS tenant');
        return result.data;
      },
    }, signingConfig().origin.origin);

  const userResult = await admin.auth.admin.getUserById(opspsUserId);
  const email = userResult.data.user?.email;
  if (userResult.error || !email || !userResult.data.user?.email_confirmed_at) {
    return json(403, { error: 'Linked OpsPS account is unavailable' }, headers);
  }
  const profile = await admin.from('profiles')
    .select('id')
    .eq('auth_user_id', opspsUserId)
    .maybeSingle();
  if (profile.error || !profile.data) {
    return json(403, { error: 'Linked OpsPS account is not provisioned' }, headers);
  }

  const link = await admin.auth.admin.generateLink({ type: 'magiclink', email });
  const tokenHash = link.data.properties?.hashed_token;
  if (link.error || !tokenHash) throw new Error('Unable to create OpsPS session');
  const verified = await auth.auth.verifyOtp({ token_hash: tokenHash, type: 'magiclink' });
  const session = verified.data.session;
  if (verified.error || !session || verified.data.user?.id !== opspsUserId) {
    throw new Error('Unable to create OpsPS session');
  }

  const supabaseSessionId = readSessionIdFromJwt(session.access_token);
  if (!supabaseSessionId) throw new Error('Invalid OpsPS auth session');
  const validUntil = new Date(Date.now() + VALID_FOR_MS).toISOString();
  const stored = await admin.from('myops_app_sessions').insert({
    myops_user_ref: redeemed.user_ref,
    opsps_user_id: opspsUserId,
    myops_session_id: redeemed.session_id,
    supabase_session_id: supabaseSessionId,
    valid_until: validUntil,
    ...opspsSessionAccessFields(access,trialReady()),
  });
  if (stored.error) throw new Error('Unable to bind OpsPS session');

  return json(200, {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    token_type: session.token_type,
    expires_in: session.expires_in,
  }, headers);
}

async function authenticatedSession(request: Request, headers: HeadersInit) {
  const authorization = request.headers.get('authorization') ?? '';
  const match = /^Bearer\s+(.+)$/i.exec(authorization);
  if (!match) return { response: json(401, { error: 'Authentication required' }, headers) };

  const token = match[1];
  const { admin } = makeClients();
  const user = await admin.auth.getUser(token);
  const sessionId = readSessionIdFromJwt(token);
  if (user.error || !user.data.user || !sessionId) {
    return { response: json(401, { error: 'Authentication required' }, headers) };
  }
  const stored = await admin.from('myops_app_sessions')
    .select('id, myops_session_id, myops_user_ref')
    .eq('opsps_user_id', user.data.user.id)
    .eq('supabase_session_id', sessionId)
    .is('revoked_at', null)
    .maybeSingle();
  if (stored.error || !stored.data) {
    return { response: json(403, { error: 'MYOPS session is not active' }, headers) };
  }
  return { admin, user: user.data.user, session: stored.data };
}

async function refreshEntitlement(request: Request, sensitive: boolean, activity: boolean, headers: HeadersInit): Promise<Response> {
  const current = await authenticatedSession(request, headers);
  if ('response' in current) return current.response;
  const body = {
    session_id: current.session.myops_session_id,
    product: PRODUCT,
    activity,
    sensitive,
  };
  let checked: JsonRecord;
  try {
    checked = await readMyopsJson(await signMyopsRequest('/api/app/entitlement', body));
  } catch {
    return json(503, { error: 'MYOPS access could not be verified' }, headers);
  }
  let access;
  try {access=opspsAccessFromEntitlement(checked,trialReady());} catch {
    await current.admin.from('myops_app_sessions')
      .update({ revoked_at: new Date().toISOString(), valid_until: new Date().toISOString() })
      .eq('id', current.session.id);
    return json(403, { error: 'MYOPS access is not active' }, headers);
  }
  const validUntil = new Date(Math.min(Date.now() + VALID_FOR_MS,access.mode==='trial'?Date.parse(access.expiresAt):Infinity)).toISOString();
  const updated = await current.admin.from('myops_app_sessions')
    .update({ valid_until: validUntil, updated_at: new Date().toISOString(),...opspsSessionAccessFields(access,trialReady()) })
    .eq('id', current.session.id)
    .is('revoked_at', null);
  if (updated.error) return json(503, { error: 'MYOPS access could not be stored' }, headers);
  return json(200, { entitled: true, valid_until: validUntil,access_mode:access.mode,
    ...(access.mode==='trial'?{trial:{id:access.trialId,expires_at:access.expiresAt,policy_version:1}}:{}) }, headers);
}

async function endSession(request: Request, headers: HeadersInit): Promise<Response> {
  const current = await authenticatedSession(request, headers);
  if ('response' in current) return current.response;
  const now = new Date().toISOString();
  const result = await current.admin.from('myops_app_sessions')
    .update({ revoked_at: now, valid_until: now, updated_at: now })
    .eq('id', current.session.id);
  if (result.error) return json(503, { error: 'Unable to end OpsPS session' }, headers);
  return json(200, { signed_out: true }, headers);
}

async function checkPremiumFeature(request:Request,feature:string,headers:HeadersInit):Promise<Response> {
  const refreshed=await refreshEntitlement(request,true,true,headers);
  if(!refreshed.ok)return refreshed;
  const checked=await refreshed.json();
  // Only the fresh signed central response can authorize premium operations.
  if(checked.access_mode!=='paid')return json(403,{error:'Upgrade in MYOPS to use this feature.',code:'premium_required'},headers);
  assertOpspsPremiumFeature({mode:'paid'},feature);
  return json(200,{entitled:true,allowed:true,feature,access_mode:'paid'},headers);
}

Deno.serve(async (request) => {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);
  const allowed = allowedOpspsOrigins(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('OPSPS_ALLOWED_ORIGINS'));
  if (origin && !allowed.includes(origin)) return json(403, { error: 'Origin is not allowed' }, headers);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (request.method !== 'POST') return json(405, { error: 'Method not allowed' }, headers);
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    return json(415, { error: 'JSON required' }, headers);
  }
  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (contentLength > 8_192) return json(413, { error: 'Request is too large' }, headers);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json(400, { error: 'Invalid request' }, headers);
  }
  if (!asObject(body) || typeof body.action !== 'string') {
    return json(400, { error: 'Invalid request' }, headers);
  }

  try {
    if(body.action==='staging_status'&&Object.keys(body).length===1) {
      if(Deno.env.get('SUPABASE_URL')!=='https://ojamkplflqafedmxbdxb.supabase.co')return json(404,{error:'Not found'},headers);
      try {
        const probe=await readMyopsJson(await signMyopsRequest('/api/app/entitlement',{session_id:crypto.randomUUID(),product:PRODUCT,activity:false}));
        const ready=probe.entitled===false&&probe.session_active===false;
        return json(ready?200:503,{ready,signed_transport:ready?'verified':'unavailable',unknown_session:ready?'denied':'unverified'},headers);
      }catch(error){
        const message=error instanceof Error?error.message:'';
        const reason=['Staging access unavailable','Invalid staging redirect','Staging redirect rejected'].includes(message)?'deployment_protection':message==='MYOPS access is not configured'?'configuration':'transport_unavailable';
        return json(503,{ready:false,reason},headers);
      }
    }
    if (body.action === 'redeem') {
      if (Object.keys(body).length !== 2 || !Object.hasOwn(body, 'ticket')) {
        return json(400, { error: 'Invalid request' }, headers);
      }
      return await redeemTicket(body.ticket as string, headers);
    }
    if (body.action === 'refresh') {
      if (Object.keys(body).some((key) => !['action', 'sensitive', 'activity'].includes(key))
        || (body.sensitive !== undefined && typeof body.sensitive !== 'boolean')
        || (body.activity !== undefined && typeof body.activity !== 'boolean')) {
        return json(400, { error: 'Invalid request' }, headers);
      }
      return await refreshEntitlement(request, body.sensitive === true, body.activity === true, headers);
    }
    if(body.action==='feature') {
      if(Object.keys(body).length!==2||typeof body.feature!=='string'||!['advanced_reporting','export','multi_user'].includes(body.feature))return json(400,{error:'Invalid feature request'},headers);
      return await checkPremiumFeature(request,body.feature,headers);
    }
    if (body.action === 'logout' && Object.keys(body).length === 1) {
      return await endSession(request, headers);
    }
    return json(400, { error: 'Invalid request' }, headers);
  } catch (error) {
    const known = ['Staging transport is restricted', 'Invalid staging redirect', 'Staging redirect rejected', 'Staging access unavailable', 'MYOPS access check failed', 'MYOPS access is not configured', 'MYOPS signed transport failed'];
    const kind = error instanceof Error ? (known.includes(error.message) ? error.message : error.name) : 'UnknownError';
    console.warn('opsps_app_access_failure', kind);
    return json(503, { error: 'MYOPS access is unavailable' }, headers);
  }
});

```

## transport.ts

```ts
const STEP1_ORIGIN = 'https://southerndotcom-website-git-fix-centr-db9115-mohd-syaiful-nizam1.vercel.app';
const STAGING_PROJECT = 'https://ojamkplflqafedmxbdxb.supabase.co';
import { validateMyopsAuthority } from './provisioning.ts';

// Deployment protection and application authorization remain separate layers.
export async function sendMyopsRequest(origin: string, path: string, init: RequestInit,
  config: { projectUrl: string; shareToken?: string; automationSecret?: string }, send: typeof fetch = fetch): Promise<Response> {
  if (!['/api/app/redeem', '/api/app/entitlement'].includes(path)) throw new Error('Unsupported MYOPS path');
  const headers = new Headers(init.headers);
  const shareToken = config.shareToken?.trim();
  const automationSecret = config.automationSecret?.trim();
  if (automationSecret) {
    if (config.projectUrl !== STAGING_PROJECT || ![STEP1_ORIGIN, 'https://southerndotcom-website-git-staging-p-9ff219-mohd-syaiful-nizam1.vercel.app'].includes(origin)) throw new Error('Staging transport is restricted');
    headers.set('x-vercel-protection-bypass', automationSecret);
  } else if (shareToken) {
    if (config.projectUrl !== STAGING_PROJECT) throw new Error('Staging transport is restricted');
    try {
      validateMyopsAuthority(config.projectUrl, origin);
    } catch {
      throw new Error('Staging transport is restricted');
    }
    const cookies = new Map<string, string>();
    const bootstrap = new URL('/', origin);
    bootstrap.searchParams.set('_vercel_share', shareToken);
    let url = bootstrap;
    let complete = false;
    for (let step = 0; step < 4; step++) {
      const cookie = [...cookies.values()].join('; ');
      const response = await send(url, { method: 'GET', redirect: 'manual', cache: 'no-store', signal: init.signal,
        headers: cookie ? { Cookie: cookie } : {} });
      // Some Edge runtimes expose Set-Cookie only through get().
      const combined = response.headers.get('set-cookie');
      const setCookies = typeof response.headers.getSetCookie === 'function'
        ? response.headers.getSetCookie()
        : (combined ? combined.split(/,(?=\s*[^;,=]+=)/) : []);
      for (const setCookie of setCookies) {
        const pair = setCookie.split(';', 1)[0];
        cookies.set(pair.split('=', 1)[0], pair);
      }
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        if (!location) throw new Error('Invalid staging redirect');
        url = new URL(location, url);
        if (url.origin !== origin) {
          console.warn('opsps_staging_redirect_rejected', {
            requestOrigin: origin, status: response.status, destinationOrigin: url.origin,
          });
          await response.body?.cancel();
          throw new Error('Staging redirect rejected');
        }
        // Vercel already issued the protection cookie. Avoid an unnecessary
        // homepage fetch before the signed API request.
        if (cookies.size > 0) {
          await response.body?.cancel();
          complete = true;
          break;
        }
      } else {
        if (!response.ok) throw new Error('Staging access unavailable');
        complete = true;
        break;
      }
    }
    if (!complete || cookies.size === 0) throw new Error('Staging access unavailable');
    headers.set('Cookie', [...cookies.values()].join('; '));
  }
  try {
    return await send(new URL(path, origin), { ...init, headers, redirect: 'error' });
  } catch {
    throw new Error('MYOPS signed transport failed');
  }
}

```

## provisioning.ts

```ts
// Only verified central redeem responses may call this server-side adapter.
const STAGING_PROJECT = 'https://ojamkplflqafedmxbdxb.supabase.co';
const STEP1_STAGING_MYOPS = 'https://southerndotcom-website-git-fix-centr-db9115-mohd-syaiful-nizam1.vercel.app';
const PRODUCTION_PROJECT = 'https://wrsigjhhbkbomtkaqlpw.supabase.co';
const STAGING_MYOPS = 'https://southerndotcom-website-git-feat-myop-ca0019-mohd-syaiful-nizam1.vercel.app';
export function centralCompanyLabels(value:unknown):{name:string;company:string} {
  const profile=value as Record<string,unknown>|null;
  const name=typeof profile?.display_name==='string'?profile.display_name.trim():'';
  const company=typeof profile?.company_name==='string'?profile.company_name.trim():'';
  if(!name||name.length>100||!company||company.length>200)throw new Error('Complete your company profile in MYOPS.');
  return {name,company};
}

export function validateMyopsAuthority(projectUrl: string, origin: string): void {
  if (!((projectUrl === STAGING_PROJECT && [STAGING_MYOPS, STEP1_STAGING_MYOPS, 'https://southerndotcom-website-git-staging-p-9ff219-mohd-syaiful-nizam1.vercel.app'].includes(origin))
    || (projectUrl === PRODUCTION_PROJECT && origin === 'https://www.myops.com.my'))) {
    throw new Error('OpsPS identity provisioning is unavailable');
  }
}

type IdentityUser = { id: string; email?: string; email_confirmed_at?: string; app_metadata: Record<string, unknown> };
type NewIdentity = { id: string; email: string; email_confirm: true; app_metadata: Record<string, string> };
export type IdentityStore = {
  getUser(id: string): Promise<IdentityUser | null>;
  createUser(input: NewIdentity): Promise<IdentityUser | null>;
  provision(userRef: string, userId: string): Promise<string>;
};

export async function ensureVerifiedMyopsIdentity(userRef: string, projectUrl: string, store: IdentityStore, origin: string): Promise<string> {
  validateMyopsAuthority(projectUrl, origin);
  if ( !/^[A-Za-z0-9_-]{43}$/.test(userRef)) {
    throw new Error('OpsPS identity provisioning is unavailable');
  }
  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`opsps-myops:${projectUrl}:${userRef}`)));
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  const id = `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20,32)}`;
  const email = `myops-${hex.slice(0,32)}@opsps.invalid`;
  let user = await store.getUser(id);
  if (!user) {
    // A retry/concurrent launch reuses the same internal Auth identity; no email is sent.
    try {
      user = await store.createUser({ id, email, email_confirm: true,
        app_metadata: { identity_provider: 'myops', myops_user_ref: userRef } });
    } catch {
      user = await store.getUser(id);
    }
  }
  if (!user || user.id !== id || user.email !== email || !user.email_confirmed_at
    || user.app_metadata.identity_provider !== 'myops' || user.app_metadata.myops_user_ref !== userRef) {
    throw new Error('OpsPS identity conflict');
  }
  const linkedId = await store.provision(userRef, id);
  if (linkedId !== id) throw new Error('OpsPS identity conflict');
  return id;
}

// Retain the existing staging adapter for callers pinned to that environment.
export function ensureVerifiedStagingIdentity(userRef: string, projectUrl: string, store: IdentityStore): Promise<string> {
  return ensureVerifiedMyopsIdentity(userRef, projectUrl, store, STAGING_MYOPS);
}

```

## origins.ts

```ts
// Exact reviewed preview origins only; never accept arbitrary Vercel hosts.
export const OPSPS_GALLERY_STAGING_ORIGIN = 'https://opsp-mobile-r1-git-feat-web-gallerie-273940-mohd-syaiful-nizam1.vercel.app';
export function allowedOpspsOrigins(projectUrl: string, configured = ''): string[] {
  const origins = configured.split(',').map(value => value.trim()).filter(Boolean);
  if (projectUrl === 'https://ojamkplflqafedmxbdxb.supabase.co') {
    origins.push(OPSPS_GALLERY_STAGING_ORIGIN);
    origins.push('https://opsp-mobile-r1-git-staging-productio-bc9e86-mohd-syaiful-nizam1.vercel.app');
    origins.push('https://opsp-mobile-r1-plzs0e8yj-mohd-syaiful-nizam1.vercel.app');
  }
  return [...new Set(origins)];
}

```

## trial-policy.ts

```ts
const isUuid=(value:unknown):value is string=>typeof value==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

export type OpspsAccess = {mode:'paid'} | {mode:'trial';trialId:string;expiresAt:string;policyVersion:1};
export type OpspsPremiumFeature='advanced_reporting'|'export'|'multi_user';
export function assertOpspsPremiumFeature(access:OpspsAccess,feature:string):void {
 if(!['advanced_reporting','export','multi_user'].includes(feature))throw new Error('Unknown OpsPS feature');
 if(access.mode!=='paid')throw new Error('Upgrade in MYOPS to use this feature.');
}

/** Input must come from the authenticated server-to-server MYOPS transport. */
export function opspsAccessFromEntitlement(value:unknown,trialReady=false,now=Date.now()):OpspsAccess {
 if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('MYOPS access is not active');
 const data=value as Record<string,unknown>;
 if(data.entitled!==true||data.session_active!==true)throw new Error('MYOPS access is not active');
 if((data.access_mode===undefined||data.access_mode==='paid')&&data.trial==null)return {mode:'paid'};
 if(data.access_mode!=='trial'||!trialReady)throw new Error('OpsPS trial is not available yet. Manage access in MYOPS.');
 const trial=data.trial as Record<string,unknown>|null;
 if(!trial||!isUuid(trial.id)||trial.policy_version!==1||typeof trial.expires_at!=='string'
  ||!Number.isFinite(Date.parse(trial.expires_at))||Date.parse(trial.expires_at)<=now)throw new Error('MYOPS trial expired or unavailable');
 return {mode:'trial',trialId:trial.id,expiresAt:trial.expires_at,policyVersion:1};
}

export function opspsTrialReady(projectUrl:string,enabled:string|undefined):boolean {
 return projectUrl==='https://ojamkplflqafedmxbdxb.supabase.co'&&enabled==='true';
}

export function opspsSessionAccessFields(access:OpspsAccess,ready:boolean) {
 if(!ready)return {};
 return access.mode==='trial'
  ?{access_mode:'trial',trial_id:access.trialId,trial_expires_at:access.expiresAt,trial_policy_version:1}
  :{access_mode:'paid',trial_id:null,trial_expires_at:null,trial_policy_version:null};
}

```

## contract.ts

```ts
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TICKET = /^[A-Za-z0-9_-]{43}$/;

// MYOPS product slugs use `opsp` for OpsPS; `opsps` is only the repository name.
export const OPSPS_MYOPS_PRODUCT = 'opsp';

export function isMyopsTicket(value: unknown): value is string {
  return typeof value === 'string' && TICKET.test(value);
}

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID.test(value);
}

export function canonicalJson(value: unknown): string {
  if (value === undefined || typeof value === 'function' || typeof value === 'symbol'
    || (typeof value === 'number' && !Number.isFinite(value))) {
    throw new Error('Value cannot be signed');
  }
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`).join(',')}}`;
}

export async function canonicalMyopsRequest(
  path: string,
  appId: string,
  version: string,
  timestamp: string,
  nonce: string,
  body: Record<string, unknown>,
): Promise<string> {
  const bodyBytes = new TextEncoder().encode(canonicalJson(body));
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bodyBytes));
  const hash = Array.from(digest, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return ['POST', path, appId, version, timestamp, nonce, hash].join('\n');
}

export function readSessionIdFromJwt(token: string): string | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    return isUuid(payload?.session_id) ? payload.session_id : null;
  } catch {
    return null;
  }
}

// WebCrypto sign() returns ArrayBuffer; nonces are Uint8Array.
export function base64UrlEncode(value: Uint8Array | ArrayBuffer): string {
  const bytes = value instanceof Uint8Array ? value : new Uint8Array(value);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

// A central denial is a valid response, not a transport outage. Callers still
// require an authorized ticket or entitled=true AND session_active=true.
export async function readMyopsJson(response: Response): Promise<Record<string, unknown>> {
  const body: unknown = await response.json().catch(() => null);
  if (!body || typeof body !== 'object' || Array.isArray(body)
    || (!response.ok && ![401, 403].includes(response.status))) {
    throw new Error('MYOPS access check failed');
  }
  return body as Record<string, unknown>;
}

```
