import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ProductGrid } from "@/components/product/product-grid";
import { CollectionAddToBag } from "@/components/collection/collection-actions";
import { Price } from "@/components/ui/price";
import { getCollectionBySlug } from "@/lib/data/catalog";

export function generateStaticParams() {
  // Collection routes depend on the request's Supabase session. Resolve slugs
  // on demand instead of reading cookies from the build-time prerender step.
  return [];
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
      <div className="mt-8 flex flex-col items-center">
        {collection.image ? (
          <div className="relative aspect-[4/3] w-full max-w-5xl overflow-hidden rounded-3xl bg-cream">
            <Image src={collection.image} alt={`${collection.nameEn} bundle`} fill priority sizes="(max-width: 1024px) 100vw, 960px" className="object-contain" />
          </div>
        ) : null}
        <section className="mt-7 w-full max-w-3xl text-center">
          <p className="eyebrow">COLLECTION</p>
          <h1 className="display-xl mt-3">{collection.nameEn}</h1>
          <p className="lead mt-3">{collection.descriptionAr}</p>
          {products.length > 0 ? (
            <div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-sm text-muted">
              <span>{products.reduce((total, item) => total + (collection.productQuantities?.[item.id] ?? 1), 0)} products</span>
              <Price price={products.reduce((total, item) => total + item.price * (collection.productQuantities?.[item.id] ?? 1), 0)} size="sm" />
              <CollectionAddToBag purchaseReady={collection.purchaseReady} products={products} quantities={collection.productQuantities} />
            </div>
          ) : null}
        </section>
      </div>
      {products.length > 0 ? (
        <ProductGrid products={products} prioritizeFirst className="mt-10" groupName={collection.nameEn} />
      ) : (
        <section className="card-luxe mt-10 px-6 py-12 text-center">
          <p className="eyebrow">COMING SOON</p>
          <h2 className="display-md mt-2 text-xl">Bundle contents are being prepared</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-muted">
            Products will appear here once the bundle contents are confirmed.
          </p>
        </section>
      )}
    </main>
  );
}
