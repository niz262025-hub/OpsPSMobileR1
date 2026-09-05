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
  'EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY',
] as const;

export type SupabaseEnvState = {
  configured: boolean;
  url: string;
  anonKey: string;
  serviceRoleKey: string;
  missing: string[];
  mode: 'mock' | 'configured';
};

export function buildSupabaseEnvState(
  source: Record<string, string | undefined> = typeof process !== 'undefined' && process.env ? process.env : {}
): SupabaseEnvState {
  const url = (source.EXPO_PUBLIC_SUPABASE_URL ?? '').trim();
  const anonKey = (source.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '').trim();
  const serviceRoleKey = (source.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ?? '').trim();
  const missing = OPSPS_REQUIRED_ENV_VARS.filter((name) => {
    const value = source[name] ?? '';
    return !value.trim();
  });

  return {
    configured: Boolean(url && anonKey),
    url,
    anonKey,
    serviceRoleKey,
    missing,
    mode: url && anonKey ? 'configured' : 'mock',
  };
}
