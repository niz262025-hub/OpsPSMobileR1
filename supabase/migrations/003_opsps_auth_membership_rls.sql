-- OpsPS Phase 1 repair: tenant isolation and auth membership integrity.
-- This migration keeps the existing business/profile model, then hardens it with
-- explicit RLS and lifecycle guards for the flows already used by the app.

ALTER TABLE IF EXISTS public.businesses
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.profiles
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.business_memberships
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.trips
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.products
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.product_variants
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.orders
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.order_items
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.payments
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.shipments
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.inventory_movements
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.finance_transactions
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.subscriptions
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.admin_users
  ENABLE ROW LEVEL SECURITY;

-- Founder bootstrap: a user may create their own business and business membership.
CREATE POLICY IF NOT EXISTS "businesses_insert_self_owned"
  ON public.businesses
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
  );

CREATE POLICY IF NOT EXISTS "businesses_member_select"
  ON public.businesses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.business_memberships bm
      WHERE bm.business_id = businesses.id
        AND bm.user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "businesses_member_update"
  ON public.businesses
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.business_memberships bm
      WHERE bm.business_id = businesses.id
        AND bm.user_id = auth.uid()
        AND bm.role IN ('founder', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.business_memberships bm
      WHERE bm.business_id = businesses.id
        AND bm.user_id = auth.uid()
        AND bm.role IN ('founder', 'admin')
    )
  );

CREATE POLICY IF NOT EXISTS "profiles_select_self_or_member"
  ON public.profiles
  FOR SELECT
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1
      FROM public.business_memberships bm
      WHERE bm.business_id = profiles.business_id
        AND bm.user_id = auth.uid()
    )
    OR (
      profiles.business_id IS NULL
      AND auth.uid() = profiles.auth_user_id
    )
  );

CREATE POLICY IF NOT EXISTS "profiles_insert_self_or_founder"
  ON public.profiles
  FOR INSERT
  WITH CHECK (
    auth.uid() = auth_user_id
    OR EXISTS (
      SELECT 1
      FROM public.business_memberships bm
      WHERE bm.business_id = profiles.business_id
        AND bm.user_id = auth.uid()
        AND bm.role IN ('founder', 'admin')
    )
  );

CREATE POLICY IF NOT EXISTS "profiles_update_self_or_founder"
  ON public.profiles
  FOR UPDATE
  USING (
    auth.uid() = auth_user_id
    OR EXISTS (
      SELECT 1
      FROM public.business_memberships bm
      WHERE bm.business_id = profiles.business_id
        AND bm.user_id = auth.uid()
        AND bm.role IN ('founder', 'admin')
    )
  )
  WITH CHECK (
    auth.uid() = auth_user_id
    OR EXISTS (
      SELECT 1
      FROM public.business_memberships bm
      WHERE bm.business_id = profiles.business_id
        AND bm.user_id = auth.uid()
        AND bm.role IN ('founder', 'admin')
    )
  );

CREATE POLICY IF NOT EXISTS "memberships_select_self_and_members"
  ON public.business_memberships
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.business_memberships bm
      WHERE bm.business_id = business_memberships.business_id
        AND bm.user_id = auth.uid()
        AND bm.role IN ('founder', 'admin')
    )
  );

CREATE POLICY IF NOT EXISTS "memberships_insert_self_or_founder"
  ON public.business_memberships
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.business_memberships bm
      WHERE bm.business_id = business_memberships.business_id
        AND bm.user_id = auth.uid()
        AND bm.role IN ('founder', 'admin')
    )
  );

CREATE POLICY IF NOT EXISTS "memberships_update_self_or_founder"
  ON public.business_memberships
  FOR UPDATE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.business_memberships bm
      WHERE bm.business_id = business_memberships.business_id
        AND bm.user_id = auth.uid()
        AND bm.role IN ('founder', 'admin')
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.business_memberships bm
      WHERE bm.business_id = business_memberships.business_id
        AND bm.user_id = auth.uid()
        AND bm.role IN ('founder', 'admin')
    )
  );

CREATE POLICY IF NOT EXISTS "memberships_delete_founders_only"
  ON public.business_memberships
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.business_memberships bm
      WHERE bm.business_id = business_memberships.business_id
        AND bm.user_id = auth.uid()
        AND bm.role = 'founder'
    )
  );

-- Business-scoped tables are only readable to members of the owning business.
CREATE POLICY IF NOT EXISTS "trips_member_select"
  ON public.trips
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.business_memberships bm
      WHERE bm.business_id = trips.business_id
        AND bm.user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "trips_member_write"
  ON public.trips
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.business_memberships bm
      WHERE bm.business_id = trips.business_id
        AND bm.user_id = auth.uid()
        AND bm.role IN ('founder', 'admin')
    )
  );

CREATE POLICY IF NOT EXISTS "trips_member_update"
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
  );

CREATE POLICY IF NOT EXISTS "products_public_or_member_select"
  ON public.products
  FOR SELECT
  USING (
    is_published = true
    OR EXISTS (
      SELECT 1
      FROM public.business_memberships bm
      WHERE bm.business_id = products.business_id
        AND bm.user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "products_member_write"
  ON public.products
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.business_memberships bm
      WHERE bm.business_id = products.business_id
        AND bm.user_id = auth.uid()
        AND bm.role IN ('founder', 'admin')
    )
  );

CREATE POLICY IF NOT EXISTS "products_member_update"
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
  );

CREATE POLICY IF NOT EXISTS "product_variants_member_select"
  ON public.product_variants
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.business_memberships bm
      WHERE bm.business_id = product_variants.business_id
        AND bm.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.products p
      WHERE p.id = product_variants.product_id
        AND p.is_published = true
    )
  );

CREATE POLICY IF NOT EXISTS "product_variants_member_write"
  ON public.product_variants
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.business_memberships bm
      WHERE bm.business_id = product_variants.business_id
        AND bm.user_id = auth.uid()
        AND bm.role IN ('founder', 'admin')
    )
  );

CREATE POLICY IF NOT EXISTS "product_variants_member_update"
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
  );

CREATE POLICY IF NOT EXISTS "orders_member_or_customer_select"
  ON public.orders
  FOR SELECT
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
  );

CREATE POLICY IF NOT EXISTS "orders_member_or_customer_insert"
  ON public.orders
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.business_memberships bm
      WHERE bm.business_id = orders.business_id
        AND bm.user_id = auth.uid()
        AND bm.role IN ('founder', 'admin')
    )
    OR (
      orders.customer_profile_id IS NOT NULL
      AND auth.uid() = (
        SELECT p.auth_user_id
        FROM public.profiles p
        WHERE p.id = orders.customer_profile_id
      )
    )
  );

CREATE POLICY IF NOT EXISTS "orders_member_or_customer_update"
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
  );

CREATE POLICY IF NOT EXISTS "order_items_member_select"
  ON public.order_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.business_memberships bm
      WHERE bm.business_id = order_items.business_id
        AND bm.user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "order_items_member_write"
  ON public.order_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.business_memberships bm
      WHERE bm.business_id = order_items.business_id
        AND bm.user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "payments_member_select"
  ON public.payments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.business_memberships bm
      WHERE bm.business_id = payments.business_id
        AND bm.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.orders o
      JOIN public.profiles p
        ON p.id = o.customer_profile_id
      WHERE o.id = payments.order_id
        AND p.auth_user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "payments_member_write"
  ON public.payments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.business_memberships bm
      WHERE bm.business_id = payments.business_id
        AND bm.user_id = auth.uid()
        AND bm.role IN ('founder', 'admin')
    )
  );

CREATE POLICY IF NOT EXISTS "shipments_member_select"
  ON public.shipments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.business_memberships bm
      WHERE bm.business_id = shipments.business_id
        AND bm.user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "shipments_member_write"
  ON public.shipments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.business_memberships bm
      WHERE bm.business_id = shipments.business_id
        AND bm.user_id = auth.uid()
        AND bm.role IN ('founder', 'admin')
    )
  );

CREATE POLICY IF NOT EXISTS "inventory_member_select"
  ON public.inventory_movements
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.business_memberships bm
      WHERE bm.business_id = inventory_movements.business_id
        AND bm.user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "inventory_member_write"
  ON public.inventory_movements
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.business_memberships bm
      WHERE bm.business_id = inventory_movements.business_id
        AND bm.user_id = auth.uid()
        AND bm.role IN ('founder', 'admin')
    )
  );

CREATE POLICY IF NOT EXISTS "finance_member_select"
  ON public.finance_transactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.business_memberships bm
      WHERE bm.business_id = finance_transactions.business_id
        AND bm.user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "finance_member_write"
  ON public.finance_transactions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.business_memberships bm
      WHERE bm.business_id = finance_transactions.business_id
        AND bm.user_id = auth.uid()
        AND bm.role IN ('founder', 'admin')
    )
  );

CREATE POLICY IF NOT EXISTS "subscriptions_member_select"
  ON public.subscriptions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.business_memberships bm
      WHERE bm.business_id = subscriptions.business_id
        AND bm.user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "subscriptions_member_write"
  ON public.subscriptions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.business_memberships bm
      WHERE bm.business_id = subscriptions.business_id
        AND bm.user_id = auth.uid()
        AND bm.role IN ('founder', 'admin')
    )
  );

CREATE POLICY IF NOT EXISTS "admin_users_member_select"
  ON public.admin_users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.business_memberships bm
      WHERE bm.business_id = admin_users.business_id
        AND bm.user_id = auth.uid()
        AND bm.role IN ('founder', 'admin')
    )
  );

CREATE POLICY IF NOT EXISTS "admin_users_member_write"
  ON public.admin_users
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.business_memberships bm
      WHERE bm.business_id = admin_users.business_id
        AND bm.user_id = auth.uid()
        AND bm.role IN ('founder', 'admin')
    )
  );

-- Database-side lifecycle enforcement: allow only the business process states
-- used by the existing OpsPS UI and mock flow, and disallow arbitrary jumps.
CREATE OR REPLACE FUNCTION public.validate_order_status_transition()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_status NOT IN ('pending', 'payment_received', 'packing', 'ready', 'shipped', 'delivered', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid order status';
  END IF;

  IF OLD.order_status = 'pending' AND NEW.order_status NOT IN ('pending', 'payment_received', 'packing', 'ready', 'cancelled') THEN
    RAISE EXCEPTION 'Order status transition not allowed from pending';
  END IF;

  IF OLD.order_status = 'payment_received' AND NEW.order_status NOT IN ('payment_received', 'packing', 'ready', 'cancelled') THEN
    RAISE EXCEPTION 'Order status transition not allowed from payment_received';
  END IF;

  IF OLD.order_status = 'packing' AND NEW.order_status NOT IN ('packing', 'ready', 'cancelled') THEN
    RAISE EXCEPTION 'Order status transition not allowed from packing';
  END IF;

  IF OLD.order_status = 'ready' AND NEW.order_status NOT IN ('ready', 'shipped', 'cancelled') THEN
    RAISE EXCEPTION 'Order status transition not allowed from ready';
  END IF;

  IF OLD.order_status = 'shipped' AND NEW.order_status NOT IN ('shipped', 'delivered', 'cancelled') THEN
    RAISE EXCEPTION 'Order status transition not allowed from shipped';
  END IF;

  IF OLD.order_status = 'delivered' AND NEW.order_status NOT IN ('delivered') THEN
    RAISE EXCEPTION 'Order status transition not allowed from delivered';
  END IF;

  IF OLD.order_status = 'cancelled' AND NEW.order_status NOT IN ('cancelled') THEN
    RAISE EXCEPTION 'Order status transition not allowed from cancelled';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS trg_validate_order_status_transition
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_order_status_transition();

CREATE OR REPLACE FUNCTION public.validate_payment_status_transition()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_status NOT IN ('pending', 'pending_verification', 'success', 'paid', 'partial', 'pay_later') THEN
    RAISE EXCEPTION 'Invalid payment status';
  END IF;

  IF OLD.payment_status = 'pending' AND NEW.payment_status NOT IN ('pending', 'pending_verification', 'success', 'partial', 'pay_later') THEN
    RAISE EXCEPTION 'Payment status transition not allowed from pending';
  END IF;

  IF OLD.payment_status = 'pending_verification' AND NEW.payment_status NOT IN ('pending_verification', 'success', 'paid', 'partial') THEN
    RAISE EXCEPTION 'Payment status transition not allowed from pending_verification';
  END IF;

  IF OLD.payment_status = 'success' AND NEW.payment_status NOT IN ('success', 'paid') THEN
    RAISE EXCEPTION 'Payment status transition not allowed from success';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS trg_validate_payment_status_transition
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_payment_status_transition();

CREATE OR REPLACE FUNCTION public.validate_shipment_status_transition()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status NOT IN ('created', 'shipped', 'in_transit', 'out_for_delivery', 'delivered', 'failed') THEN
    RAISE EXCEPTION 'Invalid shipment status';
  END IF;

  IF OLD.status = 'created' AND NEW.status NOT IN ('created', 'shipped', 'failed') THEN
    RAISE EXCEPTION 'Shipment status transition not allowed from created';
  END IF;

  IF OLD.status = 'shipped' AND NEW.status NOT IN ('shipped', 'in_transit', 'failed') THEN
    RAISE EXCEPTION 'Shipment status transition not allowed from shipped';
  END IF;

  IF OLD.status = 'in_transit' AND NEW.status NOT IN ('in_transit', 'out_for_delivery', 'failed') THEN
    RAISE EXCEPTION 'Shipment status transition not allowed from in_transit';
  END IF;

  IF OLD.status = 'out_for_delivery' AND NEW.status NOT IN ('out_for_delivery', 'delivered', 'failed') THEN
    RAISE EXCEPTION 'Shipment status transition not allowed from out_for_delivery';
  END IF;

  IF OLD.status = 'delivered' AND NEW.status NOT IN ('delivered') THEN
    RAISE EXCEPTION 'Shipment status transition not allowed from delivered';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS trg_validate_shipment_status_transition
  BEFORE UPDATE ON public.shipments
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_shipment_status_transition();
