import { createClient } from 'npm:@supabase/supabase-js@2';
import { canonicalMyopsRequest, isMyopsTicket, isUuid, OPSPS_MYOPS_PRODUCT, readSessionIdFromJwt } from './contract.ts';

const PRODUCT = OPSPS_MYOPS_PRODUCT;
const VALID_FOR_MS = 20_000;
const APP_ID = /^[a-z][a-z0-9_-]{1,31}$/;
const USER_REF = /^[A-Za-z0-9_-]{43}$/;

type JsonRecord = Record<string, unknown>;
type MyopsAppSession = {
  session_id: string;
  user_ref: string;
  product: string;
};

function corsHeaders(origin: string | null): HeadersInit {
  const allowed = (Deno.env.get('OPSPS_ALLOWED_ORIGINS') ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
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

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
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
    return await fetch(new URL(path, origin), {
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
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function readMyopsJson(response: Response): Promise<JsonRecord> {
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok || !asObject(body)) throw new Error('MYOPS access check failed');
  return body;
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

  const { admin, auth } = makeClients();
  const linkResult = await admin.from('myops_identity_links')
    .select('opsps_user_id')
    .eq('myops_user_ref', redeemed.user_ref)
    .maybeSingle();
  if (linkResult.error || !linkResult.data?.opsps_user_id) {
    return json(403, { error: 'OpsPS account is not linked to MYOPS' }, headers);
  }

  const userResult = await admin.auth.admin.getUserById(linkResult.data.opsps_user_id);
  const email = userResult.data.user?.email;
  if (userResult.error || !email || !userResult.data.user?.email_confirmed_at) {
    return json(403, { error: 'Linked OpsPS account is unavailable' }, headers);
  }
  const profile = await admin.from('profiles')
    .select('id')
    .eq('auth_user_id', linkResult.data.opsps_user_id)
    .maybeSingle();
  if (profile.error || !profile.data) {
    return json(403, { error: 'Linked OpsPS account is not provisioned' }, headers);
  }

  const link = await admin.auth.admin.generateLink({ type: 'magiclink', email });
  const tokenHash = link.data.properties?.hashed_token;
  if (link.error || !tokenHash) throw new Error('Unable to create OpsPS session');
  const verified = await auth.auth.verifyOtp({ token_hash: tokenHash, type: 'magiclink' });
  const session = verified.data.session;
  if (verified.error || !session || verified.data.user?.id !== linkResult.data.opsps_user_id) {
    throw new Error('Unable to create OpsPS session');
  }

  const supabaseSessionId = readSessionIdFromJwt(session.access_token);
  if (!supabaseSessionId) throw new Error('Invalid OpsPS auth session');
  const validUntil = new Date(Date.now() + VALID_FOR_MS).toISOString();
  const stored = await admin.from('myops_app_sessions').insert({
    myops_user_ref: redeemed.user_ref,
    opsps_user_id: linkResult.data.opsps_user_id,
    myops_session_id: redeemed.session_id,
    supabase_session_id: supabaseSessionId,
    valid_until: validUntil,
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
  if (checked.entitled !== true || checked.session_active !== true) {
    await current.admin.from('myops_app_sessions')
      .update({ revoked_at: new Date().toISOString(), valid_until: new Date().toISOString() })
      .eq('id', current.session.id);
    return json(403, { error: 'MYOPS access is not active' }, headers);
  }
  const validUntil = new Date(Date.now() + VALID_FOR_MS).toISOString();
  const updated = await current.admin.from('myops_app_sessions')
    .update({ valid_until: validUntil, updated_at: new Date().toISOString() })
    .eq('id', current.session.id)
    .is('revoked_at', null);
  if (updated.error) return json(503, { error: 'MYOPS access could not be stored' }, headers);
  return json(200, { entitled: true, valid_until: validUntil }, headers);
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

Deno.serve(async (request) => {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);
  const allowed = (Deno.env.get('OPSPS_ALLOWED_ORIGINS') ?? '')
    .split(',').map((value) => value.trim()).filter(Boolean);
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
    if (body.action === 'logout' && Object.keys(body).length === 1) {
      return await endSession(request, headers);
    }
    return json(400, { error: 'Invalid request' }, headers);
  } catch {
    return json(503, { error: 'MYOPS access is unavailable' }, headers);
  }
});
