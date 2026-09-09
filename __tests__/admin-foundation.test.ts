import { describe, expect, it } from 'vitest';

import {
  ADMIN_REQUIRED_ROUTE_KEYS,
  approveSeller,
  buildAdminDashboardSummaryFromRecords,
  canAccessAdminRoute,
  canSellerUseBusinessPrivileges,
  getAdminDashboardSummary,
  isAdminRole,
  listPendingSellers,
  normalizeAdminRole,
  normalizeSellerVerificationStatus,
  rejectSeller,
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

  it('keeps founder seller verification defaulted to pending and blocks unapproved access', () => {
    expect(normalizeSellerVerificationStatus(undefined)).toBe('PENDING');
    expect(normalizeSellerVerificationStatus('rejected')).toBe('REJECTED');
    expect(canSellerUseBusinessPrivileges('founder', 'PENDING')).toBe(false);
    expect(canSellerUseBusinessPrivileges('founder', 'REJECTED')).toBe(false);
    expect(canSellerUseBusinessPrivileges('founder', 'APPROVED')).toBe(true);
    expect(canSellerUseBusinessPrivileges('customer', undefined)).toBe(true);
  });

  it('allows support/admin approval and rejection, but blocks non-admin review actions', () => {
    const approved = approveSeller({ businessId: 'biz-approve', reviewerRole: 'admin' });
    const rejected = rejectSeller({ businessId: 'biz-reject', reviewerRole: 'support' });
    const failedApproval = approveSeller({ businessId: 'biz-fail', reviewerRole: 'founder' });
    const failedRejection = rejectSeller({ businessId: 'biz-fail', reviewerRole: 'customer' });

    expect(approved.ok).toBe(true);
    expect(approved.status).toBe('APPROVED');
    expect(rejected.ok).toBe(true);
    expect(rejected.status).toBe('REJECTED');
    expect(failedApproval.ok).toBe(false);
    expect(failedRejection.ok).toBe(false);
  });

  it('lists only pending sellers and preserves founder/business scoping in the review queue', () => {
    const queue = listPendingSellers({
      businesses: [
        { id: 'biz-1', name: 'Northwind',seller_verification_status: 'PENDING', created_at: '2025-01-01T00:00:00Z' },
        { id: 'biz-2', name: 'Southwind', seller_verification_status: 'APPROVED', created_at: '2025-01-02T00:00:00Z' },
        { id: 'biz-3', name: 'Westwind', created_at: '2025-01-03T00:00:00Z' },
      ],
      profiles: [
        { business_id: 'biz-1', full_name: 'Alice', email: 'alice@example.com', role: 'founder', phone: '0123456789', address: 'Kuala Lumpur' },
        { business_id: 'biz-3', full_name: 'Bob', email: 'bob@example.com', role: 'founder' },
      ],
    });

    expect(queue.map((seller) => seller.businessId)).toEqual(['biz-1', 'biz-3']);
    expect(queue[0]?.founderEmail).toBe('alice@example.com');
    expect(queue[1]?.sellerVerificationStatus).toBe('PENDING');
  });
});
