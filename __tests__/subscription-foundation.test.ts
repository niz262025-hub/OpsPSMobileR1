import { describe, expect, it } from 'vitest';

import {
  calculateMarketplaceCommission,
  canAccessAdminSubscriptionControls,
  canAccessFounderSubscriptionControls,
  canInspectSubscriptionState,
  getMarketplaceCommissionRate,
  getMyopsSubscriptionEntitlement,
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

  it('defines MYOPS introductory pricing and commission tiers for the approved plan mix', () => {
    expect(getMyopsSubscriptionEntitlement(0)).toMatchObject({ id: 'starter', monthlyPrice: 9.9, trialDays: 14 });
    expect(getMyopsSubscriptionEntitlement(1)).toMatchObject({ id: 'single_app', monthlyPrice: 19.9, trialDays: 14 });
    expect(getMyopsSubscriptionEntitlement(2)).toMatchObject({ id: 'two_apps', monthlyPrice: 29.9, trialDays: 14 });
    expect(getMyopsSubscriptionEntitlement(3)).toMatchObject({ id: 'all_apps', monthlyPrice: 39.9, trialDays: 14 });
    expect(getMyopsSubscriptionEntitlement(0, { isSellerSignup: true })).toMatchObject({ id: 'opshub_seller', monthlyPrice: 0, isFree: true });
    expect(getMarketplaceCommissionRate(999.99)).toBeCloseTo(0.03, 6);
    expect(getMarketplaceCommissionRate(1000)).toBeCloseTo(0.02, 6);
    expect(getMarketplaceCommissionRate(10000)).toBeCloseTo(0.015, 6);
    expect(calculateMarketplaceCommission({ eligibleSubtotal: 1000 }).commission).toBeCloseTo(20, 6);
  });

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

  it('denies access when no subscription state is present', () => {
    expect(isSubscriptionActive()).toBe(false);
    expect(isSubscriptionActive(null)).toBe(false);
    expect(canAccessFounderSubscriptionControls('founder')).toBe(false);
    expect(canAccessFounderSubscriptionControls('founder', null)).toBe(false);
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
