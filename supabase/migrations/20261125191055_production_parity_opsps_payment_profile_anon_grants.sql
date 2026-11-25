BEGIN;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.business_payment_profiles FROM anon;
DO $$ DECLARE p text; BEGIN
FOREACH p IN ARRAY ARRAY['SELECT','INSERT','UPDATE','DELETE'] LOOP
IF has_table_privilege('anon','public.business_payment_profiles',p) OR NOT has_table_privilege('authenticated','public.business_payment_profiles',p) OR NOT has_table_privilege('service_role','public.business_payment_profiles',p) THEN RAISE EXCEPTION 'Unexpected privilege: %',p; END IF;
END LOOP; END $$;
COMMIT;
