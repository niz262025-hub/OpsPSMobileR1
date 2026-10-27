-- MYOPS ticket-to-session binding for OpsPS Web.
-- Identity links are provisioned by a trusted operator; no browser may create
-- or modify a link. Client data access requires a recently revalidated app session.

CREATE TABLE IF NOT EXISTS public.myops_identity_links (
  myops_user_ref TEXT PRIMARY KEY
    CHECK (myops_user_ref ~ '^[A-Za-z0-9_-]{43}$'),
  opsps_user_id UUID NOT NULL UNIQUE
    REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (myops_user_ref, opsps_user_id)
);

CREATE TABLE IF NOT EXISTS public.myops_app_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  myops_user_ref TEXT NOT NULL,
  opsps_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  myops_session_id UUID NOT NULL UNIQUE,
  supabase_session_id UUID NOT NULL UNIQUE,
  valid_until TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (myops_user_ref, opsps_user_id)
    REFERENCES public.myops_identity_links(myops_user_ref, opsps_user_id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS myops_app_sessions_active_user_idx
  ON public.myops_app_sessions (opsps_user_id, supabase_session_id, valid_until)
  WHERE revoked_at IS NULL;

ALTER TABLE public.myops_identity_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.myops_app_sessions ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.myops_identity_links FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.myops_app_sessions FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.myops_identity_links TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.myops_app_sessions TO service_role;

CREATE OR REPLACE FUNCTION public.myops_app_session_active()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
  SELECT auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.myops_app_sessions AS app_session
      WHERE app_session.opsps_user_id = auth.uid()
        AND app_session.supabase_session_id = NULLIF(auth.jwt() ->> 'session_id', '')::UUID
        AND app_session.revoked_at IS NULL
        AND app_session.valid_until > now()
    );
$$;

REVOKE ALL ON FUNCTION public.myops_app_session_active() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.myops_app_session_active() TO authenticated;

-- Founder bootstrap is SECURITY DEFINER, so it would bypass the table RLS gate.
-- MYOPS-linked accounts must be provisioned by a trusted operator instead.
REVOKE ALL ON FUNCTION public.bootstrap_founder_business(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;

-- Restrictive policies are ANDed with the existing business/member policies.
-- This keeps the current tenant rules and adds a short-lived MYOPS entitlement gate.
DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'businesses',
    'profiles',
    'business_memberships',
    'trips',
    'products',
    'product_variants',
    'orders',
    'order_items',
    'payments',
    'shipments',
    'inventory_movements',
    'finance_transactions',
    'subscriptions',
    'admin_users',
    'business_payment_profiles'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS opsps_myops_session_gate ON public.%I', table_name);
    EXECUTE format(
      'CREATE POLICY opsps_myops_session_gate ON public.%I AS RESTRICTIVE FOR ALL TO authenticated USING (public.myops_app_session_active()) WITH CHECK (public.myops_app_session_active())',
      table_name
    );
  END LOOP;
END;
$$;

-- Payment proof objects are private. Preserve the bucket's object ownership rules
-- while requiring the same active MYOPS session for every authenticated operation.
DROP POLICY IF EXISTS opsps_myops_session_gate ON storage.objects;
CREATE POLICY opsps_myops_session_gate
  ON storage.objects
  AS RESTRICTIVE
  FOR ALL
  TO authenticated
  USING (bucket_id <> 'payment-proofs' OR public.myops_app_session_active())
  WITH CHECK (bucket_id <> 'payment-proofs' OR public.myops_app_session_active());

COMMENT ON TABLE public.myops_identity_links IS
  'Trusted mapping from opaque MYOPS user references to existing OpsPS Supabase Auth users.';
COMMENT ON TABLE public.myops_app_sessions IS
  'Short-lived OpsPS sessions revalidated against MYOPS before Supabase data access.';
