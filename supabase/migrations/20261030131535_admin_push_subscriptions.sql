-- Private web-push subscriptions for admin devices. The browser can only manage
-- its own subscription while signed in as an administrator. The worker secret
-- is stored as an MD5 digest so it is never kept in this database in plaintext.
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO anon, authenticated, service_role;

CREATE TABLE IF NOT EXISTS private.push_worker_config (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  secret_md5 text NOT NULL
);
ALTER TABLE private.push_worker_config ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.push_worker_config FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION private.is_push_worker()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM private.push_worker_config AS config
    WHERE config.id
      AND config.secret_md5 = md5(
        coalesce(
          (nullif(current_setting('request.headers', true), '')::jsonb ->> 'x-reevita-push-secret'),
          ''
        )
      )
  );
$$;
REVOKE ALL ON FUNCTION private.is_push_worker() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_push_worker() TO anon, authenticated, service_role;

CREATE TABLE public.admin_push_subscriptions (
  endpoint text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription jsonb NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_push_subscriptions FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_push_subscriptions FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_push_subscriptions TO authenticated;
GRANT SELECT, DELETE ON public.admin_push_subscriptions TO anon;
GRANT ALL ON public.admin_push_subscriptions TO service_role;

CREATE POLICY admin_push_subscriptions_admin_select
ON public.admin_push_subscriptions FOR SELECT TO authenticated
USING (public.is_admin() AND user_id = (SELECT auth.uid()));

CREATE POLICY admin_push_subscriptions_admin_insert
ON public.admin_push_subscriptions FOR INSERT TO authenticated
WITH CHECK (public.is_admin() AND user_id = (SELECT auth.uid()));

CREATE POLICY admin_push_subscriptions_admin_update
ON public.admin_push_subscriptions FOR UPDATE TO authenticated
USING (public.is_admin() AND user_id = (SELECT auth.uid()))
WITH CHECK (public.is_admin() AND user_id = (SELECT auth.uid()));

CREATE POLICY admin_push_subscriptions_admin_delete
ON public.admin_push_subscriptions FOR DELETE TO authenticated
USING (public.is_admin() AND user_id = (SELECT auth.uid()));

CREATE POLICY admin_push_subscriptions_worker_select
ON public.admin_push_subscriptions FOR SELECT TO anon, authenticated
USING ((SELECT private.is_push_worker()));

CREATE POLICY admin_push_subscriptions_worker_delete
ON public.admin_push_subscriptions FOR DELETE TO anon, authenticated
USING ((SELECT private.is_push_worker()));
