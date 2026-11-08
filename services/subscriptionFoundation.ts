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
    notes: 'Subscription selection and manual renewal are managed in MYOPS.',
  },
  'team-user-addon': {
    label: 'Team User Add-on',
    billingCycle: 'monthly',
    notes: 'Per-user add-on for users needing team access.',
  },
} as const;

// Display metadata only. Central signed MYOPS entitlement remains the access boundary.
export type MyopsSubscriptionEntitlementId = 'free_trial' | 'founders_lifetime' | 'two_apps' | 'all_apps';
export type MyopsSubscriptionEntitlement = {
 id:MyopsSubscriptionEntitlementId;label:string;monthlyPrice:number|null;oneTimePrice?:number;
 currency:'MYR';appCount:number;trialDays:number;isFree:boolean;
};
export const MYOPS_SUBSCRIPTION_ENTITLEMENTS:Record<MyopsSubscriptionEntitlementId,MyopsSubscriptionEntitlement>={
 free_trial:{id:'free_trial',label:'Free Trial',monthlyPrice:0,currency:'MYR',appCount:4,trialDays:7,isFree:true},
 founders_lifetime:{id:'founders_lifetime',label:'First 100 Subscribers',monthlyPrice:null,oneTimePrice:29,currency:'MYR',appCount:4,trialDays:7,isFree:false},
 two_apps:{id:'two_apps',label:'Normal Subscription',monthlyPrice:49,currency:'MYR',appCount:2,trialDays:7,isFree:false},
 all_apps:{id:'all_apps',label:'All Apps',monthlyPrice:79,currency:'MYR',appCount:4,trialDays:7,isFree:false},
};
export const MYOPS_INTRODUCTORY_PRICING=MYOPS_SUBSCRIPTION_ENTITLEMENTS;
export function getMyopsSubscriptionEntitlement(paidAppCount:number,opts:{isSellerSignup?:boolean;founderLifetime?:boolean}={}):MyopsSubscriptionEntitlement {
 if(opts.isSellerSignup)throw new Error('OpsHub is separate from MYOPS subscriptions.');
 if(!Number.isInteger(paidAppCount)||paidAppCount<0||paidAppCount>4)throw new Error('Invalid MYOPS app selection.');
 if(opts.founderLifetime)return MYOPS_SUBSCRIPTION_ENTITLEMENTS.founders_lifetime;
 if(paidAppCount===0)return MYOPS_SUBSCRIPTION_ENTITLEMENTS.free_trial;
 if(paidAppCount===2)return MYOPS_SUBSCRIPTION_ENTITLEMENTS.two_apps;
 if(paidAppCount>=3)return MYOPS_SUBSCRIPTION_ENTITLEMENTS.all_apps;
 throw new Error('Choose a current plan in MYOPS; no single-app offer is configured.');
}
export const getMyopsIntroductoryPrice=(count:number,opts?:{isSellerSignup?:boolean;founderLifetime?:boolean}):number|null=>getMyopsSubscriptionEntitlement(count,opts).monthlyPrice;
export const getMyopsEntitlementTier=getMyopsSubscriptionEntitlement;
export const resolveMyopsSubscriptionPricing=getMyopsSubscriptionEntitlement;

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
