-- Dynamic collections: products can belong to many collections without being duplicated.
CREATE TABLE IF NOT EXISTS public.collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  cover_image_url TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.collection_products (
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (collection_id, product_id)
);

CREATE INDEX IF NOT EXISTS collections_published_order_idx
  ON public.collections (is_published, display_order);
CREATE INDEX IF NOT EXISTS collection_products_product_idx
  ON public.collection_products (product_id);

ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections FORCE ROW LEVEL SECURITY;
ALTER TABLE public.collection_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_products FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "collections_public_select_published" ON public.collections;
CREATE POLICY "collections_public_select_published" ON public.collections
  FOR SELECT USING (is_published = TRUE OR public.is_admin());

DROP POLICY IF EXISTS "collections_admin_all" ON public.collections;
CREATE POLICY "collections_admin_all" ON public.collections
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "collection_products_public_select_published" ON public.collection_products;
CREATE POLICY "collection_products_public_select_published" ON public.collection_products
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.collections c
      WHERE c.id = collection_products.collection_id
      AND (c.is_published = TRUE OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS "collection_products_admin_all" ON public.collection_products;
CREATE POLICY "collection_products_admin_all" ON public.collection_products
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

INSERT INTO public.collections (slug, name, name_ar, description, cover_image_url, display_order, is_published)
SELECT f.slug, f.name, f.name_ar, COALESCE(f.description, ''), f.image_url, f.display_order, TRUE
FROM (
  VALUES
    ('sexy', 'Sexy', 'سيكسي', 'A confident, expressive signature.', '/images/products/body-lotion-sexy.webp', 1),
    ('queen', 'Queen', 'كوين', 'A regal floral and oud ritual.', '/images/products/body-lotion-queen.webp', 2),
    ('ruby-musk', 'Ruby Musk', 'روبي مسك', 'A warm, luminous musk ritual.', '/images/products/body-lotion-ruby-musk.webp', 3),
    ('botanical', 'Botanical Care', 'العناية النباتية', 'Gentle botanical care for every day.', '/images/products/shampoo-aloe-vera.webp', 4)
) AS f(slug, name, name_ar, description, image_url, display_order)
WHERE NOT EXISTS (SELECT 1 FROM public.collections c WHERE c.slug = f.slug);

INSERT INTO public.collections (slug, name, name_ar, description, cover_image_url, display_order, is_published)
VALUES
  ('soft-glow-bundle', 'Soft & Glow Bundle', 'مجموعة النعومة والإشراقة', 'A complete ritual for soft, glowing skin.', '/images/soft-glow-bundle.jpg', 50, TRUE),
  ('fresh-all-day-bundle', 'Fresh All Day Bundle', 'مجموعة الانتعاش طوال اليوم', 'Fresh cleansing, hydration, and fragrance all day.', '/images/fresh-all-day-bundle.jpg', 51, TRUE)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.collection_products (collection_id, product_id, display_order)
SELECT c.id, p.id, ROW_NUMBER() OVER (PARTITION BY c.id ORDER BY p.created_at, p.slug) - 1
FROM public.collections c
JOIN public.products p ON (
  (c.slug IN ('sexy', 'queen', 'ruby-musk') AND p.slug LIKE '%-' || c.slug)
  OR (c.slug = 'botanical' AND p.category_id IN (SELECT id FROM public.categories WHERE slug IN ('shampoo', 'hair-mist')))
)
ON CONFLICT (collection_id, product_id) DO NOTHING;
