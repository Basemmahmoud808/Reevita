import type { Metadata } from "next";
import { getProducts } from "@/lib/data/catalog";
import { getCollections } from "@/lib/data/catalog";
import { staticProducts } from "@/lib/catalog";
import { ReferenceHome } from "@/components/home/reference-home";

export const metadata: Metadata = {
  title: "Beauty, Body & Hair Care Products in Egypt",
  description: "Shop REEVITA's Egyptian body care, hair care and signature scent rituals, made for beautifully simple everyday care.",
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const liveProducts = await getProducts();
  const collections = await getCollections();
  const products = liveProducts.length > 0 ? liveProducts : staticProducts;

  return <ReferenceHome products={products.length >= staticProducts.length ? products : staticProducts} collections={collections} />;
}
