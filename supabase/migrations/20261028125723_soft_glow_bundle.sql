-- Configure only the owner-supplied Soft & Glow Bundle assets and metadata.
-- Its previous membership linked unrelated body-care products. Leave it empty
-- until the pictured shampoo SKUs are represented in the trusted catalog.
UPDATE public.collections
SET name = 'Soft & Glow Bundle',
    name_ar = 'باقة النعومة والإشراقة',
    description = 'روتين عناية بالشعر يجمع الشامبو ومعطر الشعر في اختيارات تناسب مزاجك.',
    cover_image_url = '/images/collections/soft-glow-bundle.webp',
    display_order = 6,
    is_published = TRUE,
    purchase_ready = FALSE,
    missing_products = ARRAY['Shampoo Bubble Gum — 300 ml', 'Shampoo Dove — 300 ml'],
    updated_at = now()
WHERE slug = 'soft-glow-bundle';

DELETE FROM public.collection_products cp
USING public.collections c
WHERE cp.collection_id = c.id
  AND c.slug = 'soft-glow-bundle';

NOTIFY pgrst, 'reload schema';
