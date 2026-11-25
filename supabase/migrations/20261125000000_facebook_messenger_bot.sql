-- Facebook Messenger subscribers and offer broadcast history.
-- Protected with strict RLS: only the authenticated server worker (PUSH_WORKER_SECRET)
-- or service_role can read/write these rows.

CREATE TABLE IF NOT EXISTS public.messenger_subscribers (
  psid text PRIMARY KEY CHECK (psid ~ '^[0-9]+$'),
  first_name text,
  last_name text,
  last_interaction_at timestamptz NOT NULL DEFAULT now(),
  marketing_token text,
  marketing_token_expires_at timestamptz,
  marketing_opt_in boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messenger_subscribers_last_interaction
  ON public.messenger_subscribers (last_interaction_at DESC);

CREATE INDEX IF NOT EXISTS idx_messenger_subscribers_marketing_opt_in
  ON public.messenger_subscribers (marketing_opt_in)
  WHERE marketing_opt_in = true AND is_active = true;

ALTER TABLE public.messenger_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messenger_subscribers FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.messenger_subscribers FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messenger_subscribers TO anon, authenticated;
GRANT ALL ON public.messenger_subscribers TO service_role;

CREATE POLICY messenger_subscribers_worker_select
ON public.messenger_subscribers FOR SELECT TO anon, authenticated
USING ((SELECT private.is_push_worker()));

CREATE POLICY messenger_subscribers_worker_insert
ON public.messenger_subscribers FOR INSERT TO anon, authenticated
WITH CHECK ((SELECT private.is_push_worker()));

CREATE POLICY messenger_subscribers_worker_update
ON public.messenger_subscribers FOR UPDATE TO anon, authenticated
USING ((SELECT private.is_push_worker()))
WITH CHECK ((SELECT private.is_push_worker()));

CREATE POLICY messenger_subscribers_worker_delete
ON public.messenger_subscribers FOR DELETE TO anon, authenticated
USING ((SELECT private.is_push_worker()));

CREATE TABLE IF NOT EXISTS public.messenger_broadcasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  link_url text,
  image_url text,
  audience text NOT NULL DEFAULT 'all_eligible',
  sent_count integer NOT NULL DEFAULT 0,
  failed_count integer NOT NULL DEFAULT 0,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.messenger_broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messenger_broadcasts FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.messenger_broadcasts FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messenger_broadcasts TO anon, authenticated;
GRANT ALL ON public.messenger_broadcasts TO service_role;

CREATE POLICY messenger_broadcasts_worker_select
ON public.messenger_broadcasts FOR SELECT TO anon, authenticated
USING ((SELECT private.is_push_worker()));

CREATE POLICY messenger_broadcasts_worker_insert
ON public.messenger_broadcasts FOR INSERT TO anon, authenticated
WITH CHECK ((SELECT private.is_push_worker()));
