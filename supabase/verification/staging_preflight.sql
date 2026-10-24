-- Read-only preflight for a staging project. Nothing here fails when the release
-- objects are absent: it records the starting point so the operator can tell
-- "already applied" from "applied in this run".

\echo '--- migration-like objects in public (orders idempotency)'
SELECT column_name, data_type
  FROM information_schema.columns
 WHERE table_schema = 'public' AND table_name = 'orders'
   AND column_name = 'idempotency_key';

SELECT indexname, indexdef
  FROM pg_indexes
 WHERE schemaname = 'public' AND indexname = 'idx_orders_idempotency_key';

SELECT p.oid::regprocedure AS place_order_signature, p.prosecdef AS security_definer
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public' AND p.proname = 'place_order';

\echo '--- storage bucket limits'
SELECT id, public, file_size_limit, allowed_mime_types
  FROM storage.buckets
 WHERE id = 'product-images';

\echo '--- storage RLS + policies'
SELECT c.relrowsecurity AS rls_enabled
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
 WHERE n.nspname = 'storage' AND c.relname = 'objects';

SELECT policyname, cmd, roles
  FROM pg_policies
 WHERE schemaname = 'storage' AND tablename = 'objects'
 ORDER BY policyname;

\echo '--- public tables without RLS (must be empty)'
SELECT c.relname
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
 WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relrowsecurity = FALSE
 ORDER BY c.relname;

\echo '--- synthetic-data guard: purchase counts (must be 0 on a clean staging DB)'
SELECT count(*) AS existing_orders FROM public.orders;
