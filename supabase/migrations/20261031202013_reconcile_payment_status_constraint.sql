-- Reconcile the obsolete core check with the existing direct-payment lifecycle.
-- NOT NULL, the verification trigger, RLS and immutable payment fields remain enforced.
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_payment_status_check;
ALTER TABLE public.payments VALIDATE CONSTRAINT payments_status_direct_qr_check;

-- Replace recursive OLD-row lookups with a null-safe immutable-fields trigger.
CREATE OR REPLACE FUNCTION public.opsps_order_scope_immutable()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
BEGIN
 IF ROW(NEW.business_id,NEW.customer_profile_id,NEW.product_id,NEW.trip_id)
    IS DISTINCT FROM ROW(OLD.business_id,OLD.customer_profile_id,OLD.product_id,OLD.trip_id) THEN
   RAISE EXCEPTION 'Order tenant and ownership fields are immutable';
 END IF;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.opsps_order_scope_immutable() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER opsps_order_scope_immutable BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.opsps_order_scope_immutable();
DROP POLICY orders_member_or_customer_update ON public.orders;
CREATE POLICY orders_member_or_customer_update ON public.orders FOR UPDATE TO authenticated
USING (
 EXISTS(SELECT 1 FROM public.business_memberships bm WHERE bm.business_id=orders.business_id AND bm.user_id=auth.uid())
 OR EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=orders.customer_profile_id AND p.auth_user_id=auth.uid())
)
WITH CHECK (
 EXISTS(SELECT 1 FROM public.business_memberships bm WHERE bm.business_id=orders.business_id AND bm.user_id=auth.uid())
 OR EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=orders.customer_profile_id AND p.auth_user_id=auth.uid())
);

-- The later direct-QR admin policy and immutable-fields trigger already replace
-- this older recursive payment UPDATE policy.
DROP POLICY IF EXISTS payments_member_update ON public.payments;

-- One authorized, atomic manual verification: payment + order + finance.
CREATE OR REPLACE FUNCTION public.opsps_verify_manual_payment(p_business_id uuid,p_payment_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER
SET search_path = public, auth, pg_temp AS $$
DECLARE p public.payments%rowtype; o public.orders%rowtype;
BEGIN
 IF auth.uid() IS NULL OR NOT public.myops_app_session_active()
   OR NOT EXISTS(SELECT 1 FROM public.business_memberships WHERE business_id=p_business_id AND user_id=auth.uid() AND role IN('founder','admin')) THEN
   RAISE EXCEPTION 'Authorized active MYOPS business session required' USING ERRCODE='42501';
 END IF;
 SELECT * INTO p FROM public.payments WHERE id=p_payment_id AND business_id=p_business_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Payment unavailable'; END IF;
 SELECT * INTO o FROM public.orders WHERE id=p.order_id AND business_id=p_business_id FOR UPDATE;
 IF NOT FOUND OR o.order_status='cancelled' OR p.payment_method<>'DIRECT_QR'
   OR p.amount<>o.total OR p.amount<=0
   OR p.payment_status NOT IN('submitted','pending_verification','paid')
   OR (p.payment_status='paid' AND p.verified IS NOT TRUE)
   OR (nullif(btrim(p.receipt_uri),'') IS NULL AND nullif(btrim(p.customer_payment_reference),'') IS NULL) THEN
   RAISE EXCEPTION 'Payment evidence or amount is invalid';
 END IF;
 -- Preserve the existing orders pending -> pending_verification -> paid guard.
 IF o.payment_status='pending' THEN
   UPDATE public.orders SET payment_status='pending_verification',updated_at=now() WHERE id=o.id AND business_id=p_business_id;
 END IF;
 UPDATE public.payments SET payment_status='paid',verified=true,
   verified_at=coalesce(verified_at,now()),verified_by=coalesce(verified_by,auth.uid()),
   verification_event_id=coalesce(verification_event_id,'manual-'||p.id::text),updated_at=now()
   WHERE id=p.id AND business_id=p_business_id RETURNING * INTO p;
 UPDATE public.orders SET payment_status='paid',
   order_status=CASE WHEN order_status='pending' THEN 'payment_received' ELSE order_status END,
   request_status=CASE WHEN order_status IN('pending','payment_received') THEN 'PAYMENT_RECEIVED' ELSE request_status END,
   payment_verified_at=coalesce(payment_verified_at,now()),updated_at=now()
   WHERE id=o.id AND business_id=p_business_id;
 IF NOT EXISTS(SELECT 1 FROM public.finance_transactions WHERE business_id=p_business_id AND reference_id=p.id::text AND category='Payment Received') THEN
   INSERT INTO public.finance_transactions(business_id,trip_id,order_id,product_id,description,amount,type,payment_method,category,reference_id)
     VALUES(p_business_id,o.trip_id,o.id,o.product_id,'Payment Received',p.amount,'income',p.payment_method,'Payment Received',p.id::text);
 END IF;
 RETURN to_jsonb(p);
END;
$$;
REVOKE ALL ON FUNCTION public.opsps_verify_manual_payment(uuid,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.opsps_verify_manual_payment(uuid,uuid) TO authenticated;
