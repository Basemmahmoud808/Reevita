-- Keep admin email allowlisting private in the database, not in the public repo.
CREATE TABLE IF NOT EXISTS public.admin_email_allowlist (
  email TEXT PRIMARY KEY CHECK (email = lower(email)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_email_allowlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_email_allowlist FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_email_allowlist FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT := 'customer';
BEGIN
  IF NEW.email IS NOT NULL AND EXISTS (
    SELECT 1
    FROM public.admin_email_allowlist allowlist
    WHERE allowlist.email = lower(NEW.email)
  ) THEN
    v_role := 'admin';
  END IF;

  INSERT INTO public.profiles (id, full_name, phone, role)
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(trim(NEW.raw_user_meta_data->>'full_name'), ''),
      NULLIF(split_part(COALESCE(NEW.email, ''), '@', 1), ''),
      'عميلة ريفيتا'
    ),
    NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'phone', '')), ''),
    v_role
  )
  ON CONFLICT (id) DO UPDATE
  SET role = CASE WHEN EXCLUDED.role = 'admin' THEN 'admin' ELSE public.profiles.role END;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
NOTIFY pgrst, 'reload schema';
