-- Additive hardening for OpsPS functions only; OpsFlow objects are excluded.
ALTER FUNCTION public.validate_order_status_transition() SET search_path = public, pg_temp;
ALTER FUNCTION public.validate_payment_status_transition() SET search_path = public, pg_temp;
ALTER FUNCTION public.validate_shipment_status_transition() SET search_path = public, pg_temp;
REVOKE EXECUTE ON FUNCTION public.get_authenticated_user_id(), public.user_is_business_member(uuid,uuid), public.user_is_business_admin(uuid,uuid), public.user_is_business_founder(uuid,uuid), public.can_manage_seller_verification(uuid), public.is_approved_seller_for_business(uuid) FROM PUBLIC, anon;
-- Trigger functions are invoked by triggers, never directly through browser RPC.
REVOKE EXECUTE ON FUNCTION public.validate_order_status_transition(), public.validate_payment_status_transition(), public.validate_shipment_status_transition(), public.direct_qr_payment_verified_gate(), public.ensure_founder_business_starts_pending(), public.payments_admin_update_immutable_fields() FROM PUBLIC, anon, authenticated;
