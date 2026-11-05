// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { ensureVerifiedStagingIdentity, ensureVerifiedMyopsIdentity, validateMyopsAuthority, type IdentityStore } from '../supabase/functions/myops-app-access/provisioning';
const project = 'https://ojamkplflqafedmxbdxb.supabase.co';
function fixture() {
  let saved: Awaited<ReturnType<IdentityStore['getUser']>> = null;
  const store: IdentityStore = {
    getUser: vi.fn(async () => saved),
    createUser: vi.fn(async input => { saved = { ...input, email_confirmed_at: '2026-01-01' }; return saved; }),
    provision: vi.fn(async (_ref, id) => id),
  };
  return store;
}
describe('verified MYOPS first-launch identity', () => {
  it('creates one deterministic internal identity without password, real email or role escalation', async () => {
    const store = fixture();
    const id = await ensureVerifiedStagingIdentity('A'.repeat(43), project, store);
    const input = vi.mocked(store.createUser).mock.calls[0][0];
    expect(input.email).toMatch(/^myops-[a-f0-9]{32}@opsps.invalid$/);
    expect(Object.keys(input).sort()).toEqual(['app_metadata','email','email_confirm','id']);
    expect(input.app_metadata).toEqual({identity_provider:'myops',myops_user_ref:'A'.repeat(43)});
    expect(await ensureVerifiedStagingIdentity('A'.repeat(43),project,store)).toBe(id);
    expect(store.createUser).toHaveBeenCalledOnce();
    expect(store.provision).toHaveBeenCalledWith('A'.repeat(43),id);
  });
  it.each(['https://production.supabase.co','https://ojamkplflqafedmxbdxb.supabase.co.evil.test'])('refuses unapproved projects before any Auth operation: %s',async origin=>{
    const store=fixture();await expect(ensureVerifiedStagingIdentity('A'.repeat(43),origin,store)).rejects.toThrow('unavailable');expect(store.getUser).not.toHaveBeenCalled();
  });
  it('rejects unverified references before any Auth operation',async()=>{
    const store=fixture();await expect(ensureVerifiedStagingIdentity('browser-email',project,store)).rejects.toThrow('unavailable');expect(store.getUser).not.toHaveBeenCalled();
  });
  it('does not bind a colliding identity with different server-owned metadata',async()=>{
    const store=fixture();vi.mocked(store.createUser).mockImplementation(async input=>({...input,email_confirmed_at:'yes',app_metadata:{identity_provider:'myops',myops_user_ref:'B'.repeat(43)}}));
    await expect(ensureVerifiedStagingIdentity('A'.repeat(43),project,store)).rejects.toThrow('conflict');expect(store.provision).not.toHaveBeenCalled();
  });
  it('leaves failed provisioning retryable without creating another Auth user',async()=>{
    const store=fixture();vi.mocked(store.provision).mockRejectedValueOnce(new Error('database unavailable'));
    await expect(ensureVerifiedStagingIdentity('A'.repeat(43),project,store)).rejects.toThrow('database unavailable');
    await ensureVerifiedStagingIdentity('A'.repeat(43),project,store);expect(store.createUser).toHaveBeenCalledOnce();
  });
  it('never accepts a database mapping to another local user',async()=>{
    const store=fixture();vi.mocked(store.provision).mockResolvedValue('other');await expect(ensureVerifiedStagingIdentity('A'.repeat(43),project,store)).rejects.toThrow('conflict');
  });
});

const productionProject = 'https://wrsigjhhbkbomtkaqlpw.supabase.co';
const stagingPortal = 'https://southerndotcom-website-git-feat-myop-ca0019-mohd-syaiful-nizam1.vercel.app';
describe('production identity environment binding', () => {
  it('creates separate deterministic identities for staging and production', async () => {
    const staging = fixture(), production = fixture();
    const stageId = await ensureVerifiedStagingIdentity('A'.repeat(43), project, staging);
    const prodId = await ensureVerifiedMyopsIdentity('A'.repeat(43), productionProject, production, 'https://www.myops.com.my');
    expect(prodId).not.toBe(stageId);
    expect(await ensureVerifiedMyopsIdentity('A'.repeat(43), productionProject, production, 'https://www.myops.com.my')).toBe(prodId);
    expect(production.createUser).toHaveBeenCalledOnce();
  });
  it.each([
    [project, 'https://www.myops.com.my'], [productionProject, stagingPortal],
    [productionProject, 'https://www.myops.com.my.evil.test'],
    ['https://unknown.supabase.co', 'https://www.myops.com.my'],
  ])('denies mixed or unknown authorities before touching Auth: %s %s', async (db, portal) => {
    const store = fixture();
    await expect(ensureVerifiedMyopsIdentity('A'.repeat(43), db, store, portal)).rejects.toThrow('unavailable');
    expect(store.getUser).not.toHaveBeenCalled();
    expect(() => validateMyopsAuthority(db, portal)).toThrow('unavailable');
  });
});
