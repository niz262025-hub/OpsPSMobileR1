export const OPSPS_REQUIRED_TABLES = [
  'businesses',
  'profiles',
  'trips',
  'products',
  'product_variants',
  'orders',
  'order_items',
  'payments',
  'shipments',
  'inventory_movements',
  'finance_transactions',
  'subscriptions',
  'admin_users',
] as const;

export const OPSPS_REQUIRED_ENV_VARS = [
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
] as const;

export const OPSPS_SERVER_ONLY_ENV_VARS = [
  'SUPABASE_SERVICE_ROLE_KEY',
] as const;

export type SupabaseEnvState = {
  configured: boolean;
  url: string;
  anonKey: string;
  hasServerOnlyServiceRoleKey: boolean;
  missing: string[];
  invalid: string[];
  mode: 'mock' | 'configured';
};

function isSupabaseUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname.endsWith('.supabase.co');
  } catch {
    return false;
  }
}

export function buildSupabaseEnvState(
  source: Record<string, string | undefined> = typeof process !== 'undefined' && process.env ? process.env : {}
): SupabaseEnvState {
  const url = (source.EXPO_PUBLIC_SUPABASE_URL ?? '').trim();
  const anonKey = (source.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '').trim();
  const missing = OPSPS_REQUIRED_ENV_VARS.filter((name) => {
    const value = source[name] ?? '';
    return !value.trim();
  });
  const invalid: string[] = [];

  if (url && !isSupabaseUrl(url)) {
    invalid.push('EXPO_PUBLIC_SUPABASE_URL');
  }

  if (anonKey && anonKey.length < 20) {
    invalid.push('EXPO_PUBLIC_SUPABASE_ANON_KEY');
  }

  const configured = missing.length === 0 && invalid.length === 0;

  return {
    configured,
    url,
    anonKey,
    hasServerOnlyServiceRoleKey: Boolean((source.SUPABASE_SERVICE_ROLE_KEY ?? '').trim()),
    missing,
    invalid,
    mode: configured ? 'configured' : 'mock',
  };
}
