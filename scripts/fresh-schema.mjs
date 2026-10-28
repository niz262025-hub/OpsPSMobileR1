import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { URL } from 'node:url';
import process from 'node:process';

// A fresh-install baseline only. Historical migration files remain byte-for-byte
// unchanged; never run this baseline against an existing OpsPS installation.
export function freshSchema() {
  const directory = fileURLToPath(new URL('../supabase/migrations/', import.meta.url));
  const files = readdirSync(directory).filter(name => /^\d+.*\.sql$/.test(name)).sort();
  const migrations = files.map(name => {
    let sql = readFileSync(`${directory}/${name}`, 'utf8');
    if (name === '016_opsps_direct_qr_payment.sql') {
      // The core orders schema links customers through profiles, never through
      // a customer_id column. Keep the same authenticated ownership check.
      sql = sql.replaceAll('o.customer_id = auth.uid()',
        'EXISTS (SELECT 1 FROM public.profiles customer_profile WHERE customer_profile.id = o.customer_profile_id AND customer_profile.auth_user_id = auth.uid())');
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
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public') THEN
    RAISE EXCEPTION 'Fresh OpsPS provisioning requires an empty public schema';
  END IF;
END $opsps_empty$;
${migrations.join('\n')}
COMMIT;\n`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) process.stdout.write(freshSchema());
