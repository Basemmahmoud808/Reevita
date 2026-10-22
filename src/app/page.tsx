import { getProducts } from "@/lib/data/catalog";
import { staticProducts } from "@/lib/catalog";
import { ReferenceHome } from "@/components/home/reference-home";

export default async function HomePage() {
  const liveProducts = await getProducts();
  const products = liveProducts.length > 0 ? liveProducts : staticProducts;

  return <ReferenceHome products={products.length >= staticProducts.length ? products : staticProducts} />;
}
