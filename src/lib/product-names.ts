const productTypes: Record<string, { en: string; ar: string }> = {
  shampoo: { en: "Shampoo", ar: "شامبو" },
  "shower-gel": { en: "Shower Gel", ar: "شاور جل" },
  "body-splash": { en: "Body Splash", ar: "بادي سبلاش" },
  "body-lotion": { en: "Body Lotion", ar: "لوشن الجسم" },
  "body-butter": { en: "Body Butter", ar: "زبدة الجسم" },
  "hair-mist": { en: "Hair Mist", ar: "معطر الشعر" },
};

const variantNames: Record<string, { en: string; ar: string }> = {
  "shampoo-aloe-vera": { en: "Aloe Vera", ar: "ألوفيرا" },
  "shampoo-blueberry": { en: "Blueberry", ar: "توت أزرق" },
  "body-lotion-sexy": { en: "Sexy", ar: "سيكسي" },
  "body-lotion-queen": { en: "Queen", ar: "كوين" },
  "body-lotion-ruby-musk": { en: "Ruby Musk", ar: "روبي مسك" },
  "body-butter-sexy": { en: "Sexy", ar: "سيكسي" },
  "body-butter-queen": { en: "Queen", ar: "كوين" },
  "body-butter-ruby-musk": { en: "Ruby Musk", ar: "روبي مسك" },
  "body-splash-sexy": { en: "Sexy", ar: "سيكسي" },
  "body-splash-queen": { en: "Queen", ar: "كوين" },
  "body-splash-ruby-musk": { en: "Ruby Musk", ar: "روبي مسك" },
  "hair-mist-sexy": { en: "Sexy", ar: "سيكسي" },
  "hair-mist-queen": { en: "Queen", ar: "كوين" },
  "hair-mist-ruby-musk": { en: "Ruby Musk", ar: "روبي مسك" },
};

function categoryFromSlug(slug: string): string {
  return Object.keys(productTypes).find((category) => slug.startsWith(`${category}-`)) ?? "";
}

export function canonicalProductNames(input: {
  slug: string;
  categorySlug?: string;
  size?: string | null;
  variantLabelAr?: string | null;
  nameEn?: string;
  nameAr?: string;
}): { nameEn: string; nameAr: string } {
  const categorySlug = input.categorySlug || categoryFromSlug(input.slug);
  const type = productTypes[categorySlug];
  if (!type) return { nameEn: input.nameEn ?? input.slug, nameAr: input.nameAr ?? input.slug };

  const variant = variantNames[input.slug] ?? (input.variantLabelAr ? { en: input.variantLabelAr, ar: input.variantLabelAr } : null);
  const enParts = ["REEVITA", type.en, variant?.en].filter(Boolean);
  const arParts = ["ريفيتا", type.ar, variant?.ar].filter(Boolean);

  return {
    nameEn: enParts.join(" "),
    nameAr: arParts.join(" "),
  };
}
