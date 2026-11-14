import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import { freshSchema } from './fresh-schema.mjs';
import { log, error as logError } from 'node:console';
import process from 'node:process';
const db=new PGlite();
const owner='10000000-0000-4000-8000-000000000001',other='10000000-0000-4000-8000-000000000002';
const business='20000000-0000-4000-8000-000000000001',session='30000000-0000-4000-8000-000000000001';
let order='40000000-0000-4000-8000-000000000001';
const trip='60000000-0000-4000-8000-000000000001';
async function asUser(id){await db.exec('RESET ROLE');await db.query("SELECT set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claims',$2,false)",[id,JSON.stringify({session_id:session})]);await db.exec('SET ROLE authenticated');}
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
 await asUser(owner);
 await assert.rejects(db.query("UPDATE orders SET payment_status='paid' WHERE id=$1",[order]),/transition not allowed/);
 await assert.rejects(db.query('UPDATE orders SET trip_id=NULL WHERE id=$1',[order]),/ownership fields are immutable/);
 await assert.rejects(db.query('UPDATE orders SET business_id=gen_random_uuid() WHERE id=$1',[order]));

 // Privileged synthetic fixture only: exercise fulfillment without verifying or
 // processing a payment. Never run this script against a hosted database.
 await db.exec('RESET ROLE');
 assert.deepEqual((await db.query('SELECT payment_status,order_status FROM orders WHERE id=$1',[order])).rows,[{payment_status:'pending',order_status:'pending'}]);
 order='40000000-0000-4000-8000-000000000002';
 await db.query("INSERT INTO orders(id,business_id,trip_id,customer_name,customer_phone,delivery_address,total,payment_status,order_status,request_status) VALUES($1,$2,$3,'Dummy','0100000000','UAT staging',60,'paid','payment_received','PAYMENT_RECEIVED')",[order,business,trip]);
 // Packing is scoped, paid-only and cannot rewrite ordered quantity or tenant.
 await db.exec('RESET ROLE');
 const product='70000000-0000-4000-8000-000000000001',variant='80000000-0000-4000-8000-000000000001';
 await db.query("INSERT INTO products(id,business_id,trip_id,name,category) VALUES($1,$2,$3,'Dummy','Clothing')",[product,business,trip]);
 await db.query("INSERT INTO product_variants(id,business_id,product_id,size,stock) VALUES($1,$2,$3,'M',5)",[variant,business,product]);
 await db.query('INSERT INTO order_items(business_id,order_id,product_variant_id,quantity) VALUES($1,$2,$3,2)',[business,order,variant]);
 await asUser(owner);
 await assert.rejects(db.query('SELECT opsps_finish_packing($1,$2)',[business,order]),/Paid packing order required/);
 assert.equal((await db.query('UPDATE order_items SET packed_quantity=2 WHERE order_id=$1 RETURNING id',[order])).rows.length,0);
 await db.query("UPDATE orders SET order_status='packing' WHERE id=$1",[order]);
 await assert.rejects(db.query('UPDATE order_items SET quantity=3 WHERE order_id=$1',[order]),/Only valid packed/);
 await assert.rejects(db.query('UPDATE order_items SET packed_quantity=3 WHERE order_id=$1',[order]),/Only valid packed/);
 await assert.rejects(db.query('SELECT opsps_finish_packing($1,$2)',[business,order]),/Packing incomplete/);
 assert.equal((await db.query('UPDATE order_items SET packed_quantity=2 WHERE order_id=$1 RETURNING packed_quantity',[order])).rows[0].packed_quantity,2);
 assert.equal((await db.query('SELECT opsps_finish_packing($1,$2) result',[business,order])).rows[0].result.order_status,'ready');
 // Dispatch must roll inventory back if shipment creation fails.
 await db.exec(`RESET ROLE;CREATE FUNCTION public.uat_fail_dispatch() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'UAT dispatch failure';END $$;
 CREATE TRIGGER uat_fail_dispatch BEFORE INSERT ON shipments FOR EACH ROW EXECUTE FUNCTION public.uat_fail_dispatch();`);await asUser(owner);
 await assert.rejects(db.query('SELECT opsps_dispatch_manual_order($1,$2,$3,$4)',[business,order,'Dummy',0.5]),/UAT dispatch failure/);
 assert.equal((await db.query('SELECT stock FROM product_variants WHERE id=$1',[variant])).rows[0].stock,5);
 assert.equal((await db.query('SELECT count(*)::int n FROM inventory_movements')).rows[0].n,0);
 await db.exec('RESET ROLE;DROP TRIGGER uat_fail_dispatch ON shipments;DROP FUNCTION uat_fail_dispatch()');await asUser(owner);
 await assert.rejects(db.query('SELECT opsps_dispatch_manual_order($1,$2,$3,$4)',[business,order,'Dummy',0]),/valid parcel weight/);
 const dispatched=await db.query('SELECT opsps_dispatch_manual_order($1,$2,$3,$4) result',[business,order,'Dummy',0.5]);
 assert.equal(dispatched.rows[0].result.recipient_phone,'0100000000');assert.equal(dispatched.rows[0].result.tracking_number,null);
 await db.query('SELECT opsps_dispatch_manual_order($1,$2,$3,$4)',[business,order,'Dummy',0.5]);
 assert.equal((await db.query('SELECT stock FROM product_variants WHERE id=$1',[variant])).rows[0].stock,3);
 assert.equal((await db.query('SELECT count(*)::int n FROM inventory_movements')).rows[0].n,1);
 assert.equal((await db.query('SELECT count(*)::int n FROM shipments')).rows[0].n,1);

 await asUser(other);
 await assert.rejects(db.query('SELECT opsps_dispatch_manual_order($1,$2,$3,$4)',[business,order,'Dummy',0.5]),/Authorized active/);
 await db.exec("RESET ROLE;UPDATE myops_app_sessions SET valid_until=now()-interval '1 second'");await asUser(owner);
 await assert.rejects(db.query('SELECT opsps_dispatch_manual_order($1,$2,$3,$4)',[business,order,'Dummy',0.5]),/Authorized active/);
 await db.exec('RESET ROLE;SET ROLE anon');
 await assert.rejects(db.query('SELECT opsps_dispatch_manual_order($1,$2,$3,$4)',[business,order,'Dummy',0.5]),/permission denied/);
 log('PASS: default pending payment, direct-paid denial, immutable order scope; isolated already-paid fixture packing/ready/shipping; incomplete/overpacking denial; dispatch rollback and exactly-once stock 5 to 3; cross-user, expired-session and anonymous denial. No payment provider or verification invoked.');
}catch(error){logError(error.message);process.exitCode=1;}finally{await db.close();}
