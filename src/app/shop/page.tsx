import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { ProductGrid } from "@/components/product/product-grid";
import { ShopToolbar } from "@/components/shop/shop-toolbar";
import { categories, fragrances } from "@/lib/catalog";
import { getProducts } from "@/lib/data/catalog";
import { siteUrl } from "@/lib/env";
import type { Product } from "@/lib/types";

export const metadata: Metadata = {
  title: "Shop — REEVITA Cosmetics",
  description: "تسوّقي كل منتجات ريفيتا للعناية بالجسم والشعر: لوشن، زبدة جسم، سبليش، معطر شعر وشامبو طبيعي.",
  alternates: { canonical: `${siteUrl}/shop` },
};

type ShopPageProps = {
  searchParams: Promise<{ search?: string; category?: string; fragrance?: string; sort?: string }>;
};

const collator = new Intl.Collator("ar");

function sortProducts(products: Product[], sort: string | undefined): Product[] {
  const list = [...products];
  switch (sort) {
    case "price-asc":
      return list.sort((a, b) => a.price - b.price);
    case "price-desc":
      return list.sort((a, b) => b.price - a.price);
    case "newest":
      return list.sort((a, b) => Number(b.isNew) - Number(a.isNew));
    case "best-selling":
      return list.sort((a, b) => b.reviews - a.reviews);
    case "name":
      return list.sort((a, b) => collator.compare(a.nameAr, b.nameAr));
    default:
      return list.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured));
  }
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const { search, category, fragrance, sort } = await searchParams;
  const allProducts = await getProducts();

  // Server-side filtering: only public catalogue fields are matched, and the
  // query string is never interpolated into a database query.
  const needle = search?.trim().toLowerCase() ?? "";
  const filtered = allProducts.filter((product) => {
    if (category && product.categorySlug !== category) return false;
    if (fragrance && product.fragranceSlug !== fragrance) return false;
    if (needle) {
      const haystack = [product.nameAr, product.nameEn, product.shortAr, product.fragranceNameAr, product.categoryNameAr]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(needle.slice(0, 60))) return false;
    }
    return true;
  });

  const products = sortProducts(filtered, sort);
  const activeCategory = categories.find((item) => item.slug === category);

  return (
    <div className="bg-ivory">
      <section className="border-b border-line/70 bg-cream/40 py-12 md:py-16">
        <div className="container-luxe">
          <p className="eyebrow">
            <Sparkles className="size-3.5" aria-hidden /> THE COLLECTION
          </p>
          <h1 className="display-xl mt-4">{activeCategory ? activeCategory.nameAr : "كل منتجات ريفيتا"}</h1>
          <p className="lead mt-3 max-w-2xl">
            {activeCategory
              ? activeCategory.descriptionAr
              : "عطور الجسم، ترطيب مكثّف وعناية طبيعية بالشعر — صُنعت في مصر وبأسعار شفافة."}
          </p>
        </div>
      </section>

      <section className="container-luxe py-10 md:py-14">
        <nav aria-label="التصنيفات" className="mb-6 flex flex-wrap gap-2">
          <Link
            href="/shop"
            className={`rounded-full border px-4 py-2 text-xs font-bold transition-colors ${
              category ? "border-line bg-white/70 text-plum hover:border-gold" : "border-plum bg-plum text-ivory"
            }`}
          >
            الكل
          </Link>
          {categories.map((item) => (
            <Link
              key={item.slug}
              href={`/shop?category=${encodeURIComponent(item.slug)}`}
              className={`rounded-full border px-4 py-2 text-xs font-bold transition-colors ${
                category === item.slug
                  ? "border-plum bg-plum text-ivory"
                  : "border-line bg-white/70 text-plum hover:border-gold"
              }`}
            >
              {item.nameAr}
            </Link>
          ))}
        </nav>

        <nav aria-label="العائلات العطرية" className="mb-8 flex flex-wrap gap-2">
          {fragrances.map((item) => (
            <Link
              key={item.slug}
              href={`/shop?fragrance=${encodeURIComponent(item.slug)}`}
              className={`rounded-full border px-3.5 py-1.5 text-[0.7rem] font-semibold transition-colors ${
                fragrance === item.slug
                  ? "border-gold bg-gold/15 text-plum"
                  : "border-line/70 bg-white/50 text-muted hover:border-gold/60 hover:text-plum"
              }`}
            >
              {item.nameAr}
            </Link>
          ))}
        </nav>

        <ShopToolbar total={products.length} />

        {products.length > 0 ? (
          <ProductGrid products={products} className="mt-8" prioritizeFirst />
        ) : (
          <div className="rounded-2xl border border-dashed border-line bg-white/50 px-6 py-16 text-center">
            <p className="display-md text-lg">لا توجد منتجات مطابقة</p>
            <p className="mt-2 text-sm text-muted">جرّبي كلمة بحث أخرى أو استعرضي كل المنتجات.</p>
            <Link href="/shop" className="btn btn-primary mt-6">
              عرض كل المنتجات
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
