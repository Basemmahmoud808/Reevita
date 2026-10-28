#!/usr/bin/env node
/**
 * Generates supabase/seed.sql from src/data/catalog.json so the storefront demo
 * catalogue and the Supabase database can never drift apart.
 *
 * Usage: node scripts/generate-catalog-seed.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalog = JSON.parse(fs.readFileSync(path.join(root, "src/data/catalog.json"), "utf8"));

const q = (value) => `'${String(value ?? "").replace(/'/g, "''")}'`;
const arr = (values) => `ARRAY[${(values ?? []).map(q).join(", ")}]::text[]`;

const BRAND = catalog.brand;
const categories = [...catalog.categories].sort((a, b) => a.displayOrder - b.displayOrder);
const products = catalog.products;

// The 27 Egyptian governorates and their logistics zones (mirrors the demo store).
const GOVERNORATES = [
  ["CAI", "القاهرة", "Cairo", "greater_cairo"],
  ["GIZ", "الجيزة", "Giza", "greater_cairo"],
  ["QAL", "القليوبية", "Qalyubia", "greater_cairo"],
  ["ALX", "الإسكندرية", "Alexandria", "alexandria"],
  ["PTS", "بورسعيد", "Port Said", "canal"],
  ["SUZ", "السويس", "Suez", "canal"],
  ["ISM", "الإسماعيلية", "Ismailia", "canal"],
  ["DAM", "دمياط", "Damietta", "delta"],
  ["DKH", "الدقهلية", "Dakahlia", "delta"],
  ["SHR", "الشرقية", "Sharqia", "delta"],
  ["KFR", "كفر الشيخ", "Kafr El Sheikh", "delta"],
  ["GHB", "الغربية", "Gharbia", "delta"],
  ["MNF", "المنوفية", "Monufia", "delta"],
  ["BEH", "البحيرة", "Beheira", "delta"],
  ["FYM", "الفيوم", "Fayoum", "upper_egypt"],
  ["BNS", "بني سويف", "Beni Suef", "upper_egypt"],
  ["MNY", "المنيا", "Minya", "upper_egypt"],
  ["ASY", "أسيوط", "Asyut", "upper_egypt"],
  ["SHG", "سوهاج", "Sohag", "upper_egypt"],
  ["QNA", "قنا", "Qena", "upper_egypt"],
  ["LXR", "الأقصر", "Luxor", "upper_egypt"],
  ["ASW", "أسوان", "Aswan", "upper_egypt"],
  ["RSH", "البحر الأحمر", "Red Sea", "frontier"],
  ["WAD", "الوادي الجديد", "New Valley", "frontier"],
  ["MAT", "مطروح", "Matrouh", "frontier"],
  ["SIN", "شمال سيناء", "North Sinai", "frontier"],
  ["SIS", "جنوب سيناء", "South Sinai", "frontier"],
];

const ZONE_SHIPPING = {
  greater_cairo: [50, 1000, 1, 2],
  alexandria: [50, 1000, 1, 2],
  delta: [65, 1000, 2, 3],
  canal: [65, 1000, 2, 3],
  upper_egypt: [80, 1200, 3, 4],
  frontier: [100, 1500, 4, 6],
};

const uuid = (prefix, index) =>
  `${prefix}-0000-0000-0000-${String(index).padStart(12, "0")}`;

const lines = [];
lines.push("-- =====================================================================");
lines.push("-- REEVITA storefront seed — AUTO-GENERATED from src/data/catalog.json");
lines.push("-- Regenerate with: node scripts/generate-catalog-seed.mjs");
lines.push("-- =====================================================================");
lines.push("");

lines.push("-- 1. Egyptian governorates (27)");
lines.push(
  "INSERT INTO public.governorates (id, code, name_ar, name_en, zone, is_active) VALUES",
);
lines.push(
  GOVERNORATES.map(
    ([code, nameAr, nameEn, zone], index) =>
      `  (${q(uuid("11111111", index + 1))}, ${q(code)}, ${q(nameAr)}, ${q(nameEn)}, ${q(zone)}, TRUE)`,
  ).join(",\n"),
);
lines.push("ON CONFLICT (id) DO NOTHING;");
lines.push("");

lines.push("-- 2. Shipping rates per governorate");
lines.push(
  "INSERT INTO public.shipping_rates (governorate_id, shipping_cost, free_shipping_threshold, estimated_days_min, estimated_days_max)",
);
lines.push("SELECT id,");
lines.push("  50,");
lines.push("  CASE zone");
lines.push("    WHEN 'frontier' THEN 1500 WHEN 'upper_egypt' THEN 1200 ELSE 1000 END,");
lines.push("  CASE zone");
lines.push("    WHEN 'greater_cairo' THEN 1 WHEN 'alexandria' THEN 1");
lines.push("    WHEN 'delta' THEN 2 WHEN 'canal' THEN 2");
lines.push("    WHEN 'upper_egypt' THEN 3 ELSE 4 END,");
lines.push("  CASE zone");
lines.push("    WHEN 'greater_cairo' THEN 2 WHEN 'alexandria' THEN 2");
lines.push("    WHEN 'delta' THEN 3 WHEN 'canal' THEN 3");
lines.push("    WHEN 'upper_egypt' THEN 4 ELSE 6 END");
lines.push("FROM public.governorates");
lines.push("ON CONFLICT (governorate_id) DO NOTHING;");
lines.push("");

lines.push("-- 3. Product lines / categories");
lines.push(
  "INSERT INTO public.categories (id, slug, name, name_ar, description, image_url, display_order, is_active) VALUES",
);
lines.push(
  categories
    .map(
      (category, index) =>
        `  (${q(uuid("22222222", index + 1))}, ${q(category.slug)}, ${q(category.nameEn)}, ${q(
          category.nameAr,
        )}, ${q(category.descriptionAr)}, ${q(category.image)}, ${category.displayOrder}, TRUE)`,
    )
    .join(",\n"),
);
lines.push("ON CONFLICT (id) DO UPDATE SET");
lines.push("  name = EXCLUDED.name, name_ar = EXCLUDED.name_ar,");
lines.push("  description = EXCLUDED.description, image_url = EXCLUDED.image_url,");
lines.push("  display_order = EXCLUDED.display_order, is_active = TRUE;");
lines.push("");

const categoryIdBySlug = new Map(
  categories.map((category, index) => [category.slug, uuid("22222222", index + 1)]),
);
const fragranceById = new Map(catalog.fragrances.map((fragrance) => [fragrance.slug, fragrance]));

lines.push(`-- 4. Products (${products.length} catalogue SKUs) — prices in EGP`);
lines.push(
  "INSERT INTO public.products (id, category_id, slug, name, name_ar, short_description, short_description_ar, description, price, compare_at_price, benefits, ingredients, how_to_use, size, is_featured, is_active) VALUES",
);
lines.push(
  products
    .map((product) => {
      const fragrance = fragranceById.get(product.fragrance);
      const category = categories.find((item) => item.slug === product.category);
      const shortEn = `${category?.nameEn ?? ""} with ${fragrance?.nameEn ?? ""} notes.`.trim();
      return `  (${q(product.id)}, ${q(categoryIdBySlug.get(product.category))}, ${q(product.slug)}, ${q(
        product.nameEn,
      )}, ${q(product.nameAr)}, ${q(shortEn)}, ${q(product.shortAr)}, ${q(product.descriptionAr)}, ${
        product.price
      }, ${product.compareAtPrice ?? "NULL"}, ${arr(product.benefits)}, ${q(product.ingredientsAr)}, ${q(
        product.howToUseAr,
      )}, ${q(product.size)}, ${product.isFeatured ? "TRUE" : "FALSE"}, ${product.isActive === false ? "FALSE" : "TRUE"})`;
    })
    .join(",\n"),
);
lines.push("ON CONFLICT (id) DO UPDATE SET");
lines.push("  category_id = EXCLUDED.category_id, name = EXCLUDED.name, name_ar = EXCLUDED.name_ar,");
lines.push("  short_description = EXCLUDED.short_description, short_description_ar = EXCLUDED.short_description_ar,");
lines.push("  description = EXCLUDED.description, price = EXCLUDED.price,");
lines.push("  compare_at_price = EXCLUDED.compare_at_price, benefits = EXCLUDED.benefits,");
lines.push("  ingredients = EXCLUDED.ingredients, how_to_use = EXCLUDED.how_to_use,");
lines.push("  size = EXCLUDED.size, is_featured = EXCLUDED.is_featured, is_active = EXCLUDED.is_active;");
lines.push("");

lines.push("-- 5. Product imagery");
lines.push("DELETE FROM public.product_images;");
lines.push(
  "INSERT INTO public.product_images (product_id, image_url, alt_text, display_order, is_primary) VALUES",
);
const imageRows = [];
for (const product of products) {
  const imageSlug = product.slug.replace(/-(100|120)$/, "");
  imageRows.push(
    `  (${q(product.id)}, ${q(`/images/products/${imageSlug}.webp`)}, ${q(`${product.nameAr} — REEVITA`)}, 1, TRUE)`,
  );
}
lines.push(imageRows.join(",\n") + ";");
lines.push("");

lines.push("-- 6. Inventory");
lines.push(
  "INSERT INTO public.inventory (product_id, quantity_available, quantity_reserved, low_stock_threshold) VALUES",
);
lines.push(products.map((product) => `  (${q(product.id)}, ${product.stock}, 0, 5)`).join(",\n"));
lines.push("ON CONFLICT (product_id) DO UPDATE SET");
lines.push("  quantity_available = EXCLUDED.quantity_available,");
lines.push("  low_stock_threshold = EXCLUDED.low_stock_threshold;");
lines.push("");

lines.push("-- 7. Site settings");
lines.push("INSERT INTO public.site_settings (key, value, description) VALUES");
const settings = [
  [
    "store_info",
    {
      name: BRAND.name,
      name_ar: BRAND.nameAr,
      tagline: BRAND.taglineEn,
      tagline_ar: BRAND.taglineAr,
      country: "EG",
      currency: "EGP",
      support_phone: BRAND.supportPhone,
      support_email: BRAND.email,
      whatsapp: BRAND.whatsapp,
      instagram: BRAND.instagram,
      owner_action_required: "استبدلي رقم الدعم وروابط السوشيال بالبيانات الرسمية قبل الإطلاق",
    },
    "General store contact & identity info",
  ],
  [
    "cod_policy",
    {
      enabled: true,
      fee: BRAND.codFee,
      max_order_amount: 10000,
      verification_required_above: 3000,
      note: "الدفع عند الاستلام فقط داخل مصر",
    },
    "Cash on Delivery parameters for Egypt",
  ],
  [
    "free_shipping_default",
    { threshold: BRAND.freeShippingThreshold, enabled: true },
    "Default free shipping threshold across Egypt",
  ],
  [
    "return_policy",
    { window_days: BRAND.returnWindowDays, condition: "غير مفتوح وبحالته الأصلية" },
    "Return window and conditions",
  ],
];
lines.push(
  settings
    .map(([key, value, description]) => `  (${q(key)}, ${q(JSON.stringify(value))}::jsonb, ${q(description)})`)
    .join(",\n"),
);
lines.push("ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, description = EXCLUDED.description;");
lines.push("");

lines.push("-- 8. Collection memberships use owner-confirmed products.");
lines.push("UPDATE public.collections SET purchase_ready = FALSE, missing_products = ARRAY['Shampoo Dove — 300 ml'], updated_at = now() WHERE slug = 'soft-glow-bundle';");
lines.push("UPDATE public.collections SET purchase_ready = TRUE, missing_products = ARRAY[]::text[], updated_at = now() WHERE slug = 'complete-care-bundle';");
lines.push("DELETE FROM public.collection_products cp USING public.collections c WHERE cp.collection_id = c.id AND c.slug IN ('complete-care-bundle', 'hair-care-duo-bundle', 'fruity-mood');");
lines.push("INSERT INTO public.collection_products (collection_id, product_id, display_order, quantity)");
lines.push("SELECT c.id, p.id, m.display_order, 1 FROM (VALUES");
lines.push("  ('complete-care-bundle', 'body-lotion-sexy', 0), ('complete-care-bundle', 'body-lotion-queen', 1), ('complete-care-bundle', 'body-lotion-ruby-musk', 2),");
lines.push("  ('complete-care-bundle', 'body-splash-sexy', 3), ('complete-care-bundle', 'body-splash-queen', 4), ('complete-care-bundle', 'body-splash-ruby-musk', 5),");
lines.push("  ('complete-care-bundle', 'shower-gel-bubble-gum', 6), ('complete-care-bundle', 'shower-gel-blueberry', 7), ('complete-care-bundle', 'shower-gel-dove', 8),");
lines.push("  ('hair-care-duo-bundle', 'shampoo-bubble-gum', 0), ('hair-care-duo-bundle', 'hair-mist-ruby-musk', 1),");
lines.push("  ('fruity-mood', 'shower-gel-blueberry', 0), ('fruity-mood', 'body-lotion-ruby-musk', 1), ('fruity-mood', 'body-splash-ruby-musk', 2)");
lines.push(") AS m(collection_slug, product_slug, display_order) JOIN public.collections c ON c.slug = m.collection_slug JOIN public.products p ON p.slug = m.product_slug AND p.is_active = TRUE");
lines.push("ON CONFLICT (collection_id, product_id) DO UPDATE SET display_order = EXCLUDED.display_order, quantity = EXCLUDED.quantity;");

const output = lines.join("\n");
fs.writeFileSync(path.join(root, "supabase/seed.sql"), output, "utf8");
console.log(`Wrote supabase/seed.sql (${products.length} products, ${categories.length} categories, ${imageRows.length} images)`);
