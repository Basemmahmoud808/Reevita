-- Prevent future public-schema tables from inheriting Supabase's broad API
-- grants. Every new table must receive an explicit privilege grant.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON TABLES FROM PUBLIC, anon, authenticated;
