import { describe, expect, it } from 'vitest';
import { verifiedIdentityRole } from '../services/myopsIdentity';
const profile={auth_user_id:'u',business_id:'b',role:'founder'};
const membership={user_id:'u',business_id:'b',role:'founder'};
describe('server-verified OpsPS role hydration',()=>{
 it('uses the complete matching server scope',()=>expect(verifiedIdentityRole('u',profile,membership,{id:'b'})).toBe('founder'));
 it('never assumes customer when an expired session returns no rows',()=>{
  expect(()=>verifiedIdentityRole('u',null,null,null)).toThrow('not available');
  expect(()=>verifiedIdentityRole('u',profile,null,{id:'b'})).toThrow('not available');
 });
 it('rejects different users, tenants and conflicting roles',()=>{
  expect(()=>verifiedIdentityRole('other',profile,membership,{id:'b'})).toThrow();
  expect(()=>verifiedIdentityRole('u',profile,membership,{id:'other'})).toThrow();
  expect(()=>verifiedIdentityRole('u',profile,{...membership,role:'customer'},{id:'b'})).toThrow();
 });
});
