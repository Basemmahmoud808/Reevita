-- Keep bundle quantities explicit while preserving the existing many-to-many relationship.
ALTER TABLE public.collection_products
  ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 1;

ALTER TABLE public.collection_products
  DROP CONSTRAINT IF EXISTS collection_products_quantity_check;

ALTER TABLE public.collection_products
  ADD CONSTRAINT collection_products_quantity_check CHECK (quantity > 0);
