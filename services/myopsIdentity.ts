export type VerifiedAppRole = 'founder' | 'customer' | 'admin' | 'support';

export function verifiedIdentityRole(
  userId: string,
  profile: { auth_user_id?: string | null; business_id?: string | null; role?: string | null } | null,
  membership: { user_id?: string | null; business_id?: string | null; role?: string | null } | null,
  business: { id?: string | null } | null,
): VerifiedAppRole {
  if (!profile || !membership || !business || profile.auth_user_id !== userId || membership.user_id !== userId
    || !business.id || profile.business_id !== business.id || membership.business_id !== business.id
    || !['founder','customer','admin','support'].includes(membership.role ?? '')
    || (profile.role !== membership.role && !(profile.role === 'admin' && membership.role === 'support'))) {
    throw new Error('OpsPS identity is not available. Reopen OpsPS from MYOPS.');
  }
  return membership.role as VerifiedAppRole;
}
