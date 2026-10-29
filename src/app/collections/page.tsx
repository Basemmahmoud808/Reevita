import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { getCollections, getProducts } from "@/lib/data/catalog";
import type { Collection, Product } from "@/lib/types";

export const metadata: Metadata = {
  title: "Collections",
  description: "Explore REEVITA signature collections.",
};

const merchandisingCollectionOrder = [
  "hair-care-duo-bundle",
  "soft-glow-bundle",
  "complete-care-bundle",
  "fresh-all-day-bundle",
];

function collectionProducts(collection: Collection, products: Product[]) {
  const productMap = new Map(products.map((product) => [product.id, product]));
  return (collection.productIds ?? []).map((id) => productMap.get(id)).filter((product): product is Product => Boolean(product));
}

function imageSource(url: string | undefined) {
  if (!url) return null;
  return url.startsWith("/") || url.startsWith("http://") || url.startsWith("https://") ? url : `/${url}`;
}

export default async function CollectionsPage() {
  const [allCollections, products] = await Promise.all([getCollections(), getProducts()]);
  const rank = new Map(merchandisingCollectionOrder.map((slug, index) => [slug, index]));
  const collections = allCollections
    .filter((collection) => rank.has(collection.slug))
    .sort((a, b) => (rank.get(a.slug) ?? Number.MAX_SAFE_INTEGER) - (rank.get(b.slug) ?? Number.MAX_SAFE_INTEGER));

  return (
    <main className="container-luxe py-10 md:py-14">
      <div className="mb-10 max-w-2xl">
        <p className="eyebrow">REEVITA COLLECTIONS</p>
        <h1 className="display-xl mt-3">A ritual for every mood</h1>
        <p className="lead mt-3">Discover curated REEVITA collections designed to become part of your daily ritual.</p>
      </div>
      {collections.length > 0 ? (
        <div className="grid gap-5 md:auto-rows-fr md:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => {
            const includedProducts = collectionProducts(collection, products);
            const quantity = includedProducts.reduce((sum, product) => sum + (collection.productQuantities?.[product.id] ?? 1), 0);
            const coverImage = imageSource(collection.image);
            return (
              <article key={collection.id} className="card-luxe group flex h-full flex-col overflow-hidden transition-transform duration-300 hover:-translate-y-1">
                <Link href={`/collections/${collection.slug}`} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep focus-visible:ring-inset">
                  <div className="relative aspect-[4/3] overflow-hidden bg-cream">
                    {coverImage ? <Image src={coverImage} alt={`${collection.nameEn} collection`} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" className="collections-cover-image transition-transform duration-700 group-hover:scale-[1.02]" /> : null}
                  </div>
                </Link>
                <div className="flex flex-1 flex-col p-6">
                  <p className="eyebrow">COLLECTION</p>
                  <h2 className="display-md mt-3 min-h-14 line-clamp-2 text-xl">{collection.nameEn}</h2>
                  <p className="mt-1 min-h-5 text-xs font-semibold tracking-wide text-muted" dir="ltr">&nbsp;</p>
                  <p className="mt-2 min-h-21 line-clamp-3 text-sm leading-7 text-muted">{collection.descriptionAr}</p>
                  <div className="mt-auto flex min-h-11 flex-wrap items-center justify-between gap-2 pt-4 text-xs text-muted">
                    {quantity > 0 ? <span>{quantity} products</span> : <span className="font-semibold text-plum">Bundle contents are being prepared</span>}
                  </div>
                  <div className="mt-4 flex min-h-10 flex-col items-start gap-3">
                    <Link href={`/collections/${collection.slug}`} className="inline-flex items-center gap-2 text-sm font-bold text-plum group-hover:text-gold-deep">
                      Explore collection <ArrowRight className="size-4" aria-hidden />
                    </Link>
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
