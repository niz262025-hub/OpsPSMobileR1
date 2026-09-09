export type AdminRole = 'admin' | 'support';
export type AppRole = 'founder' | 'customer' | 'admin' | 'support';
export type SellerVerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

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
  seller_verification_status?: string | null;
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
  seller_verification_status?: string | null;
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

const sellerVerificationState = new Map<string, SellerVerificationStatus>();

export function normalizeSellerVerificationStatus(value?: string | null): SellerVerificationStatus {
  const normalized = (value ?? '').trim().toUpperCase();
  if (normalized === 'APPROVED') return 'APPROVED';
  if (normalized === 'REJECTED') return 'REJECTED';
  return 'PENDING';
}

export function isSellerApproved(value?: string | null): boolean {
  return normalizeSellerVerificationStatus(value) === 'APPROVED';
}

export function canSellerUseBusinessPrivileges(role?: string | null, verificationStatus?: string | null): boolean {
  if (role !== 'founder') {
    return true;
  }

  return isSellerApproved(verificationStatus);
}

export function getSellerVerificationStatusForBusiness(businessId: string): SellerVerificationStatus {
  if (!businessId.trim()) {
    return 'PENDING';
  }

  return sellerVerificationState.get(businessId) ?? 'PENDING';
}

export function approveSeller(input: {
  businessId: string;
  reviewerRole?: string | null;
  reason?: string;
}): { ok: boolean; businessId: string; status: SellerVerificationStatus; message: string } {
  const businessId = (input.businessId ?? '').trim();
  if (!businessId) {
    return { ok: false, businessId: '', status: 'PENDING', message: 'Business ID is required.' };
  }

  if (!canAccessAdminRoute(input.reviewerRole)) {
    return { ok: false, businessId, status: 'PENDING', message: 'Only authorized admins can approve sellers.' };
  }

  sellerVerificationState.set(businessId, 'APPROVED');
  return { ok: true, businessId, status: 'APPROVED', message: 'Seller approved.' };
}

export function rejectSeller(input: {
  businessId: string;
  reviewerRole?: string | null;
  reason?: string;
}): { ok: boolean; businessId: string; status: SellerVerificationStatus; message: string } {
  const businessId = (input.businessId ?? '').trim();
  if (!businessId) {
    return { ok: false, businessId: '', status: 'PENDING', message: 'Business ID is required.' };
  }

  if (!canAccessAdminRoute(input.reviewerRole)) {
    return { ok: false, businessId, status: 'PENDING', message: 'Only authorized admins can reject sellers.' };
  }

  sellerVerificationState.set(businessId, 'REJECTED');
  return { ok: true, businessId, status: 'REJECTED', message: 'Seller rejected.' };
}

export type SellerReviewRecord = {
  businessId: string;
  businessName: string;
  founderName: string;
  founderEmail: string;
  phone?: string | null;
  address?: string | null;
  sellerVerificationStatus: SellerVerificationStatus;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export function listPendingSellers(input: {
  businesses?: Array<{ id?: string | null; name?: string | null; seller_verification_status?: string | null; status?: string | null; created_at?: string | null; updated_at?: string | null }>;
  profiles?: Array<{ business_id?: string | null; full_name?: string | null; email?: string | null; role?: string | null; phone?: string | null; address?: string | null }>;
} = {}): SellerReviewRecord[] {
  const businesses = input.businesses ?? [];
  const profiles = input.profiles ?? [];

  return businesses
    .filter((business) => normalizeSellerVerificationStatus((business as { seller_verification_status?: string | null }).seller_verification_status ?? getSellerVerificationStatusForBusiness(String(business.id ?? ''))) === 'PENDING')
    .map((business) => {
      const founderProfile = profiles.find((profile) => profile.business_id === business.id && (profile.role ?? '').toLowerCase() === 'founder');
      return {
        businessId: String(business.id ?? ''),
        businessName: String(business.name ?? 'Untitled business'),
        founderName: founderProfile?.full_name ?? 'Founder',
        founderEmail: founderProfile?.email ?? '',
        phone: founderProfile?.phone ?? undefined,
        address: founderProfile?.address ?? undefined,
        sellerVerificationStatus: normalizeSellerVerificationStatus((business as { seller_verification_status?: string | null }).seller_verification_status ?? getSellerVerificationStatusForBusiness(String(business.id ?? ''))),
        createdAt: business.created_at ?? null,
        updatedAt: business.updated_at ?? null,
      };
    })
    .filter((seller) => seller.businessId);
}

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
    client.from('businesses').select('id,name,status,seller_verification_status,created_at').limit(1000),
    client.from('profiles').select('id,full_name,email,role,business_id,phone,address').limit(1000),
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
