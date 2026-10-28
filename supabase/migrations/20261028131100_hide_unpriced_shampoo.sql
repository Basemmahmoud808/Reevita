-- Hide the existing shampoo listings until their owner-confirmed prices exist.
-- Bubble Gum shampoo is priced and listed separately at 220 EGP / 300ml.
UPDATE public.products
SET is_active = FALSE,
    updated_at = now()
WHERE slug IN ('shampoo-aloe-vera', 'shampoo-blueberry');

-- Move the affected collections to priced products that are actually listed.
DELETE FROM public.collection_products cp
USING public.collections c
WHERE cp.collection_id = c.id
  AND c.slug IN ('hair-care-duo-bundle', 'fruity-mood');

INSERT INTO public.collection_products (collection_id, product_id, display_order, quantity)
SELECT c.id, p.id, m.display_order, 1
FROM (VALUES
  ('hair-care-duo-bundle', 'shampoo-bubble-gum', 0),
  ('hair-care-duo-bundle', 'hair-mist-ruby-musk', 1),
  ('fruity-mood', 'shower-gel-blueberry', 0),
  ('fruity-mood', 'body-lotion-ruby-musk', 1),
  ('fruity-mood', 'body-splash-ruby-musk', 2)
) AS m(collection_slug, product_slug, display_order)
JOIN public.collections c ON c.slug = m.collection_slug
JOIN public.products p ON p.slug = m.product_slug AND p.is_active = TRUE
ON CONFLICT (collection_id, product_id) DO UPDATE SET
  display_order = EXCLUDED.display_order,
  quantity = EXCLUDED.quantity;

NOTIFY pgrst, 'reload schema';
