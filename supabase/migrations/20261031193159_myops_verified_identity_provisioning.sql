-- Server-only, atomic first-launch provisioning. Never attaches by browser email.
CREATE OR REPLACE FUNCTION public.opsps_provision_myops_identity(p_user_ref text, p_user_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER
SET search_path = public, auth, pg_temp AS $$
DECLARE v_existing uuid; v_business uuid; v_email text; v_digest bytea; v_hex text; v_expected uuid;
BEGIN
  IF p_user_ref IS NULL OR p_user_ref !~ '^[A-Za-z0-9_-]{43}$' OR p_user_id IS NULL THEN
    RAISE EXCEPTION 'Invalid MYOPS identity';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('opsps:' || p_user_ref, 0));
  SELECT opsps_user_id INTO v_existing FROM public.myops_identity_links WHERE myops_user_ref=p_user_ref;
  IF v_existing IS NOT NULL THEN
    IF v_existing <> p_user_id THEN RAISE EXCEPTION 'MYOPS identity conflict'; END IF;
    RETURN v_existing;
  END IF;
  -- The server validates Auth app_metadata through the Admin API. SQL needs no
  -- new read grant on auth.users; bind the new tenant to the same staging identity.
  v_digest := sha256(convert_to('opsps-myops:https://ojamkplflqafedmxbdxb.supabase.co:' || p_user_ref,'UTF8'));
  v_digest := set_byte(v_digest,6,(get_byte(v_digest,6) & 15) | 80);
  v_digest := set_byte(v_digest,8,(get_byte(v_digest,8) & 63) | 128);
  v_hex := encode(v_digest,'hex');
  v_expected := (substr(v_hex,1,8)||'-'||substr(v_hex,9,4)||'-'||substr(v_hex,13,4)||'-'||substr(v_hex,17,4)||'-'||substr(v_hex,21,12))::uuid;
  v_email := 'myops-' || substr(v_hex,1,32) || '@opsps.invalid';
  IF p_user_id <> v_expected OR EXISTS (SELECT 1 FROM public.profiles WHERE auth_user_id=p_user_id)
    OR EXISTS (SELECT 1 FROM public.business_memberships WHERE user_id=p_user_id)
    OR EXISTS (SELECT 1 FROM public.myops_identity_links WHERE opsps_user_id=p_user_id) THEN
    RAISE EXCEPTION 'Unverified or existing OpsPS identity';
  END IF;
  INSERT INTO public.businesses(name) VALUES ('My OpsPS') RETURNING id INTO v_business;
  INSERT INTO public.profiles(business_id,auth_user_id,full_name,email,role,business_role)
    VALUES(v_business,p_user_id,'Owner',v_email,'founder','founder');
  INSERT INTO public.business_memberships(business_id,user_id,role) VALUES(v_business,p_user_id,'founder');
  INSERT INTO public.myops_identity_links(myops_user_ref,opsps_user_id) VALUES(p_user_ref,p_user_id);
  RETURN p_user_id;
END;
$$;
REVOKE ALL ON FUNCTION public.opsps_provision_myops_identity(text,uuid) FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON public.businesses, public.profiles, public.business_memberships TO service_role;
GRANT EXECUTE ON FUNCTION public.opsps_provision_myops_identity(text,uuid) TO service_role;
COMMENT ON FUNCTION public.opsps_provision_myops_identity(text,uuid) IS
  'Invoked only by trusted server after central MYOPS ticket and entitlement verification. Creates one empty tenant; never grants subscription or platform-admin access.';
