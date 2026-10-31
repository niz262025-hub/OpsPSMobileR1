import { Linking } from 'react-native';
import type { SupabaseClient } from '@supabase/supabase-js';
import { endMyopsAppSession } from './myopsAppAccess';

const LIVE_PORTAL = 'https://www.myops.com.my/';
const STAGING_PORTAL = 'https://southerndotcom-website-git-feat-myop-ca0019-mohd-syaiful-nizam1.vercel.app/';

export function myopsPortalUrl(): string {
  const configured = process.env.EXPO_PUBLIC_MYOPS_PORTAL_ORIGIN;
  return configured === STAGING_PORTAL || configured === STAGING_PORTAL.slice(0, -1)
    ? STAGING_PORTAL : LIVE_PORTAL;
}

export function returnToMyops(): void {
  const destination = myopsPortalUrl();
  if (typeof window !== 'undefined') window.location.replace(destination);
  else void Linking.openURL(destination);
}

// Always clear local identity and return to the sole login authority, even on network failure.
export async function logoutToMyops(client: SupabaseClient | null, clear: () => void): Promise<void> {
  try {
    if (client) await endMyopsAppSession(client);
  } finally {
    try {
      if (client) await client.auth.signOut();
    } finally {
      clear();
      returnToMyops();
    }
  }
}
