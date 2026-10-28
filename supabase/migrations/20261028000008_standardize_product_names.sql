-- Standardize current catalogue names without changing product IDs, slugs,
-- images, prices, inventory, relationships, or historical order snapshots.
UPDATE public.products
SET
  name = CASE slug
    WHEN 'shampoo-aloe-vera' THEN 'REEVITA Shampoo — Aloe Vera — 300 ml'
    WHEN 'shampoo-blueberry' THEN 'REEVITA Shampoo — Blueberry — 300 ml'
    WHEN 'body-lotion-sexy' THEN 'REEVITA Body Lotion — Sexy — 200 ml'
    WHEN 'body-lotion-queen' THEN 'REEVITA Body Lotion — Queen — 200 ml'
    WHEN 'body-lotion-ruby-musk' THEN 'REEVITA Body Lotion — Ruby Musk — 200 ml'
    WHEN 'body-butter-sexy' THEN 'REEVITA Body Butter — Sexy — 200 g'
    WHEN 'body-butter-queen' THEN 'REEVITA Body Butter — Queen — 200 g'
    WHEN 'body-butter-ruby-musk' THEN 'REEVITA Body Butter — Ruby Musk — 200 g'
    WHEN 'body-splash-sexy' THEN 'REEVITA Body Splash — Sexy — 200 ml'
    WHEN 'body-splash-queen' THEN 'REEVITA Body Splash — Queen — 200 ml'
    WHEN 'body-splash-ruby-musk' THEN 'REEVITA Body Splash — Ruby Musk — 200 ml'
    WHEN 'hair-mist-sexy' THEN 'REEVITA Hair Mist — Sexy — 100 ml'
    WHEN 'hair-mist-queen' THEN 'REEVITA Hair Mist — Queen — 100 ml'
    WHEN 'hair-mist-ruby-musk' THEN 'REEVITA Hair Mist — Ruby Musk — 100 ml'
    ELSE name
  END,
  name_ar = CASE slug
    WHEN 'shampoo-aloe-vera' THEN 'ريفيتا شامبو — ألوفيرا — 300 مل'
    WHEN 'shampoo-blueberry' THEN 'ريفيتا شامبو — توت أزرق — 300 مل'
    WHEN 'body-lotion-sexy' THEN 'ريفيتا لوشن الجسم — سيكسي — 200 مل'
    WHEN 'body-lotion-queen' THEN 'ريفيتا لوشن الجسم — كوين — 200 مل'
    WHEN 'body-lotion-ruby-musk' THEN 'ريفيتا لوشن الجسم — روبي مسك — 200 مل'
    WHEN 'body-butter-sexy' THEN 'ريفيتا زبدة الجسم — سيكسي — 200 جم'
    WHEN 'body-butter-queen' THEN 'ريفيتا زبدة الجسم — كوين — 200 جم'
    WHEN 'body-butter-ruby-musk' THEN 'ريفيتا زبدة الجسم — روبي مسك — 200 جم'
    WHEN 'body-splash-sexy' THEN 'ريفيتا بادي سبلاش — سيكسي — 200 مل'
    WHEN 'body-splash-queen' THEN 'ريفيتا بادي سبلاش — كوين — 200 مل'
    WHEN 'body-splash-ruby-musk' THEN 'ريفيتا بادي سبلاش — روبي مسك — 200 مل'
    WHEN 'hair-mist-sexy' THEN 'ريفيتا معطر الشعر — سيكسي — 100 مل'
    WHEN 'hair-mist-queen' THEN 'ريفيتا معطر الشعر — كوين — 100 مل'
    WHEN 'hair-mist-ruby-musk' THEN 'ريفيتا معطر الشعر — روبي مسك — 100 مل'
    ELSE name_ar
  END,
  updated_at = now()
WHERE slug IN (
  'shampoo-aloe-vera', 'shampoo-blueberry',
  'body-lotion-sexy', 'body-lotion-queen', 'body-lotion-ruby-musk',
  'body-butter-sexy', 'body-butter-queen', 'body-butter-ruby-musk',
  'body-splash-sexy', 'body-splash-queen', 'body-splash-ruby-musk',
  'hair-mist-sexy', 'hair-mist-queen', 'hair-mist-ruby-musk'
);
