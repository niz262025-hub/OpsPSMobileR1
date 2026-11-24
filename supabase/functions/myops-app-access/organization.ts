import { isUuid } from './contract.ts';

export type ScopedMapping = { opsps_user_id: string; business_id: string };
type Lookup = {
  mapping: (organizationId: string, userRef: string) => Promise<ScopedMapping | null>;
  membership: (userId: string, businessId: string) => Promise<boolean>;
};
/** Verify an operator-provisioned link, never create one from a name or email. */
export async function resolveScopedWorkspace(organizationId: string, userRef: string, identityUserId: string, lookup: Lookup): Promise<ScopedMapping | null> {
  if (!isUuid(organizationId) || !isUuid(identityUserId) || !/^[A-Za-z0-9_-]{43}$/.test(userRef)) return null;
  const mapping = await lookup.mapping(organizationId.toLowerCase(), userRef);
  if (!mapping || mapping.opsps_user_id !== identityUserId || !isUuid(mapping.business_id)) return null;
  if (!await lookup.membership(identityUserId, mapping.business_id)) return null;
  return mapping;
}
