import { getCategories, getProducts } from "@/lib/data/catalog";
import { staticProducts } from "@/lib/catalog";
import { Hero } from "@/components/home/hero";
import {
  Bestsellers,
  BrandStory,
  CategoryStrip,
  ClosingCta,
  CollectionEdit,
  GalleryStrip,
  Ritual,
  Testimonials,
  Ticker,
  ValueStrip,
} from "@/components/home/sections";
import type { Product } from "@/lib/types";

function pickFeatured(products: Product[]): Product[] {
  const featured = products.filter((product) => product.isFeatured);
  const pool = [...featured, ...[...products].sort((a, b) => b.reviews - a.reviews)];
  const seen = new Set<string>();
  const result: Product[] = [];
  for (const product of pool) {
    if (seen.has(product.id)) continue;
    seen.add(product.id);
    result.push(product);
    if (result.length === 4) break;
  }
  return result;
}

export default async function HomePage() {
  const [liveProducts, liveCategories] = await Promise.all([getProducts(), getCategories()]);
  const products = liveProducts.length > 0 ? liveProducts : staticProducts;
  const categoriesList = liveCategories.length > 0 ? liveCategories : [];
  const heroProduct =
    products.find((product) => product.slug === "body-lotion-queen") ?? products[0];

  return (
    <>
      {heroProduct ? <Hero product={heroProduct} /> : null}
      <Ticker />
      <ValueStrip />
      <CategoryStrip items={categoriesList} />
      <Bestsellers products={pickFeatured(products)} />
      <CollectionEdit />
      <BrandStory />
      <Ritual products={products} />
      <Testimonials />
      <GalleryStrip products={products} />
      <ClosingCta />
    </>
  );
}
