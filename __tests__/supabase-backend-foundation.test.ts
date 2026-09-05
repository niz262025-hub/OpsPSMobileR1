import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  OPSPS_REQUIRED_ENV_VARS,
  OPSPS_REQUIRED_TABLES,
  buildSupabaseEnvState,
} from '../services/supabaseSchema';
import { diagnoseSupabaseConnection, getSupabasePublicClientConfig } from '../services/supabaseClient';

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

  it('includes the core schema migration file with the required tables', () => {
    const schemaPath = join(process.cwd(), 'supabase', 'migrations', '001_opsps_core_schema.sql');
    expect(existsSync(schemaPath)).toBe(true);

    const schemaSql = readFileSync(schemaPath, 'utf8');
    for (const table of OPSPS_REQUIRED_TABLES) {
      expect(schemaSql).toContain(`CREATE TABLE IF NOT EXISTS ${table}`);
    }
  });

  it('keeps the public Supabase config free of service-role secrets', () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'anon-key-with-enough-length';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'super-secret-service-role';

    const publicConfig = getSupabasePublicClientConfig();

    expect(publicConfig).toEqual({
      configured: true,
      url: 'https://example.supabase.co',
      anonKey: 'anon-key-with-enough-length',
      mode: 'configured',
    });
    expect(Object.keys(publicConfig)).not.toContain('serviceRoleKey');
  });

  it('prepares membership and RLS safeguards in the migration layer', () => {
    const migrationPath = join(process.cwd(), 'supabase', 'migrations', '002_opsps_auth_membership_rls.sql');
    expect(existsSync(migrationPath)).toBe(true);

    const migrationSql = readFileSync(migrationPath, 'utf8');
    expect(migrationSql).toContain('business_memberships');
    expect(migrationSql).toContain('auth_user_id');
    expect(migrationSql).toContain('ENABLE ROW LEVEL SECURITY');
    expect(migrationSql).toContain('CREATE POLICY');
    expect(migrationSql).toContain('bm.role IN (\'founder\', \'admin\')');
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

  it('runs read-only auth and database diagnostics with a configured client', async () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'anon-key-with-enough-length';

    const client = {
      auth: { getSession: async () => ({ data: { session: null }, error: null }) },
      from: () => ({ select: () => ({ limit: async () => ({ data: [], error: null }) }) }),
    } as never;

    await expect(diagnoseSupabaseConnection(client)).resolves.toEqual({
      configured: true,
      auth: 'verified',
      databaseRead: 'verified',
    });
  });
});
