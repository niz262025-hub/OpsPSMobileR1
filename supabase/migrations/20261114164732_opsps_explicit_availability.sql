-- A stock lookup is advisory; only a scoped merchant can confirm availability.
CREATE OR REPLACE FUNCTION public.opsps_confirm_availability(p_business_id uuid,p_order_id uuid,p_decision text)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,auth,pg_temp AS $$
DECLARE o public.orders%rowtype;
BEGIN
 IF auth.uid() IS NULL OR NOT public.myops_app_session_active() OR NOT EXISTS (
  SELECT 1 FROM public.business_memberships WHERE business_id=p_business_id AND user_id=auth.uid() AND role IN ('founder','admin')
 ) THEN RAISE EXCEPTION 'Authorized active MYOPS business session required' USING ERRCODE='42501'; END IF;
 IF p_decision IS NULL OR p_decision NOT IN ('PAY_NOW','PAY_LATER','NOT_AVAILABLE') THEN RAISE EXCEPTION 'Invalid availability decision'; END IF;
 SELECT * INTO o FROM public.orders WHERE id=p_order_id AND business_id=p_business_id FOR UPDATE;
 IF NOT FOUND OR o.order_status<>'pending' OR o.payment_status<>'pending' OR o.availability_status='confirmed' THEN
  RAISE EXCEPTION 'Pending availability order required'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.order_items WHERE order_id=o.id AND business_id=p_business_id AND quantity>0) THEN
  RAISE EXCEPTION 'Order items required'; END IF;
 UPDATE public.orders SET
  availability_status=CASE WHEN p_decision='NOT_AVAILABLE' THEN 'not_available' ELSE 'confirmed' END,
  request_status=CASE p_decision WHEN 'PAY_NOW' THEN 'PAYMENT_REQUIRED' WHEN 'PAY_LATER' THEN 'PAY_LATER_OFFERED' ELSE 'OUT_OF_STOCK' END,
  payment_option=CASE WHEN p_decision='NOT_AVAILABLE' THEN NULL ELSE p_decision END,
  payment_mode=CASE p_decision WHEN 'PAY_NOW' THEN 'customer_pays_first' WHEN 'PAY_LATER' THEN 'ps_buy_first_pay_later' ELSE NULL END,
  payment_requested_at=CASE WHEN p_decision='PAY_NOW' THEN now() ELSE NULL END,
  payment_status=CASE WHEN p_decision='PAY_LATER' THEN 'pay_later' ELSE 'pending' END,
  order_status=CASE WHEN p_decision='NOT_AVAILABLE' THEN 'cancelled' ELSE 'pending' END,updated_at=now()
 WHERE id=o.id AND business_id=p_business_id RETURNING * INTO o;
 RETURN to_jsonb(o);
END; $$;
REVOKE ALL ON FUNCTION public.opsps_confirm_availability(uuid,uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.opsps_confirm_availability(uuid,uuid,text) TO authenticated;

-- Also protect direct table writes: UI visibility is not authorization.
CREATE OR REPLACE FUNCTION public.opsps_availability_write_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,auth,pg_temp AS $$
BEGIN
 IF TG_OP='INSERT' THEN
  IF auth.uid() IS NOT NULL AND (coalesce(NEW.availability_status,'pending')<>'pending' OR NEW.payment_requested_at IS NOT NULL) THEN
   RAISE EXCEPTION 'New orders require merchant availability confirmation';
  END IF;
  RETURN NEW;
 END IF;
 IF ROW(NEW.availability_status,NEW.payment_option,NEW.payment_mode,NEW.payment_requested_at)
  IS DISTINCT FROM ROW(OLD.availability_status,OLD.payment_option,OLD.payment_mode,OLD.payment_requested_at)
  AND (auth.uid() IS NULL OR NOT public.myops_app_session_active() OR NOT EXISTS (
   SELECT 1 FROM public.business_memberships WHERE business_id=OLD.business_id AND user_id=auth.uid() AND role IN ('founder','admin')
  )) THEN RAISE EXCEPTION 'Merchant availability confirmation required' USING ERRCODE='42501'; END IF;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.opsps_availability_write_guard() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER opsps_availability_write_guard BEFORE INSERT OR UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.opsps_availability_write_guard();

CREATE OR REPLACE FUNCTION public.opsps_payment_availability_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,auth,pg_temp AS $$
BEGIN
 IF NEW.order_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM public.orders WHERE id=NEW.order_id AND business_id=NEW.business_id
   AND availability_status='confirmed' AND payment_requested_at IS NOT NULL AND order_status<>'cancelled'
 ) THEN RAISE EXCEPTION 'Founder must confirm availability and request payment first'; END IF;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.opsps_payment_availability_guard() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER opsps_payment_availability_guard BEFORE INSERT ON public.payments FOR EACH ROW EXECUTE FUNCTION public.opsps_payment_availability_guard();
