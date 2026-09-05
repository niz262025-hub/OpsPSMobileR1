-- OpsPS real-Supabase foundation prep.
-- This migration is intentionally safe for a real project and remains inert in mock mode.
-- It prepares authenticated-user linkage, business membership ownership, and tenant isolation.

ALTER TABLE IF EXISTS public.profiles
  ADD COLUMN IF NOT EXISTS auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.profiles
  ADD COLUMN IF NOT EXISTS business_role TEXT NOT NULL DEFAULT 'customer'
  CHECK (business_role IN ('founder', 'customer', 'admin', 'support'));

CREATE TABLE IF NOT EXISTS public.business_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('founder', 'customer', 'admin', 'support')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (business_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_business_memberships_user_id
  ON public.business_memberships (user_id);

CREATE INDEX IF NOT EXISTS idx_business_memberships_business_id
  ON public.business_memberships (business_id);

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "businesses_members_can_view_their_business"
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

CREATE POLICY "profiles_visible_to_self_or_business_members"
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
  );

CREATE POLICY "membership_rows_visible_to_own_user"
  ON public.business_memberships
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "membership_rows_manageable_by_owners_or_admins"
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

CREATE POLICY "membership_rows_updateable_by_owners_or_admins"
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
  );

CREATE POLICY "membership_rows_deleteable_by_founders_only"
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
