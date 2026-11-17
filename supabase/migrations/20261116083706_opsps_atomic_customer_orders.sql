-- Customers may read only their own order lines, including a seller in another
-- business. The existing active-MYOPS-session restrictive policy remains.
CREATE POLICY order_items_customer_select ON public.order_items
FOR SELECT TO authenticated USING (
 EXISTS (SELECT 1 FROM public.orders o JOIN public.profiles p ON p.id=o.customer_profile_id
  WHERE o.id=order_items.order_id AND o.business_id=order_items.business_id AND p.auth_user_id=auth.uid())
);

-- Initial request only: no packing, no other customer's order, no draft product,
-- no extra line on an existing populated order, and no forged price/variant.
CREATE POLICY order_items_customer_insert ON public.order_items
FOR INSERT TO authenticated WITH CHECK (
 packed_quantity=0 AND quantity BETWEEN 1 AND 999
 AND EXISTS (
  SELECT 1 FROM public.orders o
  JOIN public.profiles customer ON customer.id=o.customer_profile_id
  JOIN public.products product ON product.id=o.product_id AND product.business_id=o.business_id
  JOIN public.product_variants variant ON variant.id=order_items.product_variant_id
    AND variant.product_id=product.id AND variant.business_id=o.business_id
  WHERE o.id=order_items.order_id AND o.business_id=order_items.business_id
   AND customer.auth_user_id=auth.uid() AND product.is_published
   AND o.order_status='pending' AND o.payment_status='pending'
   AND o.request_status='PENDING_AVAILABILITY' AND o.availability_status='pending'
   AND variant.stock>=order_items.quantity
   AND o.subtotal=product.selling_price*order_items.quantity
   AND o.total=o.subtotal+o.shipping_fee
 )
);

-- A trigger, rather than a self-referencing RLS expression, serializes the
-- initial line and rejects appending another line without recursive policies.
CREATE FUNCTION public.opsps_customer_order_line_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,auth,pg_temp AS $$
DECLARE own_order public.orders;
BEGIN
 IF auth.uid() IS NULL OR EXISTS(SELECT 1 FROM public.business_memberships
  WHERE business_id=NEW.business_id AND user_id=auth.uid() AND role IN('founder','admin')) THEN RETURN NEW; END IF;
 SELECT * INTO own_order FROM public.orders o WHERE o.id=NEW.order_id AND o.business_id=NEW.business_id
  AND EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=o.customer_profile_id AND p.auth_user_id=auth.uid()) FOR UPDATE;
 IF own_order.id IS NULL OR own_order.order_status<>'pending' OR own_order.payment_status<>'pending'
  OR own_order.request_status<>'PENDING_AVAILABILITY' THEN
  RAISE EXCEPTION 'Own pending customer request required' USING ERRCODE='42501'; END IF;
 -- Updating the locked parent also makes competing repeatable-read writers
 -- serialize instead of both observing an empty order.
 UPDATE public.orders SET updated_at=clock_timestamp() WHERE id=own_order.id;
 IF EXISTS(SELECT 1 FROM public.order_items WHERE order_id=own_order.id) THEN
  RAISE EXCEPTION 'Customer request already has an item' USING ERRCODE='42501'; END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.opsps_customer_order_line_guard() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER opsps_customer_order_line_guard BEFORE INSERT ON public.order_items
FOR EACH ROW EXECUTE FUNCTION public.opsps_customer_order_line_guard();

-- SECURITY INVOKER deliberately retains table RLS. A failing child INSERT
-- rolls the parent INSERT back as part of this one RPC transaction.
CREATE FUNCTION public.opsps_create_customer_order(
 p_business_id uuid,p_product_id uuid,p_variant_id uuid,p_quantity integer,
 p_customer_name text,p_customer_phone text,p_delivery_address text,
 p_payment_method text DEFAULT 'bank',p_shipping_fee numeric DEFAULT 0
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,auth,pg_temp AS $$
DECLARE product public.products; variant public.product_variants; customer_profile uuid; result public.orders; item_count integer;
BEGIN
 IF auth.uid() IS NULL OR NOT public.myops_app_session_active() THEN
  RAISE EXCEPTION 'Active MYOPS sign-in required' USING ERRCODE='42501'; END IF;
 IF p_quantity IS NULL OR p_quantity NOT BETWEEN 1 AND 999
  OR length(trim(coalesce(p_customer_name,''))) NOT BETWEEN 1 AND 120
  OR length(coalesce(p_customer_phone,'')) NOT BETWEEN 1 AND 40
  OR length(trim(coalesce(p_delivery_address,''))) NOT BETWEEN 1 AND 1000
  OR p_shipping_fee IS NULL OR p_shipping_fee<0 OR p_shipping_fee>999999.99 OR p_shipping_fee='NaN'::numeric
  OR p_payment_method IS NULL OR p_payment_method NOT IN ('bank','qr','cash') THEN
  RAISE EXCEPTION 'Invalid customer order'; END IF;
 SELECT id INTO customer_profile FROM public.profiles WHERE auth_user_id=auth.uid();
 IF customer_profile IS NULL THEN RAISE EXCEPTION 'Verified customer profile required' USING ERRCODE='42501'; END IF;
 SELECT * INTO product FROM public.products WHERE id=p_product_id AND business_id=p_business_id;
 IF product.id IS NULL OR (NOT product.is_published AND NOT EXISTS(
  SELECT 1 FROM public.business_memberships WHERE user_id=auth.uid() AND business_id=p_business_id AND role IN('founder','admin')
 )) THEN RAISE EXCEPTION 'Product unavailable' USING ERRCODE='42501'; END IF;
 SELECT * INTO variant FROM public.product_variants
  WHERE id=p_variant_id AND product_id=product.id AND business_id=p_business_id;
 IF variant.id IS NULL OR variant.stock<p_quantity THEN RAISE EXCEPTION 'Variant or stock unavailable'; END IF;
 IF product.selling_price<0 OR product.selling_price='NaN'::numeric THEN RAISE EXCEPTION 'Invalid product price'; END IF;
 INSERT INTO public.orders(business_id,trip_id,product_id,customer_profile_id,customer_name,customer_phone,delivery_address,
  order_date,subtotal,shipping_fee,total,payment_status,order_status,request_status,payment_option,payment_mode,availability_status)
 VALUES(p_business_id,product.trip_id,product.id,customer_profile,trim(p_customer_name),p_customer_phone,p_delivery_address,
  now(),product.selling_price*p_quantity,p_shipping_fee,product.selling_price*p_quantity+p_shipping_fee,
  'pending','pending','PENDING_AVAILABILITY',p_payment_method,p_payment_method,'pending') RETURNING * INTO result;
 INSERT INTO public.order_items(business_id,order_id,product_variant_id,quantity,packed_quantity)
 VALUES(p_business_id,result.id,p_variant_id,p_quantity,0);
 GET DIAGNOSTICS item_count=ROW_COUNT;
 IF item_count<>1 THEN RAISE EXCEPTION 'Order item not saved'; END IF;
 RETURN to_jsonb(result);
END $$;
REVOKE ALL ON FUNCTION public.opsps_create_customer_order(uuid,uuid,uuid,integer,text,text,text,text,numeric) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.opsps_create_customer_order(uuid,uuid,uuid,integer,text,text,text,text,numeric) TO authenticated;
