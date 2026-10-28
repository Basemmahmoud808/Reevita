-- Keep catalogue names short and keep size in the dedicated products.size field.
-- Product IDs, slugs, relationships, images, prices, inventory, and order
-- snapshots are intentionally unchanged.
UPDATE public.products
SET
  name = CASE slug
    WHEN 'shampoo-aloe-vera' THEN 'REEVITA Shampoo Aloe Vera'
    WHEN 'shampoo-blueberry' THEN 'REEVITA Shampoo Blueberry'
    WHEN 'body-lotion-sexy' THEN 'REEVITA Body Lotion Sexy'
    WHEN 'body-lotion-queen' THEN 'REEVITA Body Lotion Queen'
    WHEN 'body-lotion-ruby-musk' THEN 'REEVITA Body Lotion Ruby Musk'
    WHEN 'body-butter-sexy' THEN 'REEVITA Body Butter Sexy'
    WHEN 'body-butter-queen' THEN 'REEVITA Body Butter Queen'
    WHEN 'body-butter-ruby-musk' THEN 'REEVITA Body Butter Ruby Musk'
    WHEN 'body-splash-sexy' THEN 'REEVITA Body Splash Sexy'
    WHEN 'body-splash-queen' THEN 'REEVITA Body Splash Queen'
    WHEN 'body-splash-ruby-musk' THEN 'REEVITA Body Splash Ruby Musk'
    WHEN 'hair-mist-sexy' THEN 'REEVITA Hair Mist Sexy'
    WHEN 'hair-mist-queen' THEN 'REEVITA Hair Mist Queen'
    WHEN 'hair-mist-ruby-musk' THEN 'REEVITA Hair Mist Ruby Musk'
    ELSE name
  END,
  name_ar = CASE slug
    WHEN 'shampoo-aloe-vera' THEN 'ريفيتا شامبو ألوفيرا'
    WHEN 'shampoo-blueberry' THEN 'ريفيتا شامبو توت أزرق'
    WHEN 'body-lotion-sexy' THEN 'ريفيتا لوشن الجسم سيكسي'
    WHEN 'body-lotion-queen' THEN 'ريفيتا لوشن الجسم كوين'
    WHEN 'body-lotion-ruby-musk' THEN 'ريفيتا لوشن الجسم روبي مسك'
    WHEN 'body-butter-sexy' THEN 'ريفيتا زبدة الجسم سيكسي'
    WHEN 'body-butter-queen' THEN 'ريفيتا زبدة الجسم كوين'
    WHEN 'body-butter-ruby-musk' THEN 'ريفيتا زبدة الجسم روبي مسك'
    WHEN 'body-splash-sexy' THEN 'ريفيتا بادي سبلاش سيكسي'
    WHEN 'body-splash-queen' THEN 'ريفيتا بادي سبلاش كوين'
    WHEN 'body-splash-ruby-musk' THEN 'ريفيتا بادي سبلاش روبي مسك'
    WHEN 'hair-mist-sexy' THEN 'ريفيتا معطر الشعر سيكسي'
    WHEN 'hair-mist-queen' THEN 'ريفيتا معطر الشعر كوين'
    WHEN 'hair-mist-ruby-musk' THEN 'ريفيتا معطر الشعر روبي مسك'
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
