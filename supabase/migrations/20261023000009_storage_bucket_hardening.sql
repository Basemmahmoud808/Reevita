-- Migration 000009: storage-level upload hardening for product images.
--
-- Server actions already validate MIME type and size, but the bucket must also
-- refuse anything a client claims differently (defence in depth).
--
-- On a hosted Supabase project storage.buckets is owned by the storage service role,
-- so the statements are wrapped: a missing ownership privilege downgrades to a WARNING
-- instead of aborting the whole migration. The dashboard remains the source of truth
-- in that case (Storage → product-images → Settings).

DO $$
BEGIN
    BEGIN
        EXECUTE 'ALTER TABLE storage.buckets ADD COLUMN IF NOT EXISTS file_size_limit BIGINT';
        EXECUTE 'ALTER TABLE storage.buckets ADD COLUMN IF NOT EXISTS allowed_mime_types TEXT[]';
    EXCEPTION WHEN insufficient_privilege THEN
        RAISE WARNING 'storage.buckets is not owned by the migration role; relying on the existing Supabase columns.';
    END;

    BEGIN
        UPDATE storage.buckets
        SET file_size_limit = 5242880,
            allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']
        WHERE id = 'product-images';

        IF NOT FOUND THEN
            RAISE WARNING 'Bucket "product-images" was not found; create it (public read, admin write) and re-run this statement.';
        END IF;
    EXCEPTION WHEN insufficient_privilege THEN
        RAISE WARNING 'Insufficient privilege to set product-images limits; set 5 MB + jpeg/png/webp in the Supabase dashboard';
    END;
END $$;
