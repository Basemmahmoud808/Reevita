-- =====================================================================
-- REEVITA storefront seed — AUTO-GENERATED from src/data/catalog.json
-- Regenerate with: node scripts/generate-catalog-seed.mjs
-- =====================================================================

-- 1. Egyptian governorates (27)
INSERT INTO public.governorates (id, code, name_ar, name_en, zone, is_active) VALUES
  ('11111111-0000-0000-0000-000000000001', 'CAI', 'القاهرة', 'Cairo', 'greater_cairo', TRUE),
  ('11111111-0000-0000-0000-000000000002', 'GIZ', 'الجيزة', 'Giza', 'greater_cairo', TRUE),
  ('11111111-0000-0000-0000-000000000003', 'QAL', 'القليوبية', 'Qalyubia', 'greater_cairo', TRUE),
  ('11111111-0000-0000-0000-000000000004', 'ALX', 'الإسكندرية', 'Alexandria', 'alexandria', TRUE),
  ('11111111-0000-0000-0000-000000000005', 'PTS', 'بورسعيد', 'Port Said', 'canal', TRUE),
  ('11111111-0000-0000-0000-000000000006', 'SUZ', 'السويس', 'Suez', 'canal', TRUE),
  ('11111111-0000-0000-0000-000000000007', 'ISM', 'الإسماعيلية', 'Ismailia', 'canal', TRUE),
  ('11111111-0000-0000-0000-000000000008', 'DAM', 'دمياط', 'Damietta', 'delta', TRUE),
  ('11111111-0000-0000-0000-000000000009', 'DKH', 'الدقهلية', 'Dakahlia', 'delta', TRUE),
  ('11111111-0000-0000-0000-000000000010', 'SHR', 'الشرقية', 'Sharqia', 'delta', TRUE),
  ('11111111-0000-0000-0000-000000000011', 'KFR', 'كفر الشيخ', 'Kafr El Sheikh', 'delta', TRUE),
  ('11111111-0000-0000-0000-000000000012', 'GHB', 'الغربية', 'Gharbia', 'delta', TRUE),
  ('11111111-0000-0000-0000-000000000013', 'MNF', 'المنوفية', 'Monufia', 'delta', TRUE),
  ('11111111-0000-0000-0000-000000000014', 'BEH', 'البحيرة', 'Beheira', 'delta', TRUE),
  ('11111111-0000-0000-0000-000000000015', 'FYM', 'الفيوم', 'Fayoum', 'upper_egypt', TRUE),
  ('11111111-0000-0000-0000-000000000016', 'BNS', 'بني سويف', 'Beni Suef', 'upper_egypt', TRUE),
  ('11111111-0000-0000-0000-000000000017', 'MNY', 'المنيا', 'Minya', 'upper_egypt', TRUE),
  ('11111111-0000-0000-0000-000000000018', 'ASY', 'أسيوط', 'Asyut', 'upper_egypt', TRUE),
  ('11111111-0000-0000-0000-000000000019', 'SHG', 'سوهاج', 'Sohag', 'upper_egypt', TRUE),
  ('11111111-0000-0000-0000-000000000020', 'QNA', 'قنا', 'Qena', 'upper_egypt', TRUE),
  ('11111111-0000-0000-0000-000000000021', 'LXR', 'الأقصر', 'Luxor', 'upper_egypt', TRUE),
  ('11111111-0000-0000-0000-000000000022', 'ASW', 'أسوان', 'Aswan', 'upper_egypt', TRUE),
  ('11111111-0000-0000-0000-000000000023', 'RSH', 'البحر الأحمر', 'Red Sea', 'frontier', TRUE),
  ('11111111-0000-0000-0000-000000000024', 'WAD', 'الوادي الجديد', 'New Valley', 'frontier', TRUE),
  ('11111111-0000-0000-0000-000000000025', 'MAT', 'مطروح', 'Matrouh', 'frontier', TRUE),
  ('11111111-0000-0000-0000-000000000026', 'SIN', 'شمال سيناء', 'North Sinai', 'frontier', TRUE),
  ('11111111-0000-0000-0000-000000000027', 'SIS', 'جنوب سيناء', 'South Sinai', 'frontier', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 2. Shipping rates per governorate
INSERT INTO public.shipping_rates (governorate_id, shipping_cost, free_shipping_threshold, estimated_days_min, estimated_days_max)
SELECT id,
  50,
  CASE zone
    WHEN 'frontier' THEN 1500 WHEN 'upper_egypt' THEN 1200 ELSE 1000 END,
  CASE zone
    WHEN 'greater_cairo' THEN 1 WHEN 'alexandria' THEN 1
    WHEN 'delta' THEN 2 WHEN 'canal' THEN 2
    WHEN 'upper_egypt' THEN 3 ELSE 4 END,
  CASE zone
    WHEN 'greater_cairo' THEN 2 WHEN 'alexandria' THEN 2
    WHEN 'delta' THEN 3 WHEN 'canal' THEN 3
    WHEN 'upper_egypt' THEN 4 ELSE 6 END
FROM public.governorates
ON CONFLICT (governorate_id) DO NOTHING;

-- 3. Product lines / categories
INSERT INTO public.categories (id, slug, name, name_ar, description, image_url, display_order, is_active) VALUES
  ('22222222-0000-0000-0000-000000000001', 'body-lotion', 'Body Lotion', 'لوشن الجسم', 'لوشن خفيف سريع الامتصاص يمنح بشرتك ترطيبًا عميقًا ونعومة تدوم طوال اليوم.', '/images/products/body-lotion-queen.webp', 1, TRUE),
  ('22222222-0000-0000-0000-000000000002', 'body-butter', 'Body Butter', 'زبدة الجسم', 'قوام مخملي غني بزبدة الشيا والكاكاو، يغذي البشرة الجافة ويتركها ناعمة كالحرير.', '/images/products/body-butter-queen.webp', 2, TRUE),
  ('22222222-0000-0000-0000-000000000003', 'body-splash', 'Body Splash', 'سبراي الجسم', 'سبراي منعش خفيف يمنح جسمك انتعاشًا فوريًا ولمسة عطرية أنثوية تناسب كل يوم.', '/images/products/body-splash-ruby-musk.webp', 3, TRUE),
  ('22222222-0000-0000-0000-000000000004', 'hair-mist', 'Hair Mist', 'معطر الشعر', 'رذاذ خفيف للشعر يمنحه لمعانًا ناعمًا ورائحة فاخرة تدوم دون أن يثقل خصلاته.', '/images/products/hair-mist-queen.webp', 4, TRUE),
  ('22222222-0000-0000-0000-000000000005', 'shampoo', 'Shampoo', 'الشامبو', 'شامبو لطيف بتركيبة خالية من السلفات ينظف الفروة بعمق ويحافظ على توازنها الطبيعي.', '/images/products/shampoo-aloe-vera.webp', 5, TRUE),
  ('22222222-0000-0000-0000-000000000006', 'shower-gel', 'Shower Gel', 'شاور جل', 'تركيبة منعشة تنظف البشرة بلطف وتتركها ناعمة ومعطرة.', '/images/products/shower-gel-blueberry.webp', 6, TRUE)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, name_ar = EXCLUDED.name_ar,
  description = EXCLUDED.description, image_url = EXCLUDED.image_url,
  display_order = EXCLUDED.display_order, is_active = TRUE;

-- 4. Products (25 catalogue SKUs) — prices in EGP
INSERT INTO public.products (id, category_id, slug, name, name_ar, short_description, short_description_ar, description, price, compare_at_price, benefits, ingredients, how_to_use, size, is_featured, is_active) VALUES
  ('33333333-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000005', 'shampoo-aloe-vera', 'REEVITA Shampoo Aloe Vera', 'ريفيتا شامبو ألوفيرا', 'Shampoo with Botanical Care notes.', 'ريفيتا شامبو ألوفيرا — 300 مل', 'شامبو REEVITA للعناية بالشعر. راجعي بيانات العبوة للاطلاع على المكونات وطريقة الاستخدام.', 350, NULL, ARRAY[]::text[], '', '', '300 مل', FALSE, FALSE),
  ('33333333-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000005', 'shampoo-blueberry', 'REEVITA Shampoo Blueberry', 'ريفيتا شامبو توت أزرق', 'Shampoo with Botanical Care notes.', 'ريفيتا شامبو توت أزرق — 300 مل', 'شامبو REEVITA للعناية بالشعر. راجعي بيانات العبوة للاطلاع على المكونات وطريقة الاستخدام.', 220, NULL, ARRAY[]::text[], '', '', '300 مل', FALSE, TRUE),
  ('33333333-0000-0000-0000-000000000003', '22222222-0000-0000-0000-000000000001', 'body-lotion-sexy', 'REEVITA Body Lotion Sexy', 'ريفيتا لوشن الجسم سيكسي', 'Body Lotion with Sexy notes.', 'ريفيتا لوشن الجسم سيكسي — 200 مل', 'لوشن جسم REEVITA. الرائحة والحجم موضحان على صفحة المنتج والعبوة.', 240, NULL, ARRAY[]::text[], '', '', '200 مل', FALSE, TRUE),
  ('33333333-0000-0000-0000-000000000004', '22222222-0000-0000-0000-000000000001', 'body-lotion-queen', 'REEVITA Body Lotion Queen', 'ريفيتا لوشن الجسم كوين', 'Body Lotion with Queen notes.', 'ريفيتا لوشن الجسم كوين — 200 مل', 'لوشن جسم REEVITA. الرائحة والحجم موضحان على صفحة المنتج والعبوة.', 240, NULL, ARRAY[]::text[], '', '', '200 مل', FALSE, TRUE),
  ('33333333-0000-0000-0000-000000000005', '22222222-0000-0000-0000-000000000001', 'body-lotion-ruby-musk', 'REEVITA Body Lotion Ruby Musk', 'ريفيتا لوشن الجسم روبي مسك', 'Body Lotion with Ruby Musk notes.', 'ريفيتا لوشن الجسم روبي مسك — 200 مل', 'لوشن جسم REEVITA. الرائحة والحجم موضحان على صفحة المنتج والعبوة.', 240, NULL, ARRAY[]::text[], '', '', '200 مل', FALSE, TRUE),
  ('33333333-0000-0000-0000-000000000006', '22222222-0000-0000-0000-000000000002', 'body-butter-sexy', 'REEVITA Body Butter Sexy', 'ريفيتا زبدة الجسم سيكسي', 'Body Butter with Sexy notes.', 'ريفيتا زبدة الجسم سيكسي — 200 جم', 'بادي باتر REEVITA. الرائحة والحجم موضحان على صفحة المنتج والعبوة.', 320, NULL, ARRAY[]::text[], '', '', '200 مل', FALSE, TRUE),
  ('33333333-0000-0000-0000-000000000007', '22222222-0000-0000-0000-000000000002', 'body-butter-queen', 'REEVITA Body Butter Queen', 'ريفيتا زبدة الجسم كوين', 'Body Butter with Queen notes.', 'ريفيتا زبدة الجسم كوين — 200 جم', 'بادي باتر REEVITA. الرائحة والحجم موضحان على صفحة المنتج والعبوة.', 320, NULL, ARRAY[]::text[], '', '', '200 مل', FALSE, TRUE),
  ('33333333-0000-0000-0000-000000000008', '22222222-0000-0000-0000-000000000002', 'body-butter-ruby-musk', 'REEVITA Body Butter Ruby Musk', 'ريفيتا زبدة الجسم روبي مسك', 'Body Butter with Ruby Musk notes.', 'ريفيتا زبدة الجسم روبي مسك — 200 جم', 'بادي باتر REEVITA. الرائحة والحجم موضحان على صفحة المنتج والعبوة.', 320, NULL, ARRAY[]::text[], '', '', '200 مل', FALSE, TRUE),
  ('33333333-0000-0000-0000-000000000009', '22222222-0000-0000-0000-000000000003', 'body-splash-sexy', 'REEVITA Body Splash Sexy', 'ريفيتا بادي سبلاش سيكسي', 'Body Splash with Sexy notes.', 'ريفيتا بادي سبلاش سيكسي — 200 مل', 'بادي سبلاش REEVITA. الرائحة والحجم موضحان على صفحة المنتج والعبوة.', 320, NULL, ARRAY[]::text[], '', '', '200 مل', FALSE, TRUE),
  ('33333333-0000-0000-0000-000000000010', '22222222-0000-0000-0000-000000000003', 'body-splash-queen', 'REEVITA Body Splash Queen', 'ريفيتا بادي سبلاش كوين', 'Body Splash with Queen notes.', 'ريفيتا بادي سبلاش كوين — 200 مل', 'بادي سبلاش REEVITA. الرائحة والحجم موضحان على صفحة المنتج والعبوة.', 320, NULL, ARRAY[]::text[], '', '', '200 مل', FALSE, TRUE),
  ('33333333-0000-0000-0000-000000000011', '22222222-0000-0000-0000-000000000003', 'body-splash-ruby-musk', 'REEVITA Body Splash Ruby Musk', 'ريفيتا بادي سبلاش روبي مسك', 'Body Splash with Ruby Musk notes.', 'ريفيتا بادي سبلاش روبي مسك — 200 مل', 'بادي سبلاش REEVITA. الرائحة والحجم موضحان على صفحة المنتج والعبوة.', 320, NULL, ARRAY[]::text[], '', '', '200 مل', FALSE, TRUE),
  ('33333333-0000-0000-0000-000000000012', '22222222-0000-0000-0000-000000000004', 'hair-mist-sexy', 'REEVITA Hair Mist Sexy', 'ريفيتا معطر الشعر سيكسي', 'Hair Mist with Sexy notes.', 'ريفيتا معطر الشعر سيكسي — 100 مل', 'هير ميست REEVITA. الرائحة والحجم موضحان على صفحة المنتج والعبوة.', 220, NULL, ARRAY[]::text[], '', '', '100 مل', FALSE, TRUE),
  ('33333333-0000-0000-0000-000000000013', '22222222-0000-0000-0000-000000000004', 'hair-mist-queen', 'REEVITA Hair Mist Queen', 'ريفيتا معطر الشعر كوين', 'Hair Mist with Queen notes.', 'ريفيتا معطر الشعر كوين — 100 مل', 'هير ميست REEVITA. الرائحة والحجم موضحان على صفحة المنتج والعبوة.', 220, NULL, ARRAY[]::text[], '', '', '100 مل', FALSE, TRUE),
  ('33333333-0000-0000-0000-000000000014', '22222222-0000-0000-0000-000000000004', 'hair-mist-ruby-musk', 'REEVITA Hair Mist Ruby Musk', 'ريفيتا معطر الشعر روبي مسك', 'Hair Mist with Ruby Musk notes.', 'ريفيتا معطر الشعر روبي مسك — 100 مل', 'هير ميست REEVITA. الرائحة والحجم موضحان على صفحة المنتج والعبوة.', 220, NULL, ARRAY[]::text[], '', '', '100 مل', FALSE, TRUE),
  ('33333333-0000-0000-0000-000000000015', '22222222-0000-0000-0000-000000000005', 'shampoo-bubble-gum', 'REEVITA Shampoo Bubble Gum', 'ريفيتا شامبو بابل جام', 'Shampoo with Botanical Care notes.', 'ريفيتا شامبو بابل جام — 300 مل', 'شامبو REEVITA للعناية بالشعر. راجعي بيانات العبوة للاطلاع على المكونات وطريقة الاستخدام.', 220, NULL, ARRAY[]::text[], '', '', '300 مل', FALSE, TRUE),
  ('33333333-0000-0000-0000-000000000016', '22222222-0000-0000-0000-000000000006', 'shower-gel-bubble-gum', 'REEVITA Shower Gel Bubble Gum', 'ريفيتا شاور جل بابل جام', 'Shower Gel with  notes.', 'ريفيتا شاور جل بابل جام — 500 مل', 'شاور جل REEVITA للاستخدام أثناء الاستحمام. الرائحة والحجم موضحان على العبوة.', 220, NULL, ARRAY[]::text[], '', '', '500 مل', FALSE, TRUE),
  ('33333333-0000-0000-0000-000000000017', '22222222-0000-0000-0000-000000000006', 'shower-gel-blueberry', 'REEVITA Shower Gel Blueberry', 'ريفيتا شاور جل توت أزرق', 'Shower Gel with  notes.', 'ريفيتا شاور جل توت أزرق — 500 مل', 'شاور جل REEVITA للاستخدام أثناء الاستحمام. الرائحة والحجم موضحان على العبوة.', 220, NULL, ARRAY[]::text[], '', '', '500 مل', FALSE, TRUE),
  ('33333333-0000-0000-0000-000000000018', '22222222-0000-0000-0000-000000000006', 'shower-gel-dove', 'REEVITA Shower Gel Dove', 'ريفيتا شاور جل دوف', 'Shower Gel with  notes.', 'ريفيتا شاور جل دوف — 500 مل', 'شاور جل REEVITA للاستخدام أثناء الاستحمام. الرائحة والحجم موضحان على العبوة.', 220, NULL, ARRAY[]::text[], '', '', '500 مل', FALSE, TRUE),
  ('33333333-0000-0000-0000-000000000019', '22222222-0000-0000-0000-000000000003', 'body-splash-sexy-120', 'REEVITA Body Splash Sexy', 'ريفيتا بادي سبلاش سيكسي', 'Body Splash with Sexy notes.', 'ريفيتا بادي سبلاش سيكسي — 120 مل', 'بادي سبلاش REEVITA. الرائحة والحجم موضحان على صفحة المنتج والعبوة.', 220, NULL, ARRAY[]::text[], '', '', '120 مل', FALSE, TRUE),
  ('33333333-0000-0000-0000-000000000020', '22222222-0000-0000-0000-000000000003', 'body-splash-queen-120', 'REEVITA Body Splash Queen', 'ريفيتا بادي سبلاش كوين', 'Body Splash with Queen notes.', 'ريفيتا بادي سبلاش كوين — 120 مل', 'بادي سبلاش REEVITA. الرائحة والحجم موضحان على صفحة المنتج والعبوة.', 220, NULL, ARRAY[]::text[], '', '', '120 مل', FALSE, TRUE),
  ('33333333-0000-0000-0000-000000000021', '22222222-0000-0000-0000-000000000003', 'body-splash-ruby-musk-120', 'REEVITA Body Splash Ruby Musk', 'ريفيتا بادي سبلاش روبي مسك', 'Body Splash with Ruby Musk notes.', 'ريفيتا بادي سبلاش روبي مسك — 120 مل', 'بادي سبلاش REEVITA. الرائحة والحجم موضحان على صفحة المنتج والعبوة.', 220, NULL, ARRAY[]::text[], '', '', '120 مل', FALSE, TRUE),
  ('33333333-0000-0000-0000-000000000022', '22222222-0000-0000-0000-000000000002', 'body-butter-sexy-100', 'REEVITA Body Butter Sexy', 'ريفيتا بادي باتر سيكسي', 'Body Butter with Sexy notes.', 'ريفيتا بادي باتر سيكسي — 100 مل', 'بادي باتر REEVITA. الرائحة والحجم موضحان على صفحة المنتج والعبوة.', 200, NULL, ARRAY[]::text[], '', '', '100 مل', FALSE, TRUE),
  ('33333333-0000-0000-0000-000000000023', '22222222-0000-0000-0000-000000000002', 'body-butter-queen-100', 'REEVITA Body Butter Queen', 'ريفيتا بادي باتر كوين', 'Body Butter with Queen notes.', 'ريفيتا بادي باتر كوين — 100 مل', 'بادي باتر REEVITA. الرائحة والحجم موضحان على صفحة المنتج والعبوة.', 200, NULL, ARRAY[]::text[], '', '', '100 مل', FALSE, TRUE),
  ('33333333-0000-0000-0000-000000000024', '22222222-0000-0000-0000-000000000002', 'body-butter-ruby-musk-100', 'REEVITA Body Butter Ruby Musk', 'ريفيتا بادي باتر روبي مسك', 'Body Butter with Ruby Musk notes.', 'ريفيتا بادي باتر روبي مسك — 100 مل', 'بادي باتر REEVITA. الرائحة والحجم موضحان على صفحة المنتج والعبوة.', 200, NULL, ARRAY[]::text[], '', '', '100 مل', FALSE, TRUE),
  ('33333333-0000-0000-0000-000000000025', '22222222-0000-0000-0000-000000000005', 'shampoo-dove', 'REEVITA Shampoo Dove', 'ريفيتا شامبو دوف', 'Shampoo with Botanical Care notes.', 'ريفيتا شامبو دوف — 300 مل', 'شامبو REEVITA للعناية بالشعر. راجعي بيانات العبوة للاطلاع على المكونات وطريقة الاستخدام.', 220, NULL, ARRAY[]::text[], '', '', '300 مل', FALSE, TRUE)
ON CONFLICT (id) DO UPDATE SET
  category_id = EXCLUDED.category_id, name = EXCLUDED.name, name_ar = EXCLUDED.name_ar,
  short_description = EXCLUDED.short_description, short_description_ar = EXCLUDED.short_description_ar,
  description = EXCLUDED.description, price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price, benefits = EXCLUDED.benefits,
  ingredients = EXCLUDED.ingredients, how_to_use = EXCLUDED.how_to_use,
  size = EXCLUDED.size, is_featured = EXCLUDED.is_featured, is_active = EXCLUDED.is_active;

-- 5. Product imagery
DELETE FROM public.product_images;
INSERT INTO public.product_images (product_id, image_url, alt_text, display_order, is_primary) VALUES
  ('33333333-0000-0000-0000-000000000001', '/images/products/shampoo-aloe-vera.webp', 'ريفيتا شامبو ألوفيرا — REEVITA', 1, TRUE),
  ('33333333-0000-0000-0000-000000000002', '/images/products/shampoo-blueberry.webp', 'ريفيتا شامبو توت أزرق — REEVITA', 1, TRUE),
  ('33333333-0000-0000-0000-000000000003', '/images/products/body-lotion-sexy.webp', 'ريفيتا لوشن الجسم سيكسي — REEVITA', 1, TRUE),
  ('33333333-0000-0000-0000-000000000004', '/images/products/body-lotion-queen.webp', 'ريفيتا لوشن الجسم كوين — REEVITA', 1, TRUE),
  ('33333333-0000-0000-0000-000000000005', '/images/products/body-lotion-ruby-musk.webp', 'ريفيتا لوشن الجسم روبي مسك — REEVITA', 1, TRUE),
  ('33333333-0000-0000-0000-000000000006', '/images/products/body-butter-sexy.webp', 'ريفيتا زبدة الجسم سيكسي — REEVITA', 1, TRUE),
  ('33333333-0000-0000-0000-000000000007', '/images/products/body-butter-queen.webp', 'ريفيتا زبدة الجسم كوين — REEVITA', 1, TRUE),
  ('33333333-0000-0000-0000-000000000008', '/images/products/body-butter-ruby-musk.webp', 'ريفيتا زبدة الجسم روبي مسك — REEVITA', 1, TRUE),
  ('33333333-0000-0000-0000-000000000009', '/images/products/body-splash-sexy.webp', 'ريفيتا بادي سبلاش سيكسي — REEVITA', 1, TRUE),
  ('33333333-0000-0000-0000-000000000010', '/images/products/body-splash-queen.webp', 'ريفيتا بادي سبلاش كوين — REEVITA', 1, TRUE),
  ('33333333-0000-0000-0000-000000000011', '/images/products/body-splash-ruby-musk.webp', 'ريفيتا بادي سبلاش روبي مسك — REEVITA', 1, TRUE),
  ('33333333-0000-0000-0000-000000000012', '/images/products/hair-mist-sexy.webp', 'ريفيتا معطر الشعر سيكسي — REEVITA', 1, TRUE),
  ('33333333-0000-0000-0000-000000000013', '/images/products/hair-mist-queen.webp', 'ريفيتا معطر الشعر كوين — REEVITA', 1, TRUE),
  ('33333333-0000-0000-0000-000000000014', '/images/products/hair-mist-ruby-musk.webp', 'ريفيتا معطر الشعر روبي مسك — REEVITA', 1, TRUE),
  ('33333333-0000-0000-0000-000000000015', '/images/products/shampoo-bubble-gum.webp', 'ريفيتا شامبو بابل جام — REEVITA', 1, TRUE),
  ('33333333-0000-0000-0000-000000000016', '/images/products/shower-gel-bubble-gum.webp', 'ريفيتا شاور جل بابل جام — REEVITA', 1, TRUE),
  ('33333333-0000-0000-0000-000000000017', '/images/products/shower-gel-blueberry.webp', 'ريفيتا شاور جل توت أزرق — REEVITA', 1, TRUE),
  ('33333333-0000-0000-0000-000000000018', '/images/products/shower-gel-dove.webp', 'ريفيتا شاور جل دوف — REEVITA', 1, TRUE),
  ('33333333-0000-0000-0000-000000000019', '/images/products/body-splash-sexy.webp', 'ريفيتا بادي سبلاش سيكسي — REEVITA', 1, TRUE),
  ('33333333-0000-0000-0000-000000000020', '/images/products/body-splash-queen.webp', 'ريفيتا بادي سبلاش كوين — REEVITA', 1, TRUE),
  ('33333333-0000-0000-0000-000000000021', '/images/products/body-splash-ruby-musk.webp', 'ريفيتا بادي سبلاش روبي مسك — REEVITA', 1, TRUE),
  ('33333333-0000-0000-0000-000000000022', '/images/products/body-butter-sexy.webp', 'ريفيتا بادي باتر سيكسي — REEVITA', 1, TRUE),
  ('33333333-0000-0000-0000-000000000023', '/images/products/body-butter-queen.webp', 'ريفيتا بادي باتر كوين — REEVITA', 1, TRUE),
  ('33333333-0000-0000-0000-000000000024', '/images/products/body-butter-ruby-musk.webp', 'ريفيتا بادي باتر روبي مسك — REEVITA', 1, TRUE),
  ('33333333-0000-0000-0000-000000000025', '/images/products/shampoo-dove.webp', 'ريفيتا شامبو دوف — REEVITA', 1, TRUE);

-- 6. Inventory
INSERT INTO public.inventory (product_id, quantity_available, quantity_reserved, low_stock_threshold) VALUES
  ('33333333-0000-0000-0000-000000000001', 0, 0, 5),
  ('33333333-0000-0000-0000-000000000002', 0, 0, 5),
  ('33333333-0000-0000-0000-000000000003', 0, 0, 5),
  ('33333333-0000-0000-0000-000000000004', 0, 0, 5),
  ('33333333-0000-0000-0000-000000000005', 0, 0, 5),
  ('33333333-0000-0000-0000-000000000006', 0, 0, 5),
  ('33333333-0000-0000-0000-000000000007', 0, 0, 5),
  ('33333333-0000-0000-0000-000000000008', 0, 0, 5),
  ('33333333-0000-0000-0000-000000000009', 0, 0, 5),
  ('33333333-0000-0000-0000-000000000010', 0, 0, 5),
  ('33333333-0000-0000-0000-000000000011', 0, 0, 5),
  ('33333333-0000-0000-0000-000000000012', 0, 0, 5),
  ('33333333-0000-0000-0000-000000000013', 0, 0, 5),
  ('33333333-0000-0000-0000-000000000014', 0, 0, 5),
  ('33333333-0000-0000-0000-000000000015', 0, 0, 5),
  ('33333333-0000-0000-0000-000000000016', 0, 0, 5),
  ('33333333-0000-0000-0000-000000000017', 0, 0, 5),
  ('33333333-0000-0000-0000-000000000018', 0, 0, 5),
  ('33333333-0000-0000-0000-000000000019', 0, 0, 5),
  ('33333333-0000-0000-0000-000000000020', 0, 0, 5),
  ('33333333-0000-0000-0000-000000000021', 0, 0, 5),
  ('33333333-0000-0000-0000-000000000022', 0, 0, 5),
  ('33333333-0000-0000-0000-000000000023', 0, 0, 5),
  ('33333333-0000-0000-0000-000000000024', 0, 0, 5),
  ('33333333-0000-0000-0000-000000000025', 0, 0, 5)
ON CONFLICT (product_id) DO UPDATE SET
  quantity_available = EXCLUDED.quantity_available,
  low_stock_threshold = EXCLUDED.low_stock_threshold;

-- 7. Site settings
INSERT INTO public.site_settings (key, value, description) VALUES
  ('store_info', '{"name":"REEVITA","name_ar":"ريفيتا","tagline":"BEAUTY · CARE · RENEW","tagline_ar":"جمال · عناية · تجدُّد","country":"EG","currency":"EGP","support_phone":"+201157024375","support_email":"care@reevita.com","whatsapp":"201157024375","instagram":"https://instagram.com/reevita2026","owner_action_required":"استبدلي رقم الدعم وروابط السوشيال بالبيانات الرسمية قبل الإطلاق"}'::jsonb, 'General store contact & identity info'),
  ('cod_policy', '{"enabled":true,"fee":0,"max_order_amount":10000,"verification_required_above":3000,"note":"الدفع عند الاستلام فقط داخل مصر"}'::jsonb, 'Cash on Delivery parameters for Egypt'),
  ('free_shipping_default', '{"threshold":1000,"enabled":true}'::jsonb, 'Default free shipping threshold across Egypt'),
  ('return_policy', '{"window_days":14,"condition":"غير مفتوح وبحالته الأصلية"}'::jsonb, 'Return window and conditions')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, description = EXCLUDED.description;

-- 8. Collection memberships use owner-confirmed products.
UPDATE public.collections SET display_order = CASE slug WHEN 'hair-care-duo-bundle' THEN 1 WHEN 'soft-glow-bundle' THEN 2 WHEN 'complete-care-bundle' THEN 3 WHEN 'fresh-all-day-bundle' THEN 4 WHEN 'sweet-mood' THEN 5 WHEN 'clean-mood' THEN 6 WHEN 'ruby-musk-collection' THEN 7 WHEN 'sexy-collection' THEN 8 WHEN 'fruity-mood' THEN 9 ELSE display_order END, is_published = TRUE, updated_at = now() WHERE slug IN ('hair-care-duo-bundle', 'soft-glow-bundle', 'complete-care-bundle', 'fresh-all-day-bundle', 'sweet-mood', 'clean-mood', 'ruby-musk-collection', 'sexy-collection', 'fruity-mood');
UPDATE public.collections SET purchase_ready = TRUE, missing_products = ARRAY[]::text[] WHERE slug IN ('hair-care-duo-bundle', 'soft-glow-bundle', 'complete-care-bundle', 'fresh-all-day-bundle');
UPDATE public.collections SET cover_image_url = CASE slug WHEN 'hair-care-duo-bundle' THEN '/images/collections/hair-care-duo-products.jpg' WHEN 'soft-glow-bundle' THEN '/images/collections/soft-glow-bundle.jpg' WHEN 'complete-care-bundle' THEN '/images/collections/complete-care-bundle.jpg' WHEN 'fresh-all-day-bundle' THEN '/images/collections/fresh-all-day-bundle.jpg' WHEN 'sweet-mood' THEN '/images/collections/soft-glow-bubblegum.jpg' WHEN 'clean-mood' THEN '/images/collections/soft-glow-dove.jpg' WHEN 'fruity-mood' THEN '/images/collections/soft-glow-blueberry.jpg' ELSE cover_image_url END WHERE slug IN ('hair-care-duo-bundle', 'soft-glow-bundle', 'complete-care-bundle', 'fresh-all-day-bundle', 'sweet-mood', 'clean-mood', 'fruity-mood');
DELETE FROM public.collection_products cp USING public.collections c WHERE cp.collection_id = c.id AND c.slug IN ('sweet-mood', 'clean-mood', 'complete-care-bundle', 'fresh-all-day-bundle', 'soft-glow-bundle', 'hair-care-duo-bundle', 'fruity-mood');
INSERT INTO public.collection_products (collection_id, product_id, display_order, quantity)
SELECT c.id, p.id, m.display_order, 1 FROM (VALUES
  ('hair-care-duo-bundle', 'shampoo-blueberry', 0), ('hair-care-duo-bundle', 'hair-mist-ruby-musk', 1),
  ('soft-glow-bundle', 'shampoo-blueberry', 0), ('soft-glow-bundle', 'hair-mist-ruby-musk', 1), ('soft-glow-bundle', 'shampoo-dove', 2), ('soft-glow-bundle', 'hair-mist-queen', 3), ('soft-glow-bundle', 'shampoo-bubble-gum', 4), ('soft-glow-bundle', 'hair-mist-sexy', 5),
  ('complete-care-bundle', 'body-lotion-sexy', 0), ('complete-care-bundle', 'body-lotion-queen', 1), ('complete-care-bundle', 'body-lotion-ruby-musk', 2),
  ('complete-care-bundle', 'body-splash-sexy', 3), ('complete-care-bundle', 'body-splash-queen', 4), ('complete-care-bundle', 'body-splash-ruby-musk', 5),
  ('complete-care-bundle', 'shower-gel-bubble-gum', 6), ('complete-care-bundle', 'shower-gel-blueberry', 7), ('complete-care-bundle', 'shower-gel-dove', 8),
  ('fresh-all-day-bundle', 'body-lotion-queen', 0), ('fresh-all-day-bundle', 'body-splash-queen', 1), ('fresh-all-day-bundle', 'body-butter-queen', 2),
  ('fresh-all-day-bundle', 'body-lotion-ruby-musk', 3), ('fresh-all-day-bundle', 'body-splash-ruby-musk', 4), ('fresh-all-day-bundle', 'body-butter-ruby-musk', 5),
  ('fresh-all-day-bundle', 'body-lotion-sexy', 6), ('fresh-all-day-bundle', 'body-splash-sexy', 7), ('fresh-all-day-bundle', 'body-butter-sexy', 8),
  ('sweet-mood', 'shampoo-bubble-gum', 0), ('sweet-mood', 'hair-mist-sexy', 1), ('clean-mood', 'shampoo-dove', 0), ('clean-mood', 'hair-mist-queen', 1), ('fruity-mood', 'shampoo-blueberry', 0), ('fruity-mood', 'hair-mist-ruby-musk', 1)
) AS m(collection_slug, product_slug, display_order) JOIN public.collections c ON c.slug = m.collection_slug JOIN public.products p ON p.slug = m.product_slug AND p.is_active = TRUE
ON CONFLICT (collection_id, product_id) DO UPDATE SET display_order = EXCLUDED.display_order, quantity = EXCLUDED.quantity;