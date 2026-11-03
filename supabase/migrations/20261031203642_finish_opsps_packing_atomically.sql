CREATE OR REPLACE FUNCTION public.opsps_finish_packing(p_business_id uuid,p_order_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,auth,pg_temp AS $$
DECLARE o public.orders%rowtype;
BEGIN
 IF auth.uid() IS NULL OR NOT public.myops_app_session_active()
 OR NOT EXISTS(SELECT 1 FROM public.business_memberships WHERE business_id=p_business_id AND user_id=auth.uid() AND role IN('founder','admin')) THEN
 RAISE EXCEPTION 'Authorized active MYOPS business session required' USING ERRCODE='42501'; END IF;
 SELECT * INTO o FROM public.orders WHERE id=p_order_id AND business_id=p_business_id FOR UPDATE;
 IF NOT FOUND OR o.payment_status<>'paid' OR o.order_status NOT IN('packing','ready') THEN RAISE EXCEPTION 'Paid packing order required'; END IF;
 PERFORM id FROM public.order_items WHERE order_id=o.id AND business_id=p_business_id FOR UPDATE;
 IF NOT EXISTS(SELECT 1 FROM public.order_items WHERE order_id=o.id AND business_id=p_business_id)
 OR EXISTS(SELECT 1 FROM public.order_items WHERE order_id=o.id AND business_id=p_business_id AND packed_quantity<>quantity) THEN RAISE EXCEPTION 'Packing incomplete'; END IF;
 UPDATE public.orders SET order_status='ready',request_status='READY_TO_SHIP',updated_at=now() WHERE id=o.id AND business_id=p_business_id RETURNING * INTO o;
 RETURN to_jsonb(o);
END; $$;
REVOKE ALL ON FUNCTION public.opsps_finish_packing(uuid,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.opsps_finish_packing(uuid,uuid) TO authenticated;
