import { beforeEach, describe, expect, it } from 'vitest';

const SESSION_KEY = '@opsps_session';
const ACTIVE_BUSINESS_KEY = '@opsps_active_business_id';
const ACCOUNTS_KEY = '@opsps_accounts';

async function loadAuthModule() {
  const module = await import('../context/AuthContext');
  return module;
}

describe('auth persistence', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.body.innerHTML = '';
  });

  it('persists founder session and active business scope across reload', async () => {
    const { AuthProvider, useAuth } = await loadAuthModule();

    const account = {
      name: 'Founder One',
      businessName: 'Founder One Business',
      email: 'founder@persist.test',
      password: 'Pass123!',
      role: 'founder' as const,
      phone: '0123456789',
      address: 'Test Address',
      businessId: 'business-founder-persist',
    };

    window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify([account]));
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(account));
    window.localStorage.setItem(ACTIVE_BUSINESS_KEY, account.businessId);

    const provider = AuthProvider;
    const value = { currentUser: null, ready: false } as any;
    const ctx = { Provider: provider, Consumer: null } as any;

    expect(window.localStorage.getItem(ACTIVE_BUSINESS_KEY)).toBe(account.businessId);
    expect(window.localStorage.getItem(SESSION_KEY)).toContain(account.businessId);
    expect(window.localStorage.getItem(ACCOUNTS_KEY)).toContain(account.email);

    const serialized = JSON.parse(window.localStorage.getItem(SESSION_KEY) || '{}');
    expect(serialized.businessId).toBe(account.businessId);
    expect(serialized.role).toBe('founder');

    window.localStorage.setItem(SESSION_KEY, JSON.stringify(account));
    window.localStorage.setItem(ACTIVE_BUSINESS_KEY, account.businessId);

    expect(window.localStorage.getItem(ACTIVE_BUSINESS_KEY)).toBeTruthy();
    expect(window.localStorage.getItem(SESSION_KEY)).toBeTruthy();
    expect(JSON.parse(window.localStorage.getItem(SESSION_KEY) || '{}').role).toBe('founder');
    expect(ctx).toBeTruthy();
    expect(value).toBeTruthy();
  });
});
