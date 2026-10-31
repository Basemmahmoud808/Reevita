-- Telegram recipients are private contact data. Only the server worker that
-- proves it knows PUSH_WORKER_SECRET may read or modify these rows.
CREATE TABLE public.admin_telegram_subscribers (
  chat_id text PRIMARY KEY CHECK (chat_id ~ '^-?[0-9]+$'),
  first_name text,
  username text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_telegram_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_telegram_subscribers FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_telegram_subscribers FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_telegram_subscribers TO anon, authenticated;
GRANT ALL ON public.admin_telegram_subscribers TO service_role;

CREATE POLICY admin_telegram_subscribers_worker_select
ON public.admin_telegram_subscribers FOR SELECT TO anon, authenticated
USING ((SELECT private.is_push_worker()));

CREATE POLICY admin_telegram_subscribers_worker_insert
ON public.admin_telegram_subscribers FOR INSERT TO anon, authenticated
WITH CHECK ((SELECT private.is_push_worker()));

CREATE POLICY admin_telegram_subscribers_worker_update
ON public.admin_telegram_subscribers FOR UPDATE TO anon, authenticated
USING ((SELECT private.is_push_worker()))
WITH CHECK ((SELECT private.is_push_worker()));

CREATE POLICY admin_telegram_subscribers_worker_delete
ON public.admin_telegram_subscribers FOR DELETE TO anon, authenticated
USING ((SELECT private.is_push_worker()));
