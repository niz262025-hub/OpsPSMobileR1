-- Additive preparation only; no customer is mapped automatically.
begin;
create table public.opsps_central_organization_links (
 organization_id uuid not null,
 myops_user_ref text not null,
 opsps_user_id uuid not null,
 business_id uuid not null,
 enabled boolean not null default false,
 primary key (organization_id,myops_user_ref),
 foreign key (myops_user_ref,opsps_user_id) references public.myops_identity_links(myops_user_ref,opsps_user_id) on delete cascade,
 foreign key (business_id,opsps_user_id) references public.business_memberships(business_id,user_id) on delete cascade
);
alter table public.opsps_central_organization_links enable row level security;
revoke all on public.opsps_central_organization_links from public,anon,authenticated;
grant select,insert,update,delete on public.opsps_central_organization_links to service_role;
commit;
