import assert from 'node:assert/strict';
import { URL } from 'node:url';
import { log } from 'node:console';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

// Replay the NEW SSO migration against a Supabase-shaped fixture with existing
// ownership policies. This does not rewrite or certify historical migrations.
const db = new PGlite();
const userA = '10000000-0000-4000-8000-000000000001';
const userB = '10000000-0000-4000-8000-000000000002';
const session = '20000000-0000-4000-8000-000000000001';
const tables = ['businesses', 'profiles', 'business_memberships', 'trips', 'products',
  'product_variants', 'orders', 'order_items', 'payments', 'shipments', 'inventory_movements',
  'finance_transactions', 'subscriptions', 'admin_users', 'business_payment_profiles'];
const scalar = async (sql, values = []) => (await db.query(sql, values)).rows[0]?.value;
async function asUser(id, sessionId = session) {
  await db.exec('reset role');
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
  await db.query("select set_config('request.jwt.claims',$1,false)", [JSON.stringify({ session_id: sessionId })]);
  await db.exec('set role authenticated');
}
try {
  await db.exec(`create role anon nologin; create role authenticated nologin;
    create role service_role nologin bypassrls; create schema auth;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    create function auth.jwt() returns jsonb language sql stable as $$
      select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
    create schema storage; create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text,owner uuid);
    alter table storage.objects enable row level security;
    create policy storage_owner on storage.objects for all to authenticated
      using(owner=auth.uid()) with check(owner=auth.uid());
    grant usage on schema auth,storage,public to anon,authenticated,service_role;
    grant all on storage.objects to authenticated;
    create function public.bootstrap_founder_business(text,text,text,text,text,text)
      returns uuid language sql security definer as $$ select gen_random_uuid() $$;
    grant execute on function public.bootstrap_founder_business(text,text,text,text,text,text) to authenticated;`);
  for (const table of tables) {
    await db.exec(`create table public.${table}(id uuid default gen_random_uuid(),owner uuid);
      alter table public.${table} enable row level security;
      create policy fixture_owner on public.${table} for all to authenticated
        using(owner=auth.uid()) with check(owner=auth.uid());
      grant all on public.${table} to authenticated;`);
    await db.query(`insert into public.${table}(owner) values($1),($2)`, [userA, userB]);
  }
  await db.query('insert into auth.users(id) values($1),($2)', [userA, userB]);
  await db.query("insert into storage.objects(bucket_id,name,owner) values('payment-proofs','proof-a',$1),('payment-proofs','proof-b',$2)", [userA, userB]);
  const migration = readFileSync(new URL('../supabase/migrations/017_opsps_myops_app_sessions.sql', import.meta.url), 'utf8');
  await db.exec(migration);
  await db.exec(migration);
  await db.query('insert into public.myops_identity_links(myops_user_ref,opsps_user_id) values($1,$2)', ['A'.repeat(43), userA]);

  await asUser(userA);
  for (const table of tables) assert.equal(await scalar(`select count(*)::int as value from public.${table}`), 0);
  await assert.rejects(db.query('insert into public.orders(owner) values($1)', [userA]), /row-level security/);
  await assert.rejects(db.query('select * from public.myops_identity_links'), /permission denied/);
  await assert.rejects(db.query('select public.bootstrap_founder_business(null,null,null,null,null,null)'), /permission denied/);
  assert.equal(await scalar('select count(*)::int as value from storage.objects'), 0);

  await db.exec('reset role');
  await db.query(`insert into public.myops_app_sessions(myops_user_ref,opsps_user_id,myops_session_id,supabase_session_id,valid_until)
    values($1,$2,gen_random_uuid(),$3,now()+interval '2 minutes')`, ['A'.repeat(43), userA, session]);
  await asUser(userA);
  for (const table of tables) assert.equal(await scalar(`select count(*)::int as value from public.${table}`), 1);
  assert.equal(await scalar('select count(*)::int as value from storage.objects'), 1);
  await assert.rejects(db.query('insert into public.orders(owner) values($1)', [userB]), /row-level security/);
  await asUser(userB);
  assert.equal(await scalar('select count(*)::int as value from public.orders'), 0);
  await asUser(userA, '20000000-0000-4000-8000-000000000099');
  assert.equal(await scalar('select count(*)::int as value from public.orders'), 0);

  await db.exec("reset role; update public.myops_app_sessions set valid_until=now()-interval '1 second'");
  await asUser(userA);
  assert.equal(await scalar('select count(*)::int as value from public.orders'), 0);
  await db.exec("reset role; update public.myops_app_sessions set valid_until=now()+interval '2 minutes',revoked_at=now()");
  await asUser(userA);
  assert.equal(await scalar('select count(*)::int as value from public.orders'), 0);
  assert.equal(await scalar('select count(*)::int as value from storage.objects'), 0);
  await db.exec('reset role; set role anon');
  await assert.rejects(db.query('select * from public.myops_app_sessions'), /permission denied/);
  log('PASS: SSO migration replay/idempotence; legacy-token denial; active session + owner isolation; wrong-user/session, expiry, revocation, private mappings and Storage gates');
} finally {
  await db.close();
}
