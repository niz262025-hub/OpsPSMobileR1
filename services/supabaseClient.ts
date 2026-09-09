import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import {
  buildSupabaseEnvState,
  getSupabasePublicConfig,
  type SupabasePublicConfigSource,
} from './supabaseSchema';

let client: SupabaseClient | null = null;
let clientKey = '';

export function getSupabaseClient(): SupabaseClient | null {
  const env = buildSupabaseEnvState(getSupabasePublicConfig());

  if (!env.configured) {
    client = null;
    clientKey = '';
    return null;
  }

  const configKey = `${env.url}:${env.anonKey}`;

  if (!client || clientKey !== configKey) {
    client = createClient(env.url, env.anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
    clientKey = configKey;
  }

  return client;
}

export function getSupabaseStatus() {
  return buildSupabaseEnvState(getSupabasePublicConfig());
}

export type SupabaseConnectionDiagnostics = {
  configured: boolean;
  auth: 'not_checked' | 'verified' | 'failed';
  databaseRead: 'not_checked' | 'verified' | 'failed';
  error?: string;
};

export async function diagnoseSupabaseConnection(
  configuredClient: SupabaseClient | null = getSupabaseClient(),
  source: SupabasePublicConfigSource = getSupabasePublicConfig()
): Promise<SupabaseConnectionDiagnostics> {
  const status = buildSupabaseEnvState(source);
  if (!status.configured || !configuredClient) {
    return {
      configured: false,
      auth: 'not_checked',
      databaseRead: 'not_checked',
      error: status.missing.length > 0
        ? `Missing Supabase environment variables: ${status.missing.join(', ')}`
        : `Invalid Supabase environment variables: ${status.invalid.join(', ')}`,
    };
  }

  try {
    const { error: authError } = await configuredClient.auth.getSession();
    if (authError) {
      return { configured: true, auth: 'failed', databaseRead: 'not_checked', error: authError.message };
    }

    const { error: databaseError } = await configuredClient
      .from('businesses')
      .select('id')
      .limit(1);

    if (databaseError) {
      return { configured: true, auth: 'verified', databaseRead: 'failed', error: databaseError.message };
    }

    return { configured: true, auth: 'verified', databaseRead: 'verified' };
  } catch (error) {
    return {
      configured: true,
      auth: 'failed',
      databaseRead: 'failed',
      error: error instanceof Error ? error.message : 'Unknown Supabase diagnostic error',
    };
  }
}
