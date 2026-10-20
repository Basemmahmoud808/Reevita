-- REEVITA Seed Data: Egyptian Governorates, Shipping Rates, Categories & Products

-- 1. Insert 27 Egyptian Governorates
INSERT INTO public.governorates (id, code, name_ar, name_en, zone, is_active) VALUES
-- Greater Cairo & Alexandria
('11111111-0000-0000-0000-000000000001', 'CAI', 'القاهرة', 'Cairo', 'greater_cairo', true),
('11111111-0000-0000-0000-000000000002', 'GIZ', 'الجيزة', 'Giza', 'greater_cairo', true),
('11111111-0000-0000-0000-000000000003', 'QAL', 'القليوبية', 'Qalyubia', 'greater_cairo', true),
('11111111-0000-0000-0000-000000000004', 'ALX', 'الإسكندرية', 'Alexandria', 'alexandria', true),

-- Canal
('11111111-0000-0000-0000-000000000005', 'PTS', 'بورسعيد', 'Port Said', 'canal', true),
('11111111-0000-0000-0000-000000000006', 'SUZ', 'السويس', 'Suez', 'canal', true),
('11111111-0000-0000-0000-000000000007', 'ISM', 'الإسماعيلية', 'Ismailia', 'canal', true),

-- Delta
('11111111-0000-0000-0000-000000000008', 'DAM', 'دمياط', 'Damietta', 'delta', true),
('11111111-0000-0000-0000-000000000009', 'DKH', 'الدقهلية', 'Dakahlia', 'delta', true),
('11111111-0000-0000-0000-000000000010', 'SHR', 'الشرقية', 'Sharqia', 'delta', true),
('11111111-0000-0000-0000-000000000011', 'KFR', 'كفر الشيخ', 'Kafr El Sheikh', 'delta', true),
('11111111-0000-0000-0000-000000000012', 'GHB', 'الغربية', 'Gharbia', 'delta', true),
('11111111-0000-0000-0000-000000000013', 'MNF', 'المنوفية', 'Monufia', 'delta', true),
('11111111-0000-0000-0000-000000000014', 'BEH', 'البحيرة', 'Beheira', 'delta', true),

-- Upper Egypt
('11111111-0000-0000-0000-000000000015', 'FYM', 'الفيوم', 'Fayoum', 'upper_egypt', true),
('11111111-0000-0000-0000-000000000016', 'BNS', 'بني سويف', 'Beni Suef', 'upper_egypt', true),
('11111111-0000-0000-0000-000000000017', 'MNY', 'المنيا', 'Minya', 'upper_egypt', true),
('11111111-0000-0000-0000-000000000018', 'ASY', 'أسيوط', 'Asyut', 'upper_egypt', true),
('11111111-0000-0000-0000-000000000019', 'SHG', 'سوهاج', 'Sohag', 'upper_egypt', true),
('11111111-0000-0000-0000-000000000020', 'QNA', 'قنا', 'Qena', 'upper_egypt', true),
('11111111-0000-0000-0000-000000000021', 'LXR', 'الأقصر', 'Luxor', 'upper_egypt', true),
('11111111-0000-0000-0000-000000000022', 'ASW', 'أسوان', 'Aswan', 'upper_egypt', true),

-- Frontier Governorates
('11111111-0000-0000-0000-000000000023', 'RSH', 'البحر الأحمر', 'Red Sea', 'frontier', true),
('11111111-0000-0000-0000-000000000024', 'WAD', 'الوادي الجديد', 'New Valley', 'frontier', true),
('11111111-0000-0000-0000-000000000025', 'MAT', 'مطروح', 'Matrouh', 'frontier', true),
('11111111-0000-0000-0000-000000000026', 'SIN', 'شمال سيناء', 'North Sinai', 'frontier', true),
('11111111-0000-0000-0000-000000000027', 'SIS', 'جنوب سيناء', 'South Sinai', 'frontier', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Shipping Rates for the 27 Governorates
INSERT INTO public.shipping_rates (governorate_id, shipping_cost, free_shipping_threshold, estimated_days_min, estimated_days_max)
SELECT 
    id,
    CASE 
        WHEN zone IN ('greater_cairo', 'alexandria') THEN 50.00
        WHEN zone IN ('delta', 'canal') THEN 65.00
        WHEN zone = 'upper_egypt' THEN 80.00
        WHEN zone = 'frontier' THEN 100.00
    END,
    CASE 
        WHEN zone = 'frontier' THEN 1500.00
        WHEN zone = 'upper_egypt' THEN 1200.00
        ELSE 1000.00
    END,
    CASE 
        WHEN zone IN ('greater_cairo', 'alexandria') THEN 1
        WHEN zone IN ('delta', 'canal') THEN 2
        WHEN zone = 'upper_egypt' THEN 3
        ELSE 4
    END,
    CASE 
        WHEN zone IN ('greater_cairo', 'alexandria') THEN 2
        WHEN zone IN ('delta', 'canal') THEN 3
        WHEN zone = 'upper_egypt' THEN 4
        ELSE 6
    END
FROM public.governorates
ON CONFLICT (governorate_id) DO NOTHING;

-- 3. Categories
INSERT INTO public.categories (id, slug, name, name_ar, description, display_order, is_active) VALUES
('22222222-0000-0000-0000-000000000001', 'hair-care', 'Hair Care', 'العناية بالشعر', 'مستحضرات طبيعية لشعر صحي وقوي ولامع', 1, true),
('22222222-0000-0000-0000-000000000002', 'skincare', 'Skincare', 'العناية بالبشرة', 'تركيبات نباتية لنضارة البشرة وتغذيتها بعمق', 2, true),
('22222222-0000-0000-0000-000000000003', 'body-care', 'Body Care', 'العناية بالجسم', 'ترطيب فائق ونعومة تدوم طوال اليوم', 3, true)
ON CONFLICT (id) DO NOTHING;

-- 4. Products
INSERT INTO public.products (
    id, category_id, slug, name, name_ar, short_description, short_description_ar,
    description, price, compare_at_price, benefits, ingredients, how_to_use, size, is_featured, is_active
) VALUES
(
    '33333333-0000-0000-0000-000000000001',
    '22222222-0000-0000-0000-000000000001',
    'revitalizing-shampoo',
    'Revitalizing Shampoo',
    'شامبو تجديد وحيوية الشعر',
    'For strong, shiny hair with natural botanical extracts',
    'لشعر قوي ولامع بخلاصات نباتية طبيعية',
    'شامبو REEVITA المبتكر بمستخلص إكليل الجبل وزيت الأرجان، ينظف الفروة بعمق دون تجريدها من الزيوت الطبيعية.',
    350.00,
    420.00,
    ARRAY['يقوي بصيلات الشعر', 'خالي من السلفات والبارابين', 'يمنح لمعاناً طبيعياً'],
    'Aqua, Rosmarinus Officinalis Extract, Argania Spinosa Kernel Oil, Coco-Glucoside',
    'يوزع على شعر مبلل ويدلك بلطف ثم يشطف جيداً بالماء الفاتر.',
    '250 ml',
    true,
    true
),
(
    '33333333-0000-0000-0000-000000000002',
    '22222222-0000-0000-0000-000000000001',
    'nourishing-conditioner',
    'Nourishing Conditioner',
    'بلسم مغذي ومطري للشعر',
    'Deep nourishment for soft, manageable hair',
    'تغذية عميقة لشعر ناعم وسهل التصفيف',
    'بلسم غني بزبدة الشيا والبروتين النباتي يرطب أطراف الشعر ويمنع التقصف والتطاير.',
    320.00,
    380.00,
    ARRAY['تنعيم فوري وفك التشابك', 'حماية من حرارة الجو', 'ترطيب طويل الأمد'],
    'Aqua, Butyrospermum Parkii Butter, Hydrolyzed Wheat Protein, Cetearyl Alcohol',
    'يوضع على أطراف الشعر بعد الشامبو لمدة 3 دقائق ثم يشطف.',
    '250 ml',
    true,
    true
),
(
    '33333333-0000-0000-0000-000000000003',
    '22222222-0000-0000-0000-000000000002',
    'hydrating-face-cream',
    'Hydrating Face Cream',
    'كريم مرطب للوجه لنضارة البشرة',
    'Daily hydration with hyaluronic acid and niacinamide',
    'ترطيب يومي بحمض الهيالورونيك والنياسيناميد',
    'كريم خفيف وسريع الامتصاص يعيد للبشرة نضارتها وحيويتها ويحافظ على حاجز الترطيب الطبيعي.',
    420.00,
    490.00,
    ARRAY['ترطيب يدوم 24 ساعة', 'لا يسد المسام', 'قوام غير دهني سريع الامتصاص'],
    'Aqua, Sodium Hyaluronate, Niacinamide, Squalane, Ceramide NP',
    'يوضع صباحاً ومساءً على بشرة نظيفة ويدلك بحركات دائرية.',
    '50 ml',
    true,
    true
),
(
    '33333333-0000-0000-0000-000000000004',
    '22222222-0000-0000-0000-000000000002',
    'glow-face-serum',
    'Glow Face Serum',
    'سيروم نضارة الوجه',
    'Radiance boosting vitamin C botanical serum',
    'سيروم فيتامين سي المعزز لإشراقة ونضارة البشرة',
    'سيروم غني بفيتامين C المستقر ومستخلص الشاي الأخضر لتوحيد لون البشرة ومكافحة البهتان.',
    480.00,
    560.00,
    ARRAY['يوحد لون البشرة', 'يحفز النضارة والإشراق', 'مضاد أكسدة طبيعي'],
    'Aqua, Ascorbyl Glucoside (Vitamin C), Camellia Sinensis Leaf Extract, Glycerin',
    'توضع 3-4 قطرات على الوجه والرقبة قبل المرطب صباحاً.',
    '30 ml',
    true,
    true
),
(
    '33333333-0000-0000-0000-000000000005',
    '22222222-0000-0000-0000-000000000003',
    'nourishing-body-butter',
    'Nourishing Body Butter',
    'زبدة جسم للترطيب العميق',
    'Ultra-rich hydration with cocoa butter and almond oil',
    'ترطيب فائق بزبدة الكاكاو وزيت اللوز الحلو',
    'قوام مخملي غني يغذي البشرة الجافة بعمق ويتركها ناعمة كالحرير برائحة عطرية طبيعية هادئة.',
    390.00,
    450.00,
    ARRAY['ترطيب مكثف للأماكن الجافة', 'سريعة الامتصاص', 'عطر هادئ يدوم طويلاً'],
    'Theobroma Cacao Seed Butter, Sweet Almond Oil, Tocopherol (Vitamin E)',
    'تدهن على كامل الجسم بعد الاستحمام بحركات تدليك لطيفة.',
    '200 ml',
    false,
    true
),
(
    '33333333-0000-0000-0000-000000000006',
    '22222222-0000-0000-0000-000000000003',
    'exfoliating-scrub',
    'Exfoliating Body Scrub',
    'مقشر طبيعي للجسم',
    'Gentle exfoliation with sea salt and jojoba beads',
    'تقشير لطيف بأملاح البحر وحبيبات الجوجوبا',
    'يزيل خلايا الجلد الميتة بلطف وينشط الدورة الدموية، ليمنح البشرة ملمساً حريرياً ناعماً.',
    360.00,
    420.00,
    ARRAY['يزيل الجلد الميت بلطف', 'ينعم ملمس البشرة', 'غني بالزيوت المغذية'],
    'Maris Sal (Sea Salt), Simmondsia Chinensis Seed Oil, Citrus Aurantium Dulcis Oil',
    'يستخدم مرتين أسبوعياً على بشرة رطبة بحركات دائرية ثم يشطف.',
    '250 g',
    false,
    true
),
(
    '33333333-0000-0000-0000-000000000007',
    '22222222-0000-0000-0000-000000000001',
    'botanical-hair-mist',
    'Botanical Hair Mist',
    'معطر ومرطب خفيف للشعر',
    'Refreshing scent and shine without weighing hair down',
    'عطر منعش ولمعان خفيف دون إثقال الشعر',
    'رذاذ خفيف يمنح الشعر رائحة الطبيعة المنعشة وترطيباً خفيفاً يحمي من الروائح الخارجية طوال اليوم.',
    290.00,
    340.00,
    ARRAY['عطر يدوم ساعات طويلة', 'لا يسبب جفاف الشعر', 'لمعان حريري خفيف'],
    'Aqua, Rosa Damascena Flower Water, Panthenol, Natural Botanical Fragrance',
    'يرش على أطراف الشعر الجاف أو المبلل من مسافة 20 سم.',
    '100 ml',
    false,
    true
),
(
    '33333333-0000-0000-0000-000000000008',
    '22222222-0000-0000-0000-000000000001',
    'intense-hair-mask',
    'Intense Hair Mask',
    'ماسك مكثف لترميم الشعر',
    'Deep repair treatment for damaged, heat-treated hair',
    'علاج مكثف لترميم وتغذية الشعر التالف والمجهد',
    'ماسك علاجي غني بالكيراتين النباتي وزيت المارولا، يعالج التلف الناتج عن الصبغات والحرارة.',
    450.00,
    520.00,
    ARRAY['ترميم عميق لألياف الشعر', 'يقلل التكسر بنسبة 90%', 'نعومة ولمعان ملحوظ من أول استخدام'],
    'Aqua, Hydrolyzed Keratin, Sclerocarya Birrea Seed Oil, Cetyl Alcohol',
    'يوضع على شعر نظيف ورطب لمدة 10-15 دقيقة ثم يشطف بماء فاتر.',
    '300 ml',
    true,
    true
),
(
    '33333333-0000-0000-0000-000000000009',
    '22222222-0000-0000-0000-000000000002',
    'anti-aging-renewal-serum',
    'Anti-Aging Renewal Serum',
    'سيروم تجديد ومكافحة التجاعيد',
    'Botanical retinol alternative for firm, youthful skin',
    'بديل الريتينول النباتي لشد وتجديد خلايا البشرة',
    'سيروم نباتي مبتكر يحتوي على الباكوتشيول (بديل الريتينول اللطيف)، يقلل مظهر الخطوط الرفيعة.',
    540.00,
    620.00,
    ARRAY['بديل طبيعي آمن للريتينول', 'يحفز مرونة الجلد وشده', 'مناسب للبشرة الحساسة'],
    'Aqua, Bakuchiol, Peptides Complex, Centella Asiatica Extract',
    'توضع بضع قطرات ليلاً على بشرة الوجه والرقبة.',
    '30 ml',
    true,
    true
)
ON CONFLICT (id) DO NOTHING;

-- 5. Inventory Stock for each product
INSERT INTO public.inventory (product_id, quantity_available, quantity_reserved, low_stock_threshold) VALUES
('33333333-0000-0000-0000-000000000001', 50, 0, 5),
('33333333-0000-0000-0000-000000000002', 50, 0, 5),
('33333333-0000-0000-0000-000000000003', 40, 0, 5),
('33333333-0000-0000-0000-000000000004', 30, 0, 5),
('33333333-0000-0000-0000-000000000005', 35, 0, 5),
('33333333-0000-0000-0000-000000000006', 30, 0, 5),
('33333333-0000-0000-0000-000000000007', 45, 0, 5),
('33333333-0000-0000-0000-000000000008', 25, 0, 5),
('33333333-0000-0000-0000-000000000009', 20, 0, 5)
ON CONFLICT (product_id) DO UPDATE SET
    quantity_available = EXCLUDED.quantity_available,
    quantity_reserved = EXCLUDED.quantity_reserved;

-- 6. Site Settings
INSERT INTO public.site_settings (key, value, description) VALUES
('store_info', '{"name": "REEVITA", "tagline": "BEAUTY · CARE · RENEW", "country": "EG", "currency": "EGP", "support_phone": "01000000000", "support_email": "care@reevita.com"}'::jsonb, 'General store contact & identity info'),
('cod_policy', '{"enabled": true, "fee": 0, "max_order_amount": 10000, "verification_required_above": 3000}'::jsonb, 'Cash on Delivery parameters for Egypt'),
('free_shipping_default', '{"threshold": 1000.00, "enabled": true}'::jsonb, 'Default free shipping threshold across Egypt')
ON CONFLICT (key) DO NOTHING;
