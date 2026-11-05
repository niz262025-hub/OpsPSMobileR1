import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import { freshSchema } from './fresh-schema.mjs';
import { productionUpgrade } from './production-upgrade.mjs';
import { log, error as logError } from 'node:console';
import process from 'node:process';
import { readFileSync } from 'node:fs';
import { URL } from 'node:url';
const db = new PGlite();
try {
  await db.exec(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role BYPASSRLS;
    CREATE SCHEMA auth;CREATE TABLE auth.users(id uuid PRIMARY KEY);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$ SELECT coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
    CREATE SCHEMA storage;CREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    CREATE TABLE storage.objects(id uuid DEFAULT gen_random_uuid(),bucket_id text,name text,owner uuid);ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
    CREATE FUNCTION storage.foldername(text) RETURNS text[] LANGUAGE sql IMMUTABLE AS $$ SELECT string_to_array($1,'/') $$;
    GRANT USAGE ON SCHEMA public,auth,storage TO anon,authenticated,service_role;
    CREATE SCHEMA supabase_migrations;CREATE TABLE supabase_migrations.schema_migrations(version text PRIMARY KEY,name text,statements text[]);
    INSERT INTO supabase_migrations.schema_migrations(version) VALUES('001'),('002'),('003'),('009'),('011');`);
  await db.exec(freshSchema().split('-- Source: 012_opsps_seller_verification.sql')[0]+'COMMIT;');
  if (process.argv.includes('--existing-seller-verification')) {
    await db.exec(readFileSync(new URL('../supabase/migrations/012_opsps_seller_verification.sql', import.meta.url),'utf8'));
  }
  const user='10000000-0000-4000-8000-000000000001', business='20000000-0000-4000-8000-000000000001', order='40000000-0000-4000-8000-000000000001';
  await db.query('INSERT INTO auth.users(id) VALUES($1)',[user]);
  await db.query("INSERT INTO businesses(id,name) VALUES($1,'Existing company')",[business]);
  await db.query("INSERT INTO profiles(auth_user_id,business_id,full_name,email,role) VALUES($1,$2,'Owner','owner@fixture.invalid','founder')",[user,business]);
  await db.query("INSERT INTO business_memberships(user_id,business_id,role) VALUES($1,$2,'founder')",[user,business]);
  await db.query("INSERT INTO orders(id,business_id,customer_name,total) VALUES($1,$2,'Existing order',60)",[order,business]);
  await db.query("INSERT INTO payments(business_id,order_id,payment_method,payment_status,amount) VALUES($1,$2,'manual','pending',60)",[business,order]);
  const snapshot=async()=>Object.fromEntries(await Promise.all(['businesses','profiles','business_memberships','orders','payments'].map(async table=>[table,(await db.query(`SELECT * FROM ${table} ORDER BY id`)).rows])));
  const before=await snapshot();
  await db.exec(productionUpgrade());
  const after=await snapshot();
  // New columns may be added; every original column/value must remain identical.
  for(const [table, rows] of Object.entries(before)) {
    assert.equal(after[table].length,rows.length);
    rows.forEach((row,i)=>Object.entries(row).forEach(([column,value])=>assert.deepEqual(after[table][i][column],value,`${table}.${column}`)));
  }
  assert.deepEqual((await db.query("SELECT tablename FROM pg_tables WHERE schemaname='public' AND NOT rowsecurity")).rows,[]);
  assert.equal((await db.query("SELECT has_function_privilege('authenticated','opsps_provision_myops_identity_v2(text,uuid,text)','EXECUTE') allowed")).rows[0].allowed,false);
  await db.query("SELECT set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claims','{}',false)",[user]);
  await db.exec('SET ROLE authenticated');
  assert.equal((await db.query('SELECT * FROM orders')).rows.length,0);
  await db.exec('RESET ROLE');
  await assert.rejects(db.exec(productionUpgrade()),/verified.*baseline/);
  await db.exec('ROLLBACK');
  assert.deepEqual(await snapshot(),after);
  log('PASS: existing production baseline upgrades atomically; all original tenant/order/payment values preserved; RLS and SSO gate enforced; unsafe rerun refused');
} catch(error) { logError('FAIL production upgrade:',error.message);process.exitCode=1; }
finally { await db.close(); }
