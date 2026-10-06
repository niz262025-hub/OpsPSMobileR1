import React from 'react';
import { act, create } from 'react-test-renderer';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';

const mockSupabaseClient = {
  auth: {
    getSession: vi.fn(async () => ({
      data: {
        session: {
          user: {
            id: 'user-123',
            email: 'founder@test.com',
            user_metadata: { full_name: 'Founder Demo' },
          },
        },
      },
      error: null,
    })),
    onAuthStateChange: vi.fn(() => ({
      data: {
        subscription: { unsubscribe: vi.fn() },
      },
    })),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    signUp: vi.fn(),
  },
  from: vi.fn((table: string) => {
    if (table === 'profiles') {
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: {
                id: 'profile-1',
                auth_user_id: 'user-123',
                business_id: 'business-1',
                full_name: 'Founder Demo',
                email: 'founder@test.com',
                role: 'founder',
              },
              error: null,
            }),
          }),
        }),
      };
    }

    if (table === 'business_memberships') {
      return {
        select: () => ({
          eq: () => ({
            limit: async () => ({
              data: [{ id: 'membership-1', business_id: 'business-1', user_id: 'user-123', role: 'founder' }],
              error: null,
            }),
          }),
        }),
      };
    }

    if (table === 'businesses') {
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: { id: 'business-1', name: 'Demo Business', email: 'founder@test.com' },
              error: null,
            }),
          }),
        }),
      };
    }

    return {
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: null, error: null }),
        }),
      }),
    };
  }),
};

vi.mock('../services/supabaseClient', () => ({
  getSupabaseClient: () => mockSupabaseClient,
}));

describe('auth business scope', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('derives the active business from authenticated membership data, not a client-controlled fallback', async () => {
    const { AuthProvider, useAuth } = await import('../context/AuthContext');

    let authValue: any;

    function Harness() {
      authValue = useAuth();
      return null;
    }

    await act(async () => {
      create(
        React.createElement(AuthProvider, null, React.createElement(Harness))
      );
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(authValue.currentUser?.businessId).toBe('business-1');
    expect(authValue.membership?.business_id).toBe('business-1');
    expect(authValue.business?.id).toBe('business-1');
    expect(authValue.role).toBe('founder');
  });

  it('defers profile creation until an authenticated session exists after email confirmation', async () => {
    const { AuthProvider, useAuth } = await import('../context/AuthContext');

    const signUpMock = vi.fn(async () => ({
      data: {
        user: {
          id: 'new-founder-user',
          email: 'new-founder@example.com',
          user_metadata: { full_name: 'New Founder', role: 'founder' },
        },
      },
      error: null,
    }));

    const getSessionMock = vi.fn(async () => ({ data: { session: null as any }, error: null }));
    const fromMock = vi.fn(() => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: null, error: null }),
        }),
      }),
      insert: async () => ({ error: null }),
      upsert: async () => ({ error: null }),
    }));

    mockSupabaseClient.auth.signUp = signUpMock;
    mockSupabaseClient.auth.getSession = getSessionMock;
    mockSupabaseClient.from = fromMock;

    let authValue: any;

    function Harness() {
      authValue = useAuth();
      return null;
    }

    await act(async () => {
      create(
        React.createElement(AuthProvider, null, React.createElement(Harness))
      );
    });

    let result: any;
    await act(async () => {
      result = await authValue.register({
        email: 'new-founder@example.com',
        password: 'Password123!',
        name: 'New Founder',
        businessName: 'New Business',
        phone: '0123456789',
        address: '123 Test Street',
        role: 'founder',
      });
    });

    expect(signUpMock).toHaveBeenCalled();
    expect(result.ok).toBe(true);
    expect(fromMock).not.toHaveBeenCalledWith('profiles');
  });

  it('keeps production runtime free of direct mock/local persistence usage in the audited paths', () => {
    const targetedFiles = [
      'app/(tabs)/dashboard.tsx',
      'app/(tabs)/inventory.tsx',
      'app/trip/[id]/index.tsx',
      'app/settings/index.tsx',
      'context/AuthContext.tsx',
    ];

    for (const relativePath of targetedFiles) {
      const absolutePath = `${process.cwd()}/${relativePath}`;
      const contents = fs.readFileSync(absolutePath, 'utf8');
      expect(contents).not.toMatch(/useMockDatabase|mockDatabase|localStorage|AsyncStorage/i);
    }
  });
});
