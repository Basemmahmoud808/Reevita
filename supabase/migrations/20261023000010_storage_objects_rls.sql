-- Migration 000010: make storage authorisation explicit.
--
-- Supabase enables RLS on storage.objects by default, but a security control must not
-- depend on an implicit platform default (the repository's PostgreSQL harness creates
-- storage.objects itself). The policies live in migration 000007.
--
-- Wrapped so a missing ownership privilege produces a visible WARNING plus a
-- verification hint instead of aborting the migration run.

DO $$
DECLARE
    v_rls BOOLEAN;
BEGIN
    SELECT c.relrowsecurity INTO v_rls
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'storage' AND c.relname = 'objects';

    IF v_rls IS NULL THEN
        RAISE WARNING 'storage.objects does not exist; run the storage policies migration first.';
        RETURN;
    END IF;

    IF v_rls THEN
        RAISE NOTICE 'RLS already enabled on storage.objects.';
    ELSE
        BEGIN
            EXECUTE 'ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY';
            RAISE NOTICE 'RLS enabled on storage.objects.';
        EXCEPTION WHEN insufficient_privilege THEN
            RAISE WARNING 'Could not enable RLS on storage.objects (table ownership required). Enable it in the Supabase dashboard, then verify: SELECT relrowsecurity FROM pg_class WHERE relname = ''objects'';';
        END;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'storage' AND tablename = 'objects'
          AND policyname = 'product_images_admin_insert'
    ) THEN
        RAISE WARNING 'Expected storage policies are missing; apply migration 20261022000007 first.';
    END IF;
END $$;
