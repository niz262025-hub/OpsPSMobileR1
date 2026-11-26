REVOKE SELECT, INSERT, UPDATE, DELETE ON public.business_payment_profiles FROM authenticated;
DO $$ DECLARE r text; p text; BEGIN
FOREACH r IN ARRAY ARRAY['anon','authenticated','service_role'] LOOP
FOREACH p IN ARRAY ARRAY['SELECT','INSERT','UPDATE','DELETE'] LOOP
IF has_table_privilege(r,'public.business_payment_profiles',p) IS DISTINCT FROM (r='service_role') THEN RAISE EXCEPTION 'Unexpected privilege: % %',r,p; END IF;
END LOOP;
END LOOP;
END $$;
