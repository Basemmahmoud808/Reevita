-- Prepare the customer catalogue from owner-confirmed prices and sizes.
-- No customer orders exist at the time of this migration; stock is set to zero
-- until verified counts are entered through the admin inventory page.

INSERT INTO public.categories (slug, name, name_ar, description, image_url, display_order, is_active) VALUES
  ('shampoo', 'Shampoo', 'الشامبو', 'شامبو REEVITA للعناية بالشعر.', '/images/products/shampoo-aloe-vera.webp', 5, TRUE),
  ('shower-gel', 'Shower Gel', 'شاور جل', 'شاور جل REEVITA للاستخدام أثناء الاستحمام.', '/images/products/shower-gel-blueberry.webp', 6, TRUE)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  name_ar = EXCLUDED.name_ar,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  display_order = EXCLUDED.display_order,
  is_active = TRUE;

-- The owner confirmed one flat 50 EGP delivery fee across Egypt.
UPDATE public.shipping_rates
SET shipping_cost = 50,
    updated_at = now();

UPDATE public.products p
SET price = CASE c.slug
      WHEN 'body-lotion' THEN 240
      WHEN 'body-splash' THEN 320
      WHEN 'body-butter' THEN 320
      WHEN 'hair-mist' THEN 220
      WHEN 'shower-gel' THEN 220
      ELSE p.price
    END,
    compare_at_price = NULL,
    is_featured = FALSE,
    updated_at = now()
FROM public.categories c
WHERE c.id = p.category_id;

UPDATE public.products
SET size = '200 مل', updated_at = now()
WHERE slug LIKE 'body-butter-%' AND size IN ('200 جم', '200 g');

WITH new_products (
  product_id, category_slug, slug, name, name_ar, short_description,
  short_description_ar, description, price, size
) AS (
  VALUES
    ('33333333-0000-0000-0000-000000000015'::uuid, 'shampoo', 'shampoo-bubble-gum', 'REEVITA Shampoo Bubble Gum', 'ريفيتا شامبو بابل جام', 'REEVITA Shampoo Bubble Gum', 'ريفيتا شامبو بابل جام — 300 مل', 'شامبو REEVITA للعناية بالشعر. راجعي بيانات العبوة للاطلاع على المكونات وطريقة الاستخدام.', 220::numeric, '300 مل'),
    ('33333333-0000-0000-0000-000000000016'::uuid, 'shower-gel', 'shower-gel-bubble-gum', 'REEVITA Shower Gel Bubble Gum', 'ريفيتا شاور جل بابل جام', 'REEVITA Shower Gel Bubble Gum', 'ريفيتا شاور جل بابل جام — 500 مل', 'شاور جل REEVITA للاستخدام أثناء الاستحمام. الرائحة والحجم موضحان على العبوة.', 220::numeric, '500 مل'),
    ('33333333-0000-0000-0000-000000000017'::uuid, 'shower-gel', 'shower-gel-blueberry', 'REEVITA Shower Gel Blueberry', 'ريفيتا شاور جل توت أزرق', 'REEVITA Shower Gel Blueberry', 'ريفيتا شاور جل توت أزرق — 500 مل', 'شاور جل REEVITA للاستخدام أثناء الاستحمام. الرائحة والحجم موضحان على العبوة.', 220::numeric, '500 مل'),
    ('33333333-0000-0000-0000-000000000018'::uuid, 'shower-gel', 'shower-gel-dove', 'REEVITA Shower Gel Dove', 'ريفيتا شاور جل دوف', 'REEVITA Shower Gel Dove', 'ريفيتا شاور جل دوف — 500 مل', 'شاور جل REEVITA للاستخدام أثناء الاستحمام. الرائحة والحجم موضحان على العبوة.', 220::numeric, '500 مل')
)
INSERT INTO public.products (
  id, category_id, slug, name, name_ar, short_description, short_description_ar,
  description, price, compare_at_price, benefits, ingredients, how_to_use, size,
  is_featured, is_active
)
SELECT n.product_id, c.id, n.slug, n.name, n.name_ar, n.short_description,
  n.short_description_ar, n.description, n.price, NULL, ARRAY[]::text[], '', '',
  n.size, FALSE, TRUE
FROM new_products n
JOIN public.categories c ON c.slug = n.category_slug
ON CONFLICT (id) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  slug = EXCLUDED.slug,
  name = EXCLUDED.name,
  name_ar = EXCLUDED.name_ar,
  short_description = EXCLUDED.short_description,
  short_description_ar = EXCLUDED.short_description_ar,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  compare_at_price = NULL,
  benefits = ARRAY[]::text[],
  ingredients = '',
  how_to_use = '',
  size = EXCLUDED.size,
  is_featured = FALSE,
  is_active = TRUE,
  updated_at = now();

WITH size_products (product_id, parent_slug, slug, size, price) AS (
  VALUES
    ('33333333-0000-0000-0000-000000000019'::uuid, 'body-splash-sexy', 'body-splash-sexy-120', '120 مل', 220::numeric),
    ('33333333-0000-0000-0000-000000000020'::uuid, 'body-splash-queen', 'body-splash-queen-120', '120 مل', 220::numeric),
    ('33333333-0000-0000-0000-000000000021'::uuid, 'body-splash-ruby-musk', 'body-splash-ruby-musk-120', '120 مل', 220::numeric),
    ('33333333-0000-0000-0000-000000000022'::uuid, 'body-butter-sexy', 'body-butter-sexy-100', '100 مل', 200::numeric),
    ('33333333-0000-0000-0000-000000000023'::uuid, 'body-butter-queen', 'body-butter-queen-100', '100 مل', 200::numeric),
    ('33333333-0000-0000-0000-000000000024'::uuid, 'body-butter-ruby-musk', 'body-butter-ruby-musk-100', '100 مل', 200::numeric)
)
INSERT INTO public.products (
  id, category_id, slug, name, name_ar, short_description, short_description_ar,
  description, price, compare_at_price, benefits, ingredients, how_to_use, size,
  is_featured, is_active
)
SELECT s.product_id, parent.category_id, s.slug, parent.name || ' — ' || s.size,
  parent.name_ar, parent.short_description, parent.short_description_ar,
  parent.description, s.price, NULL, ARRAY[]::text[], '', '', s.size, FALSE, TRUE
FROM size_products s
JOIN public.products parent ON parent.slug = s.parent_slug
ON CONFLICT (id) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  slug = EXCLUDED.slug,
  name = EXCLUDED.name,
  name_ar = EXCLUDED.name_ar,
  short_description = EXCLUDED.short_description,
  short_description_ar = EXCLUDED.short_description_ar,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  compare_at_price = NULL,
  benefits = ARRAY[]::text[],
  ingredients = '',
  how_to_use = '',
  size = EXCLUDED.size,
  is_featured = FALSE,
  is_active = TRUE,
  updated_at = now();

DELETE FROM public.product_images
WHERE product_id IN (SELECT id FROM public.products WHERE slug IN (
  'shampoo-bubble-gum', 'shower-gel-bubble-gum', 'shower-gel-blueberry',
  'shower-gel-dove', 'body-splash-sexy-120', 'body-splash-queen-120',
  'body-splash-ruby-musk-120', 'body-butter-sexy-100', 'body-butter-queen-100',
  'body-butter-ruby-musk-100'
));

INSERT INTO public.product_images (product_id, image_url, alt_text, display_order, is_primary)
SELECT p.id, image.image_url, p.name_ar || ' — REEVITA', 1, TRUE
FROM (VALUES
  ('shampoo-bubble-gum', '/images/products/shampoo-bubble-gum.webp'),
  ('shower-gel-bubble-gum', '/images/products/shower-gel-bubble-gum.webp'),
  ('shower-gel-blueberry', '/images/products/shower-gel-blueberry.webp'),
  ('shower-gel-dove', '/images/products/shower-gel-dove.webp')
) AS image(slug, image_url)
JOIN public.products p ON p.slug = image.slug;

WITH size_images (slug, parent_slug) AS (
  VALUES
    ('body-splash-sexy-120', 'body-splash-sexy'),
    ('body-splash-queen-120', 'body-splash-queen'),
    ('body-splash-ruby-musk-120', 'body-splash-ruby-musk'),
    ('body-butter-sexy-100', 'body-butter-sexy'),
    ('body-butter-queen-100', 'body-butter-queen'),
    ('body-butter-ruby-musk-100', 'body-butter-ruby-musk')
)
INSERT INTO public.product_images (product_id, image_url, alt_text, display_order, is_primary)
SELECT variant.id, original.image_url, variant.name_ar || ' — REEVITA', 1, TRUE
FROM size_images s
JOIN public.products variant ON variant.slug = s.slug
JOIN public.products parent ON parent.slug = s.parent_slug
JOIN public.product_images original ON original.product_id = parent.id AND original.is_primary = TRUE;

UPDATE public.inventory
SET quantity_available = 0,
    quantity_reserved = 0,
    updated_at = now();

INSERT INTO public.inventory (product_id, quantity_available, quantity_reserved, low_stock_threshold)
SELECT id, 0, 0, 5
FROM public.products
WHERE slug IN (
  'shampoo-bubble-gum', 'shower-gel-bubble-gum', 'shower-gel-blueberry',
  'shower-gel-dove', 'body-splash-sexy-120', 'body-splash-queen-120',
  'body-splash-ruby-musk-120', 'body-butter-sexy-100', 'body-butter-queen-100',
  'body-butter-ruby-musk-100'
)
ON CONFLICT (product_id) DO UPDATE SET
  quantity_available = 0,
  quantity_reserved = 0,
  updated_at = now();

UPDATE public.collections
SET purchase_ready = FALSE,
    missing_products = ARRAY['Shampoo Dove — 300 ml'],
    updated_at = now()
WHERE slug = 'soft-glow-bundle';

DELETE FROM public.collection_products cp
USING public.collections c
WHERE cp.collection_id = c.id AND c.slug = 'complete-care-bundle';

UPDATE public.collections
SET purchase_ready = TRUE,
    missing_products = ARRAY[]::text[],
    updated_at = now()
WHERE slug = 'complete-care-bundle';

INSERT INTO public.collection_products (collection_id, product_id, display_order, quantity)
SELECT c.id, p.id, membership.display_order, 1
FROM (VALUES
  ('body-lotion-sexy', 0),
  ('body-lotion-queen', 1),
  ('body-lotion-ruby-musk', 2),
  ('body-splash-sexy', 3),
  ('body-splash-queen', 4),
  ('body-splash-ruby-musk', 5),
  ('shower-gel-bubble-gum', 6),
  ('shower-gel-blueberry', 7),
  ('shower-gel-dove', 8)
) AS membership(product_slug, display_order)
CROSS JOIN public.collections c
JOIN public.products p ON p.slug = membership.product_slug
WHERE c.slug = 'complete-care-bundle'
ON CONFLICT (collection_id, product_id) DO UPDATE SET
  display_order = EXCLUDED.display_order,
  quantity = EXCLUDED.quantity;

NOTIFY pgrst, 'reload schema';
