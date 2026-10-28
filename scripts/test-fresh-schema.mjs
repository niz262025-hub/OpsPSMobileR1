import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import { freshSchema } from './fresh-schema.mjs';
import process from 'node:process';
import console from 'node:console';

const db = new PGlite();
try {
  await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
    CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
      SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$
      SELECT coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
    CREATE SCHEMA storage;
    CREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    CREATE TABLE storage.objects(id uuid DEFAULT gen_random_uuid(),bucket_id text,name text,owner uuid);
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
    CREATE FUNCTION storage.foldername(text) RETURNS text[] LANGUAGE sql IMMUTABLE AS $$
      SELECT string_to_array($1,'/') $$;
    GRANT USAGE ON SCHEMA public,auth,storage TO anon,authenticated,service_role;`);
  await db.exec(freshSchema());
  const tables = (await db.query("SELECT tablename FROM pg_tables WHERE schemaname='public'")).rows;
  assert.ok(tables.some(row => row.tablename === 'myops_app_sessions'));
  const unprotected = (await db.query("SELECT relname FROM pg_class WHERE relnamespace='public'::regnamespace AND relkind='r' AND NOT relrowsecurity")).rows;
  assert.deepEqual(unprotected, []);
  assert.equal((await db.query("SELECT has_function_privilege('authenticated','public.bootstrap_founder_business(text,text,text,text,text,text)','EXECUTE') AS allowed")).rows[0].allowed, false);
  const userA = '10000000-0000-4000-8000-000000000001';
  const userB = '10000000-0000-4000-8000-000000000002';
  const businessA = '20000000-0000-4000-8000-000000000001';
  const businessB = '20000000-0000-4000-8000-000000000002';
  const sessionA = '30000000-0000-4000-8000-000000000001';
  await db.query('INSERT INTO auth.users(id) VALUES ($1),($2)', [userA, userB]);
  await db.query("INSERT INTO businesses(id,name) VALUES ($1,'A'),($2,'B')", [businessA, businessB]);
  await db.query("INSERT INTO business_memberships(business_id,user_id,role) VALUES ($1,$2,'founder'),($3,$4,'founder')", [businessA,userA,businessB,userB]);
  await db.query('INSERT INTO myops_identity_links(myops_user_ref,opsps_user_id) VALUES ($1,$2)', ['A'.repeat(43),userA]);
  await db.query("INSERT INTO myops_app_sessions(myops_user_ref,opsps_user_id,myops_session_id,supabase_session_id,valid_until) VALUES ($1,$2,gen_random_uuid(),$3,now()+interval '2 minutes')", ['A'.repeat(43),userA,sessionA]);
  await db.query("SELECT set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claims',$2,false)", [userA,JSON.stringify({session_id:sessionA})]);
  await db.exec('SET ROLE authenticated');
  assert.deepEqual((await db.query('SELECT name FROM businesses')).rows, [{name:'A'}]);
  assert.deepEqual((await db.query('SELECT business_id FROM business_memberships')).rows, [{business_id:businessA}]);
  await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)", [userB]);
  assert.equal((await db.query('SELECT * FROM businesses')).rows.length, 0);
  await db.exec('RESET ROLE');
  // Existing installations must be refused before any policy/schema changes.
  await assert.rejects(db.exec(freshSchema()), /requires an empty public schema/);
  await db.exec('ROLLBACK');
  console.log(`PASS: full historical OpsPS baseline (${tables.length} tables), RLS, bootstrap denial, existing-install guard`);
} catch (error) {
  console.error('FAIL fresh provisioning:', error.message, 'position:', error.position);
  process.exitCode = 1;
} finally { await db.close(); }
