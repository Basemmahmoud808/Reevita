-- REEVITA release gate: executable security assertions.
--
-- Run against the target project AFTER `supabase db push`:
--     psql "$DB_URL" -v ON_ERROR_STOP=1 -f supabase/verification/release_security_checks.sql
-- Every failed assertion raises an exception, so a non-zero exit code means the release
-- gate is NOT satisfied. A successful `db push` proves nothing on its own: migrations
-- 000009/000010 downgrade to WARNING when the storage tables are not owned by the
-- migration role.

DO $$
DECLARE
    v_limit BIGINT;
    v_mimes TEXT[];
    v_public BOOLEAN;
    v_rls BOOLEAN;
    v_policies INT;
    v_signatures INT;
    v_definer BOOLEAN;
    v_settings TEXT[];
    v_body TEXT;
    v_index TEXT;
    v_no_rls TEXT;
BEGIN
    ------------------------------------------------------------------ storage bucket
    SELECT public, file_size_limit, allowed_mime_types
      INTO v_public, v_limit, v_mimes
      FROM storage.buckets WHERE id = 'product-images';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'FAIL: bucket product-images is missing';
    END IF;
    IF v_limit IS DISTINCT FROM 5242880 THEN
        RAISE EXCEPTION 'FAIL: product-images file_size_limit is % (expected 5242880)', v_limit;
    END IF;
    IF v_mimes IS NULL OR NOT (v_mimes @> ARRAY['image/jpeg','image/png','image/webp']::TEXT[])
       OR array_length(v_mimes, 1) <> 3 THEN
        RAISE EXCEPTION 'FAIL: product-images allowed_mime_types is % (expected exactly jpeg/png/webp)', v_mimes;
    END IF;
    IF v_public IS DISTINCT FROM TRUE THEN
        RAISE EXCEPTION 'FAIL: product-images must be public-read for storefront images';
    END IF;

    ------------------------------------------------------------------ storage RLS
    SELECT c.relrowsecurity INTO v_rls
      FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'storage' AND c.relname = 'objects';
    IF v_rls IS DISTINCT FROM TRUE THEN
        RAISE EXCEPTION 'FAIL: RLS is not enabled on storage.objects';
    END IF;

    SELECT count(*) INTO v_policies FROM pg_policies
     WHERE schemaname = 'storage' AND tablename = 'objects'
       AND policyname IN ('product_images_public_read','product_images_admin_insert',
                          'product_images_admin_update','product_images_admin_delete');
    IF v_policies <> 4 THEN
        RAISE EXCEPTION 'FAIL: expected 4 product-images storage policies, found %', v_policies;
    END IF;

    ------------------------------------------------------------------ place_order
    SELECT count(*) INTO v_signatures
      FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public' AND p.proname = 'place_order';
    IF v_signatures <> 1 THEN
        RAISE EXCEPTION 'FAIL: expected exactly 1 place_order signature, found %', v_signatures;
    END IF;

    SELECT p.prosecdef, p.proconfig, p.prosrc
      INTO v_definer, v_settings, v_body
      FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public' AND p.proname = 'place_order';

    IF v_definer IS NOT TRUE THEN
        RAISE EXCEPTION 'FAIL: place_order must be SECURITY DEFINER';
    END IF;
    IF v_settings IS NULL OR NOT (v_settings @> ARRAY['search_path=public']) THEN
        RAISE EXCEPTION 'FAIL: place_order must pin search_path=public (found %)', v_settings;
    END IF;
    IF v_body NOT LIKE '%limited%' OR v_body NOT LIKE '%pg_advisory_xact_lock%' THEN
        RAISE EXCEPTION 'FAIL: place_order does not contain the hardened replay logic (apply migration 000012)';
    END IF;

    ------------------------------------------------------------------ idempotency index
    SELECT indexdef INTO v_index FROM pg_indexes
     WHERE schemaname='public' AND indexname='idx_orders_idempotency_key';
    IF v_index IS NULL OR v_index NOT LIKE 'CREATE UNIQUE INDEX%' OR v_index NOT LIKE '%WHERE (idempotency_key IS NOT NULL)%' THEN
        RAISE EXCEPTION 'FAIL: idx_orders_idempotency_key missing or not a partial unique index (%)', v_index;
    END IF;

    ------------------------------------------------------------------ public RLS sweep
    SELECT string_agg(c.relname, ', ') INTO v_no_rls
      FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname='public' AND c.relkind='r' AND c.relrowsecurity = FALSE;
    IF v_no_rls IS NOT NULL THEN
        RAISE EXCEPTION 'FAIL: RLS disabled on public tables: %', v_no_rls;
    END IF;

    RAISE NOTICE 'PASS: storage limits, storage RLS, storage policies, place_order, idempotency index and public RLS all verified.';
END $$;
