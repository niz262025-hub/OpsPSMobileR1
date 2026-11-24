import { describe, expect, it, vi } from 'vitest';
import {
  centralCompanyLabels,
  ensureVerifiedStagingIdentity,
  type IdentityStore,
} from '../provisioning';

describe('OpsPS MYOPS provisioning', () => {
  it('requires validated company details for trial onboarding', () => {
    expect(() => centralCompanyLabels(undefined)).toThrow('Complete your company profile');
    expect(() => centralCompanyLabels({ display_name: 'Tester', company_name: ' ' })).toThrow();
    expect(centralCompanyLabels({ display_name: ' Tester ', company_name: ' UAT Company ' }))
      .toEqual({ name: 'Tester', company: 'UAT Company' });
  });

  it('reuses a partially provisioned Auth identity on the next verified launch', async () => {
    let existing: Awaited<ReturnType<IdentityStore['getUser']>> = null;
    const createUser = vi.fn<IdentityStore['createUser']>(async (input) => {
      existing = { ...input, email_confirmed_at: '2026-01-01T00:00:00Z' };
      return existing;
    });
    const provision = vi.fn<IdentityStore['provision']>()
      .mockRejectedValueOnce(new Error('Temporary provisioning failure'))
      .mockImplementation(async (_ref, id) => id);
    const store: IdentityStore = { getUser: async () => existing, createUser, provision };
    const ref = 'a'.repeat(43);

    await expect(ensureVerifiedStagingIdentity(ref, store)).rejects.toThrow('Temporary provisioning failure');
    const id = await ensureVerifiedStagingIdentity(ref, store);

    expect(createUser).toHaveBeenCalledTimes(1);
    expect(provision).toHaveBeenCalledTimes(2);
    expect(provision).toHaveBeenLastCalledWith(ref, id);
  });
});
