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
  const isSoftGlow = collection.slug === "soft-glow-bundle";

  return (
    <main className="container-luxe py-10 md:py-14">
      <Link href="/collections" className="text-sm font-bold text-muted hover:text-gold-deep">← All collections</Link>
      <div className="mt-8 grid items-start gap-8 lg:grid-cols-2">
        {collection.image ? (
          <div className={`relative overflow-hidden rounded-3xl bg-cream ${isSoftGlow ? "aspect-square max-w-[680px]" : "aspect-[4/3]"}`}>
            <Image src={collection.image} alt={`${collection.nameEn} — صورة المجموعة`} fill priority sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
          </div>
        ) : null}
        <section className="max-w-2xl" dir={isSoftGlow ? "rtl" : undefined}>
          <p className="eyebrow">{isSoftGlow ? "باقة عناية بالشعر" : "COLLECTION"}</p>
          <h1 className="display-xl mt-3">{isSoftGlow ? collection.nameAr : collection.nameEn}</h1>
          {isSoftGlow ? <p className="mt-2 text-sm font-semibold tracking-wide text-muted" dir="ltr">{collection.nameEn}</p> : null}
          <p className="lead mt-3">{collection.descriptionAr}</p>
          {products.length > 0 ? (
            <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-muted">
              <span>{products.reduce((total, item) => total + (collection.productQuantities?.[item.id] ?? 1), 0)} منتجات</span>
              <Price price={products.reduce((total, item) => total + item.price * (collection.productQuantities?.[item.id] ?? 1), 0)} size="sm" />
              <CollectionAddToBag purchaseReady={collection.purchaseReady} products={products} quantities={collection.productQuantities} />
            </div>
          ) : null}
        </section>
      </div>
      {products.length > 0 ? (
        <ProductGrid products={products} prioritizeFirst className="mt-10" />
      ) : (
        <section className="card-luxe mt-10 px-6 py-12 text-center" dir="rtl">
          <p className="eyebrow">قريبًا</p>
          <h2 className="display-md mt-2 text-xl">محتويات الباقة قيد التجهيز</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-muted">
            هنعلن عن المنتجات المتاحة هنا بعد تأكيد مكونات الباقة. المنتجات الظاهرة في المتجر لن تُضاف للمجموعة إلا بعد اعتمادها.
          </p>
        </section>
      )}
    </main>
  );
}
