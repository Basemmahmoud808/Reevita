import type { Metadata } from "next";
import Link from "next/link";
import { Layers } from "lucide-react";
import { fragrances } from "@/lib/catalog";
import { getProductsByFragrance } from "@/lib/data/catalog";
import { siteUrl } from "@/lib/env";

export const metadata: Metadata = {
  title: "الكولكشنات — REEVITA",
  description: "كولكشنات ريفيتا العطرية: Sexy وQueen وRuby Musk — لوشن، زبدة جسم، سبليش ومعطر شعر.",
  alternates: { canonical: `${siteUrl}/collections` },
};

export default async function CollectionsPage() {
  const collections = await Promise.all(
    fragrances.map(async (fragrance) => ({
      fragrance,
      products: await getProductsByFragrance(fragrance.slug),
    })),
  );

  return (
    <div className="bg-ivory">
      <section className="border-b border-line/70 bg-cream/40 py-12 md:py-16">
        <div className="container-luxe">
          <p className="eyebrow">
            <Layers className="size-3.5" aria-hidden /> COLLECTIONS
          </p>
          <h1 className="display-xl mt-4">الكولكشنات العطرية</h1>
          <p className="lead mt-3 max-w-2xl">
            كل كولكشن هي عائلة عطرية واحدة بمنتجات متكاملة للجسم والشعر. المنتجات المعروضة في كل
            كولكشن هي بالضبط المنتجات التي يمكن إضافتها للسلة.
          </p>
        </div>
      </section>

      <section className="container-luxe grid gap-6 py-10 md:grid-cols-3 md:py-14">
        {collections.map(({ fragrance, products }) => (
          <Link
            key={fragrance.slug}
            href={`/collections/${fragrance.slug}`}
            className="group rounded-2xl border border-line bg-white/80 p-6 shadow-card transition-transform hover:-translate-y-0.5"
          >
            <p className="text-[0.62rem] font-bold tracking-[0.2em] text-gold-deep uppercase">
              {fragrance.nameEn}
            </p>
            <h2 className="display-md mt-2 text-xl">{fragrance.nameAr}</h2>
            <p className="mt-2 text-xs leading-6 text-muted">{fragrance.taglineAr}</p>
            <p className="mt-4 text-[0.7rem] font-bold text-plum">
              {products.length} منتجات — من {products[0] ? formatPrice(products) : "—"}
            </p>
            <span className="mt-3 inline-block text-xs font-bold text-gold-deep group-hover:underline">
              استعراض الكولكشن ←
            </span>
          </Link>
        ))}
      </section>
    </div>
  );
}

function formatPrice(products: { price: number }[]): string {
  const min = Math.min(...products.map((product) => product.price));
  return `${min} ج.م`;
}
