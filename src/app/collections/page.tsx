import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { CollectionAddToBag } from "@/components/collection/collection-actions";
import { Price } from "@/components/ui/price";
import { getCollections, getProducts } from "@/lib/data/catalog";
import type { Collection, Product } from "@/lib/types";

export const metadata: Metadata = {
  title: "Collections",
  description: "Explore REEVITA signature collections.",
};

function collectionProducts(collection: Collection, products: Product[]) {
  const ids = new Set(collection.productIds ?? []);
  return products.filter((product) => ids.has(product.id));
}

export default async function CollectionsPage() {
  const [collections, products] = await Promise.all([getCollections(), getProducts()]);

  return (
    <main className="container-luxe py-10 md:py-14">
      <div className="mb-10 max-w-2xl">
        <p className="eyebrow">REEVITA COLLECTIONS</p>
        <h1 className="display-xl mt-3">A ritual for every mood</h1>
        <p className="lead mt-3">Discover curated REEVITA collections designed to become part of your daily ritual.</p>
      </div>
      {collections.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => {
            const includedProducts = collectionProducts(collection, products);
            const total = includedProducts.reduce((sum, product) => sum + product.price * (collection.productQuantities?.[product.id] ?? 1), 0);
            const quantity = includedProducts.reduce((sum, product) => sum + (collection.productQuantities?.[product.id] ?? 1), 0);
            return (
              <article key={collection.id} className="card-luxe group overflow-hidden transition-transform duration-300 hover:-translate-y-1">
                <Link href={`/collections/${collection.slug}`} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep focus-visible:ring-inset">
                  <div className="relative aspect-[4/3] overflow-hidden bg-cream">
                    {collection.image ? <Image src={collection.image} alt={`${collection.nameEn} collection`} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" className="object-cover transition-transform duration-700 group-hover:scale-105" /> : null}
                  </div>
                </Link>
                <div className="p-6">
                  <p className="eyebrow">COLLECTION</p>
                  <h2 className="display-md mt-3 text-xl">{collection.nameEn}</h2>
                  <p className="mt-2 text-sm leading-7 text-muted">{collection.descriptionAr}</p>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
                    <span>{quantity} products</span>
                    <Price price={total} size="sm" />
                  </div>
                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <Link href={`/collections/${collection.slug}`} className="inline-flex items-center gap-2 text-sm font-bold text-plum group-hover:text-gold-deep">
                      View collection <ArrowLeft className="size-4" aria-hidden />
                    </Link>
                    <CollectionAddToBag purchaseReady={collection.purchaseReady} products={includedProducts} quantities={collection.productQuantities} />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="card-luxe px-6 py-12 text-center text-sm text-muted">Collections will be available soon.</div>
      )}
    </main>
  );
}
