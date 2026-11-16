// The customer layout verifies the role; the shared detail screen uses
// getForCustomer(profile.id, orderId), retaining order ownership and RLS checks.
export { default } from '../../../order/[id]/index';
