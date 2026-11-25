ALTER POLICY payments_member_select ON public.payments USING ((EXISTS ( SELECT 1
   FROM business_memberships bm
  WHERE ((bm.business_id = payments.business_id) AND (bm.user_id = auth.uid())))));
ALTER POLICY admin_users_member_delete ON public.admin_users USING ((EXISTS ( SELECT 1
   FROM business_memberships bm
  WHERE ((bm.business_id = admin_users.business_id) AND (bm.user_id = auth.uid()) AND (bm.role = 'founder'::text)))));
ALTER POLICY memberships_member_delete ON public.business_memberships USING ((((user_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM business_memberships bm
  WHERE ((bm.business_id = business_memberships.business_id) AND (bm.role = 'founder'::text) AND (bm.user_id <> auth.uid()))))) OR ((EXISTS ( SELECT 1
   FROM business_memberships actor
  WHERE ((actor.business_id = business_memberships.business_id) AND (actor.user_id = auth.uid()) AND (actor.role = 'founder'::text)))) AND (user_id <> auth.uid()) AND (EXISTS ( SELECT 1
   FROM business_memberships remaining_founder
  WHERE ((remaining_founder.business_id = business_memberships.business_id) AND (remaining_founder.role = 'founder'::text) AND (remaining_founder.user_id <> business_memberships.user_id)))))));
DROP POLICY IF EXISTS memberships_delete_founders_only ON public.business_memberships;
