-- Supplied-image collections. Product membership uses existing product rows only;
-- missing Shower Gel records are intentionally not fabricated.
INSERT INTO public.collections (slug, name, name_ar, description, cover_image_url, display_order, is_published)
VALUES
  ('sweet-mood', 'Sweet Mood', 'Sweet Mood', 'A sweet daily ritual of cleansing, hydration, and fragrance.', '/images/collections/sweet-mood.jpg', 1, TRUE),
  ('clean-mood', 'Clean Mood', 'Clean Mood', 'A soft, fresh ritual for everyday care.', '/images/collections/clean-mood.jpg', 2, TRUE),
  ('ruby-musk-collection', 'Ruby Musk Collection', 'Ruby Musk Collection', 'A warm, luminous musk ritual for soft, scented skin.', '/images/collections/ruby-musk-collection.jpg', 3, TRUE),
  ('sexy-collection', 'Sexy Collection', 'Sexy Collection', 'An elegant, expressive ritual with lasting fragrance.', '/images/collections/sexy-collection.jpg', 4, TRUE),
  ('fruity-mood', 'Fruity Mood', 'Fruity Mood', 'A bright, fruity mood for lively haircare moments.', '/images/collections/fruity-mood.jpg', 5, TRUE)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  name_ar = EXCLUDED.name_ar,
  description = EXCLUDED.description,
  cover_image_url = EXCLUDED.cover_image_url,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  updated_at = now();

DELETE FROM public.collection_products cp
USING public.collections c
WHERE cp.collection_id = c.id
  AND c.slug IN ('sweet-mood', 'clean-mood', 'ruby-musk-collection', 'sexy-collection', 'fruity-mood');

INSERT INTO public.collection_products (collection_id, product_id, display_order)
SELECT c.id, p.id, membership.display_order
FROM (
  VALUES
    ('sweet-mood', 'body-lotion-sexy', 0),
    ('sweet-mood', 'body-splash-sexy', 1),
    ('clean-mood', 'body-lotion-queen', 0),
    ('clean-mood', 'body-splash-queen', 1),
    ('ruby-musk-collection', 'body-lotion-ruby-musk', 0),
    ('ruby-musk-collection', 'body-splash-ruby-musk', 1),
    ('ruby-musk-collection', 'body-butter-ruby-musk', 2),
    ('sexy-collection', 'body-lotion-sexy', 0),
    ('sexy-collection', 'body-splash-sexy', 1),
    ('sexy-collection', 'body-butter-sexy', 2),
    ('fruity-mood', 'shampoo-blueberry', 0),
    ('fruity-mood', 'hair-mist-ruby-musk', 1)
) AS membership(collection_slug, product_slug, display_order)
JOIN public.collections c ON c.slug = membership.collection_slug
JOIN public.products p ON p.slug = membership.product_slug
ON CONFLICT (collection_id, product_id) DO UPDATE SET display_order = EXCLUDED.display_order;
