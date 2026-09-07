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

export type AdminUserRecord = {
  id?: string | null;
  full_name?: string | null;
  email?: string | null;
  role?: string | null;
  business_id?: string | null;
};

export type AdminBusinessListRecord = {
  id?: string | null;
  name?: string | null;
  status?: string | null;
  created_at?: string | null;
};

export type AdminSubscriptionListRecord = {
  id?: string | null;
  business_id?: string | null;
  plan_name?: string | null;
  status?: string | null;
  payment_status?: string | null;
  started_at?: string | null;
  ends_at?: string | null;
};

export type AdminPaymentListRecord = {
  id?: string | null;
  business_id?: string | null;
  order_id?: string | null;
  payment_method?: string | null;
  payment_status?: string | null;
  amount?: number | string | null;
  created_at?: string | null;
};

export type AdminFinanceListRecord = {
  id?: string | null;
  business_id?: string | null;
  description?: string | null;
  amount?: number | string | null;
  type?: string | null;
  category?: string | null;
  created_at?: string | null;
};

export type AdminDashboardQueryResult = {
  businesses: AdminBusinessListRecord[];
  users: AdminUserRecord[];
  subscriptions: AdminSubscriptionListRecord[];
  payments: AdminPaymentListRecord[];
  financeTransactions: AdminFinanceListRecord[];
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

export async function loadAdminDashboardQueryResult(): Promise<AdminDashboardQueryResult> {
  const { getSupabaseClient } = await import('../services/supabaseClient');
  const client = getSupabaseClient();
  if (!client) {
    return {
      businesses: [],
      users: [],
      subscriptions: [],
      payments: [],
      financeTransactions: [],
    };
  }

  const [businesses, users, subscriptions, payments, financeTransactions] = await Promise.all([
    client.from('businesses').select('id,name,status,created_at').limit(1000),
    client.from('profiles').select('id,full_name,email,role,business_id').limit(1000),
    client.from('subscriptions').select('id,business_id,plan_name,status,payment_status,started_at,ends_at').limit(1000),
    client.from('payments').select('id,business_id,order_id,payment_method,payment_status,amount,created_at').limit(1000),
    client.from('finance_transactions').select('id,business_id,description,amount,type,category,created_at').limit(1000),
  ]);

  return {
    businesses: (businesses.data ?? []) as AdminBusinessListRecord[],
    users: (users.data ?? []) as AdminUserRecord[],
    subscriptions: (subscriptions.data ?? []) as AdminSubscriptionListRecord[],
    payments: (payments.data ?? []) as AdminPaymentListRecord[],
    financeTransactions: (financeTransactions.data ?? []) as AdminFinanceListRecord[],
  };
}

export async function loadAdminDashboardSummary(): Promise<AdminDashboardSummary> {
  const data = await loadAdminDashboardQueryResult();
  return buildAdminDashboardSummaryFromRecords(data);
}

export function getAdminPaymentStatusLabel(status: AdminPaymentSnapshot['paymentStatus']) {
  if (status === 'paid') return 'Paid';
  if (status === 'failed') return 'Failed';
  return 'Pending';
}
