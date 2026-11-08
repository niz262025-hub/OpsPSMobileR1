import { describe, expect, it } from 'vitest';

import {
  canAccessAdminSubscriptionControls,
  canAccessFounderSubscriptionControls,
  canInspectSubscriptionState,
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

  it('matches the central seven-day policy and original MYOPS packages',()=>{
    expect(getMyopsSubscriptionEntitlement(0)).toMatchObject({id:'free_trial',monthlyPrice:0,trialDays:7,appCount:4});
    expect(getMyopsSubscriptionEntitlement(2)).toMatchObject({id:'two_apps',monthlyPrice:49,trialDays:7});
    expect(getMyopsSubscriptionEntitlement(4)).toMatchObject({id:'all_apps',monthlyPrice:79,trialDays:7,appCount:4});
    expect(getMyopsSubscriptionEntitlement(0,{founderLifetime:true})).toMatchObject({id:'founders_lifetime',monthlyPrice:null,oneTimePrice:29});
    expect(()=>getMyopsSubscriptionEntitlement(1)).toThrow(/MYOPS/);
    expect(()=>getMyopsSubscriptionEntitlement(0,{isSellerSignup:true})).toThrow(/separate/);
    for(const count of [-1,1.5,5,NaN])expect(()=>getMyopsSubscriptionEntitlement(count)).toThrow();
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
