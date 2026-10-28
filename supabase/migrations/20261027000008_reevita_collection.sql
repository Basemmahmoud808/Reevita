-- Add is_in_collection column to products table
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_in_collection BOOLEAN NOT NULL DEFAULT FALSE;

-- Index for fast filtering
CREATE INDEX IF NOT EXISTS products_is_in_collection_idx ON public.products (is_in_collection)
  WHERE is_in_collection = TRUE;

-- Allow admins to update is_in_collection via existing product update policy
-- (The existing UPDATE RLS policy for authenticated admins already covers this column.)
