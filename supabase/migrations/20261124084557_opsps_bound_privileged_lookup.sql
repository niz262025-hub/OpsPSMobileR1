-- Bound sessions cannot use definer lookups to inspect other businesses.
begin;
create function public.opsps_scoped_lookup_allowed(target uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select not exists(select 1 from public.myops_app_sessions s where s.opsps_user_id=auth.uid()
   and s.supabase_session_id=nullif(auth.jwt()->>'session_id','')::uuid and s.central_organization_id is not null)
   or public.opsps_session_allows_business(target);
$$;
revoke all on function public.opsps_scoped_lookup_allowed(uuid) from public,anon;
grant execute on function public.opsps_scoped_lookup_allowed(uuid) to authenticated;
CREATE OR REPLACE FUNCTION public.user_is_business_member(p_business_id UUID, p_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
  SELECT public.opsps_scoped_lookup_allowed(p_business_id) AND EXISTS (
    SELECT 1
    FROM public.business_memberships bm
    WHERE bm.business_id = p_business_id
      AND bm.user_id = COALESCE(p_user_id, auth.uid())
  );
$$;
CREATE OR REPLACE FUNCTION public.user_is_business_admin(p_business_id UUID, p_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
  SELECT public.opsps_scoped_lookup_allowed(p_business_id) AND EXISTS (
    SELECT 1
    FROM public.business_memberships bm
    WHERE bm.business_id = p_business_id
      AND bm.user_id = COALESCE(p_user_id, auth.uid())
      AND bm.role IN ('founder', 'admin')
  );
$$;
CREATE OR REPLACE FUNCTION public.user_is_business_founder(p_business_id UUID, p_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
  SELECT public.opsps_scoped_lookup_allowed(p_business_id) AND EXISTS (
    SELECT 1
    FROM public.business_memberships bm
    WHERE bm.business_id = p_business_id
      AND bm.user_id = COALESCE(p_user_id, auth.uid())
      AND bm.role = 'founder'
  );
$$;
CREATE OR REPLACE FUNCTION public.is_approved_seller_for_business(p_business_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
  SELECT public.opsps_scoped_lookup_allowed(p_business_id) AND EXISTS (
    SELECT 1
    FROM public.businesses b
    WHERE b.id = p_business_id
      AND b.seller_verification_status = 'APPROVED'
  );
$$;
CREATE OR REPLACE FUNCTION public.can_manage_seller_verification(p_business_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
  SELECT public.opsps_scoped_lookup_allowed(p_business_id) AND EXISTS (
    SELECT 1
    FROM public.business_memberships bm
    WHERE bm.business_id = p_business_id
      AND bm.user_id = auth.uid()
      AND bm.role IN ('admin', 'support')
  );
$$;
commit;
