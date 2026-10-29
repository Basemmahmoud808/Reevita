import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CollectionProductGallery } from "@/components/collection/collection-product-gallery";
import { getCollectionBySlug } from "@/lib/data/catalog";

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
      <section className="collection-detail-heading">
        <p className="eyebrow">REEVITA COLLECTION</p>
        <h1 className="display-xl mt-2">{collection.nameEn}</h1>
        <p className="lead mt-2">{collection.descriptionAr}</p>
      </section>
      {products.length > 0 ? (
        <CollectionProductGallery products={products} collectionName={collection.nameEn} />
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
