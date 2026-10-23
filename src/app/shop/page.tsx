import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductGrid } from "@/components/product/product-grid";
import { ShopToolbar } from "@/components/shop/shop-toolbar";
import { categories } from "@/lib/catalog";
import { getProducts } from "@/lib/data/catalog";
import { siteUrl } from "@/lib/env";
import { filterProducts, SORTS, type Sort } from "@/lib/shop-filter";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Shop",
  description: "Shop REEVITA body and hair care. Cash on delivery across Egypt.",
  alternates: { canonical: `${siteUrl}/shop` },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export default async function ShopPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const search = first(params.search).slice(0, 80);
  const requestedCategory = first(params.category);
  const category = categories.some((item) => item.slug === requestedCategory) ? requestedCategory : "";
  const requestedSort = first(params.sort);
  const sort: Sort = (SORTS as readonly string[]).includes(requestedSort) ? (requestedSort as Sort) : "featured";

  const products = await getProducts();
  const visible = filterProducts(products, search, category, sort);

  return (
    <div className="container-luxe py-10 md:py-14">
      <h1 className="display-xl">المتجر</h1>
      <nav aria-label="التصنيفات" className="mt-5 flex flex-wrap gap-2">
        <Link href="/shop" className="btn btn-outline px-4 py-2 text-xs" aria-current={category ? undefined : "page"}>
          الكل
        </Link>
        {categories.map((item) => (
          <Link
            key={item.slug}
            href={`/shop?category=${item.slug}`}
            className="btn btn-outline px-4 py-2 text-xs"
            aria-current={category === item.slug ? "page" : undefined}
          >
            {item.nameAr}
          </Link>
        ))}
      </nav>
      <div className="mt-6">
        <Suspense fallback={null}>
          <ShopToolbar total={visible.length} />
        </Suspense>
      </div>
      <div className="mt-8">
        {visible.length === 0 ? (
          <div className="py-16 text-center" role="status">
            <p className="lead">لا توجد منتجات مطابقة لبحثك.</p>
            <Link href="/shop" className="btn btn-primary mt-6">
              عرض كل المنتجات
            </Link>
          </div>
        ) : (
          <ProductGrid products={visible} prioritizeFirst />
        )}
      </div>
    </div>
  );
}
