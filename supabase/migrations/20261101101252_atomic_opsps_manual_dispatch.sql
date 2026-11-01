CREATE OR REPLACE FUNCTION public.opsps_variant_scope_immutable()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
BEGIN
 IF ROW(NEW.id,NEW.business_id,NEW.product_id) IS DISTINCT FROM ROW(OLD.id,OLD.business_id,OLD.product_id) OR NEW.stock<0 THEN RAISE EXCEPTION 'Variant scope is immutable and stock cannot be negative'; END IF;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.opsps_variant_scope_immutable() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER opsps_variant_scope_immutable BEFORE UPDATE ON public.product_variants FOR EACH ROW EXECUTE FUNCTION public.opsps_variant_scope_immutable();
DROP POLICY product_variants_member_update ON public.product_variants;
CREATE POLICY product_variants_member_update ON public.product_variants FOR UPDATE TO authenticated
USING(EXISTS(SELECT 1 FROM public.business_memberships bm WHERE bm.business_id=product_variants.business_id AND bm.user_id=auth.uid() AND bm.role IN('founder','admin')))
WITH CHECK(EXISTS(SELECT 1 FROM public.business_memberships bm WHERE bm.business_id=product_variants.business_id AND bm.user_id=auth.uid() AND bm.role IN('founder','admin')));
CREATE OR REPLACE FUNCTION public.opsps_shipment_scope_immutable()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
BEGIN
 IF ROW(NEW.id,NEW.business_id,NEW.order_id) IS DISTINCT FROM ROW(OLD.id,OLD.business_id,OLD.order_id) THEN RAISE EXCEPTION 'Shipment scope is immutable'; END IF;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.opsps_shipment_scope_immutable() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER opsps_shipment_scope_immutable BEFORE UPDATE ON public.shipments FOR EACH ROW EXECUTE FUNCTION public.opsps_shipment_scope_immutable();
CREATE POLICY opsps_complete_manual_shipment ON public.shipments FOR UPDATE TO authenticated
USING(status='created' AND tracking_number IS NULL AND EXISTS(SELECT 1 FROM public.business_memberships bm WHERE bm.business_id=shipments.business_id AND bm.user_id=auth.uid() AND bm.role IN('founder','admin')))
WITH CHECK(status='shipped' AND tracking_number IS NULL AND EXISTS(SELECT 1 FROM public.business_memberships bm WHERE bm.business_id=shipments.business_id AND bm.user_id=auth.uid() AND bm.role IN('founder','admin')));
CREATE OR REPLACE FUNCTION public.opsps_dispatch_manual_order(p_business_id uuid,p_order_id uuid,p_courier text,p_weight numeric)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,auth,pg_temp AS $$
DECLARE o public.orders%rowtype; s public.shipments%rowtype; item record; available integer; existing_count integer;
BEGIN
 IF auth.uid() IS NULL OR NOT public.myops_app_session_active() OR NOT EXISTS(SELECT 1 FROM public.business_memberships WHERE business_id=p_business_id AND user_id=auth.uid() AND role IN('founder','admin')) THEN RAISE EXCEPTION 'Authorized active MYOPS business session required' USING ERRCODE='42501'; END IF;
 IF nullif(btrim(p_courier),'') IS NULL OR p_weight IS NULL OR p_weight<=0 OR p_weight>9999 OR p_weight='NaN'::numeric THEN RAISE EXCEPTION 'Courier and valid parcel weight required'; END IF;
 SELECT * INTO o FROM public.orders WHERE id=p_order_id AND business_id=p_business_id FOR UPDATE;
 IF NOT FOUND OR o.payment_status<>'paid' OR o.order_status NOT IN('ready','shipped') OR nullif(btrim(o.customer_name),'') IS NULL OR nullif(btrim(o.customer_phone),'') IS NULL OR nullif(btrim(o.delivery_address),'') IS NULL THEN RAISE EXCEPTION 'Paid ready order and recipient details required'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.order_items WHERE order_id=o.id AND business_id=p_business_id) OR EXISTS(SELECT 1 FROM public.order_items WHERE order_id=o.id AND business_id=p_business_id AND packed_quantity<>quantity) THEN RAISE EXCEPTION 'Packing incomplete'; END IF;
 SELECT count(*) INTO existing_count FROM public.shipments WHERE order_id=o.id AND business_id=p_business_id;
 IF existing_count>1 THEN RAISE EXCEPTION 'Duplicate shipment records require review'; END IF;
 SELECT * INTO s FROM public.shipments WHERE order_id=o.id AND business_id=p_business_id;
 IF s.id IS NOT NULL AND EXISTS(SELECT 1 FROM public.inventory_movements WHERE business_id=p_business_id AND reference_id=o.id::text AND source='manual_dispatch') THEN RETURN to_jsonb(s); END IF;
 FOR item IN SELECT product_variant_id,sum(quantity)::integer quantity FROM public.order_items WHERE order_id=o.id AND business_id=p_business_id GROUP BY product_variant_id ORDER BY product_variant_id LOOP
   SELECT stock INTO available FROM public.product_variants WHERE id=item.product_variant_id AND business_id=p_business_id FOR UPDATE;
   IF NOT FOUND OR available<item.quantity THEN RAISE EXCEPTION 'Insufficient stock for dispatch'; END IF;
   UPDATE public.product_variants SET stock=stock-item.quantity,updated_at=now() WHERE id=item.product_variant_id AND business_id=p_business_id;
   INSERT INTO public.inventory_movements(business_id,product_variant_id,delta,reason,source,reference_id) VALUES(p_business_id,item.product_variant_id,-item.quantity,'Order dispatched','manual_dispatch',o.id::text);
 END LOOP;
 IF s.id IS NULL THEN
   INSERT INTO public.shipments(business_id,order_id,courier,status,recipient_name,recipient_phone,delivery_address,parcel_weight,quantity,parcel_type,shipping_cost) VALUES(p_business_id,o.id,btrim(p_courier),'shipped',o.customer_name,o.customer_phone,o.delivery_address,p_weight,1,'Parcel',0) RETURNING * INTO s;
 ELSE
   UPDATE public.shipments SET status='shipped',recipient_name=o.customer_name,recipient_phone=o.customer_phone,delivery_address=o.delivery_address,parcel_weight=p_weight,updated_at=now() WHERE id=s.id AND business_id=p_business_id RETURNING * INTO s;
   IF NOT FOUND THEN RAISE EXCEPTION 'Existing shipment cannot be safely completed'; END IF;
 END IF;
 UPDATE public.orders SET order_status='shipped',request_status='SHIPPED',updated_at=now() WHERE id=o.id AND business_id=p_business_id;
 RETURN to_jsonb(s);
END; $$;
REVOKE ALL ON FUNCTION public.opsps_dispatch_manual_order(uuid,uuid,text,numeric) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.opsps_dispatch_manual_order(uuid,uuid,text,numeric) TO authenticated;
