import type { Product } from "@/lib/types";

export const SORTS = ["featured", "newest", "best-selling", "price-asc", "price-desc"] as const;
export type Sort = (typeof SORTS)[number];

/** Pure, URL-param-safe catalogue filter used by /shop. */
export function filterProducts(products: Product[], search: string, category: string, sort: Sort): Product[] {
  const needle = search.trim().toLowerCase().slice(0, 80);
  let result = products.filter((product) => {
    if (category && product.categorySlug !== category) return false;
    if (!needle) return true;
    return [product.nameAr, product.nameEn, product.fragranceNameAr, product.fragranceNameEn, product.categoryNameAr]
      .join(" ")
      .toLowerCase()
      .includes(needle);
  });
  result = [...result];
  if (sort === "price-asc") result.sort((a, b) => a.price - b.price);
  else if (sort === "price-desc") result.sort((a, b) => b.price - a.price);
  else if (sort === "newest") result.sort((a, b) => Number(b.isNew) - Number(a.isNew));
  else if (sort === "featured") result.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured));
  return result;
}

