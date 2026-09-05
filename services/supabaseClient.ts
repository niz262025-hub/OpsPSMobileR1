import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { buildSupabaseEnvState } from './supabaseSchema';

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const env = buildSupabaseEnvState(
    typeof process !== 'undefined' && process.env ? process.env : {}
  );

  if (!env.configured) {
    return null;
  }

  if (!client) {
    client = createClient(env.url, env.anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }

  return client;
}

export function getSupabaseStatus() {
  return buildSupabaseEnvState(
    typeof process !== 'undefined' && process.env ? process.env : {}
  );
}
