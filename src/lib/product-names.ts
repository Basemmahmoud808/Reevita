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

function scentFromSlug(slug: string, categorySlug: string): string {
  const prefix = `${categorySlug}-`;
  const suffix = slug.startsWith(prefix) ? slug.slice(prefix.length) : "";
  return suffix
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
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
  const scent = scentFromSlug(input.slug, categorySlug);

  return {
    // The prior generic names created duplicate product-page titles for every
    // fragrance variant. The scent makes the storefront name and metadata
    // unique while retaining the product's primary keyword.
    nameEn: `REEVITA ${scent ? `${scent} ` : ""}${type.en}`,
    nameAr: `ريفيتا ${type.ar}`,
  };
}
