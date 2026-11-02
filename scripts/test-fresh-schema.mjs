import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
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
  assert.equal((await db.query("SELECT has_function_privilege('anon','public.user_is_business_member(uuid,uuid)','EXECUTE') allowed")).rows[0].allowed,false);
  assert.equal((await db.query("SELECT has_function_privilege('authenticated','public.direct_qr_payment_verified_gate()','EXECUTE') allowed")).rows[0].allowed,false);
  assert.equal((await db.query("SELECT has_function_privilege('authenticated','public.user_is_business_member(uuid,uuid)','EXECUTE') allowed")).rows[0].allowed,true);
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
  // The first-launch RPC is service-only, atomic and idempotent; browser metadata cannot claim identities.
  await db.exec(`ALTER TABLE auth.users ADD COLUMN email text, ADD COLUMN email_confirmed_at timestamptz,
    ADD COLUMN raw_app_meta_data jsonb DEFAULT '{}'::jsonb;
    -- Auth metadata is validated by the server Admin API, not through a broader SQL grant.
    SELECT 1;`);
  const newRef='C'.repeat(43);
  const identityBytes=createHash('sha256').update('opsps-myops:https://ojamkplflqafedmxbdxb.supabase.co:'+newRef).digest();
  identityBytes[6]=(identityBytes[6]&15)|80; identityBytes[8]=(identityBytes[8]&63)|128;
  const hex=identityBytes.toString('hex');
  const newUser=hex.slice(0,8)+'-'+hex.slice(8,12)+'-'+hex.slice(12,16)+'-'+hex.slice(16,20)+'-'+hex.slice(20,32);
  await db.query("INSERT INTO auth.users(id,email,email_confirmed_at,raw_app_meta_data) VALUES($1,'myops-fixture@opsps.invalid',now(),$2)", [newUser,JSON.stringify({identity_provider:'myops',myops_user_ref:newRef})]);
  await db.exec('SET ROLE authenticated');
  await assert.rejects(db.query('SELECT public.opsps_provision_myops_identity($1,$2)',[newRef,newUser]), /permission denied/);
  await db.exec("RESET ROLE; SELECT set_config('request.jwt.claim.sub','',false); SET ROLE service_role");
  await assert.rejects(db.query('SELECT public.opsps_provision_myops_identity($1,$2)', ['D'.repeat(43),newUser]), /Unverified/);
  assert.equal((await db.query('SELECT public.opsps_provision_myops_identity($1,$2) id',[newRef,newUser])).rows[0].id,newUser);
  assert.equal((await db.query('SELECT public.opsps_provision_myops_identity($1,$2) id',[newRef,newUser])).rows[0].id,newUser);
  assert.equal((await db.query('SELECT count(*)::int n FROM profiles WHERE auth_user_id=$1',[newUser])).rows[0].n,1);
  assert.equal((await db.query('SELECT count(*)::int n FROM business_memberships WHERE user_id=$1',[newUser])).rows[0].n,1);
  await assert.rejects(db.query('SELECT public.opsps_provision_myops_identity($1,$2)', [newRef,userB]), /conflict/);
  await db.exec('RESET ROLE');
  assert.equal((await db.query('SELECT count(*)::int n FROM public.orders')).rows[0].n,0);
  assert.equal((await db.query('SELECT count(*)::int n FROM public.subscriptions')).rows[0].n,0);
  await db.exec('RESET ROLE');
  // Production v2 must preserve existing tenants, isolate environment identities and be service-only.
  const productionProject = 'https://wrsigjhhbkbomtkaqlpw.supabase.co';
  const prodBytes = createHash('sha256').update('opsps-myops:'+productionProject+':'+newRef).digest();
  prodBytes[6]=(prodBytes[6]&15)|80; prodBytes[8]=(prodBytes[8]&63)|128;
  const prodHex=prodBytes.toString('hex');
  const prodUser=prodHex.slice(0,8)+'-'+prodHex.slice(8,12)+'-'+prodHex.slice(12,16)+'-'+prodHex.slice(16,20)+'-'+prodHex.slice(20,32);
  await db.query('INSERT INTO auth.users(id) VALUES ($1)', [prodUser]);
  await db.exec('SET ROLE authenticated');
  await assert.rejects(db.query('SELECT opsps_provision_myops_identity_v2($1,$2,$3)',[newRef,prodUser,productionProject]), /permission denied/);
  await db.exec('RESET ROLE; SET ROLE service_role');
  await assert.rejects(db.query('SELECT opsps_provision_myops_identity_v2($1,$2,$3)',[newRef,newUser,productionProject]), /Unverified/);
  await assert.rejects(db.query('SELECT opsps_provision_myops_identity_v2($1,$2,$3)',[newRef,prodUser,'https://evil.test']), /Unapproved/);
  await assert.rejects(db.query('SELECT opsps_provision_myops_identity_v2($1,$2,$3)',[newRef,prodUser,productionProject]), /conflict/);
  // A separate reference simulates a fresh production tenant without claiming an existing link.
  await db.exec('RESET ROLE');
  await db.query('DELETE FROM myops_identity_links WHERE myops_user_ref=$1',[newRef]);
  const tenantCount=(await db.query('SELECT count(*)::int n FROM businesses')).rows[0].n;
  await db.exec('SET ROLE service_role');
  assert.equal((await db.query('SELECT opsps_provision_myops_identity_v2($1,$2,$3) id',[newRef,prodUser,productionProject])).rows[0].id,prodUser);
  assert.equal((await db.query('SELECT opsps_provision_myops_identity_v2($1,$2,$3) id',[newRef,prodUser,productionProject])).rows[0].id,prodUser);
  await db.exec('RESET ROLE');
  assert.equal((await db.query('SELECT count(*)::int n FROM businesses')).rows[0].n,tenantCount+1);
  assert.equal((await db.query('SELECT count(*)::int n FROM profiles WHERE auth_user_id=$1',[newUser])).rows[0].n,1);
  assert.equal((await db.query('SELECT count(*)::int n FROM orders')).rows[0].n,0);
  console.log('PASS: production identity RPC, environment binding, browser denial, tenant preservation, idempotence');
  const labelsRef='E'.repeat(43),labelsProject='https://ojamkplflqafedmxbdxb.supabase.co';
  const labelBytes=createHash('sha256').update('opsps-myops:'+labelsProject+':'+labelsRef).digest();
  labelBytes[6]=(labelBytes[6]&15)|80;labelBytes[8]=(labelBytes[8]&63)|128;
  const labelHex=labelBytes.toString('hex');
  const labelUser=`${labelHex.slice(0,8)}-${labelHex.slice(8,12)}-${labelHex.slice(12,16)}-${labelHex.slice(16,20)}-${labelHex.slice(20,32)}`;
  await db.query('insert into auth.users(id) values($1)',[labelUser]);await db.exec('set role service_role');
  await db.query('select opsps_provision_myops_identity_v3($1,$2,$3,$4,$5)',[labelsRef,labelUser,labelsProject,'Central Owner','Central Company']);
  await db.query('select opsps_provision_myops_identity_v3($1,$2,$3,$4,$5)',[labelsRef,labelUser,labelsProject,'Changed Owner','Changed Company']);
  assert.equal((await db.query('select b.name from businesses b join profiles p on p.business_id=b.id where p.auth_user_id=$1',[labelUser])).rows[0].name,'Central Company');
  assert.equal((await db.query('select full_name from profiles where auth_user_id=$1',[labelUser])).rows[0].full_name,'Central Owner');
  await assert.rejects(db.query('select opsps_provision_myops_identity_v3($1,$2,$3,$4,$5)',[labelsRef,labelUser,productionProject,'Owner','Company']),/staging company/);
  await db.exec('reset role');
  console.log('PASS: central descriptive company labels, retry preserves tenant names, staging-only v3');
  // Existing installations must be refused before any policy/schema changes.
  await assert.rejects(db.exec(freshSchema()), /requires an empty public schema/);
  await db.exec('ROLLBACK');
  const shared = new PGlite();
  try {
    await shared.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
      CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY);
      CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$ SELECT coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
      CREATE SCHEMA storage;
      CREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
      CREATE TABLE storage.objects(id uuid DEFAULT gen_random_uuid(),bucket_id text,name text,owner uuid);
      ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
      CREATE FUNCTION storage.foldername(text) RETURNS text[] LANGUAGE sql IMMUTABLE AS $$ SELECT string_to_array($1,'/') $$;
      GRANT USAGE ON SCHEMA public,auth,storage TO anon,authenticated,service_role;`);
    await assert.rejects(shared.exec(freshSchema({sharedOpsflowStaging:true})), /verified OpsFlow-only staging schema/);
    await shared.exec('ROLLBACK');
    for (const name of ['app_sessions','companies','documents','memberships','onboarding_sessions','profiles']) {
      await shared.exec(`CREATE TABLE opsflow_${name}(id int); ALTER TABLE opsflow_${name} ENABLE ROW LEVEL SECURITY;`);
    }
    await shared.exec(`INSERT INTO opsflow_documents VALUES(7);
      GRANT SELECT ON opsflow_documents TO anon;
      ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT ON TABLES TO anon;
      CREATE FUNCTION opsflow_session_context() RETURNS int LANGUAGE sql AS $$ SELECT 42 $$;`);
    const snapshot = async () => ({
      rows: (await shared.query('SELECT * FROM opsflow_documents')).rows,
      acl: (await shared.query("SELECT relname,relacl::text FROM pg_class WHERE relname LIKE 'opsflow_%' ORDER BY relname")).rows,
      defaults: (await shared.query('SELECT defaclacl::text FROM pg_default_acl')).rows,
      function: (await shared.query('SELECT opsflow_session_context() value')).rows,
    });
    const beforeShared = await snapshot();
    await shared.exec(freshSchema({sharedOpsflowStaging:true}));
    assert.deepEqual(await snapshot(), beforeShared);
    assert.equal((await shared.query("SELECT count(*)::int n FROM pg_tables WHERE schemaname='public'")).rows[0].n,25);
    assert.equal((await shared.query("SELECT has_table_privilege('anon','profiles','SELECT') allowed")).rows[0].allowed,false);
    await assert.rejects(shared.exec(freshSchema({sharedOpsflowStaging:true})), /verified OpsFlow-only staging schema/);
    await shared.exec('ROLLBACK');
    console.log('PASS: shared staging preserves OpsFlow rows, ACLs, functions and default privileges; rejects unknown/existing schemas; OpsPS browser grants remain restricted');
  } finally { await shared.close(); }
  console.log(`PASS: full historical OpsPS baseline (${tables.length} tables), RLS, bootstrap denial, existing-install guard`);
} catch (error) {
  console.error('FAIL fresh provisioning:', error.message, 'position:', error.position);
  process.exitCode = 1;
} finally { await db.close(); }
