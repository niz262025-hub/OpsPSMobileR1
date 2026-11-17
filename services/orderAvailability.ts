import type { SupabaseClient } from '@supabase/supabase-js';
export type AvailabilityDecision = 'PAY_NOW' | 'PAY_LATER' | 'NOT_AVAILABLE';
export async function confirmOrderAvailability(client: SupabaseClient, businessId: string, orderId: string, decision: AvailabilityDecision) {
  const { data, error } = await client.rpc('opsps_confirm_availability', { p_business_id: businessId, p_order_id: orderId, p_decision: decision });
  if (error || !data || data.id !== orderId || data.business_id !== businessId) throw new Error('Availability could not be confirmed. Refresh the order and check your access.');
}
