import type { Metadata } from "next";
import { ProductGrid } from "@/components/product/product-grid";
import { ShopToolbar } from "@/components/shop/shop-toolbar";
import { getProducts } from "@/lib/data/catalog";
import { cn } from "@/lib/format";

export const metadata: Metadata = {
  title: "Shop",
  description: "Shop REEVITA body care, hair care and beauty essentials.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function ShopPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const search = first(params.search).trim().toLowerCase();
  const category = first(params.category);
  const sort = first(params.sort) || "featured";
  const allProducts = await getProducts();
  let products = allProducts.filter((product) => {
    const matchesCategory = !category || product.categorySlug === category;
    const haystack = `${product.nameEn} ${product.nameAr} ${product.categoryNameEn} ${product.fragranceNameEn}`.toLowerCase();
    return matchesCategory && (!search || haystack.includes(search));
  });

  products = [...products].sort((a, b) => {
    if (sort === "price-asc") return a.price - b.price;
    if (sort === "price-desc") return b.price - a.price;
    if (sort === "best-selling") return b.reviews - a.reviews;
    if (sort === "newest") return Number(b.isNew) - Number(a.isNew);
    return Number(b.isFeatured) - Number(a.isFeatured) || b.reviews - a.reviews;
  });

  return (
    <main className="container-luxe py-10 md:py-14">
      <div className="mb-8 max-w-2xl">
        <p className="eyebrow">REEVITA COLLECTION</p>
        <h1 className="display-xl mt-3">Shop the ritual</h1>
        <p className="lead mt-3">Thoughtfully made body care, hair care and beauty essentials for your everyday routine.</p>
      </div>

      <ShopToolbar total={products.length} />

      {products.length > 0 ? (
        <ProductGrid products={products} prioritizeFirst className="mt-9" />
      ) : (
        <div className="mt-9 rounded-2xl border border-dashed border-line bg-white/50 px-6 py-16 text-center">
          <h2 className="display-md text-xl">No products found</h2>
          <p className="mt-2 text-sm text-muted">Try a different search or browse the full collection.</p>
          <a href="/shop" className={cn("btn btn-primary", "mt-6")}>View all products</a>
        </div>
      )}
    </main>
  );
}
