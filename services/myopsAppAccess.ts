import type { Session, SupabaseClient } from '@supabase/supabase-js';

const TICKET = /^[A-Za-z0-9_-]{43}$/;

export function extractMyopsLaunchTicket(url: string): string | null {
  try {
    const parsed = new URL(url);
    const searchParams = new URLSearchParams(parsed.search);
    const hash = parsed.hash.replace(/^#/, '').replace(/^\//, '');
    const hashQueryIndex = hash.indexOf('?');
    const hashParams = new URLSearchParams(hashQueryIndex >= 0 ? hash.slice(hashQueryIndex + 1) : hash);
    const ticket = searchParams.get('t') ?? hashParams.get('t');
    return ticket && TICKET.test(ticket) ? ticket : null;
  } catch {
    return null;
  }
}

export function clearMyopsLaunchTicketFromUrl(): void {
  if (typeof window === 'undefined' || (!window.location.hash.includes('t=') && !window.location.search.includes('t='))) return;
  const cleanUrl = new URL(window.location.href);
  cleanUrl.searchParams.delete('t');
  cleanUrl.hash = '';
  window.history.replaceState(null, '', `${cleanUrl.pathname}${cleanUrl.search}`);
}

export async function redeemMyopsLaunchTicket(
  client: SupabaseClient,
  ticket: string,
): Promise<Session | null> {
  if (!TICKET.test(ticket)) return null;
  const { data, error } = await client.functions.invoke('myops-app-access', {
    body: { action: 'redeem', ticket },
  });
  if (error || !data || typeof data.access_token !== 'string' || typeof data.refresh_token !== 'string') {
    return null;
  }
  const result = await client.auth.setSession({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
  });
  if (result.error || !result.data.session) return null;
  return result.data.session;
}

export async function refreshMyopsEntitlement(
  client: SupabaseClient,
  sensitive = false,
  activity = false,
): Promise<boolean> {
  const { data, error } = await client.functions.invoke('myops-app-access', {
    body: { action: 'refresh', sensitive, activity },
  });
  return !error && data?.entitled === true;
}

export async function endMyopsAppSession(client: SupabaseClient): Promise<void> {
  await client.functions.invoke('myops-app-access', { body: { action: 'logout' } });
}
