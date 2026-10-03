-- OpsPS RLS hardening for membership updates and client grants.
-- This migration blocks self-escalation and tenant drift in update policies while
-- removing unnecessary client privileges without touching service_role.

DROP POLICY IF EXISTS "memberships_update_self_or_founder" ON public.business_memberships;
CREATE POLICY "memberships_update_self_or_founder"
  ON public.business_memberships
  FOR UPDATE
  USING (
    user_id = auth.uid()
    OR public.user_is_business_admin(business_id, auth.uid())
  )
  WITH CHECK (
    business_id = (
      SELECT existing.business_id
      FROM public.business_memberships existing
      WHERE existing.id = business_memberships.id
    )
    AND user_id = (
      SELECT existing.user_id
      FROM public.business_memberships existing
      WHERE existing.id = business_memberships.id
    )
    AND (
      (
        user_id = auth.uid()
        AND role IN ('customer', 'support')
      )
      OR (
        public.user_is_business_admin(business_id, auth.uid())
        AND (
          role IN ('customer', 'support', 'admin')
          OR (
            role = 'founder'
            AND public.user_is_business_founder(business_id, auth.uid())
          )
        )
      )
    )
  );

DROP POLICY IF EXISTS "profiles_update_self_or_business_leader" ON public.profiles;
CREATE POLICY "profiles_update_self_or_business_leader"
  ON public.profiles
  FOR UPDATE
  USING (
    auth.uid() = auth_user_id
    OR public.user_is_business_admin(business_id, auth.uid())
  )
  WITH CHECK (
    business_id = (
      SELECT existing.business_id
      FROM public.profiles existing
      WHERE existing.id = profiles.id
    )
    AND auth_user_id = (
      SELECT existing.auth_user_id
      FROM public.profiles existing
      WHERE existing.id = profiles.id
    )
    AND (
      (
        auth.uid() = auth_user_id
        AND role IN ('customer', 'support')
      )
      OR (
        public.user_is_business_admin(business_id, auth.uid())
        AND (
          role IN ('customer', 'support', 'admin')
          OR (
            role = 'founder'
            AND public.user_is_business_founder(business_id, auth.uid())
          )
        )
      )
    )
  );

DROP POLICY IF EXISTS "trips_member_update" ON public.trips;
CREATE POLICY "trips_member_update"
  ON public.trips
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.business_memberships bm
      WHERE bm.business_id = trips.business_id
        AND bm.user_id = auth.uid()
        AND bm.role IN ('founder', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.business_memberships bm
      WHERE bm.business_id = trips.business_id
        AND bm.user_id = auth.uid()
        AND bm.role IN ('founder', 'admin')
    )
    AND business_id = (
      SELECT existing.business_id
      FROM public.trips existing
      WHERE existing.id = trips.id
    )
  );

DROP POLICY IF EXISTS "products_member_update" ON public.products;
CREATE POLICY "products_member_update"
  ON public.products
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.business_memberships bm
      WHERE bm.business_id = products.business_id
        AND bm.user_id = auth.uid()
        AND bm.role IN ('founder', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.business_memberships bm
      WHERE bm.business_id = products.business_id
        AND bm.user_id = auth.uid()
        AND bm.role IN ('founder', 'admin')
    )
    AND business_id = (
      SELECT existing.business_id
      FROM public.products existing
      WHERE existing.id = products.id
    )
    AND trip_id = (
      SELECT existing.trip_id
      FROM public.products existing
      WHERE existing.id = products.id
    )
  );

DROP POLICY IF EXISTS "product_variants_member_update" ON public.product_variants;
CREATE POLICY "product_variants_member_update"
  ON public.product_variants
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.business_memberships bm
      WHERE bm.business_id = product_variants.business_id
        AND bm.user_id = auth.uid()
        AND bm.role IN ('founder', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.business_memberships bm
      WHERE bm.business_id = product_variants.business_id
        AND bm.user_id = auth.uid()
        AND bm.role IN ('founder', 'admin')
    )
    AND business_id = (
      SELECT existing.business_id
      FROM public.product_variants existing
      WHERE existing.id = product_variants.id
    )
    AND product_id = (
      SELECT existing.product_id
      FROM public.product_variants existing
      WHERE existing.id = product_variants.id
    )
  );

DROP POLICY IF EXISTS "orders_member_or_customer_update" ON public.orders;
CREATE POLICY "orders_member_or_customer_update"
  ON public.orders
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.business_memberships bm
      WHERE bm.business_id = orders.business_id
        AND bm.user_id = auth.uid()
    )
    OR (
      orders.customer_profile_id IS NOT NULL
      AND auth.uid() = (
        SELECT p.auth_user_id
        FROM public.profiles p
        WHERE p.id = orders.customer_profile_id
      )
    )
  )
  WITH CHECK (
    (
      EXISTS (
        SELECT 1
        FROM public.business_memberships bm
        WHERE bm.business_id = orders.business_id
          AND bm.user_id = auth.uid()
      )
      AND business_id = (
        SELECT existing.business_id
        FROM public.orders existing
        WHERE existing.id = orders.id
      )
      AND customer_profile_id = (
        SELECT existing.customer_profile_id
        FROM public.orders existing
        WHERE existing.id = orders.id
      )
      AND product_id = (
        SELECT existing.product_id
        FROM public.orders existing
        WHERE existing.id = orders.id
      )
      AND trip_id = (
        SELECT existing.trip_id
        FROM public.orders existing
        WHERE existing.id = orders.id
      )
    )
    OR (
      orders.customer_profile_id IS NOT NULL
      AND auth.uid() = (
        SELECT p.auth_user_id
        FROM public.profiles p
        WHERE p.id = orders.customer_profile_id
      )
      AND business_id = (
        SELECT existing.business_id
        FROM public.orders existing
        WHERE existing.id = orders.id
      )
      AND customer_profile_id = (
        SELECT existing.customer_profile_id
        FROM public.orders existing
        WHERE existing.id = orders.id
      )
      AND product_id = (
        SELECT existing.product_id
        FROM public.orders existing
        WHERE existing.id = orders.id
      )
      AND trip_id = (
        SELECT existing.trip_id
        FROM public.orders existing
        WHERE existing.id = orders.id
      )
    )
  );

DROP POLICY IF EXISTS "businesses_update_member_founder_admin" ON public.businesses;
CREATE POLICY "businesses_update_member_founder_admin"
  ON public.businesses
  FOR UPDATE
  USING (public.user_is_business_admin(id, auth.uid()))
  WITH CHECK (public.user_is_business_admin(id, auth.uid()));

DROP POLICY IF EXISTS "businesses_seller_verification_admin_update" ON public.businesses;
CREATE POLICY "businesses_seller_verification_admin_update"
  ON public.businesses
  FOR UPDATE
  USING (public.can_manage_seller_verification(id))
  WITH CHECK (public.can_manage_seller_verification(id));

-- Least privilege: keep authenticated access for business flows while removing
-- client-side write powers that are never required and preventing future broad grants.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE TRUNCATE, TRIGGER, REFERENCES ON ALL TABLES IN SCHEMA public FROM anon, authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE TRUNCATE, TRIGGER, REFERENCES ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;

GRANT SELECT ON TABLE public.products TO anon;
GRANT SELECT ON TABLE public.product_variants TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.admin_users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.business_memberships TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.businesses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.finance_transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.inventory_movements TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.order_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.orders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.payments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.product_variants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.products TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.shipments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.subscriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.trips TO authenticated;
