import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import process from 'node:process';

// This is a one-time upgrade for the verified existing OpsPS production baseline.
// It is never a fresh install and must not run until production SSO is configured.
export function productionUpgrade() {
  const directory = fileURLToPath(new URL('../supabase/migrations/', import.meta.url));
  const files = readdirSync(directory).filter(name => /^\d+.*\.sql$/.test(name)).sort();
  const baseline = ['001','002','003','009','011'];
  const tables = ['admin_users','business_memberships','businesses','finance_transactions','inventory_movements','order_items','orders','payments','product_variants','products','profiles','shipments','subscriptions','trips'];
  const quote = value => "'" + value.replaceAll("'", "''") + "'";
  const pending = files.filter(name => !baseline.includes(name.split('_')[0]));
  const migrations = pending.map(name => {
    const version = name.split('_')[0];
    let sql = readFileSync(`${directory}/${name}`, 'utf8');
    if (name === '016_opsps_direct_qr_payment.sql') sql = sql.replaceAll('o.customer_id = auth.uid()',
      'EXISTS (SELECT 1 FROM public.profiles customer_profile WHERE customer_profile.id = o.customer_profile_id AND customer_profile.auth_user_id = auth.uid())');
    sql = sql.replace(/CREATE (POLICY|TRIGGER) IF NOT EXISTS\b[\s\S]*?;/g, statement =>
      `DO $opsps_upgrade$ BEGIN\n${statement.replace(' IF NOT EXISTS', '')}\nEXCEPTION WHEN duplicate_object THEN NULL; END $opsps_upgrade$;`);
    return `-- Source: ${name}\n${sql}\nINSERT INTO supabase_migrations.schema_migrations(version,name,statements) VALUES (${quote(version)},${quote(name.slice(version.length+1,-4))},ARRAY[${quote(sql)}]);`;
  });
  return `BEGIN;
SELECT pg_advisory_xact_lock(hashtextextended('opsps-production-upgrade',0));
DO $opsps_verified_baseline$ BEGIN
  IF (SELECT array_agg(version::text ORDER BY version) FROM supabase_migrations.schema_migrations) IS DISTINCT FROM ARRAY[${baseline.map(quote)}]::text[]
    OR (SELECT count(*) FROM pg_tables WHERE schemaname='public') <> 14
    OR EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND (tablename NOT IN (${tables.map(quote)}) OR NOT rowsecurity)) THEN
    RAISE EXCEPTION 'OpsPS upgrade requires the verified 001/002/003/009/011 production baseline';
  END IF;
END $opsps_verified_baseline$;
${migrations.join('\n')}
${readFileSync(new URL('../supabase/provisioning/function-hardening.sql', import.meta.url),'utf8')}
COMMIT;\n`;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) process.stdout.write(productionUpgrade());
