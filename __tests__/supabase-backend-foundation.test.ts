import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  OPSPS_REQUIRED_ENV_VARS,
  OPSPS_REQUIRED_TABLES,
  buildSupabaseEnvState,
} from '../services/supabaseSchema';

describe('backend foundation contracts', () => {
  beforeEach(() => {
    delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
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

  it('switches to configured when the required Supabase variables are supplied', () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
    process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';

    const status = buildSupabaseEnvState(process.env);

    expect(status.configured).toBe(true);
    expect(status.mode).toBe('configured');
    expect(status.missing).toEqual([]);
  });
});
