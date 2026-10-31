import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { URL } from 'node:url';
import process from 'node:process';

// A fresh-install baseline only. Historical migration files remain byte-for-byte
// unchanged; never run this baseline against an existing OpsPS installation.
export function freshSchema({ sharedOpsflowStaging = false } = {}) {
  const directory = fileURLToPath(new URL('../supabase/migrations/', import.meta.url));
  const files = readdirSync(directory).filter(name => /^\d+.*\.sql$/.test(name)).sort();
  const tableNamesThrough = name => [...new Set(files.slice(0, files.indexOf(name) + 1).flatMap(file => [...readFileSync(`${directory}/${file}`, 'utf8').matchAll(/CREATE TABLE IF NOT EXISTS (?:public\.)?([a-z_]+)/gi)].map(match => match[1])))];
  const existingTables = ['opsflow_app_sessions','opsflow_companies','opsflow_documents','opsflow_memberships','opsflow_onboarding_sessions','opsflow_profiles'];
  const existingFunctions = ['opsflow_close_session','opsflow_document_gateway','opsflow_onboarding','opsflow_open_session','opsflow_resolve_value','opsflow_session_context','opsflow_touch_session'];
  const literals = names => names.map(name => `'${name}'`).join(',');
  const guard = sharedOpsflowStaging
    ? `IF (SELECT count(*) FROM pg_tables WHERE schemaname='public') <> 6
       OR EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND (tablename NOT IN (${literals(existingTables)}) OR NOT rowsecurity))
       OR EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname NOT IN (${literals(existingFunctions)})) THEN
         RAISE EXCEPTION 'Shared OpsPS provisioning requires the verified OpsFlow-only staging schema'; END IF;`
    : `IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public') THEN
         RAISE EXCEPTION 'Fresh OpsPS provisioning requires an empty public schema'; END IF;`;
  const migrations = files.map(name => {
    let sql = readFileSync(`${directory}/${name}`, 'utf8');
    if (name === '016_opsps_direct_qr_payment.sql') {
      // The core orders schema links customers through profiles, never through
      // a customer_id column. Keep the same authenticated ownership check.
      sql = sql.replaceAll('o.customer_id = auth.uid()',
        'EXISTS (SELECT 1 FROM public.profiles customer_profile WHERE customer_profile.id = o.customer_profile_id AND customer_profile.auth_user_id = auth.uid())');
    }
    if (sharedOpsflowStaging) {
      // Preserve other apps' existing grants and future-table defaults.
      sql = sql.replaceAll('ON ALL TABLES IN SCHEMA public', 'ON TABLE ' + tableNamesThrough(name).map(table => 'public.' + table).join(', '));
      sql = sql.replace(/^ALTER DEFAULT PRIVILEGES[^;]+;$/gm, '-- Shared staging: existing default privileges preserved.');
    }
    // PostgreSQL has no CREATE POLICY/TRIGGER IF NOT EXISTS. Preserve the
    // historical intent using a narrowly scoped duplicate-object handler.
    sql = sql.replace(/CREATE (POLICY|TRIGGER) IF NOT EXISTS\b[\s\S]*?;/g, statement => {
      const supported = statement.replace(' IF NOT EXISTS', '');
      return `DO $opsps_baseline$ BEGIN\n${supported}\nEXCEPTION WHEN duplicate_object THEN NULL;\nEND $opsps_baseline$;`;
    });
    return `-- Source: ${name}\n${sql}`;
  });
  return `BEGIN;
DO $opsps_empty$ BEGIN
  ${guard}
END $opsps_empty$;
${migrations.join('\n')}
COMMIT;\n`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) process.stdout.write(freshSchema({ sharedOpsflowStaging: process.argv.includes('--shared-opsflow-staging') }));
