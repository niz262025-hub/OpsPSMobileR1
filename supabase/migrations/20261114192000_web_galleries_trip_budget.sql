-- Additive: legacy product image_url and all existing rows remain intact.
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS budget numeric(14,2) NOT NULL DEFAULT 0;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS gallery_paths jsonb NOT NULL DEFAULT '[]';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS gallery_paths jsonb NOT NULL DEFAULT '[]';
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS gallery_version integer NOT NULL DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS gallery_version integer NOT NULL DEFAULT 0;
-- A sentinel references the original image without copying/replacing its bytes.
UPDATE public.products SET gallery_paths='["legacy"]'::jsonb WHERE gallery_paths='[]'::jsonb AND nullif(image_url,'') IS NOT NULL;
ALTER TABLE public.trips ADD CONSTRAINT opsps_trip_budget_valid CHECK (budget >= 0 AND budget <> 'NaN'::numeric);

INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
VALUES('opsps-media','opsps-media',false,5242880,ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT(id) DO NOTHING;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM storage.buckets WHERE id='opsps-media' AND (public OR file_size_limit IS DISTINCT FROM 5242880 OR allowed_mime_types IS DISTINCT FROM ARRAY['image/jpeg','image/png','image/webp'])) THEN RAISE EXCEPTION 'Existing media bucket configuration requires review'; END IF; END $$;

CREATE OR REPLACE FUNCTION public.opsps_media_allowed(p_name text,p_write boolean)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path=public,auth,pg_temp AS $$
DECLARE parts text[]; b uuid; entity uuid; member boolean;
BEGIN
 IF auth.uid() IS NULL OR NOT public.myops_app_session_active() THEN RETURN false; END IF;
 parts:=string_to_array(p_name,'/');
 IF array_length(parts,1)<>5 OR parts[1]<>'business' OR parts[3] NOT IN('trips','products') OR parts[5] !~ '^[0-9a-f-]{36}\.(jpg|png|webp)$' THEN RETURN false; END IF;
 BEGIN b:=parts[2]::uuid; entity:=parts[4]::uuid; EXCEPTION WHEN invalid_text_representation THEN RETURN false; END;
 SELECT EXISTS(SELECT 1 FROM public.business_memberships WHERE business_id=b AND user_id=auth.uid() AND role IN('founder','admin')) INTO member;
 IF parts[3]='trips' THEN
  RETURN member AND EXISTS(SELECT 1 FROM public.trips WHERE id=entity AND business_id=b);
 END IF;
 RETURN EXISTS(SELECT 1 FROM public.products WHERE id=entity AND business_id=b AND (member OR (NOT p_write AND is_published AND gallery_paths ? p_name)));
END; $$;
REVOKE ALL ON FUNCTION public.opsps_media_allowed(text,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.opsps_media_allowed(text,boolean) TO authenticated;

-- A restrictive guard prevents unrelated permissive Storage policies granting
-- access to this private bucket. No object overwrites; replacements use new IDs.
CREATE POLICY opsps_media_guard ON storage.objects AS RESTRICTIVE FOR ALL TO authenticated
USING(bucket_id<>'opsps-media' OR public.opsps_media_allowed(name,false))
WITH CHECK(bucket_id<>'opsps-media' OR public.opsps_media_allowed(name,true));
CREATE POLICY opsps_media_read ON storage.objects FOR SELECT TO authenticated
USING(bucket_id='opsps-media' AND public.opsps_media_allowed(name,false));
CREATE POLICY opsps_media_insert ON storage.objects FOR INSERT TO authenticated
WITH CHECK(bucket_id='opsps-media' AND public.opsps_media_allowed(name,true));
CREATE POLICY opsps_media_delete ON storage.objects FOR DELETE TO authenticated
USING(bucket_id='opsps-media' AND public.opsps_media_allowed(name,true));
CREATE POLICY opsps_media_no_overwrite ON storage.objects AS RESTRICTIVE FOR UPDATE TO authenticated
USING(bucket_id<>'opsps-media') WITH CHECK(bucket_id<>'opsps-media');
CREATE POLICY opsps_media_no_anonymous ON storage.objects AS RESTRICTIVE FOR ALL TO anon
USING(bucket_id<>'opsps-media') WITH CHECK(bucket_id<>'opsps-media');

CREATE OR REPLACE FUNCTION public.opsps_validate_gallery()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE item text; prefix text;
BEGIN
 IF TG_TABLE_NAME='products' AND TG_OP='UPDATE' THEN
  IF NEW.trip_id IS DISTINCT FROM OLD.trip_id THEN RAISE EXCEPTION 'Product trip scope is immutable'; END IF;
 END IF;
 IF TG_TABLE_NAME='trips' AND TG_OP='UPDATE' AND OLD.status='closed' AND NEW.status<>'closed' THEN RAISE EXCEPTION 'Completed trips cannot be reopened'; END IF;
 IF TG_OP='UPDATE' AND ROW(NEW.id,NEW.business_id) IS DISTINCT FROM ROW(OLD.id,OLD.business_id) THEN RAISE EXCEPTION 'Gallery scope is immutable'; END IF;
 IF jsonb_typeof(NEW.gallery_paths)<>'array' OR jsonb_array_length(NEW.gallery_paths)>10 THEN RAISE EXCEPTION 'Gallery allows at most ten images'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(NEW.gallery_paths) e WHERE jsonb_typeof(e)<>'string') OR
 (SELECT count(*) FROM jsonb_array_elements(NEW.gallery_paths))<>(SELECT count(DISTINCT value) FROM jsonb_array_elements(NEW.gallery_paths)) THEN RAISE EXCEPTION 'Gallery paths must be unique strings'; END IF;
 prefix:='business/'||NEW.business_id||'/'||TG_TABLE_NAME||'/'||NEW.id||'/';
 FOR item IN SELECT jsonb_array_elements_text(NEW.gallery_paths) LOOP
  IF TG_TABLE_NAME='products' AND item='legacy' THEN
   IF nullif(NEW.image_url,'') IS NULL THEN RAISE EXCEPTION 'Original image unavailable'; END IF;
   CONTINUE;
  END IF;
  IF left(item,length(prefix))<>prefix OR substring(item FROM length(prefix)+1) !~ '^[0-9a-f-]{36}\.(jpg|png|webp)$' THEN RAISE EXCEPTION 'Invalid gallery object scope'; END IF;
 END LOOP;
 IF TG_OP='UPDATE' AND NEW.gallery_paths IS DISTINCT FROM OLD.gallery_paths THEN NEW.gallery_version:=OLD.gallery_version+1;
 ELSIF TG_OP='UPDATE' THEN NEW.gallery_version:=OLD.gallery_version;
 ELSE NEW.gallery_version:=0; END IF;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.opsps_validate_gallery() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER opsps_trip_gallery BEFORE INSERT OR UPDATE ON public.trips FOR EACH ROW EXECUTE FUNCTION public.opsps_validate_gallery();
CREATE TRIGGER opsps_product_gallery BEFORE INSERT OR UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.opsps_validate_gallery();

-- Compare-and-swap prevents two tabs silently overwriting each other's gallery.
CREATE OR REPLACE FUNCTION public.opsps_save_gallery(p_kind text,p_business_id uuid,p_entity_id uuid,p_version integer,p_paths jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,auth,pg_temp AS $$
DECLARE current_version integer; result jsonb; path text;
BEGIN
 IF p_kind NOT IN('trips','products') OR NOT public.myops_app_session_active() OR NOT EXISTS(SELECT 1 FROM public.business_memberships WHERE business_id=p_business_id AND user_id=auth.uid() AND role IN('founder','admin')) THEN RAISE EXCEPTION 'Authorized business session required' USING ERRCODE='42501'; END IF;
 EXECUTE format('SELECT gallery_version FROM public.%I WHERE id=$1 AND business_id=$2 FOR UPDATE',p_kind) INTO current_version USING p_entity_id,p_business_id;
 IF current_version IS NULL THEN RAISE EXCEPTION 'Gallery not found'; END IF;
 IF current_version<>p_version THEN RAISE EXCEPTION 'Gallery changed; reload before saving'; END IF;
 IF p_paths IS NULL OR jsonb_typeof(p_paths)<>'array' OR jsonb_array_length(p_paths)>10 THEN RAISE EXCEPTION 'Gallery allows at most ten images'; END IF;
 FOR path IN SELECT jsonb_array_elements_text(p_paths) LOOP
  IF p_kind='products' AND path='legacy' THEN CONTINUE; END IF;
  IF NOT EXISTS(SELECT 1 FROM storage.objects WHERE bucket_id='opsps-media' AND name=path) THEN RAISE EXCEPTION 'Upload each image before saving'; END IF;
 END LOOP;
 EXECUTE format('UPDATE public.%I SET gallery_paths=$1 WHERE id=$2 AND business_id=$3 RETURNING jsonb_build_object(''paths'',gallery_paths,''version'',gallery_version)',p_kind) INTO result USING p_paths,p_entity_id,p_business_id;
 IF result IS NULL THEN RAISE EXCEPTION 'Gallery save denied'; END IF;
 RETURN result;
END; $$;
REVOKE ALL ON FUNCTION public.opsps_save_gallery(text,uuid,uuid,integer,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.opsps_save_gallery(text,uuid,uuid,integer,jsonb) TO authenticated;

-- Old UPDATE policies selected their own table in WITH CHECK, causing PostgreSQL
-- 42P17 recursion. Preserve role/session checks; triggers above enforce immutable
-- id/business/trip ownership without querying the table under its own RLS.
DROP POLICY trips_member_update ON public.trips;
CREATE POLICY trips_member_update ON public.trips FOR UPDATE TO authenticated
USING(EXISTS(SELECT 1 FROM public.business_memberships WHERE business_id=trips.business_id AND user_id=auth.uid() AND role IN('founder','admin')))
WITH CHECK(EXISTS(SELECT 1 FROM public.business_memberships WHERE business_id=trips.business_id AND user_id=auth.uid() AND role IN('founder','admin')));
DROP POLICY products_member_update ON public.products;
CREATE POLICY products_member_update ON public.products FOR UPDATE TO authenticated
USING(EXISTS(SELECT 1 FROM public.business_memberships WHERE business_id=products.business_id AND user_id=auth.uid() AND role IN('founder','admin')))
WITH CHECK(EXISTS(SELECT 1 FROM public.business_memberships WHERE business_id=products.business_id AND user_id=auth.uid() AND role IN('founder','admin')));
