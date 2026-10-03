-- OpsPS Phase 5: strict delete and tenant-isolation hardening.
-- This migration adds the missing per-table delete RLS rules and keeps all
-- authorization anchored to trusted business_memberships data instead of client
-- supplied business_id values.

CREATE POLICY IF NOT EXISTS "businesses_member_delete"
  ON public.businesses
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.business_memberships bm
      WHERE bm.business_id = businesses.id
        AND bm.user_id = auth.uid()
        AND bm.role = 'founder'
    )
  );

CREATE POLICY IF NOT EXISTS "profiles_member_delete"
  ON public.profiles
  FOR DELETE
  USING (
    auth.uid() = auth_user_id
    OR EXISTS (
      SELECT 1
      FROM public.business_memberships bm
      WHERE bm.business_id = profiles.business_id
        AND bm.user_id = auth.uid()
        AND bm.role IN ('founder', 'admin')
    )
  );

CREATE POLICY IF NOT EXISTS "memberships_member_delete"
  ON public.business_memberships
  FOR DELETE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.business_memberships bm
      WHERE bm.business_id = business_memberships.business_id
        AND bm.user_id = auth.uid()
        AND bm.role = 'founder'
    )
  );

CREATE POLICY IF NOT EXISTS "trips_member_delete"
  ON public.trips
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.business_memberships bm
      WHERE bm.business_id = trips.business_id
        AND bm.user_id = auth.uid()
        AND bm.role IN ('founder', 'admin')
    )
  );

CREATE POLICY IF NOT EXISTS "products_member_delete"
  ON public.products
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.business_memberships bm
      WHERE bm.business_id = products.business_id
        AND bm.user_id = auth.uid()
        AND bm.role IN ('founder', 'admin')
    )
  );

CREATE POLICY IF NOT EXISTS "product_variants_member_delete"
  ON public.product_variants
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.business_memberships bm
      WHERE bm.business_id = product_variants.business_id
        AND bm.user_id = auth.uid()
        AND bm.role IN ('founder', 'admin')
    )
  );

CREATE POLICY IF NOT EXISTS "orders_member_delete"
  ON public.orders
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.business_memberships bm
      WHERE bm.business_id = orders.business_id
        AND bm.user_id = auth.uid()
        AND bm.role IN ('founder', 'admin')
    )
  );

CREATE POLICY IF NOT EXISTS "order_items_member_delete"
  ON public.order_items
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.business_memberships bm
      WHERE bm.business_id = order_items.business_id
        AND bm.user_id = auth.uid()
        AND bm.role IN ('founder', 'admin')
    )
  );

CREATE POLICY IF NOT EXISTS "payments_member_delete"
  ON public.payments
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.business_memberships bm
      WHERE bm.business_id = payments.business_id
        AND bm.user_id = auth.uid()
        AND bm.role IN ('founder', 'admin')
    )
  );

CREATE POLICY IF NOT EXISTS "shipments_member_delete"
  ON public.shipments
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.business_memberships bm
      WHERE bm.business_id = shipments.business_id
        AND bm.user_id = auth.uid()
        AND bm.role IN ('founder', 'admin')
    )
  );

CREATE POLICY IF NOT EXISTS "inventory_member_delete"
  ON public.inventory_movements
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.business_memberships bm
      WHERE bm.business_id = inventory_movements.business_id
        AND bm.user_id = auth.uid()
        AND bm.role IN ('founder', 'admin')
    )
  );

CREATE POLICY IF NOT EXISTS "finance_member_delete"
  ON public.finance_transactions
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.business_memberships bm
      WHERE bm.business_id = finance_transactions.business_id
        AND bm.user_id = auth.uid()
        AND bm.role IN ('founder', 'admin')
    )
  );

CREATE POLICY IF NOT EXISTS "subscriptions_member_delete"
  ON public.subscriptions
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.business_memberships bm
      WHERE bm.business_id = subscriptions.business_id
        AND bm.user_id = auth.uid()
        AND bm.role IN ('founder', 'admin')
    )
  );

CREATE POLICY IF NOT EXISTS "admin_users_member_delete"
  ON public.admin_users
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.business_memberships bm
      WHERE bm.business_id = admin_users.business_id
        AND bm.user_id = auth.uid()
        AND bm.role IN ('founder', 'admin')
    )
  );
