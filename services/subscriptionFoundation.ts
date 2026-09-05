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
    return true;
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
    return true;
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
