import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductGrid } from "@/components/product/product-grid";
import { CollectionAddToBag } from "@/components/collection/collection-actions";
import { Price } from "@/components/ui/price";
import { getCollectionBySlug, getCollections } from "@/lib/data/catalog";

export async function generateStaticParams() {
  return (await getCollections()).map((collection) => ({ slug: collection.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const result = await getCollectionBySlug(slug);
  return result ? { title: result.collection.nameEn, description: result.collection.descriptionAr } : {};
}

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await getCollectionBySlug(slug);
  if (!result) notFound();
  const { collection, products } = result;

  return (
    <main className="container-luxe py-10 md:py-14">
      <Link href="/collections" className="text-sm font-bold text-muted hover:text-gold-deep">← All collections</Link>
      <div className="mt-8 max-w-2xl">
        <p className="eyebrow">COLLECTION</p>
        <h1 className="display-xl mt-3">{collection.nameEn}</h1>
        <p className="lead mt-3">{collection.descriptionAr}</p>
        <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-muted">
          <span>{products.reduce((total, item) => total + (collection.productQuantities?.[item.id] ?? 1), 0)} products</span>
          <Price price={products.reduce((total, item) => total + item.price * (collection.productQuantities?.[item.id] ?? 1), 0)} size="sm" />
          <CollectionAddToBag purchaseReady={collection.purchaseReady} products={products} quantities={collection.productQuantities} />
        </div>
        {collection.missingProducts && collection.missingProducts.length > 0 && (
          <p className="mt-3 max-w-xl text-xs leading-6 text-muted">
            Bundle purchase is pending verification for: {collection.missingProducts.join(", ")}.
          </p>
        )}
      </div>
      {products.length > 0 ? <ProductGrid products={products} prioritizeFirst className="mt-10" /> : <div className="card-luxe mt-10 px-6 py-12 text-center text-sm text-muted">Products will be added to this collection soon.</div>}
    </main>
  );
}
