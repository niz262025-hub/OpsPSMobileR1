-- Final clean founder bootstrap redesign.
-- This migration removes the circular business_memberships authorization logic,
-- keeps RLS enabled, and creates a single security-definer bootstrap path for a
-- founder with no prior membership.

DROP POLICY IF EXISTS "businesses_insert_authenticated_user" ON public.businesses;
DROP POLICY IF EXISTS "businesses_insert_self_owned" ON public.businesses;
DROP POLICY IF EXISTS "businesses_member_select" ON public.businesses;
DROP POLICY IF EXISTS "businesses_members_can_view_their_business" ON public.businesses;
DROP POLICY IF EXISTS "businesses_update_member_founder_admin" ON public.businesses;
DROP POLICY IF EXISTS "profiles_select_self_or_member" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_self_or_business_leader" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_self_or_business_leader" ON public.profiles;
DROP POLICY IF EXISTS "profiles_visible_to_self_or_business_members" ON public.profiles;
DROP POLICY IF EXISTS "membership_rows_visible_to_own_user" ON public.business_memberships;
DROP POLICY IF EXISTS "membership_rows_manageable_by_owners_or_admins" ON public.business_memberships;
DROP POLICY IF EXISTS "memberships_insert_self_or_founder" ON public.business_memberships;
DROP POLICY IF EXISTS "membership_rows_updateable_by_owners_or_admins" ON public.business_memberships;
DROP POLICY IF EXISTS "memberships_update_self_or_founder" ON public.business_memberships;
DROP POLICY IF EXISTS "membership_rows_deleteable_by_founders_only" ON public.business_memberships;
DROP POLICY IF EXISTS "memberships_delete_founders_only" ON public.business_memberships;

DROP FUNCTION IF EXISTS public.get_authenticated_user_id();
CREATE OR REPLACE FUNCTION public.get_authenticated_user_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
  SELECT auth.uid();
$$;

REVOKE ALL ON FUNCTION public.get_authenticated_user_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_authenticated_user_id() TO authenticated;

DROP FUNCTION IF EXISTS public.user_is_business_member(UUID, UUID);
CREATE OR REPLACE FUNCTION public.user_is_business_member(p_business_id UUID, p_user_id UUID DEFAULT NULL)
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
      AND bm.user_id = COALESCE(p_user_id, auth.uid())
  );
$$;

REVOKE ALL ON FUNCTION public.user_is_business_member(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_is_business_member(UUID, UUID) TO authenticated;

DROP FUNCTION IF EXISTS public.user_is_business_admin(UUID, UUID);
CREATE OR REPLACE FUNCTION public.user_is_business_admin(p_business_id UUID, p_user_id UUID DEFAULT NULL)
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
      AND bm.user_id = COALESCE(p_user_id, auth.uid())
      AND bm.role IN ('founder', 'admin')
  );
$$;

REVOKE ALL ON FUNCTION public.user_is_business_admin(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_is_business_admin(UUID, UUID) TO authenticated;

DROP FUNCTION IF EXISTS public.user_is_business_founder(UUID, UUID);
CREATE OR REPLACE FUNCTION public.user_is_business_founder(p_business_id UUID, p_user_id UUID DEFAULT NULL)
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
      AND bm.user_id = COALESCE(p_user_id, auth.uid())
      AND bm.role = 'founder'
  );
$$;

REVOKE ALL ON FUNCTION public.user_is_business_founder(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_is_business_founder(UUID, UUID) TO authenticated;

DROP FUNCTION IF EXISTS public.bootstrap_founder_business(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION public.bootstrap_founder_business(
  p_name TEXT,
  p_slug TEXT,
  p_email TEXT,
  p_phone TEXT DEFAULT NULL,
  p_address TEXT DEFAULT NULL,
  p_profile_name TEXT DEFAULT NULL
)
RETURNS TABLE (
  business_id UUID,
  membership_id UUID,
  profile_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_user_id UUID;
  v_business_id UUID;
  v_membership_id UUID;
  v_profile_id UUID;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authenticated founder required';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.business_memberships bm
    WHERE bm.user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Founder already bootstrapped a business';
  END IF;

  IF p_name IS NULL OR btrim(p_name) = '' THEN
    RAISE EXCEPTION 'Business name is required';
  END IF;

  IF p_slug IS NULL OR btrim(p_slug) = '' THEN
    RAISE EXCEPTION 'Business slug is required';
  END IF;

  IF p_email IS NULL OR btrim(p_email) = '' THEN
    RAISE EXCEPTION 'Business email is required';
  END IF;

  INSERT INTO public.businesses (name, slug, email, phone, address, status)
  VALUES (p_name, p_slug, p_email, p_phone, p_address, 'active')
  RETURNING id INTO v_business_id;

  INSERT INTO public.business_memberships (business_id, user_id, role)
  VALUES (v_business_id, v_user_id, 'founder')
  RETURNING id INTO v_membership_id;

  INSERT INTO public.profiles (business_id, auth_user_id, full_name, email, phone, address, role)
  VALUES (
    v_business_id,
    v_user_id,
    COALESCE(p_profile_name, 'Founder'),
    p_email,
    p_phone,
    p_address,
    'founder'
  )
  RETURNING id INTO v_profile_id;

  business_id := v_business_id;
  membership_id := v_membership_id;
  profile_id := v_profile_id;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.bootstrap_founder_business(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bootstrap_founder_business(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

CREATE POLICY "businesses_member_select"
  ON public.businesses
  FOR SELECT
  USING (public.user_is_business_member(id, auth.uid()));

CREATE POLICY "businesses_update_member_founder_admin"
  ON public.businesses
  FOR UPDATE
  USING (public.user_is_business_admin(id, auth.uid()))
  WITH CHECK (public.user_is_business_admin(id, auth.uid()));

CREATE POLICY "profiles_select_self_or_member"
  ON public.profiles
  FOR SELECT
  USING (
    auth.uid() = auth_user_id
    OR public.user_is_business_member(business_id, auth.uid())
  );

CREATE POLICY "profiles_insert_self_or_business_leader"
  ON public.profiles
  FOR INSERT
  WITH CHECK (
    auth.uid() = auth_user_id
    OR public.user_is_business_admin(business_id, auth.uid())
  );

CREATE POLICY "profiles_update_self_or_business_leader"
  ON public.profiles
  FOR UPDATE
  USING (
    auth.uid() = auth_user_id
    OR public.user_is_business_admin(business_id, auth.uid())
  )
  WITH CHECK (
    auth.uid() = auth_user_id
    OR public.user_is_business_admin(business_id, auth.uid())
  );

CREATE POLICY "membership_rows_visible_to_own_user"
  ON public.business_memberships
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR public.user_is_business_admin(business_id, auth.uid())
  );

CREATE POLICY "memberships_insert_self_or_founder"
  ON public.business_memberships
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR public.user_is_business_admin(business_id, auth.uid())
  );

CREATE POLICY "memberships_update_self_or_founder"
  ON public.business_memberships
  FOR UPDATE
  USING (
    user_id = auth.uid()
    OR public.user_is_business_admin(business_id, auth.uid())
  )
  WITH CHECK (
    user_id = auth.uid()
    OR public.user_is_business_admin(business_id, auth.uid())
  );

CREATE POLICY "memberships_delete_founders_only"
  ON public.business_memberships
  FOR DELETE
  USING (public.user_is_business_founder(business_id, auth.uid()));

-- No policy directly references public.business_memberships inside USING/WITH CHECK.
-- The bootstrap function performs the first founders-only insert atomically and
-- all subsequent access is controlled by authenticated membership membership checks.
