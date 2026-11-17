-- DELETE has USING only; the generic gallery guard intentionally allows
-- customer reads of published product media. A separate restrictive DELETE
-- guard prevents unrelated permissive policies turning read access into delete.
CREATE POLICY opsps_media_delete_guard ON storage.objects
AS RESTRICTIVE FOR DELETE TO authenticated
USING(bucket_id <> 'opsps-media' OR public.opsps_media_allowed(name,true));
