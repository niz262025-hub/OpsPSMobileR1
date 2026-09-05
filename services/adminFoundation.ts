export type AdminRole = 'admin' | 'support';
export type AppRole = 'founder' | 'customer' | 'admin' | 'support';

export const ADMIN_REQUIRED_ROUTE_KEYS = [
  'users',
  'businesses',
  'subscriptions',
  'payments',
  'revenue',
] as const;

export type AdminRouteKey = (typeof ADMIN_REQUIRED_ROUTE_KEYS)[number];

export type AdminSubscriptionSnapshot = {
  businessId: string;
  planName: string;
  status: 'trial' | 'active' | 'paused' | 'cancelled' | 'expired';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'overdue';
  nextBillingDate?: string;
  revenueShare?: number;
};

export type AdminPaymentSnapshot = {
  orderId: string;
  businessId: string;
  customerName: string;
  amount: number;
  paymentStatus: 'pending' | 'paid' | 'failed';
  createdAt: string;
};

export type AdminDashboardSummary = {
  totalBusinesses: number;
  activeSubscriptions: number;
  pendingPayments: number;
  platformRevenue: number;
  netProfit: number;
};

export function normalizeAdminRole(value?: string | null): AdminRole | null {
  const normalized = (value ?? '').trim().toLowerCase();
  if (normalized === 'admin') return 'admin';
  if (normalized === 'support') return 'support';
  return null;
}

export function isAdminRole(value?: string | null): boolean {
  return normalizeAdminRole(value) !== null;
}

export function canAccessAdminRoute(role?: string | null): boolean {
  return normalizeAdminRole(role) !== null;
}

export function getAdminDashboardSummary(
  input: Partial<AdminDashboardSummary> = {}
): AdminDashboardSummary {
  return {
    totalBusinesses: input.totalBusinesses ?? 0,
    activeSubscriptions: input.activeSubscriptions ?? 0,
    pendingPayments: input.pendingPayments ?? 0,
    platformRevenue: input.platformRevenue ?? 0,
    netProfit: input.netProfit ?? 0,
  };
}

export function getAdminPaymentStatusLabel(status: AdminPaymentSnapshot['paymentStatus']) {
  if (status === 'paid') return 'Paid';
  if (status === 'failed') return 'Failed';
  return 'Pending';
}
