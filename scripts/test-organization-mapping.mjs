import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const db = new PGlite();
try {
 await db.exec(`create role anon; create role authenticated; create role service_role;
 create table public.myops_identity_links(myops_user_ref text,opsps_user_id uuid,unique(myops_user_ref,opsps_user_id));
 create table public.business_memberships(business_id uuid,user_id uuid,unique(business_id,user_id));`);
 await db.exec(await readFile(new URL('../supabase/migrations/20261124080822_opsps_central_organization_mapping.sql',import.meta.url),'utf8'));
 const u='00000000-0000-4000-8000-000000000001', b='00000000-0000-4000-8000-000000000002',other='00000000-0000-4000-8000-000000000003',o='00000000-0000-4000-8000-000000000004';
 await db.query('insert into myops_identity_links values($1,$2)',['a'.repeat(43),u]);
 await db.query('insert into business_memberships values($1,$2)',[b,u]);
 await assert.rejects(db.query('insert into opsps_central_organization_links values($1,$2,$3,$4,true)',[o,'a'.repeat(43),u,other]));
 await db.query('insert into opsps_central_organization_links values($1,$2,$3,$4,true)',[o,'a'.repeat(43),u,b]);
 await db.exec('set role authenticated');
 await assert.rejects(db.query('select * from opsps_central_organization_links'));
 console.log('OpsPS mapping foreign-key and client ACL PASS');
} finally { await db.close(); }
