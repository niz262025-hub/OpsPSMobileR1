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

export type AdminBusinessRecord = {
  status?: string | null;
};

export type AdminSubscriptionRecord = {
  status?: string | null;
  payment_status?: string | null;
};

export type AdminPaymentRecord = {
  payment_status?: string | null;
  amount?: number | string | null;
};

export type AdminFinanceRecord = {
  type?: string | null;
  amount?: number | string | null;
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

export function buildAdminDashboardSummaryFromRecords(input: {
  businesses?: AdminBusinessRecord[];
  subscriptions?: AdminSubscriptionRecord[];
  payments?: AdminPaymentRecord[];
  financeTransactions?: AdminFinanceRecord[];
} = {}): AdminDashboardSummary {
  const businesses = input.businesses ?? [];
  const subscriptions = input.subscriptions ?? [];
  const payments = input.payments ?? [];
  const financeTransactions = input.financeTransactions ?? [];

  const activeSubscriptions = subscriptions.filter((row) => (row.status ?? '').toLowerCase() === 'active').length;
  const pendingPayments = payments.filter((row) => {
    const status = (row.payment_status ?? '').toLowerCase();
    return status !== 'paid' && status !== 'refunded';
  }).length;
  const platformRevenue = payments.reduce((total, row) => {
    const status = (row.payment_status ?? '').toLowerCase();
    if (status === 'failed' || status === 'cancelled' || status === 'refunded') {
      return total;
    }
    const amount = Number(row.amount ?? 0);
    return Number.isFinite(amount) ? total + amount : total;
  }, 0);
  const operatingExpenses = financeTransactions.reduce((total, row) => {
    if ((row.type ?? '').toLowerCase() !== 'expense') {
      return total;
    }
    const amount = Number(row.amount ?? 0);
    return Number.isFinite(amount) ? total + amount : total;
  }, 0);

  return {
    totalBusinesses: businesses.length,
    activeSubscriptions,
    pendingPayments,
    platformRevenue,
    netProfit: platformRevenue - operatingExpenses,
  };
}

export function getAdminPaymentStatusLabel(status: AdminPaymentSnapshot['paymentStatus']) {
  if (status === 'paid') return 'Paid';
  if (status === 'failed') return 'Failed';
  return 'Pending';
}
