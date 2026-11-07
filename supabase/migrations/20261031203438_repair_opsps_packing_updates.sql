-- Packing may change only packed_quantity on a paid order in packing status.
CREATE OR REPLACE FUNCTION public.opsps_packing_item_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
BEGIN
 IF ROW(NEW.id,NEW.business_id,NEW.order_id,NEW.product_variant_id,NEW.quantity,NEW.created_at)
    IS DISTINCT FROM ROW(OLD.id,OLD.business_id,OLD.order_id,OLD.product_variant_id,OLD.quantity,OLD.created_at)
    OR NEW.packed_quantity<0 OR NEW.packed_quantity>NEW.quantity THEN
   RAISE EXCEPTION 'Only valid packed quantity may change';
 END IF;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.opsps_packing_item_guard() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER opsps_packing_item_guard BEFORE UPDATE ON public.order_items
FOR EACH ROW EXECUTE FUNCTION public.opsps_packing_item_guard();
CREATE POLICY opsps_admin_pack_items ON public.order_items FOR UPDATE TO authenticated
USING (
 EXISTS(SELECT 1 FROM public.business_memberships bm WHERE bm.business_id=order_items.business_id AND bm.user_id=auth.uid() AND bm.role IN('founder','admin'))
 AND EXISTS(SELECT 1 FROM public.orders o WHERE o.id=order_items.order_id AND o.business_id=order_items.business_id AND o.payment_status='paid' AND o.order_status='packing')
)
WITH CHECK (
 EXISTS(SELECT 1 FROM public.business_memberships bm WHERE bm.business_id=order_items.business_id AND bm.user_id=auth.uid() AND bm.role IN('founder','admin'))
 AND EXISTS(SELECT 1 FROM public.orders o WHERE o.id=order_items.order_id AND o.business_id=order_items.business_id AND o.payment_status='paid' AND o.order_status='packing')
);
