export type PlanType = 'FREE' | 'PREMIUM';

export const subscription = {
  plan: 'FREE' as PlanType,
  maxTrips: 2,
  maxProducts: 2,
};

export function upgradeToPremium() {
  subscription.plan = 'PREMIUM';
}

export function canAddTrip(currentTripCount: number) {
  if (subscription.plan === 'PREMIUM') {
    return true;
  }

  return currentTripCount < subscription.maxTrips;
}

export default function SubscriptionScreen() {
  return null;
}