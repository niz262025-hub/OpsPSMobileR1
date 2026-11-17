-- Preserve tenant/link immutability without self-referencing UPDATE policies.
CREATE OR REPLACE FUNCTION public.opsps_preserve_trip_product_scope()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
BEGIN
 IF NEW.business_id IS DISTINCT FROM OLD.business_id OR NEW.id IS DISTINCT FROM OLD.id THEN
  RAISE EXCEPTION 'Trip/product ownership is immutable' USING ERRCODE='42501';
 END IF;
 IF TG_TABLE_NAME='products' AND to_jsonb(NEW)->'trip_id' IS DISTINCT FROM to_jsonb(OLD)->'trip_id' THEN
  RAISE EXCEPTION 'Product trip is immutable' USING ERRCODE='42501';
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.opsps_preserve_trip_product_scope() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS opsps_trip_scope_immutable ON public.trips;
CREATE TRIGGER opsps_trip_scope_immutable BEFORE UPDATE ON public.trips FOR EACH ROW EXECUTE FUNCTION public.opsps_preserve_trip_product_scope();
DROP TRIGGER IF EXISTS opsps_product_scope_immutable ON public.products;
CREATE TRIGGER opsps_product_scope_immutable BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.opsps_preserve_trip_product_scope();
DROP POLICY IF EXISTS trips_member_update ON public.trips;
CREATE POLICY trips_member_update ON public.trips FOR UPDATE TO authenticated
 USING (EXISTS (SELECT 1 FROM public.business_memberships bm WHERE bm.business_id=trips.business_id AND bm.user_id=auth.uid() AND bm.role IN ('founder','admin')))
 WITH CHECK (EXISTS (SELECT 1 FROM public.business_memberships bm WHERE bm.business_id=trips.business_id AND bm.user_id=auth.uid() AND bm.role IN ('founder','admin')));
DROP POLICY IF EXISTS products_member_update ON public.products;
CREATE POLICY products_member_update ON public.products FOR UPDATE TO authenticated
 USING (EXISTS (SELECT 1 FROM public.business_memberships bm WHERE bm.business_id=products.business_id AND bm.user_id=auth.uid() AND bm.role IN ('founder','admin')))
 WITH CHECK (EXISTS (SELECT 1 FROM public.business_memberships bm WHERE bm.business_id=products.business_id AND bm.user_id=auth.uid() AND bm.role IN ('founder','admin')));

-- Trip lock serializes closure/retry; expense inserts and status commit together.
CREATE OR REPLACE FUNCTION public.opsps_close_trip(p_business_id uuid,p_trip_id uuid,p_entries jsonb DEFAULT '[]'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
DECLARE t public.trips; e jsonb; amount_value numeric; existing public.finance_transactions;
BEGIN
 IF NOT public.myops_app_session_active() OR NOT EXISTS (
  SELECT 1 FROM public.business_memberships WHERE business_id=p_business_id AND user_id=auth.uid() AND role IN ('founder','admin')
 ) THEN RAISE EXCEPTION 'Authorized active merchant required' USING ERRCODE='42501'; END IF;
 IF jsonb_typeof(p_entries) IS DISTINCT FROM 'array' OR jsonb_array_length(p_entries)>30 THEN RAISE EXCEPTION 'Invalid trip entries'; END IF;
 SELECT * INTO t FROM public.trips WHERE id=p_trip_id AND business_id=p_business_id FOR UPDATE;
 IF t.id IS NULL THEN RAISE EXCEPTION 'Trip not found'; END IF;
 IF t.status='closed' THEN RETURN to_jsonb(t); END IF;
 FOR e IN SELECT value FROM jsonb_array_elements(p_entries) LOOP
  IF jsonb_typeof(e) IS DISTINCT FROM 'object' OR coalesce(e->>'category','') NOT IN ('Trip Expense','Cost of Goods')
   OR length(coalesce(e->>'description','')) NOT BETWEEN 1 AND 500
   OR length(coalesce(e->>'paymentMethod','')) NOT BETWEEN 1 AND 50
   OR coalesce(e->>'referenceId','') !~ '^trip-(expense|cogs):[A-Za-z0-9_-]{1,120}$'
   OR coalesce(e->>'amount','') !~ '^[0-9]+([.][0-9]{1,2})?$' THEN RAISE EXCEPTION 'Invalid trip entry'; END IF;
  amount_value=(e->>'amount')::numeric;
  IF amount_value<=0 OR amount_value>99999999.99 THEN RAISE EXCEPTION 'Invalid trip amount'; END IF;
  SELECT * INTO existing FROM public.finance_transactions WHERE business_id=p_business_id AND reference_id=e->>'referenceId' LIMIT 1;
  IF existing.id IS NOT NULL THEN
   IF existing.trip_id IS DISTINCT FROM p_trip_id OR existing.amount<>amount_value OR existing.type<>'expense'
    OR existing.category IS DISTINCT FROM e->>'category' OR existing.description IS DISTINCT FROM e->>'description'
    OR existing.payment_method IS DISTINCT FROM e->>'paymentMethod' THEN RAISE EXCEPTION 'Trip entry reference conflict'; END IF;
  ELSE
   INSERT INTO public.finance_transactions(business_id,trip_id,description,amount,type,payment_method,category,reference_id)
   VALUES(p_business_id,p_trip_id,e->>'description',amount_value,'expense',e->>'paymentMethod',e->>'category',e->>'referenceId');
  END IF;
 END LOOP;
 UPDATE public.trips SET status='closed' WHERE id=p_trip_id AND business_id=p_business_id RETURNING * INTO t;
 RETURN to_jsonb(t);
END $$;
REVOKE ALL ON FUNCTION public.opsps_close_trip(uuid,uuid,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.opsps_close_trip(uuid,uuid,jsonb) TO authenticated;
