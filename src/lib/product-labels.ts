import type { Product } from "@/lib/types";

const englishVariantLabels: Record<string, string> = {
  "ألوفيرا": "Aloe Vera",
  "توت أزرق": "Blueberry",
  "سيكسي": "Sexy",
  "كوين": "Queen",
  "روبي مسك": "Ruby Musk",
  "بابل جام": "Bubble Gum",
  "دوف": "Dove",
};

export function productScentLabel(product: Product, locale: "ar" | "en") {
  if (locale === "ar") {
    return product.variantLabelAr || (product.fragranceSlug === "botanical" ? "" : product.fragranceNameAr);
  }

  if (product.variantLabelAr) return englishVariantLabels[product.variantLabelAr] ?? "";
  return product.fragranceSlug === "botanical" ? "" : product.fragranceNameEn;
}
