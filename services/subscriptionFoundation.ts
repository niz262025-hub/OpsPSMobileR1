import type { UserRole } from '../context/AuthContext';

export type SubscriptionPlan =
  | 'free'
  | 'founder-lifetime'
  | 'standard-monthly'
  | 'team-user-addon';

export type SubscriptionStatus =
  | 'active'
  | 'inactive'
  | 'expired'
  | 'trial'
  | 'cancelled';

export type SubscriptionBillingCycle = 'lifetime' | 'monthly';

export type SubscriptionPaymentState =
  | 'not_required'
  | 'pending'
  | 'completed'
  | 'overdue';

export type SubscriptionRecord = {
  businessId: string;
  userId: string;
  role: UserRole;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  billingCycle: SubscriptionBillingCycle;
  startDate: string;
  expiryDate?: string | null;
  renewalDate?: string | null;
  isLifetime: boolean;
  paymentState?: SubscriptionPaymentState;
  lastUpdated?: string;
};

export const OPSPS_PLAN_DEFINITIONS = {
  free: {
    label: 'Free Access',
    billingCycle: 'monthly',
    notes: 'Limited free access for basic usage.',
  },
  'founder-lifetime': {
    label: 'Founder Lifetime',
    billingCycle: 'lifetime',
    notes: 'One-time founder lifetime access.',
  },
  'standard-monthly': {
    label: 'Standard Monthly',
    billingCycle: 'monthly',
    notes: 'RM49/month recurring access for active business operations.',
  },
  'team-user-addon': {
    label: 'Team User Add-on',
    billingCycle: 'monthly',
    notes: 'Per-user add-on for users needing team access.',
  },
} as const;

export type MyopsSubscriptionEntitlementId =
  | 'starter'
  | 'single_app'
  | 'two_apps'
  | 'all_apps'
  | 'opshub_seller';

export type MyopsSubscriptionEntitlement = {
  id: MyopsSubscriptionEntitlementId;
  label: string;
  monthlyPrice: number;
  currency: 'MYR';
  appCount: number;
  limitDescription?: string;
  trialDays: number;
  isFree: boolean;
};

export const MYOPS_SUBSCRIPTION_ENTITLEMENTS: Record<
  MyopsSubscriptionEntitlementId,
  MyopsSubscriptionEntitlement
> = {
  starter: {
    id: 'starter',
    label: 'Starter',
    monthlyPrice: 9.9,
    currency: 'MYR',
    appCount: 1,
    limitDescription: 'Limited usage; exact app limits are defined by the product feature gate.',
    trialDays: 14,
    isFree: false,
  },
  single_app: {
    id: 'single_app',
    label: 'Single paid app',
    monthlyPrice: 19.9,
    currency: 'MYR',
    appCount: 1,
    trialDays: 14,
    isFree: false,
  },
  two_apps: {
    id: 'two_apps',
    label: 'Any 2 paid apps',
    monthlyPrice: 29.9,
    currency: 'MYR',
    appCount: 2,
    trialDays: 14,
    isFree: false,
  },
  all_apps: {
    id: 'all_apps',
    label: 'All 3 paid apps',
    monthlyPrice: 39.9,
    currency: 'MYR',
    appCount: 3,
    trialDays: 14,
    isFree: false,
  },
  opshub_seller: {
    id: 'opshub_seller',
    label: 'OpsHub seller signup',
    monthlyPrice: 0,
    currency: 'MYR',
    appCount: 0,
    trialDays: 0,
    isFree: true,
  },
};

export const MYOPS_INTRODUCTORY_PRICING = MYOPS_SUBSCRIPTION_ENTITLEMENTS;

export function getMyopsSubscriptionEntitlement(
  paidAppCount: number,
  opts: { isSellerSignup?: boolean } = {}
): MyopsSubscriptionEntitlement {
  if (opts.isSellerSignup) {
    return MYOPS_SUBSCRIPTION_ENTITLEMENTS.opshub_seller;
  }

  if (paidAppCount <= 0) {
    return MYOPS_SUBSCRIPTION_ENTITLEMENTS.starter;
  }

  if (paidAppCount === 1) {
    return MYOPS_SUBSCRIPTION_ENTITLEMENTS.single_app;
  }

  if (paidAppCount === 2) {
    return MYOPS_SUBSCRIPTION_ENTITLEMENTS.two_apps;
  }

  return MYOPS_SUBSCRIPTION_ENTITLEMENTS.all_apps;
}

export const getMyopsIntroductoryPrice = (paidAppCount: number, opts?: { isSellerSignup?: boolean }): number =>
  getMyopsSubscriptionEntitlement(paidAppCount, opts).monthlyPrice;

export const getMyopsEntitlementTier = getMyopsSubscriptionEntitlement;
export const resolveMyopsSubscriptionPricing = getMyopsSubscriptionEntitlement;

export type MyopsCommissionRateTier = {
  minimumGmv: number;
  maximumGmv?: number;
  rate: number;
};

export const MYOPS_MARKETPLACE_COMMISSION_TIERS: MyopsCommissionRateTier[] = [
  { minimumGmv: 0, maximumGmv: 999.99, rate: 0.03 },
  { minimumGmv: 1000, maximumGmv: 9999.99, rate: 0.02 },
  { minimumGmv: 10000, rate: 0.015 },
];

export function getMarketplaceCommissionRate(gmv: number): number {
  const subtotal = Number(gmv) || 0;

  if (subtotal < 1000) return 0.03;
  if (subtotal < 10000) return 0.02;
  return 0.015;
}

export function createCommissionRateSnapshot(
  gmv: number,
  effectiveTimestamp: string = new Date().toISOString()
): {
  effectiveAt: string;
  gmv: number;
  rate: number;
  ratePercent: number;
  currency: 'MYR';
} {
  const rate = getMarketplaceCommissionRate(gmv);
  return {
    effectiveAt: effectiveTimestamp,
    gmv: Number(gmv) || 0,
    rate,
    ratePercent: Number((rate * 100).toFixed(4)),
    currency: 'MYR',
  };
}

export function calculateMarketplaceCommission(input: {
  eligibleSubtotal?: number;
  shipping?: number;
  tax?: number;
  refundAmount?: number;
  gmv?: number;
  rate?: number;
  effectiveAt?: string;
} = {}): {
  eligibleSubtotal: number;
  commission: number;
  rate: number;
  refundAmount: number;
  snapshot: ReturnType<typeof createCommissionRateSnapshot>;
} {
  const eligibleSubtotal = Math.max(0, Number(input.eligibleSubtotal ?? input.gmv ?? 0) || 0);
  const refundAmount = Number(input.refundAmount ?? 0) || 0;
  const gmv = Math.max(0, Number(input.gmv ?? eligibleSubtotal) || 0);
  const rate = input.rate ?? getMarketplaceCommissionRate(gmv);
  const commission = Math.max(0, eligibleSubtotal * rate - refundAmount);

  return {
    eligibleSubtotal,
    commission,
    rate,
    refundAmount,
    snapshot: createCommissionRateSnapshot(gmv, input.effectiveAt ?? new Date().toISOString()),
  };
}

export const calculateSellerCommission = calculateMarketplaceCommission;
export const getSellerCommissionRate = getMarketplaceCommissionRate;

export function normalizeSubscriptionState(
  value?: string | null
): SubscriptionStatus {
  const normalized = (value ?? '').trim().toLowerCase();

  if (normalized === 'active' || normalized === 'trial') return normalized;
  if (normalized === 'inactive') return 'inactive';
  if (normalized === 'expired') return 'expired';
  if (normalized === 'cancelled') return 'cancelled';

  return 'inactive';
}

export function isLifetimeSubscription(
  record?: Partial<SubscriptionRecord> | null
): boolean {
  if (!record) return false;
  if (record.isLifetime === true) return true;
  if (record.billingCycle === 'lifetime') return true;
  return false;
}

export function isSubscriptionActive(
  record?: Partial<SubscriptionRecord> | null
): boolean {
  if (!record) {
    return false;
  }

  const status = normalizeSubscriptionState(record.status ?? 'active');
  if (status === 'active' || status === 'trial') {
    if (isLifetimeSubscription(record)) {
      return true;
    }

    if (record.expiryDate) {
      const expiryDate = new Date(record.expiryDate);
      if (!Number.isNaN(expiryDate.getTime())) {
        return expiryDate.getTime() > Date.now();
      }
    }

    return true;
  }

  return false;
}

export function canInspectSubscriptionState(role?: string | null): boolean {
  return role === 'admin' || role === 'support';
}

export function canAccessAdminSubscriptionControls(role?: string | null): boolean {
  return role === 'admin';
}

export function canAccessFounderSubscriptionControls(
  role?: string | null,
  record?: Partial<SubscriptionRecord> | null
): boolean {
  if (role !== 'founder') {
    return false;
  }

  if (!record) {
    return false;
  }

  return isSubscriptionActive(record);
}

export function getDefaultSubscriptionForRole(
  role: UserRole,
  businessId: string,
  userId: string
): SubscriptionRecord {
  const today = new Date();
  const start = today.toISOString().slice(0, 10);

  if (role === 'founder') {
    return {
      businessId,
      userId,
      role,
      plan: 'founder-lifetime',
      status: 'active',
      billingCycle: 'lifetime',
      startDate: start,
      expiryDate: null,
      renewalDate: null,
      isLifetime: true,
      paymentState: 'not_required',
      lastUpdated: new Date().toISOString(),
    };
  }

  if (role === 'support' || role === 'admin') {
    return {
      businessId,
      userId,
      role,
      plan: 'free',
      status: 'active',
      billingCycle: 'monthly',
      startDate: start,
      expiryDate: null,
      renewalDate: null,
      isLifetime: false,
      paymentState: 'not_required',
      lastUpdated: new Date().toISOString(),
    };
  }

  return {
    businessId,
    userId,
    role,
    plan: 'free',
    status: 'active',
    billingCycle: 'monthly',
    startDate: start,
    expiryDate: null,
    renewalDate: null,
    isLifetime: false,
    paymentState: 'not_required',
    lastUpdated: new Date().toISOString(),
  };
}
