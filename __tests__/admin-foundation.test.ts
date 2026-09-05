import { describe, expect, it } from 'vitest';

import {
  ADMIN_REQUIRED_ROUTE_KEYS,
  canAccessAdminRoute,
  getAdminDashboardSummary,
  isAdminRole,
  normalizeAdminRole,
  type AdminDashboardSummary,
  type AdminSubscriptionSnapshot,
} from '../services/adminFoundation';

describe('admin foundation', () => {
  it('recognizes admin role', () => {
    expect(isAdminRole('admin')).toBe(true);
    expect(isAdminRole('founder')).toBe(false);
    expect(isAdminRole('customer')).toBe(false);
  });

  it('prevents founder access to admin routes', () => {
    expect(canAccessAdminRoute('founder')).toBe(false);
  });

  it('prevents customer access to admin routes', () => {
    expect(canAccessAdminRoute('customer')).toBe(false);
  });

  it('allows admin-only access', () => {
    expect(canAccessAdminRoute('admin')).toBe(true);
    expect(normalizeAdminRole('ADMIN')).toBe('admin');
  });

  it('provides admin subscription/payment/dashboard contracts', () => {
    const dashboard: AdminDashboardSummary = getAdminDashboardSummary();
    const subscription: AdminSubscriptionSnapshot = {
      businessId: 'business-1',
      planName: 'OpsPS Founder',
      status: 'active',
      paymentStatus: 'paid',
      nextBillingDate: '2026-10-01',
      revenueShare: 12,
    };

    expect(dashboard.totalBusinesses).toBeGreaterThanOrEqual(0);
    expect(ADMIN_REQUIRED_ROUTE_KEYS).toEqual(
      expect.arrayContaining(['users', 'businesses', 'subscriptions', 'payments'])
    );
    expect(subscription.planName).toBe('OpsPS Founder');
    expect(subscription.status).toBe('active');
    expect(subscription.paymentStatus).toBe('paid');
  });
});
