-- Restrict private objects to the same business as the verified session.
begin;
create policy opsps_bound_storage_scope on storage.objects as restrictive for all to authenticated
using (
 bucket_id not in ('payment-proofs','opsps-media') or public.opsps_session_allows_business(
  case when split_part(name,'/',2) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then split_part(name,'/',2)::uuid else null end)
)
with check (
 bucket_id not in ('payment-proofs','opsps-media') or public.opsps_session_allows_business(
  case when split_part(name,'/',2) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then split_part(name,'/',2)::uuid else null end)
);
commit;
