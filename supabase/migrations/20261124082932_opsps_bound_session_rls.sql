-- Add tenant-scoped RLS independently of the still-disabled bound Edge flow.
begin;
alter table public.myops_app_sessions add column central_organization_id uuid;
alter table public.myops_app_sessions add column bound_business_id uuid;
alter table public.myops_app_sessions add constraint opsps_bound_session_pair
 check ((central_organization_id is null and bound_business_id is null) or (central_organization_id is not null and bound_business_id is not null));
create function public.opsps_session_allows_business(target uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists (
  select 1 from public.myops_app_sessions s
  where s.opsps_user_id=auth.uid()
    and s.supabase_session_id=nullif(auth.jwt()->>'session_id','')::uuid
    and s.revoked_at is null and s.valid_until>now()
    and (s.central_organization_id is null or (
      target is not null and target=s.bound_business_id and exists (
        select 1 from public.opsps_central_organization_links l
        join public.business_memberships m on m.business_id=l.business_id and m.user_id=l.opsps_user_id
        where l.organization_id=s.central_organization_id and l.myops_user_ref=s.myops_user_ref
          and l.opsps_user_id=s.opsps_user_id and l.business_id=s.bound_business_id and l.enabled
      )
    ))
 );
$$;
revoke all on function public.opsps_session_allows_business(uuid) from public,anon;
grant execute on function public.opsps_session_allows_business(uuid) to authenticated;
create policy opsps_bound_business_scope on public.businesses as restrictive for all to authenticated
 using (public.opsps_session_allows_business(id)) with check (public.opsps_session_allows_business(id));
do $$
declare name text;
begin
 foreach name in array array['profiles','business_memberships','trips','products','product_variants','orders','order_items','payments','shipments','inventory_movements','finance_transactions','subscriptions','admin_users','business_payment_profiles'] loop
  execute format('create policy opsps_bound_business_scope on public.%I as restrictive for all to authenticated using (public.opsps_session_allows_business(business_id)) with check (public.opsps_session_allows_business(business_id))',name);
 end loop;
end $$;
commit;
