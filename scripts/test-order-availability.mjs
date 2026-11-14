import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import { freshSchema } from './fresh-schema.mjs';
import { log, error as logError } from 'node:console';
import process from 'node:process';
const db=new PGlite();
const owner='10000000-0000-4000-8000-000000000001',other='10000000-0000-4000-8000-000000000002';
const business='20000000-0000-4000-8000-000000000001',session='30000000-0000-4000-8000-000000000001';
const order='40000000-0000-4000-8000-000000000001',trip='60000000-0000-4000-8000-000000000001';
async function asUser(id){await db.exec('RESET ROLE');await db.query("SELECT set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claims',$2,false)",[id,JSON.stringify({session_id:id===other?'30000000-0000-4000-8000-000000000002':session})]);await db.exec('SET ROLE authenticated');}
try{
 await db.exec(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role BYPASSRLS;CREATE SCHEMA auth;
 CREATE TABLE auth.users(id uuid PRIMARY KEY);
 CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$ SELECT coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
 CREATE SCHEMA storage;CREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 CREATE TABLE storage.objects(id uuid DEFAULT gen_random_uuid(),bucket_id text,name text,owner uuid);ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
 CREATE FUNCTION storage.foldername(text) RETURNS text[] LANGUAGE sql IMMUTABLE AS $$ SELECT string_to_array($1,'/') $$;
 GRANT USAGE ON SCHEMA public,auth,storage TO anon,authenticated,service_role;`);
 await db.exec(freshSchema());
 await db.query('INSERT INTO auth.users VALUES($1),($2)',[owner,other]);
 await db.query("INSERT INTO businesses(id,name) VALUES($1,'UAT')",[business]);
 await db.query("INSERT INTO profiles(auth_user_id,business_id,full_name,email,role) VALUES($1,$2,'Owner','owner@fixture.invalid','founder')",[owner,business]);
 await db.query("INSERT INTO business_memberships(user_id,business_id,role) VALUES($1,$2,'founder')",[owner,business]);
 await db.query("INSERT INTO trips(id,business_id,name,destination,trip_date) VALUES($1,$2,'UAT','UAT','2026-11-01')",[trip,business]);
 await db.query("INSERT INTO orders(id,business_id,trip_id,customer_name,customer_phone,delivery_address,total) VALUES($1,$2,$3,'Dummy','0100000000','UAT staging',60)",[order,business,trip]);

 await db.query('INSERT INTO myops_identity_links(myops_user_ref,opsps_user_id) VALUES($1,$2)',['A'.repeat(43),owner]);
 await db.query("INSERT INTO myops_app_sessions(myops_user_ref,opsps_user_id,myops_session_id,supabase_session_id,valid_until) VALUES($1,$2,gen_random_uuid(),$3,now()+interval '10 minutes')",['A'.repeat(43),owner,session]);
 const product='70000000-0000-4000-8000-000000000001',variant='80000000-0000-4000-8000-000000000001';
 await db.query("INSERT INTO products(id,business_id,trip_id,name,category) VALUES($1,$2,$3,'Dummy','Clothing')",[product,business,trip]);
 await db.query("INSERT INTO product_variants(id,business_id,product_id,size,stock) VALUES($1,$2,$3,'M',5)",[variant,business,product]);
 await db.query('INSERT INTO order_items(business_id,order_id,product_variant_id,quantity) VALUES($1,$2,$3,1)',[business,order,variant]);
 const insertPayment=()=>db.query("INSERT INTO payments(business_id,order_id,payment_method,payment_status,amount,customer_payment_reference) VALUES($1,$2,'DIRECT_QR','submitted',60,'UAT')",[business,order]);
 await assert.rejects(insertPayment(),/confirm availability/);
 await asUser(owner);
 await assert.rejects(db.query('SELECT opsps_confirm_availability($1,$2,$3)',[business,order,'invented']),/Invalid availability/);
 await assert.rejects(db.query('SELECT opsps_confirm_availability($1,$2,$3)',[business,'40000000-0000-4000-8000-000000000099','PAY_NOW']),/Pending availability/);
 const confirmed=await db.query('SELECT opsps_confirm_availability($1,$2,$3) result',[business,order,'PAY_NOW']);
 assert.equal(confirmed.rows[0].result.availability_status,'confirmed');
 assert.equal(confirmed.rows[0].result.request_status,'PAYMENT_REQUIRED');
 assert.ok(confirmed.rows[0].result.payment_requested_at);
 await assert.rejects(db.query('SELECT opsps_confirm_availability($1,$2,$3)',[business,order,'PAY_LATER']),/Pending availability/);
 await insertPayment();
 await db.exec('RESET ROLE');
 for(const [n,decision] of [[2,'PAY_LATER'],[3,'NOT_AVAILABLE']]){
  const id='40000000-0000-4000-8000-00000000000'+n;
  await db.query("INSERT INTO orders(id,business_id,trip_id,customer_name,total,availability_status) VALUES($1,$2,$3,'Dummy',60,'pending')",[id,business,trip]);
  await db.query('INSERT INTO order_items(business_id,order_id,product_variant_id,quantity) VALUES($1,$2,$3,1)',[business,id,variant]);
  await asUser(owner);const r=(await db.query('SELECT opsps_confirm_availability($1,$2,$3) result',[business,id,decision])).rows[0].result;
  assert.equal(r.payment_requested_at,null);
  assert.equal(r.request_status,decision==='PAY_LATER'?'PAY_LATER_OFFERED':'OUT_OF_STOCK');
  assert.equal(r.order_status,decision==='PAY_LATER'?'pending':'cancelled');
  await assert.rejects(db.query("INSERT INTO payments(business_id,order_id,payment_method,payment_status,amount) VALUES($1,$2,'DIRECT_QR','submitted',60)",[business,id]),/confirm availability/);
  await db.exec('RESET ROLE');
 }
 // Customer owns the order, but cannot confirm availability through RPC or direct update.
 await db.query("INSERT INTO profiles(auth_user_id,business_id,full_name,email,role) VALUES($1,$2,'Customer','customer@fixture.invalid','customer')",[other,business]);
 const customerOrder='40000000-0000-4000-8000-000000000004';
 await db.query("INSERT INTO orders(id,business_id,customer_profile_id,customer_name,total,availability_status) SELECT $1,$2,id,'Customer',60,'pending' FROM profiles WHERE auth_user_id=$3",[customerOrder,business,other]);
 await db.query('INSERT INTO myops_identity_links(myops_user_ref,opsps_user_id) VALUES($1,$2)',['B'.repeat(43),other]);
 await db.query("INSERT INTO myops_app_sessions(myops_user_ref,opsps_user_id,myops_session_id,supabase_session_id,valid_until) VALUES($1,$2,gen_random_uuid(),$3,now()+interval '10 minutes')",['B'.repeat(43),other,'30000000-0000-4000-8000-000000000002']);
 await asUser(other);
 await assert.rejects(db.query('SELECT opsps_confirm_availability($1,$2,$3)',[business,order,'PAY_NOW']),/Authorized active/);
 await assert.rejects(db.query("UPDATE orders SET availability_status='confirmed' WHERE id=$1",[customerOrder]),/Merchant availability/);
 await db.exec("RESET ROLE;UPDATE myops_app_sessions SET valid_until=now()-interval '1 second'");await asUser(owner);
 await assert.rejects(db.query('SELECT opsps_confirm_availability($1,$2,$3)',[business,order,'PAY_NOW']),/Authorized active/);
 await db.exec('RESET ROLE;SET ROLE anon');
 await assert.rejects(db.query('SELECT opsps_confirm_availability($1,$2,$3)',[business,order,'PAY_NOW']),/permission denied/);
 log('PASS: explicit pay-first/pay-later/unavailable decisions; payment blocked before request; no implicit stock mutation; duplicate, foreign-order, customer direct-write, expired and anonymous denial');
}catch(error){logError(error);process.exitCode=1;}finally{await db.close();}
