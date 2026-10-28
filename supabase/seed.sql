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
  CASE zone
    WHEN 'greater_cairo' THEN 50 WHEN 'alexandria' THEN 50
    WHEN 'delta' THEN 65 WHEN 'canal' THEN 65
    WHEN 'upper_egypt' THEN 80 WHEN 'frontier' THEN 100 END,
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
  ('22222222-0000-0000-0000-000000000005', 'shampoo', 'Shampoo', 'الشامبو', 'شامبو لطيف بتركيبة خالية من السلفات ينظف الفروة بعمق ويحافظ على توازنها الطبيعي.', '/images/products/shampoo-aloe-vera.webp', 5, TRUE)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, name_ar = EXCLUDED.name_ar,
  description = EXCLUDED.description, image_url = EXCLUDED.image_url,
  display_order = EXCLUDED.display_order, is_active = TRUE;

-- 4. Products (14 real SKUs) — prices in EGP
INSERT INTO public.products (id, category_id, slug, name, name_ar, short_description, short_description_ar, description, price, compare_at_price, benefits, ingredients, how_to_use, size, is_featured, is_active) VALUES
  ('33333333-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000005', 'shampoo-aloe-vera', 'Aloe Vera Shampoo', 'شامبو ألوفيرا', 'Shampoo with Botanical Care notes.', 'تنظيف لطيف بخلاصة الألوفيرا لبشرة رأس متوازنة وشعر لامع.', 'شامبو ريفيتا بخلاصة الألوفيرا والبنتينول ينظف الشعر بلطف دون تجريد الفروة من زيوتها الطبيعية. تركيبة خالية من السلفات والبارابين، تهدئ الفروة الحساسة وتترك الشعر نظيفًا، ناعمًا ولامعًا من أول غسلة.', 350, 420, ARRAY['ينظف بلطف دون تجريد الفروة', 'خالٍ من السلفات والبارابين', 'يهدئ الفروة ويترك لمعانًا طبيعيًا']::text[], 'ماء، مستخلص الألوفيرا، كوكو جلوكوسيد، بانثينول، جليسرين، مستخلص إكليل الجبل', 'يوزع على شعر مبلل، يُدلَّك بلطف على الفروة ثم يُشطف جيدًا بالماء الفاتر. يُكرر عند الحاجة.', '300 مل', TRUE, TRUE),
  ('33333333-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000005', 'shampoo-blueberry', 'Blueberry Shampoo', 'شامبو توت أزرق', 'Shampoo with Botanical Care notes.', 'انتعاش التوت الأزرق مع ترطيب عميق وحماية للون الشعر.', 'تركيبة نباتية غنية بمستخلص التوت الأزرق والبانثينول، ترطب الشعر وتحمي لونه من البهتان. خالية من السلفات، برائحة فاكهية منعشة تجعل كل غسلة طقسًا صغيرًا من الانتعاش.', 350, 420, ARRAY['ترطيب عميق لألياف الشعر', 'يساعد على حماية لون الشعر', 'رائحة فاكهية منعشة تدوم']::text[], 'ماء، مستخلص التوت الأزرق، بانثينول، كوكو جلوكوسيد، جليسرين، فيتامين E', 'يوزع على شعر مبلل، يُدلَّك بلطف على الفروة ثم يُشطف جيدًا بالماء الفاتر.', '300 مل', FALSE, TRUE),
  ('33333333-0000-0000-0000-000000000003', '22222222-0000-0000-0000-000000000001', 'body-lotion-sexy', 'Body Lotion — Sexy', 'لوشن الجسم — سيكسي', 'Body Lotion with Sexy notes.', 'ترطيب حريري بلمسة دافئة من الفانيليا والمسك.', 'لوشن جسم خفيف وسريع الامتصاص يمنح بشرتك ترطيبًا يدوم ٢٤ ساعة. زبدة الشيا وفيتامين E يغذيان البشرة، بينما يترك عطر الفانيليا والمسك الأبيض لمسة دافئة أنثوية على جسدك.', 240, 300, ARRAY['ترطيب يدوم ٢٤ ساعة', 'قوام خفيف غير دهني', 'لمسة عطرية دافئة وأنثوية']::text[], 'ماء، زبدة الشيا، جليسرين، زيت اللوز الحلو، فيتامين E، عطر', 'ضعي كمية مناسبة على بشرة نظيفة بعد الاستحمام، ودلكي بحركات دائرية حتى الامتصاص الكامل.', '200 مل', FALSE, TRUE),
  ('33333333-0000-0000-0000-000000000004', '22222222-0000-0000-0000-000000000001', 'body-lotion-queen', 'Body Lotion — Queen', 'لوشن الجسم — كوين', 'Body Lotion with Queen notes.', 'ترطيب ملكي برائحة الورد الدمشقي والعود.', 'لوشن جسم فاخر يمنح بشرتك ترطيبًا عميقًا ونعومة فورية، برائحة الورد الدمشقي والعود والعنبر. قوامه المخملي يمتص سريعًا ويترك بشرتك ناعمة كالحرير مع أثر عطري راقٍ يدوم.', 240, 300, ARRAY['ترطيب عميق ونعومة فورية', 'قوام مخملي سريع الامتصاص', 'أثر عطري ملكي يدوم']::text[], 'ماء، زبدة الشيا، جليسرين، زيت اللوز الحلو، فيتامين E، عطر الورد والعود', 'ضعي كمية مناسبة على بشرة نظيفة بعد الاستحمام، ودلكي بحركات دائرية حتى الامتصاص.', '200 مل', TRUE, TRUE),
  ('33333333-0000-0000-0000-000000000005', '22222222-0000-0000-0000-000000000001', 'body-lotion-ruby-musk', 'Body Lotion — Ruby Musk', 'لوشن الجسم — روبي مسك', 'Body Lotion with Ruby Musk notes.', 'ترطيب مخملي بياسمين ناعم ولمسة مسك روبي.', 'لوشن جسم بقوام ناعم يذوب في البشرة، يرطبها بعمق ويتركها حريرية الملمس. عطر الياسمين والصندل بلمسة المسك الروبي يمنحك رائحة أنثوية هادئة تدوم معك.', 240, 300, ARRAY['ترطيب حريري طويل الأمد', 'رائحة ياسمين وصندل ناعمة', 'لا يترك أي ملمس دهني']::text[], 'ماء، زبدة الشيا، جليسرين، زيت اللوز الحلو، فيتامين E، عطر الياسمين والمسك', 'ضعي كمية مناسبة على بشرة نظيفة بعد الاستحمام، ودلكي بحركات دائرية حتى الامتصاص.', '200 مل', FALSE, TRUE),
  ('33333333-0000-0000-0000-000000000006', '22222222-0000-0000-0000-000000000002', 'body-butter-sexy', 'Body Butter — Sexy', 'زبدة الجسم — سيكسي', 'Body Butter with Sexy notes.', 'تغذية فائقة بزبدة الشيا والكاكاو بلمسة فانيليا دافئة.', 'زبدة جسم غنية بزبدة الشيا والكاكاو تذوب على البشرة وتمنحها تغذية مكثفة للأماكن الجافة كالكوعين والركبتين. عطر الفانيليا والمسك الدافئ يترك جسمك ناعمًا وعطريًا لساعات.', 320, 400, ARRAY['تغذية مكثفة للبشرة الجافة', 'قوام مخملي يذوب فورًا', 'رائحة دافئة تدوم لساعات']::text[], 'زبدة الشيا، زبدة الكاكاو، زيت اللوز الحلو، فيتامين E، عطر الفانيليا والمسك', 'خذي كمية صغيرة ودلكيها على الأماكن الجافة من الجسم بعد الاستحمام. مناسبة للاستخدام اليومي.', '200 جم', TRUE, TRUE),
  ('33333333-0000-0000-0000-000000000007', '22222222-0000-0000-0000-000000000002', 'body-butter-queen', 'Body Butter — Queen', 'زبدة الجسم — كوين', 'Body Butter with Queen notes.', 'زبدة مخملية بزبدة الشيا وعبير الورد والعود.', 'تركيبة ملكية من زبدة الشيا والكاكاو وزيت اللوز، تمنح البشرة الجافة ترطيبًا مكثفًا ونعومة فورية. عبير الورد الدمشقي والعود يجعل العناية بالجسم طقسًا فاخرًا كل يوم.', 320, 400, ARRAY['ترطيب مكثف يدوم', 'نعومة فورية للبشرة الجافة', 'عبير ورد وعود ملكي']::text[], 'زبدة الشيا، زبدة الكاكاو، زيت اللوز الحلو، فيتامين E، عطر الورد والعود', 'خذي كمية صغيرة ودلكيها على الأماكن الجافة من الجسم بعد الاستحمام.', '200 جم', FALSE, TRUE),
  ('33333333-0000-0000-0000-000000000008', '22222222-0000-0000-0000-000000000002', 'body-butter-ruby-musk', 'Body Butter — Ruby Musk', 'زبدة الجسم — روبي مسك', 'Body Butter with Ruby Musk notes.', 'تغذية عميقة بياسمين مخملي وصندل دافئ.', 'زبدة جسم غنية تمتص بسرعة وتغذي البشرة بعمق، بتركيبة زبدة الشيا وزيت اللوز وفيتامين E. عطر الياسمين والصندل والمسك الروبي يمنحك إحساسًا بالفخامة في كل لمسة.', 320, 400, ARRAY['تغذية عميقة للأماكن الجافة', 'امتصاص سريع بلا لزوجة', 'رائحة مخملية آسرة']::text[], 'زبدة الشيا، زبدة الكاكاو، زيت اللوز الحلو، فيتامين E، عطر الياسمين والمسك', 'خذي كمية صغيرة ودلكيها على الأماكن الجافة من الجسم بعد الاستحمام.', '200 جم', FALSE, TRUE),
  ('33333333-0000-0000-0000-000000000009', '22222222-0000-0000-0000-000000000003', 'body-splash-sexy', 'Body Splash — Sexy', 'سبراي الجسم — سيكسي', 'Body Splash with Sexy notes.', 'انتعاش فوري بلمسة فانيليا ومسك دافئة.', 'سبراي جسم خفيف يمنحك انتعاشًا فوريًا وطبقة عطرية دافئة من الفانيليا والمسك الأبيض. مثالي بعد الاستحمام أو خلال اليوم لانتعاش يدوم.', 260, 330, ARRAY['انتعاش فوري طوال اليوم', 'عطر خفيف لا يثقل', 'مناسب للاستخدام اليومي']::text[], 'ماء، كحول طبيعي، عطر الفانيليا والمسك، جليسرين، مستخلص نباتي', 'يرش على الجسم من مسافة 15–20 سم، ويُفضل بعد الاستحمام على بشرة جافة.', '200 مل', FALSE, TRUE),
  ('33333333-0000-0000-0000-000000000010', '22222222-0000-0000-0000-000000000003', 'body-splash-queen', 'Body Splash — Queen', 'سبراي الجسم — كوين', 'Body Splash with Queen notes.', 'انتعاش ملكي بعبير الورد الدمشقي والعنبر.', 'سبراي جسم منعش بعبير الورد الدمشقي والعنبر، يمنح جسمك لمسة أنثوية راقية وانتعاشًا يدوم. خفيف على البشرة ومناسب لكل يوم.', 260, 330, ARRAY['عبير ورد وعنبر راقٍ', 'انتعاش خفيف يدوم', 'مناسب لكل يوم']::text[], 'ماء، كحول طبيعي، عطر الورد والعنبر، جليسرين، مستخلص نباتي', 'يرش على الجسم من مسافة 15–20 سم بعد الاستحمام.', '200 مل', FALSE, TRUE),
  ('33333333-0000-0000-0000-000000000011', '22222222-0000-0000-0000-000000000003', 'body-splash-ruby-musk', 'Body Splash — Ruby Musk', 'سبراي الجسم — روبي مسك', 'Body Splash with Ruby Musk notes.', 'عطر جسم ناعم بياسمين وصندل ومسك روبي.', 'سبراي جسم أنيق يجمع الياسمين والناعم والصندل الدافئ بلمسة مسك روبي. يمنحك انتعاشًا وثباتًا عطريًا خفيفًا يناسب النهار والمساء.', 260, 330, ARRAY['ثبات عطري خفيف يدوم', 'مزيج ياسمين وصندل', 'مناسب للنهار والمساء']::text[], 'ماء، كحول طبيعي، عطر الياسمين والصندل، جليسرين، مستخلص نباتي', 'يرش على الجسم من مسافة 15–20 سم بعد الاستحمام.', '200 مل', TRUE, TRUE),
  ('33333333-0000-0000-0000-000000000012', '22222222-0000-0000-0000-000000000004', 'hair-mist-sexy', 'Hair Mist — Sexy', 'معطر الشعر — سيكسي', 'Hair Mist with Sexy notes.', 'عطر شعر دافئ بالفانيليا والمسك مع لمعان خفيف.', 'رذاذ شعر فاخر يمنح خصلاتك رائحة الفانيليا والمسك الدافئة ولمعانًا ناعمًا دون إثقال. مثالي لتجديد انتعاش الشعر خلال اليوم.', 200, 250, ARRAY['عطر شعر يدوم ساعات', 'لمعان خفيف بلا إثقال', 'مناسب للاستخدام اليومي']::text[], 'ماء، ماء الورد، بانثينول، عطر الفانيليا والمسك، مستخلص نباتي', 'يرش على الشعر الجاف أو المبلل من مسافة 20 سم، مع التركيز على الأطراف.', '100 مل', FALSE, TRUE),
  ('33333333-0000-0000-0000-000000000013', '22222222-0000-0000-0000-000000000004', 'hair-mist-queen', 'Hair Mist — Queen', 'معطر الشعر — كوين', 'Hair Mist with Queen notes.', 'عبير ورد وعود فاخر يلازم خصلاتك.', 'معطر شعر ملكي بخلاصة ماء الورد والبانثينول، يمنح الشعر رائحة الورد والعود الفاخرة ولمعانًا صحيًا. خفيف على الشعر ولا يترك أي أثر دهني.', 200, 250, ARRAY['عبير ورد وعود فاخر', 'يمنح لمعانًا صحيًا', 'خفيف ولا يثقل الشعر']::text[], 'ماء، ماء الورد الدمشقي، بانثينول، عطر الورد والعود، مستخلص نباتي', 'يرش على الشعر الجاف أو المبلل من مسافة 20 سم.', '100 مل', TRUE, TRUE),
  ('33333333-0000-0000-0000-000000000014', '22222222-0000-0000-0000-000000000004', 'hair-mist-ruby-musk', 'Hair Mist — Ruby Musk', 'معطر الشعر — روبي مسك', 'Hair Mist with Ruby Musk notes.', 'ياسمين وصندل بلمسة مسك روبي على شعرك.', 'رذاذ شعر ناعم يجمع الياسمين والصندل والمسك الروبي، يمنح خصلاتك رائحة أنثوية آسرة ولمعانًا خفيفًا. تركيبة خفيفة تحمي من روائح المكان وتدوم معك.', 200, 250, ARRAY['رائحة ياسمين ومسك آسرة', 'معطر يدوم معك أينما ذهبت', 'تركيبة خفيفة لا تثقل الشعر']::text[], 'ماء، ماء الورد، بانثينول، عطر الياسمين والمسك، مستخلص نباتي', 'يرش على الشعر الجاف أو المبلل من مسافة 20 سم.', '100 مل', FALSE, TRUE)
ON CONFLICT (id) DO UPDATE SET
  category_id = EXCLUDED.category_id, name = EXCLUDED.name, name_ar = EXCLUDED.name_ar,
  short_description = EXCLUDED.short_description, short_description_ar = EXCLUDED.short_description_ar,
  description = EXCLUDED.description, price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price, benefits = EXCLUDED.benefits,
  ingredients = EXCLUDED.ingredients, how_to_use = EXCLUDED.how_to_use,
  size = EXCLUDED.size, is_featured = EXCLUDED.is_featured, is_active = TRUE;

-- 5. Product imagery (only files present in public/images/products)
DELETE FROM public.product_images;
INSERT INTO public.product_images (product_id, image_url, alt_text, display_order, is_primary) VALUES
  ('33333333-0000-0000-0000-000000000001', '/images/products/shampoo-aloe-vera.webp', 'شامبو ألوفيرا — REEVITA', 1, TRUE),
  ('33333333-0000-0000-0000-000000000002', '/images/products/shampoo-blueberry.webp', 'شامبو توت أزرق — REEVITA', 1, TRUE),
  ('33333333-0000-0000-0000-000000000003', '/images/products/body-lotion-sexy.webp', 'لوشن الجسم — سيكسي — REEVITA', 1, TRUE),
  ('33333333-0000-0000-0000-000000000004', '/images/products/body-lotion-queen.webp', 'لوشن الجسم — كوين — REEVITA', 1, TRUE),
  ('33333333-0000-0000-0000-000000000005', '/images/products/body-lotion-ruby-musk.webp', 'لوشن الجسم — روبي مسك — REEVITA', 1, TRUE),
  ('33333333-0000-0000-0000-000000000006', '/images/products/body-butter-sexy.webp', 'زبدة الجسم — سيكسي — REEVITA', 1, TRUE),
  ('33333333-0000-0000-0000-000000000007', '/images/products/body-butter-queen.webp', 'زبدة الجسم — كوين — REEVITA', 1, TRUE),
  ('33333333-0000-0000-0000-000000000008', '/images/products/body-butter-ruby-musk.webp', 'زبدة الجسم — روبي مسك — REEVITA', 1, TRUE),
  ('33333333-0000-0000-0000-000000000009', '/images/products/body-splash-sexy.webp', 'سبراي الجسم — سيكسي — REEVITA', 1, TRUE),
  ('33333333-0000-0000-0000-000000000010', '/images/products/body-splash-queen.webp', 'سبراي الجسم — كوين — REEVITA', 1, TRUE),
  ('33333333-0000-0000-0000-000000000011', '/images/products/body-splash-ruby-musk.webp', 'سبراي الجسم — روبي مسك — REEVITA', 1, TRUE),
  ('33333333-0000-0000-0000-000000000012', '/images/products/hair-mist-sexy.webp', 'معطر الشعر — سيكسي — REEVITA', 1, TRUE),
  ('33333333-0000-0000-0000-000000000013', '/images/products/hair-mist-queen.webp', 'معطر الشعر — كوين — REEVITA', 1, TRUE),
  ('33333333-0000-0000-0000-000000000014', '/images/products/hair-mist-ruby-musk.webp', 'معطر الشعر — روبي مسك — REEVITA', 1, TRUE);

-- 6. Inventory
INSERT INTO public.inventory (product_id, quantity_available, quantity_reserved, low_stock_threshold) VALUES
  ('33333333-0000-0000-0000-000000000001', 50, 0, 5),
  ('33333333-0000-0000-0000-000000000002', 50, 0, 5),
  ('33333333-0000-0000-0000-000000000003', 40, 0, 5),
  ('33333333-0000-0000-0000-000000000004', 40, 0, 5),
  ('33333333-0000-0000-0000-000000000005', 40, 0, 5),
  ('33333333-0000-0000-0000-000000000006', 30, 0, 5),
  ('33333333-0000-0000-0000-000000000007', 30, 0, 5),
  ('33333333-0000-0000-0000-000000000008', 30, 0, 5),
  ('33333333-0000-0000-0000-000000000009', 35, 0, 5),
  ('33333333-0000-0000-0000-000000000010', 35, 0, 5),
  ('33333333-0000-0000-0000-000000000011', 35, 0, 5),
  ('33333333-0000-0000-0000-000000000012', 45, 0, 5),
  ('33333333-0000-0000-0000-000000000013', 45, 0, 5),
  ('33333333-0000-0000-0000-000000000014', 45, 0, 5)
ON CONFLICT (product_id) DO UPDATE SET
  quantity_available = EXCLUDED.quantity_available,
  low_stock_threshold = EXCLUDED.low_stock_threshold;

-- 7. Site settings
INSERT INTO public.site_settings (key, value, description) VALUES
  ('store_info', '{"name":"REEVITA","name_ar":"ريفيتا","tagline":"BEAUTY · CARE · RENEW","tagline_ar":"جمال · عناية · تجدُّد","country":"EG","currency":"EGP","support_phone":"+201157024375","support_email":"care@reevita.com","whatsapp":"201157024375","instagram":"https://instagram.com/reevita2026"}'::jsonb, 'General store contact & identity info'),
  ('cod_policy', '{"enabled":true,"fee":0,"max_order_amount":10000,"verification_required_above":3000,"note":"الدفع عند الاستلام فقط داخل مصر"}'::jsonb, 'Cash on Delivery parameters for Egypt'),
  ('free_shipping_default', '{"threshold":1000,"enabled":true}'::jsonb, 'Default free shipping threshold across Egypt'),
  ('return_policy', '{"window_days":14,"condition":"غير مفتوح وبحالته الأصلية"}'::jsonb, 'Return window and conditions')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, description = EXCLUDED.description;

-- 8. Collection memberships. Migrations run before seed data, so these links
-- are added here after products exist instead of being silently skipped.
UPDATE public.collections
SET name_ar = 'باقة النعومة والإشراقة',
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
WHERE cp.collection_id = c.id AND c.slug = 'soft-glow-bundle';

INSERT INTO public.collection_products (collection_id, product_id, display_order, quantity)
SELECT c.id, p.id,
  ROW_NUMBER() OVER (PARTITION BY c.id ORDER BY p.created_at, p.slug) - 1,
  1
FROM public.collections c
JOIN public.products p ON (
  (c.slug IN ('sexy', 'queen', 'ruby-musk') AND p.slug LIKE '%-' || c.slug)
  OR (c.slug = 'botanical' AND p.category_id IN (
    SELECT id FROM public.categories WHERE slug IN ('shampoo', 'hair-mist')
  ))
)
ON CONFLICT (collection_id, product_id) DO UPDATE SET
  display_order = EXCLUDED.display_order,
  quantity = EXCLUDED.quantity;

INSERT INTO public.collection_products (collection_id, product_id, display_order, quantity)
SELECT c.id, p.id, membership.display_order, 1
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
    ('fruity-mood', 'hair-mist-ruby-musk', 1),
    ('fresh-all-day-bundle', 'body-lotion-ruby-musk', 0),
    ('fresh-all-day-bundle', 'body-splash-ruby-musk', 1),
    ('hair-care-duo-bundle', 'shampoo-blueberry', 0),
    ('hair-care-duo-bundle', 'hair-mist-ruby-musk', 1),
    ('complete-care-bundle', 'body-lotion-sexy', 0),
    ('complete-care-bundle', 'body-splash-sexy', 1),
    ('complete-care-bundle', 'body-butter-sexy', 2),
    ('complete-care-bundle', 'hair-mist-sexy', 3)
) AS membership(collection_slug, product_slug, display_order)
JOIN public.collections c ON c.slug = membership.collection_slug
JOIN public.products p ON p.slug = membership.product_slug
ON CONFLICT (collection_id, product_id) DO UPDATE SET
  display_order = EXCLUDED.display_order,
  quantity = EXCLUDED.quantity;
