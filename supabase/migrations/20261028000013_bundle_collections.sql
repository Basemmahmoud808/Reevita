-- Bundle metadata keeps uncertain bundles visible without allowing a partial,
-- misleading purchase until every pictured product has a real catalogue row.
ALTER TABLE public.collection_products
  ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 1;

ALTER TABLE public.collections
  ADD COLUMN IF NOT EXISTS purchase_ready BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS missing_products TEXT[] NOT NULL DEFAULT '{}';

INSERT INTO public.collections (slug, name, name_ar, description, cover_image_url, display_order, is_published, purchase_ready, missing_products)
VALUES
  ('soft-glow-bundle', 'Soft & Glow Bundle', 'Soft & Glow Bundle', 'A complete body-care ritual for soft, glowing skin.', '/images/collections/soft-glow-bundle.jpg', 6, TRUE, TRUE, '{}'),
  ('fresh-all-day-bundle', 'Fresh All Day Bundle', 'Fresh All Day Bundle', 'A fresh shower and body ritual for an easy all-day routine.', '/images/collections/fresh-all-day-bundle.jpg', 7, TRUE, FALSE, ARRAY['Shower Gel Blueberry — 500 ml']),
  ('hair-care-duo-bundle', 'Hair Care Duo Bundle', 'Hair Care Duo Bundle', 'A coordinated shampoo and hair mist ritual for fresh, scented hair.', '/images/collections/hair-care-duo-bundle.jpg', 8, TRUE, TRUE, '{}'),
  ('complete-care-bundle', 'Complete Care Bundle', 'Complete Care Bundle', 'A full-body care ritual shown in the supplied bundle image.', '/images/collections/complete-care-bundle.jpg', 9, TRUE, FALSE, ARRAY['Shampoo Bubble Gum — 300 ml', 'Shower Gel Bubble Gum — 500 ml'])
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  name_ar = EXCLUDED.name_ar,
  description = EXCLUDED.description,
  cover_image_url = EXCLUDED.cover_image_url,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  purchase_ready = EXCLUDED.purchase_ready,
  missing_products = EXCLUDED.missing_products,
  updated_at = now();

DELETE FROM public.collection_products cp
USING public.collections c
WHERE cp.collection_id = c.id
  AND c.slug IN ('soft-glow-bundle', 'fresh-all-day-bundle', 'hair-care-duo-bundle', 'complete-care-bundle');

INSERT INTO public.collection_products (collection_id, product_id, display_order, quantity)
SELECT c.id, p.id, membership.display_order, membership.quantity
FROM (
  VALUES
    ('soft-glow-bundle', 'body-lotion-queen', 0, 1),
    ('soft-glow-bundle', 'body-splash-queen', 1, 1),
    ('soft-glow-bundle', 'body-butter-queen', 2, 1),
    ('soft-glow-bundle', 'body-lotion-sexy', 3, 1),
    ('soft-glow-bundle', 'body-splash-sexy', 4, 1),
    ('soft-glow-bundle', 'body-butter-sexy', 5, 1),
    ('soft-glow-bundle', 'body-lotion-ruby-musk', 6, 1),
    ('soft-glow-bundle', 'body-splash-ruby-musk', 7, 1),
    ('soft-glow-bundle', 'body-butter-ruby-musk', 8, 1),
    ('fresh-all-day-bundle', 'body-lotion-ruby-musk', 0, 1),
    ('fresh-all-day-bundle', 'body-splash-ruby-musk', 1, 1),
    ('hair-care-duo-bundle', 'shampoo-blueberry', 0, 1),
    ('hair-care-duo-bundle', 'hair-mist-ruby-musk', 1, 1),
    ('complete-care-bundle', 'body-lotion-sexy', 0, 1),
    ('complete-care-bundle', 'body-splash-sexy', 1, 1),
    ('complete-care-bundle', 'body-butter-sexy', 2, 1),
    ('complete-care-bundle', 'hair-mist-sexy', 3, 1)
) AS membership(collection_slug, product_slug, display_order, quantity)
JOIN public.collections c ON c.slug = membership.collection_slug
JOIN public.products p ON p.slug = membership.product_slug
ON CONFLICT (collection_id, product_id) DO UPDATE SET display_order = EXCLUDED.display_order, quantity = EXCLUDED.quantity;
