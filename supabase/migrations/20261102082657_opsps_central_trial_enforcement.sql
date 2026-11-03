-- Staging trial foundation. Central admission remains OFF until all adapters pass.
alter table public.myops_app_sessions
 add column access_mode text not null default 'paid' check(access_mode in ('paid','trial')),
 add column trial_id uuid,
 add column trial_expires_at timestamptz,
 add column trial_policy_version integer,
 add constraint opsps_trial_session_metadata check(
  (access_mode='paid' and trial_id is null and trial_expires_at is null and trial_policy_version is null)
  or (access_mode='trial' and trial_id is not null and trial_expires_at is not null and trial_policy_version=1)
 );

create table public.opsps_trial_bindings(
 trial_id uuid primary key,business_id uuid not null references public.businesses(id)
);
create table public.opsps_trial_usage(
 trial_id uuid not null references public.opsps_trial_bindings(trial_id),
 business_id uuid not null references public.businesses(id),
 feature text not null check(feature in ('projects','transactions')),
 entity_type text not null,entity_id uuid not null,created_at timestamptz not null default now(),
 primary key(trial_id,feature,entity_type,entity_id)
);
alter table public.opsps_trial_bindings enable row level security;
alter table public.opsps_trial_usage enable row level security;
revoke all on public.opsps_trial_bindings,public.opsps_trial_usage from public,anon,authenticated;
grant select on public.opsps_trial_bindings,public.opsps_trial_usage to service_role;

-- A recently attested session is still invalid at exact trial expiry.
create or replace function public.myops_app_session_active() returns boolean
language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(
  select 1 from public.myops_app_sessions s where s.opsps_user_id=auth.uid()
   and s.supabase_session_id=nullif(auth.jwt()->>'session_id','')::uuid
   and s.revoked_at is null and s.valid_until>now()
   and (s.access_mode='paid' or (s.access_mode='trial' and s.trial_expires_at>now() and s.trial_policy_version=1))
 );
$$;
revoke all on function public.myops_app_session_active() from public,anon;
grant execute on function public.myops_app_session_active() to authenticated;

create schema if not exists opsps_private;
revoke all on schema opsps_private from public,anon,authenticated;
-- Definer is limited to a private trigger: browser roles cannot read or alter
-- session attestations/counters. Business writes retain their existing RLS.
create function opsps_private.enforce_trial_write() returns trigger
language plpgsql security definer set search_path='' as $$
declare s public.myops_app_sessions%rowtype; row_data jsonb;
 b uuid; bound_business uuid; operation_id uuid; entity text; feature_name text; cap integer; used integer;
begin
 if TG_OP='DELETE' then row_data:=to_jsonb(OLD); else row_data:=to_jsonb(NEW); end if;
 if auth.uid() is null then if TG_OP='DELETE' then return OLD; else return NEW; end if; end if;
 select * into s from public.myops_app_sessions
  where opsps_user_id=auth.uid() and supabase_session_id=nullif(auth.jwt()->>'session_id','')::uuid
   and revoked_at is null and valid_until>now();
 if not found then raise exception 'Active MYOPS session required' using errcode='42501'; end if;
 if s.access_mode='paid' then if TG_OP='DELETE' then return OLD; else return NEW; end if; end if;
 if s.trial_expires_at<=now() or s.trial_policy_version<>1 then raise exception 'MYOPS trial expired' using errcode='42501'; end if;
 b:=(row_data->>'business_id')::uuid;
 if b is null or not exists(select 1 from public.business_memberships where business_id=b and user_id=auth.uid())
  or (select count(*) from public.business_memberships where business_id=b)<>1 then
  raise exception 'Trial requires one user and one company' using errcode='42501'; end if;
 if TG_OP='UPDATE' and (to_jsonb(OLD)->>'business_id') is distinct from (row_data->>'business_id') then
  raise exception 'Trial company cannot be reassigned' using errcode='42501'; end if;
 if TG_OP='UPDATE' and ((to_jsonb(OLD)->>'id') is distinct from (row_data->>'id')
  or (TG_TABLE_NAME='finance_transactions' and (to_jsonb(OLD)->>'order_id') is distinct from (row_data->>'order_id'))) then
  raise exception 'Trial transaction identity cannot be reassigned' using errcode='42501'; end if;
 if TG_TABLE_NAME='business_memberships' then raise exception 'Multi-user requires an upgrade in MYOPS' using errcode='42501'; end if;
 if TG_TABLE_NAME='profiles' then
  if TG_OP<>'UPDATE' or (to_jsonb(OLD)-array['full_name','phone','address','updated_at']) is distinct from (row_data-array['full_name','phone','address','updated_at']) then
   raise exception 'Multi-user and role changes require an upgrade in MYOPS' using errcode='42501'; end if;
  return NEW;
 end if;
 if TG_OP<>'INSERT' then if TG_OP='DELETE' then return OLD; else return NEW; end if; end if;
 if TG_TABLE_NAME='trips' then feature_name:='projects';cap:=2;entity:='trip';
 else feature_name:='transactions';cap:=30;entity:=TG_TABLE_NAME; end if;
 operation_id:=(row_data->>'id')::uuid;
 -- Order-linked financial entries belong to the same primary transaction.
 if TG_TABLE_NAME='orders' then entity:='order';
 elsif TG_TABLE_NAME='finance_transactions' and row_data->>'order_id' is not null then
  operation_id:=(row_data->>'order_id')::uuid;entity:='order';
  if not exists(select 1 from public.orders where id=operation_id and business_id=b) then
   raise exception 'Trial order does not belong to this company' using errcode='42501'; end if;
 end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('opsps-trial:'||s.trial_id::text,0));
 insert into public.opsps_trial_bindings values(s.trial_id,b) on conflict do nothing returning business_id into bound_business;
 if found then
  -- Existing data is retained and counts toward evaluation limits as well.
  insert into public.opsps_trial_usage(trial_id,business_id,feature,entity_type,entity_id)
   select s.trial_id,b,'projects','trip',id from public.trips where business_id=b on conflict do nothing;
  insert into public.opsps_trial_usage(trial_id,business_id,feature,entity_type,entity_id)
   select s.trial_id,b,'transactions','order',id from public.orders where business_id=b on conflict do nothing;
  insert into public.opsps_trial_usage(trial_id,business_id,feature,entity_type,entity_id)
   select s.trial_id,b,'transactions','finance_transactions',id from public.finance_transactions where business_id=b and order_id is null on conflict do nothing;
 end if;
 select business_id into bound_business from public.opsps_trial_bindings where trial_id=s.trial_id;
 if bound_business<>b then raise exception 'Trial company binding mismatch' using errcode='42501'; end if;
 if exists(select 1 from public.opsps_trial_usage where trial_id=s.trial_id and feature=feature_name and entity_type=entity and entity_id=operation_id) then return NEW; end if;
 select count(*) into used from public.opsps_trial_usage where trial_id=s.trial_id and feature=feature_name;
 if used>=cap then raise exception 'Trial % limit reached (%). Upgrade in MYOPS.',feature_name,cap using errcode='42501'; end if;
 insert into public.opsps_trial_usage(trial_id,business_id,feature,entity_type,entity_id) values(s.trial_id,b,feature_name,entity,operation_id);
 return NEW;
end $$;
revoke all on function opsps_private.enforce_trial_write() from public,anon,authenticated;
create trigger opsps_trial_trips before insert or update or delete on public.trips for each row execute function opsps_private.enforce_trial_write();
create trigger opsps_trial_orders before insert or update or delete on public.orders for each row execute function opsps_private.enforce_trial_write();
create trigger opsps_trial_finance before insert or update or delete on public.finance_transactions for each row execute function opsps_private.enforce_trial_write();
create trigger opsps_trial_members before insert or update or delete on public.business_memberships for each row execute function opsps_private.enforce_trial_write();
create trigger opsps_trial_profiles before insert or update or delete on public.profiles for each row execute function opsps_private.enforce_trial_write();
