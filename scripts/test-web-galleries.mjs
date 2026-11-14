import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { URL } from 'node:url';
import { freshSchema } from './fresh-schema.mjs';
import { log, error as logError } from 'node:console';
import process from 'node:process';
const db=new PGlite();
const owner='10000000-0000-4000-8000-000000000001',other='10000000-0000-4000-8000-000000000002';
const business='20000000-0000-4000-8000-000000000001',session='30000000-0000-4000-8000-000000000001';
const product='40000000-0000-4000-8000-000000000001';
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
 // Simulate an existing install, then apply only the new additive migration.
 const migration=readFileSync(new URL('../supabase/migrations/20261114192000_web_galleries_trip_budget.sql',import.meta.url),'utf8');
 await db.exec(freshSchema().replace(migration,''));

 await db.query('INSERT INTO auth.users VALUES($1),($2)',[owner,other]);
 await db.query("INSERT INTO businesses(id,name) VALUES($1,'UAT')",[business]);
 await db.query("INSERT INTO business_memberships(user_id,business_id,role) VALUES($1,$2,'founder')",[owner,business]);
 const otherBusiness='20000000-0000-4000-8000-000000000002';
 await db.query("INSERT INTO businesses(id,name) VALUES($1,'Other business')",[otherBusiness]);
 await db.query("INSERT INTO business_memberships(user_id,business_id,role) VALUES($1,$2,'founder')",[other,otherBusiness]);
 await db.query("INSERT INTO trips(id,business_id,name,destination,trip_date) VALUES($1,$2,'Original','Mall','2026-11-14')",[trip,business]);
 await db.query("INSERT INTO products(id,business_id,trip_id,name,category,image_url,is_published) VALUES($1,$2,$3,'Legacy','Other','https://example.com/legacy.jpg',false)",[product,business,trip]);
 await db.exec(migration);
 assert.equal((await db.query('SELECT image_url FROM products WHERE id=$1',[product])).rows[0].image_url,'https://example.com/legacy.jpg');
 assert.deepEqual((await db.query('SELECT gallery_paths FROM products WHERE id=$1',[product])).rows[0].gallery_paths,['legacy']);
 assert.deepEqual((await db.query('SELECT budget::text,gallery_paths,gallery_version FROM trips')).rows,[{budget:'0.00',gallery_paths:[],gallery_version:0}]);
 await db.query('INSERT INTO myops_identity_links(myops_user_ref,opsps_user_id) VALUES($1,$2)',['A'.repeat(43),owner]);
 await db.query("INSERT INTO myops_app_sessions(myops_user_ref,opsps_user_id,myops_session_id,supabase_session_id,valid_until) VALUES($1,$2,gen_random_uuid(),$3,now()+interval '10 minutes')",['A'.repeat(43),owner,session]);
 await db.exec('GRANT SELECT,INSERT,UPDATE,DELETE ON storage.objects TO authenticated;GRANT SELECT ON storage.objects TO anon');
 // Simulate unrelated broad policies: restrictive media gates must still win.
 await db.exec('CREATE POLICY fixture_broad ON storage.objects FOR ALL TO authenticated USING(true) WITH CHECK(true);CREATE POLICY fixture_anon ON storage.objects FOR SELECT TO anon USING(true)');
 const paths=(kind,id)=>Array.from({length:10},(_,i)=>`business/${business}/${kind}/${id}/90000000-0000-4000-8000-${String(i+1).padStart(12,'0')}.png`);
 await asUser(owner);
 await db.query("UPDATE trips SET name='Edited',destination='Mall B',trip_date='2026-11-15',budget=125.50,status='open' WHERE id=$1",[trip]);
 assert.deepEqual((await db.query('SELECT name,destination,trip_date::text,budget::text,status FROM trips WHERE id=$1',[trip])).rows,[{name:'Edited',destination:'Mall B',trip_date:'2026-11-15',budget:'125.50',status:'open'}]);
 await assert.rejects(db.query('UPDATE trips SET budget=-1 WHERE id=$1',[trip]),/constraint/);
 await assert.rejects(db.query("UPDATE trips SET budget='NaN' WHERE id=$1",[trip]),/constraint/);
 for(const [kind,id] of [['trips',trip],['products',product]]) {
  const images=paths(kind,id);
  for(const path of images)await db.query("INSERT INTO storage.objects(bucket_id,name) VALUES('opsps-media',$1)",[path]);
  let version=0;
  for(const count of [1,10]) {
   const r=await db.query('SELECT opsps_save_gallery($1,$2,$3,$4,$5) result',[kind,business,id,version,JSON.stringify(images.slice(0,count))]);
   version=r.rows[0].result.version;assert.equal(r.rows[0].result.paths.length,count);
  }
  const state=await db.query(`SELECT gallery_paths,gallery_version FROM ${kind} WHERE id=$1`,[id]);assert.deepEqual(state.rows[0].gallery_paths,images);
  await assert.rejects(db.query('SELECT opsps_save_gallery($1,$2,$3,0,$4)',[kind,business,id,JSON.stringify(images)]),/Gallery changed/);
  await assert.rejects(db.query('SELECT opsps_save_gallery($1,$2,$3,$4,$5)',[kind,business,id,version,JSON.stringify([...images,images[0]])]),/at most ten/);
  await assert.rejects(db.query('SELECT opsps_save_gallery($1,$2,$3,$4,$5)',[kind,business,id,version,JSON.stringify([images[0],images[0]])]),/unique strings/);
  const reordered=[images[9],...images.slice(0,9)];
  const reorderedResult=await db.query('SELECT opsps_save_gallery($1,$2,$3,$4,$5) result',[kind,business,id,version,JSON.stringify(reordered)]);version=reorderedResult.rows[0].result.version;
  const replacement=images[0].replace(/000000000001\.png$/, '000000000099.png');
  await db.query("INSERT INTO storage.objects(bucket_id,name) VALUES('opsps-media',$1)",[replacement]);
  const replaced=[replacement,...reordered.slice(1)];
  const saved=await db.query('SELECT opsps_save_gallery($1,$2,$3,$4,$5) result',[kind,business,id,version,JSON.stringify(replaced)]);version=saved.rows[0].result.version;
  await db.query('SELECT opsps_save_gallery($1,$2,$3,$4,$5)',[kind,business,id,version,JSON.stringify(replaced.slice(1))]);
  assert.equal((await db.query(`SELECT gallery_paths FROM ${kind} WHERE id=$1`,[id])).rows[0].gallery_paths.length,9);
  if(kind==='products') {
   const v=(await db.query('SELECT gallery_version FROM products WHERE id=$1',[id])).rows[0].gallery_version;
   const restored=await db.query('SELECT opsps_save_gallery($1,$2,$3,$4,$5) result',[kind,business,id,v,JSON.stringify(['legacy',...replaced.slice(1)])]);
   assert.equal(restored.rows[0].result.paths.length,10);assert.equal(restored.rows[0].result.paths[0],'legacy');
   await db.query('SELECT opsps_save_gallery($1,$2,$3,$4,$5)',[kind,business,id,restored.rows[0].result.version,JSON.stringify(replaced.slice(1))]);
  }
  // Removing from gallery does not destroy the recoverable private object.
  assert.equal((await db.query("SELECT count(*)::int n FROM storage.objects WHERE bucket_id='opsps-media' AND name=$1",[replacement])).rows[0].n,1);
 }

 await assert.rejects(db.query('UPDATE trips SET business_id=gen_random_uuid() WHERE id=$1',[trip]),/scope is immutable/);
 await assert.rejects(db.query('UPDATE products SET trip_id=NULL WHERE id=$1',[product]),/scope is immutable/);
 await assert.rejects(db.query('UPDATE trips SET gallery_paths=$1 WHERE id=$2',[JSON.stringify(paths('products',product).slice(0,1)),trip]),/object scope/);
 await db.query("UPDATE products SET name='Edited legacy' WHERE id=$1",[product]);
 assert.equal((await db.query('SELECT is_published,image_url FROM products WHERE id=$1',[product])).rows[0].is_published,false);
 assert.equal((await db.query('SELECT image_url FROM products WHERE id=$1',[product])).rows[0].image_url,'https://example.com/legacy.jpg');
 assert.equal((await db.query("UPDATE storage.objects SET name=name WHERE bucket_id='opsps-media' RETURNING id")).rows.length,0);
 await db.query("UPDATE trips SET status='closed' WHERE id=$1",[trip]);
 await assert.rejects(db.query("UPDATE trips SET status='open' WHERE id=$1",[trip]),/cannot be reopened/);
 await asUser(other);
 assert.equal((await db.query("SELECT * FROM storage.objects WHERE bucket_id='opsps-media'")).rows.length,0);
 assert.equal((await db.query('UPDATE trips SET budget=999 WHERE id=$1 RETURNING id',[trip])).rows.length,0);
 await assert.rejects(db.query('SELECT opsps_save_gallery($1,$2,$3,0,$4)',['trips',business,trip,'[]']),/Authorized/);
 await assert.rejects(db.query("INSERT INTO storage.objects(bucket_id,name) VALUES('opsps-media',$1)",[paths('trips',trip)[0]]),/row-level security/);
 // Customer has a verified session but no manager membership.
 await db.exec('RESET ROLE');
 await db.query('INSERT INTO myops_identity_links(myops_user_ref,opsps_user_id) VALUES($1,$2)',['B'.repeat(43),other]);
 await db.query("INSERT INTO myops_app_sessions(myops_user_ref,opsps_user_id,myops_session_id,supabase_session_id,valid_until) VALUES($1,$2,gen_random_uuid(),gen_random_uuid(),now()+interval '10 minutes')",['B'.repeat(43),other]);
 const customerSession=(await db.query('SELECT supabase_session_id FROM myops_app_sessions WHERE opsps_user_id=$1',[other])).rows[0].supabase_session_id;
 await db.query("UPDATE products SET is_published=true WHERE id=$1",[product]);
 await asUser(other);await db.query("SELECT set_config('request.jwt.claims',$1,false)",[JSON.stringify({session_id:customerSession})]);
 assert.equal((await db.query("SELECT * FROM storage.objects WHERE bucket_id='opsps-media'")).rows.length,9);
 await assert.rejects(db.query("INSERT INTO storage.objects(bucket_id,name) VALUES('opsps-media',$1)",[paths('products',product)[0]]),/row-level security/);
 await assert.rejects(db.query('SELECT opsps_save_gallery($1,$2,$3,0,$4)',['products',business,product,'[]']),/Authorized/);
 await db.exec("RESET ROLE;UPDATE myops_app_sessions SET valid_until=now()-interval '1 second'");await asUser(owner);
 assert.equal((await db.query("SELECT * FROM storage.objects WHERE bucket_id='opsps-media'")).rows.length,0);
 await db.exec('RESET ROLE;SET ROLE anon');
 assert.equal((await db.query("SELECT * FROM storage.objects WHERE bucket_id='opsps-media'")).rows.length,0);
 log('PASS: additive legacy preservation; trip editing/budget/completion; 1/10-image persistence, replace/remove/reorder and concurrency; private Storage role/tenant/session isolation even with broad unrelated policies.');
}catch(error){logError(error);process.exitCode=1;}finally{await db.close();}
