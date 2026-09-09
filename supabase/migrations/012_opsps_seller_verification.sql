-- Seller verification tied to the existing founder/business identity.
-- New founders start in PENDING; only admins may approve or reject.
-- Unapproved sellers do not gain approved-seller privileges.

ALTER TABLE IF EXISTS public.businesses
  ADD COLUMN IF NOT EXISTS seller_verification_status TEXT NOT NULL DEFAULT 'PENDING';

ALTER TABLE IF EXISTS public.businesses
  ADD CONSTRAINT businesses_seller_verification_status_check
  CHECK (seller_verification_status IN ('PENDING', 'APPROVED', 'REJECTED'));

ALTER TABLE IF EXISTS public.businesses
  ADD COLUMN IF NOT EXISTS seller_verified_at TIMESTAMPTZ;

ALTER TABLE IF EXISTS public.businesses
  ADD COLUMN IF NOT EXISTS seller_verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE IF EXISTS public.businesses
  ADD COLUMN IF NOT EXISTS seller_rejection_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_businesses_seller_verification_status
  ON public.businesses (seller_verification_status);

CREATE OR REPLACE FUNCTION public.is_approved_seller_for_business(p_business_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.businesses b
    WHERE b.id = p_business_id
      AND b.seller_verification_status = 'APPROVED'
  );
$$;

REVOKE ALL ON FUNCTION public.is_approved_seller_for_business(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_approved_seller_for_business(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.can_manage_seller_verification(p_business_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.business_memberships bm
    WHERE bm.business_id = p_business_id
      AND bm.user_id = auth.uid()
      AND bm.role IN ('admin', 'support')
  );
$$;

REVOKE ALL ON FUNCTION public.can_manage_seller_verification(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_manage_seller_verification(UUID) TO authenticated;

CREATE POLICY "businesses_seller_verification_visible_to_admins"
  ON public.businesses
  FOR SELECT
  USING (
    public.can_manage_seller_verification(id)
    OR EXISTS (
      SELECT 1
      FROM public.business_memberships bm
      WHERE bm.business_id = businesses.id
        AND bm.user_id = auth.uid()
    )
  );

CREATE POLICY "businesses_seller_verification_admin_update"
  ON public.businesses
  FOR UPDATE
  USING (public.can_manage_seller_verification(id))
  WITH CHECK (public.can_manage_seller_verification(id));

CREATE POLICY "businesses_seller_verification_founder_self_view"
  ON public.businesses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.business_memberships bm
      WHERE bm.business_id = businesses.id
        AND bm.user_id = auth.uid()
        AND bm.role = 'founder'
    )
  );

CREATE OR REPLACE FUNCTION public.ensure_founder_business_starts_pending()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  IF NEW.seller_verification_status IS NULL THEN
    NEW.seller_verification_status := 'PENDING';
  END IF;

  IF NEW.seller_verification_status NOT IN ('PENDING', 'APPROVED', 'REJECTED') THEN
    RAISE EXCEPTION 'Seller verification status must be PENDING, APPROVED, or REJECTED';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER businesses_seller_verification_default_pending
BEFORE INSERT OR UPDATE ON public.businesses
FOR EACH ROW
EXECUTE FUNCTION public.ensure_founder_business_starts_pending();
