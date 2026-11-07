-- Descriptive labels from a verified central launch. Existing tenants are retained.
create function public.opsps_provision_myops_identity_v3(
 p_user_ref text,p_user_id uuid,p_project_url text,p_display_name text,p_company_name text
) returns uuid language plpgsql security invoker set search_path='' as $$
declare existing_user uuid; linked_user uuid; b uuid;
begin
 if p_user_ref is null or p_user_ref !~ '^[A-Za-z0-9_-]{43}$' or p_user_id is null
  or p_project_url is distinct from 'https://ojamkplflqafedmxbdxb.supabase.co'
  or nullif(trim(p_display_name),'') is null or length(trim(p_display_name))>100
  or nullif(trim(p_company_name),'') is null or length(trim(p_company_name))>200 then
  raise exception 'Verified staging company labels required'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('opsps:'||p_user_ref,0));
 select opsps_user_id into existing_user from public.myops_identity_links where myops_user_ref=p_user_ref;
 if existing_user is not null then
  if existing_user<>p_user_id then raise exception 'MYOPS identity conflict';end if;
  return existing_user;
 end if;
 linked_user:=public.opsps_provision_myops_identity_v2(p_user_ref,p_user_id,p_project_url);
 select business_id into strict b from public.profiles where auth_user_id=linked_user;
 update public.businesses set name=trim(p_company_name) where id=b;
 update public.profiles set full_name=trim(p_display_name) where auth_user_id=linked_user and business_id=b;
 return linked_user;
end $$;
revoke all on function public.opsps_provision_myops_identity_v3(text,uuid,text,text,text) from public,anon,authenticated;
grant update(name) on public.businesses to service_role;
grant update(full_name) on public.profiles to service_role;
grant execute on function public.opsps_provision_myops_identity_v3(text,uuid,text,text,text) to service_role;
