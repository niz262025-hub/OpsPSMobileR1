// Isolated PostgreSQL only: never points at a hosted Supabase database.
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import { freshSchema } from './fresh-schema.mjs';
import { log } from 'node:console';
const db=new PGlite();
const owner='10000000-0000-4000-8000-000000000001',buyer='10000000-0000-4000-8000-000000000002',other='10000000-0000-4000-8000-000000000003';
const seller='20000000-0000-4000-8000-000000000001',buyerBusiness='20000000-0000-4000-8000-000000000002',otherBusiness='20000000-0000-4000-8000-000000000003';
const product='70000000-0000-4000-8000-000000000001',hidden='70000000-0000-4000-8000-000000000002',variant='80000000-0000-4000-8000-000000000001';
const sessions=new Map([[owner,'30000000-0000-4000-8000-000000000001'],[buyer,'30000000-0000-4000-8000-000000000002'],[other,'30000000-0000-4000-8000-000000000003']]);
async function asUser(uid){await db.exec('RESET ROLE');await db.query("SELECT set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claims',$2,false)",[uid,JSON.stringify({session_id:sessions.get(uid)})]);await db.exec('SET ROLE authenticated');}
const call=(args=[seller,product,variant,2,'UAT buyer','0120000000','UAT TEST ONLY','bank',0])=>db.query('SELECT opsps_create_customer_order($1,$2,$3,$4,$5,$6,$7,$8,$9) AS result',args);
try {
 await db.exec(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role BYPASSRLS;CREATE SCHEMA auth;
 CREATE TABLE auth.users(id uuid PRIMARY KEY);
 CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$ SELECT coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
 CREATE SCHEMA storage;CREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 CREATE TABLE storage.objects(id uuid DEFAULT gen_random_uuid(),bucket_id text,name text,owner uuid);ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
 CREATE FUNCTION storage.foldername(text) RETURNS text[] LANGUAGE sql IMMUTABLE AS $$ SELECT string_to_array($1,'/') $$;
 GRANT USAGE ON SCHEMA public,auth,storage TO anon,authenticated,service_role;`);
 await db.exec(freshSchema());
 for(const [uid,bid,role,label] of [[owner,seller,'founder','A'],[buyer,buyerBusiness,'customer','B'],[other,otherBusiness,'customer','C']]){
  await db.query('INSERT INTO auth.users VALUES($1)',[uid]);await db.query('INSERT INTO businesses(id,name) VALUES($1,$2)',[bid,`UAT ${label}`]);
  await db.query('INSERT INTO profiles(auth_user_id,business_id,full_name,email,role,business_role) VALUES($1,$2,$3,$4,$5,$5)',[uid,bid,`UAT ${label}`,`${label}@fixture.invalid`,role]);
  await db.query('INSERT INTO business_memberships(user_id,business_id,role) VALUES($1,$2,$3)',[uid,bid,role]);
  await db.query('INSERT INTO myops_identity_links(myops_user_ref,opsps_user_id) VALUES($1,$2)',[label.repeat(43),uid]);
  await db.query("INSERT INTO myops_app_sessions(myops_user_ref,opsps_user_id,myops_session_id,supabase_session_id,valid_until) VALUES($1,$2,gen_random_uuid(),$3,now()+interval '10 minutes')",[label.repeat(43),uid,sessions.get(uid)]);
 }
 await db.query("INSERT INTO products(id,business_id,name,category,selling_price,is_published) VALUES($1,$2,'UAT published','Clothing',21.50,true),($3,$2,'UAT draft','Clothing',21.50,false)",[product,seller,hidden]);
 await db.query("INSERT INTO product_variants(id,business_id,product_id,size,stock) VALUES($1,$2,$3,'M',10)",[variant,seller,product]);
 await asUser(buyer);
 const result=(await call()).rows[0].result;assert.equal(Number(result.total),43);assert.equal(result.business_id,seller);assert.equal(result.payment_status,'pending');
 assert.equal((await db.query('SELECT count(*)::integer n FROM order_items WHERE order_id=$1',[result.id])).rows[0].n,1);
 assert.equal((await db.query('SELECT stock FROM product_variants WHERE id=$1',[variant])).rows[0].stock,10);
 await assert.rejects(db.query('INSERT INTO order_items(business_id,order_id,product_variant_id,quantity,packed_quantity) VALUES($1,$2,$3,2,0)',[seller,result.id,variant]),/already has an item/);
 assert.equal((await db.query('UPDATE order_items SET packed_quantity=1 WHERE order_id=$1 RETURNING id',[result.id])).rows.length,0);
 await asUser(other);
 assert.equal((await db.query('SELECT * FROM orders WHERE id=$1',[result.id])).rows.length,0);
 assert.equal((await db.query('SELECT * FROM order_items WHERE order_id=$1',[result.id])).rows.length,0);
 await assert.rejects(db.query('INSERT INTO order_items(business_id,order_id,product_variant_id,quantity,packed_quantity) VALUES($1,$2,$3,2,0)',[seller,result.id,variant]),/Own pending customer request|row-level security/);
 await asUser(buyer);
 for(const args of [[buyerBusiness,product,variant,1,'UAT','0120000000','UAT','bank',0],[seller,hidden,variant,1,'UAT','0120000000','UAT','bank',0],[seller,product,variant,0,'UAT','0120000000','UAT','bank',0],[seller,product,variant,11,'UAT','0120000000','UAT','bank',0],[seller,product,variant,1,'UAT','0120000000','UAT','bank',-1]])await assert.rejects(call(args));
 const before=(await db.query('SELECT count(*)::integer n FROM orders')).rows[0].n;
 await db.exec(`RESET ROLE;CREATE FUNCTION public.fixture_fail_item() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'UAT forced item failure';END $$;CREATE TRIGGER fixture_fail_item BEFORE INSERT ON order_items FOR EACH ROW EXECUTE FUNCTION public.fixture_fail_item();`);
 await asUser(buyer);await assert.rejects(call(),/UAT forced item failure/);
 assert.equal((await db.query('SELECT count(*)::integer n FROM orders')).rows[0].n,before);
 await db.exec('RESET ROLE;DROP TRIGGER fixture_fail_item ON order_items;SET ROLE anon;');await assert.rejects(call(),/permission denied/);
 await db.exec('RESET ROLE');await db.query('UPDATE myops_app_sessions SET revoked_at=now() WHERE opsps_user_id=$1',[buyer]);
 await asUser(buyer);await assert.rejects(call(),/Active MYOPS sign-in/);
 log('PASS: authenticated atomic customer orders, own-order/item reads, price/stock checks, rollback on child failure, foreign-customer denial, draft denial, anonymous/expired-session denial and no customer packing.');
}finally{await db.close();}
