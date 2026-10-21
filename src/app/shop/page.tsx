import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Sparkles, X } from "lucide-react";
import { getCategories, getProducts } from "@/lib/data/catalog";
import { fragrances } from "@/lib/catalog";
import { ProductGrid } from "@/components/product/product-grid";
import { ShopToolbar } from "@/components/shop/shop-toolbar";
import { Reveal } from "@/components/ui/reveal";
import { cn } from "@/lib/format";
import type { Product } from "@/lib/types";

export const metadata: Metadata = {
  title: "المتجر — كل منتجات ريفيتا",
  description:
    "تسوّقي لوشن الجسم، زبدة الجسم، سبراي الجسم، معطر الشعر والشامبو من ريفيتا بروائح سيكسي وكوين وروبي مسك.",
  alternates: { canonical: "/shop" },
};

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

function param(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function buildHref(
  current: Record<string, string | string[] | undefined>,
  overrides: Record<string, string | null>,
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(current)) {
    if (typeof value === "string" && value && key !== "search") params.set(key, value);
    if (Array.isArray(value) && value[0]) params.set(key, value[0]);
  }
  for (const [key, value] of Object.entries(overrides)) {
    if (value) params.set(key, value);
    else params.delete(key);
  }
  const query = params.toString();
  return query ? `/shop?${query}` : "/shop";
}

function matchesSearch(product: Product, needle: string): boolean {
  const haystack = [
    product.nameAr,
    product.nameEn,
    product.shortAr,
    product.descriptionAr,
    product.categoryNameAr,
    product.fragranceNameAr,
    product.variantLabelAr ?? "",
    product.sku,
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(needle.toLowerCase());
}

function sortProducts(products: Product[], sort: string): Product[] {
  const list = [...products];
  switch (sort) {
    case "price-asc":
      return list.sort((a, b) => a.price - b.price);
    case "price-desc":
      return list.sort((a, b) => b.price - a.price);
    case "best-selling":
      return list.sort((a, b) => b.reviews - a.reviews);
    case "newest":
      return list.sort((a, b) => Number(b.isNew) - Number(a.isNew));
    default:
      return list.sort(
        (a, b) => Number(b.isFeatured) - Number(a.isFeatured) || b.rating - a.rating,
      );
  }
}

export default async function ShopPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const categorySlug = param(params.category);
  const fragranceSlug = param(params.fragrance);
  const search = (param(params.search) ?? "").trim();
  const sort = param(params.sort) ?? "featured";

  const [allProducts, categories] = await Promise.all([getProducts(), getCategories()]);

  let products = allProducts;
  if (categorySlug) products = products.filter((product) => product.categorySlug === categorySlug);
  if (fragranceSlug) products = products.filter((product) => product.fragranceSlug === fragranceSlug);
  if (search) products = products.filter((product) => matchesSearch(product, search));
  products = sortProducts(products, sort);

  const activeCategory = categories.find((category) => category.slug === categorySlug);
  const activeFragrance = fragrances.find((fragrance) => fragrance.slug === fragranceSlug);
  const hasFilters = Boolean(categorySlug || fragranceSlug || search);

  return (
    <div className="bg-ivory">
      <section className="relative overflow-hidden border-b border-line/70 bg-cream/50 py-14 md:py-20">
        <div className="pointer-events-none absolute -top-24 end-10 size-72 rounded-full bg-blush/70 blur-[100px]" aria-hidden />
        <div className="container-luxe relative">
          <nav aria-label="مسار التنقل" className="mb-5 text-[0.7rem] text-muted">
            <Link href="/" className="transition-colors hover:text-plum">
              الرئيسية
            </Link>
            <span className="mx-2 text-gold" aria-hidden>
              /
            </span>
            <span className="text-plum">المتجر</span>
            {activeCategory && (
              <>
                <span className="mx-2 text-gold" aria-hidden>
                  /
                </span>
                <span className="text-plum">{activeCategory.nameAr}</span>
              </>
            )}
          </nav>
          <p className="eyebrow">THE COLLECTION</p>
          <h1 className="display-xl mt-4">
            {activeCategory ? activeCategory.nameAr : activeFragrance ? `مجموعة ${activeFragrance.nameAr}` : "كل منتجات ريفيتا"}
          </h1>
          <p className="lead mt-4 max-w-2xl">
            {activeCategory
              ? activeCategory.descriptionAr
              : activeFragrance
                ? activeFragrance.descriptionAr
                : "عناية فاخرة بالجسم والشعر، بتركيبات نباتية لطيفة وروائح تحكي قصتك. اختاري طقسك وابدئي."}
          </p>
        </div>
      </section>

      <section className="container-luxe py-10 md:py-14">
        <div className="mb-7 space-y-4">
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="تصفية حسب النوع">
            <Link
              href={buildHref(params, { category: null })}
              className={cn(
                "rounded-full border px-4 py-2 text-xs font-bold transition-all",
                !categorySlug
                  ? "border-plum bg-plum text-ivory"
                  : "border-line bg-white/70 text-plum hover:border-gold",
              )}
            >
              كل المنتجات
            </Link>
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={buildHref(params, { category: category.slug })}
                aria-current={categorySlug === category.slug ? "page" : undefined}
                className={cn(
                  "rounded-full border px-4 py-2 text-xs font-bold transition-all",
                  categorySlug === category.slug
                    ? "border-plum bg-plum text-ivory"
                    : "border-line bg-white/70 text-plum hover:border-gold",
                )}
              >
                {category.nameAr}
              </Link>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="تصفية حسب الرائحة">
            <span className="flex items-center gap-1.5 pe-1 text-[0.68rem] font-bold text-muted">
              <Sparkles className="size-3 text-gold-deep" aria-hidden />
              الرائحة:
            </span>
            {fragrances.map((fragrance) => (
              <Link
                key={fragrance.slug}
                href={buildHref(params, { fragrance: fragranceSlug === fragrance.slug ? null : fragrance.slug })}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-[0.7rem] font-semibold transition-all",
                  fragranceSlug === fragrance.slug
                    ? "border-gold-deep bg-gold/15 text-gold-deep"
                    : "border-line bg-white/60 text-muted hover:border-gold hover:text-plum",
                )}
              >
                {fragrance.nameAr}
              </Link>
            ))}
          </div>
        </div>

        <Suspense fallback={<div className="h-16" aria-hidden />}>
          <ShopToolbar total={products.length} />
        </Suspense>

        {hasFilters && (
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted">
            <span>الفلاتر النشطة:</span>
            {search && <FilterChip label={`بحث: ${search}`} href={buildHref(params, { search: null })} />}
            {activeCategory && (
              <FilterChip label={activeCategory.nameAr} href={buildHref(params, { category: null })} />
            )}
            {activeFragrance && (
              <FilterChip label={activeFragrance.nameAr} href={buildHref(params, { fragrance: null })} />
            )}
            <Link href="/shop" className="text-[0.7rem] font-bold text-gold-deep hover:underline">
              مسح الكل
            </Link>
          </div>
        )}

        <div className="mt-8">
          {products.length > 0 ? (
            <ProductGrid products={products} prioritizeFirst />
          ) : (
            <Reveal className="rounded-2xl border border-line bg-white/60 px-6 py-20 text-center">
              <p className="display-md">لا توجد منتجات مطابقة</p>
              <p className="mt-2 text-sm text-muted">جرّبي تعديل الفلاتر أو البحث بكلمة أخرى.</p>
              <Link href="/shop" className="btn btn-outline mt-6">
                عرض كل المنتجات
              </Link>
            </Reveal>
          )}
        </div>
      </section>
    </div>
  );
}

function FilterChip({ label, href }: { label: string; href: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 font-semibold text-gold-deep"
    >
      {label}
      <X className="size-3" aria-hidden />
    </Link>
  );
}
