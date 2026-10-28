import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ProductGrid } from "@/components/product/product-grid";
import { getFragrance } from "@/lib/catalog";
import { getProductsByFragrance } from "@/lib/data/catalog";
import { siteUrl } from "@/lib/env";

export const metadata: Metadata = {
  title: "كولكشن عطري — REEVITA",
  robots: { index: false, follow: true },
};

type CollectionPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: CollectionPageProps): Promise<Metadata> {
  const { slug } = await params;
  const fragrance = getFragrance(slug);
  if (!fragrance) return { title: "الكولكشن غير موجود", robots: { index: false, follow: false } };
  return {
    title: `${fragrance.nameAr} — REEVITA`,
    description: fragrance.descriptionAr.slice(0, 160),
    alternates: { canonical: `${siteUrl}/collections/${fragrance.slug}` },
  };
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { slug } = await params;
  const fragrance = getFragrance(slug);
  if (!fragrance) notFound();

  // Collection membership is derived from the catalogue itself, not from a
  // client-supplied list: the grid and the cart always reference the same
  // product IDs and server-side prices.
  const products = await getProductsByFragrance(fragrance.slug);

  return (
    <div className="bg-ivory">
      <section className="border-b border-line/70 bg-cream/40 py-12 md:py-16">
        <div className="container-luxe">
          <Link href="/collections" className="inline-flex items-center gap-1.5 text-xs font-bold text-gold-deep hover:underline">
            <ArrowLeft className="size-3.5" aria-hidden /> كل الكولكشنات
          </Link>
          <p className="eyebrow mt-4">{fragrance.nameEn}</p>
          <h1 className="display-xl mt-3">{fragrance.nameAr}</h1>
          <p className="lead mt-3 max-w-2xl">{fragrance.descriptionAr}</p>
          <ul className="mt-5 flex flex-wrap gap-2">
            {fragrance.notesAr.map((note) => (
              <li key={note} className="rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-[0.68rem] font-semibold text-plum">
                {note}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="container-luxe py-10 md:py-14">
        {products.length > 0 ? (
          <ProductGrid products={products} prioritizeFirst />
        ) : (
          <p className="text-sm text-muted">لا توجد منتجات متاحة في هذا الكولكشن حاليًا.</p>
        )}
      </section>
    </div>
  );
}
