const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TICKET = /^[A-Za-z0-9_-]{43}$/;

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
