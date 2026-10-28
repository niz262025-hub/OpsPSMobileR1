-- Historical 003 policies survived the 009/014 replacements. PostgreSQL ORs
-- permissive policies, so retaining them both recurses on membership SELECT
-- and lets the older profile UPDATE predicate weaken the hardened policy.
-- Keep the reviewed replacement policies; preserve all rows and memberships.
DROP POLICY IF EXISTS "memberships_select_self_and_members" ON public.business_memberships;
DROP POLICY IF EXISTS "profiles_insert_self_or_founder" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_self_or_founder" ON public.profiles;
DROP POLICY IF EXISTS "businesses_member_update" ON public.businesses;
