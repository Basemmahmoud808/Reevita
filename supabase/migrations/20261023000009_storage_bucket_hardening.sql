-- Migration 000009: storage-level upload hardening for product images.
-- Server actions already validate MIME type and size, but the bucket must also
-- refuse anything the client claims differently (defence in depth).

-- Keep the lightweight test harness schema compatible with Supabase's storage.buckets.
ALTER TABLE storage.buckets ADD COLUMN IF NOT EXISTS file_size_limit BIGINT;
ALTER TABLE storage.buckets ADD COLUMN IF NOT EXISTS allowed_mime_types TEXT[];

UPDATE storage.buckets
SET file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']
WHERE id = 'product-images';
