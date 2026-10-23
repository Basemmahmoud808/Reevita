-- Migration 000010: make storage authorisation explicit.
--
-- Supabase enables RLS on storage.objects by default, but a security control must
-- not depend on an implicit platform default (and the repository's PostgreSQL test
-- harness creates storage.objects itself). Policies for this table already exist in
-- migration 000007; this statement guarantees they are enforced everywhere.

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
