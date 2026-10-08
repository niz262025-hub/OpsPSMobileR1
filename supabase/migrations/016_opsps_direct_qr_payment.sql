-- OpsPS direct QR payment profile and proof-verification flow.
-- This migration is additive and intentionally preserves the existing payment provider architecture.

ALTER TABLE public.payments
  DROP CONSTRAINT IF EXISTS payments_provider_check;

ALTER TABLE public.payments
  ADD CONSTRAINT payments_provider_direct_qr_check
  CHECK (provider IN ('mock', 'stripe', 'sandbox', 'fpx', 'paynet', 'direct_qr'))
  NOT VALID;

CREATE TABLE IF NOT EXISTS public.business_payment_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  payment_method_type TEXT NOT NULL CHECK (payment_method_type IN ('BANK_TRANSFER', 'DUITNOW_QR', 'TNG_QR')),
  account_type TEXT,
  bank_name TEXT,
  account_holder_name TEXT,
  account_number TEXT,
  ewallet_name TEXT,
  qr_image_url TEXT,
  payment_instructions TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.business_payment_profiles
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_business_payment_profiles_business_id
  ON public.business_payment_profiles (business_id);

CREATE INDEX IF NOT EXISTS idx_business_payment_profiles_active
  ON public.business_payment_profiles (business_id, is_active);

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS customer_payment_reference TEXT;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS payment_instructions_snapshot TEXT;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS payment_profile_id UUID REFERENCES public.business_payment_profiles(id) ON DELETE SET NULL;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS verification_event_id TEXT;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS payment_method TEXT;

ALTER TABLE public.payments
  ADD CONSTRAINT payments_payment_method_direct_qr_check
  CHECK (payment_method IS NULL OR payment_method IN ('cash', 'bank', 'card', 'wallet', 'DIRECT_QR'))
  NOT VALID;

ALTER TABLE public.payments
  ADD CONSTRAINT payments_status_direct_qr_check
  CHECK (
    payment_status IS NULL OR payment_status IN (
      'pending',
      'submitted',
      'pending_verification',
      'authorized',
      'success',
      'paid',
      'partial',
      'pay_later',
      'rejected',
      'failed',
      'cancelled',
      'refunded'
    )
  )
  NOT VALID;

CREATE INDEX IF NOT EXISTS idx_payments_customer_payment_reference
  ON public.payments (customer_payment_reference);

CREATE INDEX IF NOT EXISTS idx_payments_payment_profile_id
  ON public.payments (payment_profile_id);

CREATE INDEX IF NOT EXISTS idx_payments_verified_at
  ON public.payments (verified_at);

CREATE OR REPLACE FUNCTION public.direct_qr_payment_verified_gate()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  IF NEW.payment_method = 'DIRECT_QR' AND NEW.payment_status = 'paid' AND NEW.verified IS NOT TRUE THEN
    RAISE EXCEPTION 'Direct QR payment must be verified by an authorized business owner or admin before it can become paid.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS direct_qr_payment_verified_gate_trigger ON public.payments;
CREATE TRIGGER direct_qr_payment_verified_gate_trigger
BEFORE INSERT OR UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.direct_qr_payment_verified_gate();

CREATE POLICY "business_payment_profiles_admin_manage"
  ON public.business_payment_profiles
  FOR ALL
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.business_memberships bm
      WHERE bm.business_id = business_payment_profiles.business_id
        AND bm.user_id = auth.uid()
        AND bm.role IN ('founder', 'admin')
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.business_memberships bm
      WHERE bm.business_id = business_payment_profiles.business_id
        AND bm.user_id = auth.uid()
        AND bm.role IN ('founder', 'admin')
    )
  );

CREATE POLICY "business_payment_profiles_customer_select_active"
  ON public.business_payment_profiles
  FOR SELECT
  USING (
    is_active = TRUE
    AND EXISTS (
      SELECT 1
      FROM public.orders o
      WHERE o.business_id = business_payment_profiles.business_id
        AND (
          o.customer_id = auth.uid()
          OR o.customer_profile_id = (
            SELECT p.id
            FROM public.profiles p
            WHERE p.auth_user_id = auth.uid()
            LIMIT 1
          )
        )
    )
  );

CREATE POLICY "payments_customer_insert_own_direct_qr"
  ON public.payments
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND payment_method = 'DIRECT_QR'
    AND EXISTS (
      SELECT 1
      FROM public.orders o
      WHERE o.id = payments.order_id
        AND o.business_id = payments.business_id
        AND (
          o.customer_id = auth.uid()
          OR o.customer_profile_id = (
            SELECT p.id
            FROM public.profiles p
            WHERE p.auth_user_id = auth.uid()
            LIMIT 1
          )
        )
    )
    AND payment_status IN ('pending', 'submitted')
  );

CREATE POLICY "payments_customer_select_own"
  ON public.payments
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.orders o
      WHERE o.id = payments.order_id
        AND o.business_id = payments.business_id
        AND (
          o.customer_id = auth.uid()
          OR o.customer_profile_id = (
            SELECT p.id
            FROM public.profiles p
            WHERE p.auth_user_id = auth.uid()
            LIMIT 1
          )
        )
    )
  );

CREATE POLICY "payments_business_member_select_update"
  ON public.payments
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.business_memberships bm
      WHERE bm.business_id = payments.business_id
        AND bm.user_id = auth.uid()
    )
  );

CREATE POLICY "payments_business_admin_update"
  ON public.payments
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.business_memberships bm
      WHERE bm.business_id = payments.business_id
        AND bm.user_id = auth.uid()
        AND bm.role IN ('founder', 'admin')
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.business_memberships bm
      WHERE bm.business_id = payments.business_id
        AND bm.user_id = auth.uid()
        AND bm.role IN ('founder', 'admin')
    )
  );

-- RLS USING/WITH CHECK expressions cannot reference OLD/NEW, so business_id,
-- order_id, and amount immutability on update is enforced via trigger instead.
CREATE OR REPLACE FUNCTION public.payments_admin_update_immutable_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.business_id IS DISTINCT FROM OLD.business_id
     OR NEW.order_id IS DISTINCT FROM OLD.order_id
     OR NEW.amount IS DISTINCT FROM OLD.amount THEN
    RAISE EXCEPTION 'business_id, order_id, and amount are immutable on payments';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS payments_admin_update_immutable_fields_trigger ON public.payments;
CREATE TRIGGER payments_admin_update_immutable_fields_trigger
BEFORE UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.payments_admin_update_immutable_fields();

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('payment-proofs', 'payment-proofs', FALSE, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "payment_proofs_customer_upload_own"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'payment-proofs'
    AND auth.uid() IS NOT NULL
    AND split_part(name, '/', 2) IS NOT NULL
    AND split_part(name, '/', 4) = auth.uid()::text
    AND EXISTS (
      SELECT 1
      FROM public.business_memberships bm
      WHERE bm.business_id::text = split_part(name, '/', 2)
        AND bm.user_id = auth.uid()
    )
  );

CREATE POLICY "payment_proofs_customer_select_own"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'payment-proofs'
    AND auth.uid() IS NOT NULL
    AND split_part(name, '/', 4) = auth.uid()::text
  );

CREATE POLICY "payment_proofs_business_admin_select"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'payment-proofs'
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.business_memberships bm
      WHERE bm.business_id::text = split_part(name, '/', 2)
        AND bm.user_id = auth.uid()
        AND bm.role IN ('founder', 'admin')
    )
  );

CREATE POLICY "payment_proofs_business_admin_update_delete"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'payment-proofs'
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.business_memberships bm
      WHERE bm.business_id::text = split_part(name, '/', 2)
        AND bm.user_id = auth.uid()
        AND bm.role IN ('founder', 'admin')
    )
  )
  WITH CHECK (
    bucket_id = 'payment-proofs'
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.business_memberships bm
      WHERE bm.business_id::text = split_part(name, '/', 2)
        AND bm.user_id = auth.uid()
        AND bm.role IN ('founder', 'admin')
    )
  );

CREATE POLICY "payment_proofs_business_admin_delete"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'payment-proofs'
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.business_memberships bm
      WHERE bm.business_id::text = split_part(name, '/', 2)
        AND bm.user_id = auth.uid()
        AND bm.role IN ('founder', 'admin')
    )
  );
