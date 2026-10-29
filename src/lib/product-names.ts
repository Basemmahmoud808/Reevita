const productTypes: Record<string, { en: string; ar: string }> = {
  shampoo: { en: "Shampoo", ar: "شامبو" },
  "shower-gel": { en: "Shower Gel", ar: "شاور جل" },
  "body-splash": { en: "Body Splash", ar: "بادي سبلاش" },
  "body-lotion": { en: "Body Lotion", ar: "لوشن الجسم" },
  "body-butter": { en: "Body Butter", ar: "زبدة الجسم" },
  "hair-mist": { en: "Hair Mist", ar: "معطر الشعر" },
};

function categoryFromSlug(slug: string): string {
  return Object.keys(productTypes).find((category) => slug.startsWith(`${category}-`)) ?? "";
}

export function canonicalProductNames(input: {
  slug: string;
  categorySlug?: string;
  nameEn?: string;
  nameAr?: string;
}): { nameEn: string; nameAr: string } {
  const categorySlug = input.categorySlug || categoryFromSlug(input.slug);
  const type = productTypes[categorySlug];
  if (!type) return { nameEn: input.nameEn ?? input.slug, nameAr: input.nameAr ?? input.slug };

  return {
    nameEn: `REEVITA ${type.en}`,
    nameAr: `ريفيتا ${type.ar}`,
  };
}
