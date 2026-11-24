import { describe, expect, it, vi } from 'vitest';
import { resolveScopedWorkspace } from '../supabase/functions/myops-app-access/organization';
const user='00000000-0000-4000-8000-000000000001';
const org='00000000-0000-4000-8000-000000000002';
const business='00000000-0000-4000-8000-000000000003';
const other='00000000-0000-4000-8000-000000000004';
const ref='a'.repeat(43);
describe('verified organization workspace mapping',()=>{
 it('requires an explicit active identity and membership',async()=>{
  const lookup={mapping:vi.fn().mockResolvedValue({opsps_user_id:user,business_id:business}),membership:vi.fn().mockResolvedValue(true)};
  expect(await resolveScopedWorkspace(org,ref,user,lookup)).toEqual({opsps_user_id:user,business_id:business});
  expect(lookup.mapping).toHaveBeenCalledWith(org,ref);expect(lookup.membership).toHaveBeenCalledWith(user,business);
  lookup.membership.mockResolvedValue(false);expect(await resolveScopedWorkspace(org,ref,user,lookup)).toBeNull();
  lookup.mapping.mockResolvedValue({opsps_user_id:other,business_id:business});expect(await resolveScopedWorkspace(org,ref,user,lookup)).toBeNull();
  lookup.mapping.mockResolvedValue(null);expect(await resolveScopedWorkspace(org,ref,user,lookup)).toBeNull();
  expect(await resolveScopedWorkspace('not-an-org',ref,user,lookup)).toBeNull();
 });
 it('does not turn an upstream lookup error into an access grant',async()=>{
  await expect(resolveScopedWorkspace(org,ref,user,{mapping:async()=>{throw new Error('unavailable')},membership:async()=>true})).rejects.toThrow();
 });
});
