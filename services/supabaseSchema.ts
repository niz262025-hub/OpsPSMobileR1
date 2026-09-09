export const OPSPS_REQUIRED_TABLES = [
  'businesses',
  'profiles',
  'business_memberships',
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

type SupabasePublicEnv = {
  EXPO_PUBLIC_SUPABASE_URL?: string;
  EXPO_PUBLIC_SUPABASE_ANON_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
};

type SupabasePublicConfigSource =
  | (Record<string, string | undefined> & Partial<SupabasePublicEnv>)
  | { extra?: Record<string, string | undefined> };

function readExpoPublicExtra(): Record<string, string | undefined> {
  try {
    const constantsModule = require('expo-constants');
    const constantsWithConfig = constantsModule as {
      expoConfig?: { extra?: Record<string, string | undefined> };
      manifest?: { extra?: Record<string, string | undefined> };
      manifest2?: { extra?: Record<string, string | undefined> };
    };

    return constantsWithConfig.expoConfig?.extra ??
      constantsWithConfig.manifest?.extra ??
      constantsWithConfig.manifest2?.extra ??
      {};
  } catch {
    return {};
  }
}

function normalizeSupabaseConfigSource(source: SupabasePublicConfigSource): Record<string, string | undefined> {
  if (typeof source !== 'object' || source === null) {
    return {};
  }

  if ('extra' in source && source.extra && typeof source.extra === 'object') {
    return source.extra;
  }

  return source as Record<string, string | undefined>;
}

export function getSupabasePublicConfig(
  source: SupabasePublicConfigSource = {}
): SupabasePublicEnv {
  const envSource = normalizeSupabaseConfigSource(source);
  const processEnv = typeof process !== 'undefined' && process.env ? process.env as Record<string, string | undefined> : {};
  const expoExtra = readExpoPublicExtra();
  const merged: Record<string, string | undefined> = {
    ...processEnv,
    ...expoExtra,
    ...envSource,
  };

  return {
    EXPO_PUBLIC_SUPABASE_URL: merged.EXPO_PUBLIC_SUPABASE_URL ?? '',
    EXPO_PUBLIC_SUPABASE_ANON_KEY: merged.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
    SUPABASE_SERVICE_ROLE_KEY: merged.SUPABASE_SERVICE_ROLE_KEY ?? '',
  };
}

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
  source: SupabasePublicConfigSource = getSupabasePublicConfig()
): SupabaseEnvState {
  const sourceConfig = normalizeSupabaseConfigSource(source);
  const resolvedConfig = getSupabasePublicConfig(source);
  const processEnv = typeof process !== 'undefined' && process.env ? process.env as Partial<SupabasePublicEnv> : {};

  const url = (
    resolvedConfig.EXPO_PUBLIC_SUPABASE_URL ??
    sourceConfig.EXPO_PUBLIC_SUPABASE_URL ??
    processEnv.EXPO_PUBLIC_SUPABASE_URL ??
    ''
  ).trim();

  const anonKey = (
    resolvedConfig.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
    sourceConfig.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
    processEnv.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
    ''
  ).trim();

  const missing = OPSPS_REQUIRED_ENV_VARS.filter((name) => {
    const value = resolvedConfig[name] ?? sourceConfig[name] ?? processEnv[name] ?? '';
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
    hasServerOnlyServiceRoleKey: Boolean((resolvedConfig.SUPABASE_SERVICE_ROLE_KEY ?? sourceConfig.SUPABASE_SERVICE_ROLE_KEY ?? processEnv.SUPABASE_SERVICE_ROLE_KEY ?? '').trim()),
    missing,
    invalid,
    mode: configured ? 'configured' : 'mock',
  };
}
