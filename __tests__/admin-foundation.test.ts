import { describe, expect, it } from 'vitest';

import {
  ADMIN_REQUIRED_ROUTE_KEYS,
  buildAdminDashboardSummaryFromRecords,
  canAccessAdminRoute,
  getAdminDashboardSummary,
  isAdminRole,
  normalizeAdminRole,
  type AdminDashboardSummary,
  type AdminSubscriptionSnapshot,
} from '../services/adminFoundation';

describe('admin foundation', () => {
  it('allows support users to access admin routes', () => {
    expect(isAdminRole('support')).toBe(true);
    expect(canAccessAdminRoute('support')).toBe(true);
    expect(normalizeAdminRole('SUPPORT')).toBe('support');
  });

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

  it('aggregates real admin metrics from business, subscription, payment, and finance records', () => {
    const summary = buildAdminDashboardSummaryFromRecords({
      businesses: [{ status: 'active' }, { status: 'active' }, { status: 'paused' }],
      subscriptions: [
        { status: 'active', payment_status: 'paid' },
        { status: 'active', payment_status: 'pending' },
        { status: 'trial', payment_status: 'pending' },
        { status: 'cancelled', payment_status: 'failed' },
      ],
      payments: [
        { payment_status: 'paid', amount: 2500 },
        { payment_status: 'pending', amount: 800 },
        { payment_status: 'failed', amount: 400 },
      ],
      financeTransactions: [
        { type: 'income', amount: 2500 },
        { type: 'income', amount: 800 },
        { type: 'expense', amount: 620 },
      ],
    });

    expect(summary.totalBusinesses).toBe(3);
    expect(summary.activeSubscriptions).toBe(2);
    expect(summary.pendingPayments).toBe(2);
    expect(summary.platformRevenue).toBe(3300);
    expect(summary.netProfit).toBe(2680);
  });
});
