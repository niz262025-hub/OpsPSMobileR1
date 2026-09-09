import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  classifySupabaseSignupError,
  type SupabaseSignupErrorCategory,
} from '../context/AuthContext';
import {
  OPSPS_REQUIRED_ENV_VARS,
  OPSPS_REQUIRED_TABLES,
  buildSupabaseEnvState,
  getSupabasePublicConfig,
} from '../services/supabaseSchema';
import {
  createSupabaseClientFromConfig,
  diagnoseSupabaseConnection,
} from '../services/supabaseClient';
import { getDataSource } from '../services/repository';
import { vi } from 'vitest';

describe('backend foundation contracts', () => {
  beforeEach(() => {
    delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  it('marks Supabase as mock-unconfigured when required environment variables are absent', () => {
    const status = buildSupabaseEnvState(process.env);

    expect(status.configured).toBe(false);
    expect(status.mode).toBe('mock');
    expect(status.missing).toEqual(
      expect.arrayContaining([...OPSPS_REQUIRED_ENV_VARS])
    );
  });

  it('reports the required OpsPS backend table set', () => {
    expect(OPSPS_REQUIRED_TABLES).toEqual(
      expect.arrayContaining([
        'businesses',
        'profiles',
        'trips',
        'products',
        'orders',
        'payments',
        'shipments',
        'subscriptions',
      ])
    );
  });

  it('includes the required tables across the Supabase migration set', () => {
    const migrationsDir = join(process.cwd(), 'supabase', 'migrations');
    expect(existsSync(migrationsDir)).toBe(true);

    const migrationFiles = ['001_opsps_core_schema.sql', '002_opsps_auth_membership_rls.sql'];
    const combinedSql = migrationFiles
      .map((fileName) => join(migrationsDir, fileName))
      .filter((filePath) => existsSync(filePath))
      .map((filePath) => readFileSync(filePath, 'utf8'))
      .join('\n');

    for (const table of OPSPS_REQUIRED_TABLES) {
      expect(
        combinedSql.includes(`CREATE TABLE IF NOT EXISTS ${table}`) ||
          combinedSql.includes(`CREATE TABLE IF NOT EXISTS public.${table}`)
      ).toBe(true);
    }
  });

  it('adds tenant RLS and auth membership integrity for business-scoped tables', () => {
    const migrationsDir = join(process.cwd(), 'supabase', 'migrations');
    const migrationFiles = ['001_opsps_core_schema.sql', '002_opsps_auth_membership_rls.sql'];
    const combinedSql = migrationFiles
      .map((fileName) => join(migrationsDir, fileName))
      .filter((filePath) => existsSync(filePath))
      .map((filePath) => readFileSync(filePath, 'utf8'))
      .join('\n');

    expect(combinedSql.includes('business_memberships')).toBe(true);
    expect(combinedSql.includes('ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY')).toBe(true);
    expect(combinedSql.includes('auth.uid()')).toBe(true);
    expect(combinedSql.includes('CREATE POLICY')).toBe(true);
    expect(combinedSql.includes('WITH CHECK (')).toBe(true);
  });

  it('includes the seller verification state in the business identity model', () => {
    const migrationsDir = join(process.cwd(), 'supabase', 'migrations');
    const migrationFiles = ['001_opsps_core_schema.sql', '012_opsps_seller_verification.sql'];
    const combinedSql = migrationFiles
      .map((fileName) => join(migrationsDir, fileName))
      .filter((filePath) => existsSync(filePath))
      .map((filePath) => readFileSync(filePath, 'utf8'))
      .join('\n');

    expect(combinedSql.includes('seller_verification_status')).toBe(true);
    expect(combinedSql.includes("CHECK (seller_verification_status IN ('PENDING', 'APPROVED', 'REJECTED'))")).toBe(true);
  });

  it('switches to configured when the required Supabase variables are supplied', () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'anon-key-with-enough-length';

    const status = buildSupabaseEnvState(process.env);

    expect(status.configured).toBe(true);
    expect(status.mode).toBe('configured');
    expect(status.missing).toEqual([]);
    expect(status.invalid).toEqual([]);
    expect(status.hasServerOnlyServiceRoleKey).toBe(false);
  });

  it('reads public Supabase settings from Expo app config when browser process.env is empty', () => {
    const config = getSupabasePublicConfig({
      extra: {
        EXPO_PUBLIC_SUPABASE_URL: 'https://expo-config.supabase.co',
        EXPO_PUBLIC_SUPABASE_ANON_KEY: 'expo-config-key-with-enough-length',
      },
    });

    expect(config.EXPO_PUBLIC_SUPABASE_URL).toBe('https://expo-config.supabase.co');
    expect(config.EXPO_PUBLIC_SUPABASE_ANON_KEY).toBe('expo-config-key-with-enough-length');

    const status = buildSupabaseEnvState(config);
    expect(status.configured).toBe(true);
    expect(status.mode).toBe('configured');
  });

  it('reads public Supabase settings from the Expo config object passed to the resolver', () => {
    const config = getSupabasePublicConfig({
      extra: {
        EXPO_PUBLIC_SUPABASE_URL: 'https://expo-default-export.supabase.co',
        EXPO_PUBLIC_SUPABASE_ANON_KEY: 'expo-default-export-key-with-enough-length',
      },
    });

    expect(config.EXPO_PUBLIC_SUPABASE_URL).toBe('https://expo-default-export.supabase.co');
    expect(config.EXPO_PUBLIC_SUPABASE_ANON_KEY).toBe('expo-default-export-key-with-enough-length');

    const status = buildSupabaseEnvState(config);
    expect(status.configured).toBe(true);
    expect(status.mode).toBe('configured');
  });

  it('rejects malformed public configuration without making a network call', async () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'http://not-supabase.example';
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'short';

    const status = buildSupabaseEnvState(process.env);
    const diagnostics = await diagnoseSupabaseConnection();

    expect(status.configured).toBe(false);
    expect(status.invalid).toEqual([
      'EXPO_PUBLIC_SUPABASE_URL',
      'EXPO_PUBLIC_SUPABASE_ANON_KEY',
    ]);
    expect(diagnostics.auth).toBe('not_checked');
    expect(diagnostics.databaseRead).toBe('not_checked');
  });

  it('creates a configured Supabase client when the public config is present', () => {
    const config = getSupabasePublicConfig({
      extra: {
        EXPO_PUBLIC_SUPABASE_URL: 'https://configured-client.supabase.co',
        EXPO_PUBLIC_SUPABASE_ANON_KEY: 'configured-client-key-with-enough-length',
      },
    });

    const status = buildSupabaseEnvState(config);
    const client = createSupabaseClientFromConfig(config);

    expect(config.EXPO_PUBLIC_SUPABASE_URL).toBe('https://configured-client.supabase.co');
    expect(status.configured).toBe(true);
    expect(client).not.toBeNull();
  });

  it('sends the public apikey header when signup is attempted with a configured client', async () => {
    const fetchSpy = vi.spyOn(globalThis as typeof globalThis & { fetch: typeof fetch }, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ user: { id: 'user-123' }, session: null }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }) as Response
    );

    const config = getSupabasePublicConfig({
      extra: {
        EXPO_PUBLIC_SUPABASE_URL: 'https://configured-client.supabase.co',
        EXPO_PUBLIC_SUPABASE_ANON_KEY: 'configured-client-key-with-enough-length',
      },
    });

    const client = createSupabaseClientFromConfig(config);
    expect(client).not.toBeNull();

    await client!.auth.signUp({
      email: 'signup@example.com',
      password: 'Password123!',
      options: {
        data: {
          full_name: 'Test Founder',
          role: 'founder',
        },
      },
    });

    const [, init] = fetchSpy.mock.calls.at(-1) as [RequestInfo | URL, RequestInit | undefined];
    const headers = new Headers(init?.headers ?? {});

    expect(headers.get('apikey')).toBe('configured-client-key-with-enough-length');
    fetchSpy.mockRestore();
  });

  it('fails closed when Supabase is missing the public configuration', () => {
    const client = createSupabaseClientFromConfig({
      extra: {
        EXPO_PUBLIC_SUPABASE_URL: '',
        EXPO_PUBLIC_SUPABASE_ANON_KEY: '',
      },
    });

    expect(client).toBeNull();
    expect(buildSupabaseEnvState({ extra: { EXPO_PUBLIC_SUPABASE_URL: '', EXPO_PUBLIC_SUPABASE_ANON_KEY: '' } }).configured).toBe(false);
  });

  it('runs read-only auth and database diagnostics with a configured client', async () => {
    const client = {
      auth: { getSession: async () => ({ data: { session: null }, error: null }) },
      from: () => ({ select: () => ({ limit: async () => ({ data: [], error: null }) }) }),
    } as never;

    const status = buildSupabaseEnvState({
      extra: {
        EXPO_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
        EXPO_PUBLIC_SUPABASE_ANON_KEY: 'anon-key-with-enough-length',
      },
    });

    expect(status.configured).toBe(true);
    await expect(diagnoseSupabaseConnection(client, { extra: {
      EXPO_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      EXPO_PUBLIC_SUPABASE_ANON_KEY: 'anon-key-with-enough-length',
    } })).resolves.toEqual({
      configured: true,
      auth: 'verified',
      databaseRead: 'verified',
    });
  });

  it('classifies duplicate email errors separately from rate limit errors', () => {
    const duplicate = classifySupabaseSignupError({ status: 400, message: 'User already registered' });
    const rateLimit = classifySupabaseSignupError({ status: 429, error_code: 'over_email_send_rate_limit', msg: 'email rate limit exceeded' });

    expect(duplicate.kind).toBe('duplicate');
    expect(duplicate.message).toContain('already exists');
    expect(rateLimit.kind).toBe('rate_limit');
    expect(rateLimit.message).toContain('temporarily unavailable');
  });

  it('uses a generic safe message for other Supabase auth failures', () => {
    const generic = classifySupabaseSignupError({ status: 500, message: 'Unexpected server error' });

    expect(generic.kind).toBe('auth_error');
    expect(generic.message).toContain('try again');
  });

  it('fails closed in production when Supabase is not configured', () => {
    const previousNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    try {
      expect(() => getDataSource('production')).toThrow(/Supabase.*configured/i);
    } finally {
      if (previousNodeEnv === undefined) {
        process.env.NODE_ENV = 'test';
      } else {
        process.env.NODE_ENV = previousNodeEnv;
      }
    }
  });
});
