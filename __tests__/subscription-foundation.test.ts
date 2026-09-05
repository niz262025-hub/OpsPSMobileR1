import { describe, expect, it } from 'vitest';

import {
  canAccessAdminSubscriptionControls,
  canAccessFounderSubscriptionControls,
  canInspectSubscriptionState,
  isLifetimeSubscription,
  isSubscriptionActive,
  normalizeSubscriptionState,
  type SubscriptionRecord,
} from '../services/subscriptionFoundation';

describe('subscription foundation', () => {
  const activeSubscription: SubscriptionRecord = {
    businessId: 'business-1',
    userId: 'user-1',
    role: 'founder',
    plan: 'founder-lifetime',
    status: 'active',
    billingCycle: 'lifetime',
    startDate: '2026-01-01',
    renewalDate: null,
    isLifetime: true,
  };

  it('allows active subscription access', () => {
    expect(isSubscriptionActive(activeSubscription)).toBe(true);
    expect(canAccessFounderSubscriptionControls('founder', activeSubscription)).toBe(true);
  });

  it('restricts expired subscription access', () => {
    const expired: SubscriptionRecord = { ...activeSubscription, status: 'expired', renewalDate: '2026-02-01', isLifetime: false };
    expect(isSubscriptionActive(expired)).toBe(false);
    expect(canAccessFounderSubscriptionControls('founder', expired)).toBe(false);
  });

  it('restricts inactive subscription access', () => {
    const inactive: SubscriptionRecord = { ...activeSubscription, status: 'inactive', renewalDate: '2026-03-01' };
    expect(isSubscriptionActive(inactive)).toBe(false);
    expect(canAccessFounderSubscriptionControls('founder', inactive)).toBe(false);
  });

  it('keeps lifetime subscriptions active', () => {
    expect(isLifetimeSubscription(activeSubscription)).toBe(true);
    expect(isSubscriptionActive({ ...activeSubscription, status: 'active', billingCycle: 'lifetime' })).toBe(true);
  });

  it('allows admin to inspect subscription state', () => {
    expect(canInspectSubscriptionState('admin')).toBe(true);
    expect(canInspectSubscriptionState('support')).toBe(true);
  });

  it('prevents customer access to founder/admin subscription controls', () => {
    expect(canAccessFounderSubscriptionControls('customer', activeSubscription)).toBe(false);
    expect(canAccessAdminSubscriptionControls('customer')).toBe(false);
  });

  it('prevents founder access to admin controls', () => {
    expect(canAccessAdminSubscriptionControls('founder')).toBe(false);
    expect(normalizeSubscriptionState('ACTIVE')).toBe('active');
  });
});
