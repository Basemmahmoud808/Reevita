-- Add the sixth product type without touching existing categories or products.
-- The remaining five categories are already part of the canonical storefront seed.
INSERT INTO public.categories (id, slug, name, name_ar, description, image_url, display_order, is_active)
SELECT
  '22222222-0000-0000-0000-000000000006'::uuid,
  'shower-gel',
  'Shower Gel',
  'شاور جل',
  'Fresh, gentle cleansing for the daily shower.',
  '/images/fresh-all-day-bundle.jpg',
  6,
  TRUE
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'shower-gel');
