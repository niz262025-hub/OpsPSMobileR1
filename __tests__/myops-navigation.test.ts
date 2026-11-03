import { afterEach, describe, expect, it, vi } from 'vitest';
import { endMyopsAppSession } from '../services/myopsAppAccess';
import { logoutToMyops, myopsPortalUrl, returnToMyops } from '../services/myopsNavigation';
vi.mock('../services/myopsAppAccess', () => ({ endMyopsAppSession: vi.fn() }));
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.resetAllMocks(); });
describe('central MYOPS logout', () => {
  it('revokes app session before signout and clears identity before returning directly to MYOPS', async () => {
    const steps: string[] = [];
    vi.mocked(endMyopsAppSession).mockImplementation(async () => { steps.push('revoke'); });
    const client = { auth: { signOut: vi.fn(async () => { steps.push('signout'); }) } } as any;
    const replace = vi.fn(() => steps.push('redirect'));
    vi.stubGlobal('window', { location: { replace } });
    await logoutToMyops(client, () => steps.push('clear'));
    expect(steps).toEqual(['revoke', 'signout', 'clear', 'redirect']);
    expect(replace).toHaveBeenCalledWith('https://www.myops.com.my/');
  });
  it('network revocation failure still signs out and clears identity', async () => {
    vi.mocked(endMyopsAppSession).mockRejectedValue(new Error('offline'));
    const client = { auth: { signOut: vi.fn(async () => undefined) } } as any;
    const clear = vi.fn(), replace = vi.fn();
    vi.stubGlobal('window', { location: { replace } });
    await expect(logoutToMyops(client, clear)).rejects.toThrow('offline');
    expect(client.auth.signOut).toHaveBeenCalledOnce();
    expect(clear).toHaveBeenCalledOnce();
    expect(replace).toHaveBeenCalledOnce();
  });
  it('signout failure still clears identity and returns to portal', async () => {
    const client = { auth: { signOut: vi.fn(async () => { throw new Error('offline'); }) } } as any;
    const clear = vi.fn(), replace = vi.fn();
    vi.stubGlobal('window', { location: { replace } });
    await expect(logoutToMyops(client, clear)).rejects.toThrow('offline');
    expect(clear).toHaveBeenCalledOnce();expect(replace).toHaveBeenCalledOnce();
  });
  it('works with missing local client without inventing a session', async () => {
    const clear = vi.fn(), replace = vi.fn();vi.stubGlobal('window', { location: { replace } });
    await logoutToMyops(null, clear);
    expect(endMyopsAppSession).not.toHaveBeenCalled();expect(clear).toHaveBeenCalledOnce();expect(replace).toHaveBeenCalledOnce();
  });
  it('only permits the exact staging origin override and rejects arbitrary redirect destinations', () => {
    vi.stubEnv('EXPO_PUBLIC_MYOPS_PORTAL_ORIGIN','https://evil.test');
    expect(myopsPortalUrl()).toBe('https://www.myops.com.my/');
    const origin='https://southerndotcom-website-git-feat-myop-ca0019-mohd-syaiful-nizam1.vercel.app';
    vi.stubEnv('EXPO_PUBLIC_MYOPS_PORTAL_ORIGIN',origin);
    const replace=vi.fn();vi.stubGlobal('window',{location:{replace}});returnToMyops();
    expect(replace).toHaveBeenCalledWith(origin+'/');
  });
});
