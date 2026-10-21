import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";
import { fragrances } from "@/lib/catalog";
import { getProductsByFragrance } from "@/lib/data/catalog";
import { ProductGrid } from "@/components/product/product-grid";
import { Reveal } from "@/components/ui/reveal";
import { blurForSlug } from "@/lib/images";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return fragrances.map((fragrance) => ({ slug: fragrance.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const fragrance = fragrances.find((item) => item.slug === slug);
  if (!fragrance) return { title: "المجموعة غير موجودة" };
  return {
    title: `مجموعة ${fragrance.nameAr} — ${fragrance.taglineAr}`,
    description: fragrance.descriptionAr,
    alternates: { canonical: `/collections/${fragrance.slug}` },
    openGraph: {
      title: `مجموعة ${fragrance.nameAr} | REEVITA`,
      description: fragrance.descriptionAr,
      images: [{ url: fragrance.image }],
    },
  };
}

export default async function CollectionPage({ params }: PageProps) {
  const { slug } = await params;
  const fragrance = fragrances.find((item) => item.slug === slug);
  if (!fragrance) notFound();

  const products = await getProductsByFragrance(fragrance.slug);
  const others = fragrances.filter(
    (item) => item.slug !== fragrance.slug && item.slug !== "botanical",
  );

  return (
    <div className="bg-ivory">
      <section
        className="relative overflow-hidden text-ivory"
        style={{ backgroundColor: fragrance.color }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.14),transparent_55%)]" aria-hidden />
        <div className="container-luxe relative grid items-center gap-10 py-14 md:grid-cols-2 md:py-20">
          <div>
            <nav aria-label="مسار التنقل" className="mb-6 text-[0.7rem] text-ivory/60">
              <Link href="/" className="hover:text-gold">
                الرئيسية
              </Link>
              <span className="mx-2 text-gold" aria-hidden>
                /
              </span>
              <Link href="/collections" className="hover:text-gold">
                المجموعات
              </Link>
              <span className="mx-2 text-gold" aria-hidden>
                /
              </span>
              <span className="text-ivory">{fragrance.nameAr}</span>
            </nav>
            <p className="eyebrow-plain text-[0.6rem]" style={{ color: fragrance.accent }}>
              {fragrance.nameEn.toUpperCase()} COLLECTION
            </p>
            <h1 className="display-hero mt-4 text-ivory">{fragrance.nameAr}</h1>
            <p className="latin mt-2 text-2xl italic" style={{ color: fragrance.accent }}>
              {fragrance.taglineAr}
            </p>
            <p className="mt-6 max-w-lg text-sm leading-8 text-ivory/75">{fragrance.descriptionAr}</p>

            <div className="mt-7 flex flex-wrap gap-2">
              {fragrance.notesAr.map((note) => (
                <span
                  key={note}
                  className="rounded-full border border-ivory/30 px-3.5 py-1.5 text-xs font-semibold text-ivory/85"
                >
                  {note}
                </span>
              ))}
            </div>
            <p className="mt-6 flex items-center gap-2 text-xs text-ivory/60">
              <Sparkles className="size-3.5" style={{ color: fragrance.accent }} aria-hidden />
              {fragrance.moodAr}
            </p>
          </div>

          <Reveal className="relative mx-auto w-full max-w-md">
            <div className="arch-frame relative aspect-[4/5] overflow-hidden border border-ivory/20 bg-black/10">
              <Image
                src={fragrance.image}
                alt={`مجموعة ${fragrance.nameAr}`}
                fill
                priority
                sizes="(max-width: 768px) 88vw, 40vw"
                placeholder="blur"
                blurDataURL={blurForSlug(fragrance.image.split("/").pop()?.replace(".webp", ""))}
                className="object-cover"
              />
            </div>
            <p className="mt-4 text-center text-[0.68rem] text-ivory/50">
              {products.length} منتجات ضمن هذه العائلة العطرية
            </p>
          </Reveal>
        </div>
      </section>

      <section className="container-luxe py-12 md:py-16">
        <div className="mb-9 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">THE COLLECTION</p>
            <h2 className="display-lg mt-3">منتجات {fragrance.nameAr}</h2>
          </div>
          <Link
            href="/shop"
            className="group inline-flex items-center gap-2 border-b border-plum/25 pb-1 text-sm font-bold text-plum transition-colors hover:text-gold-deep"
          >
            كل المنتجات
            <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" aria-hidden />
          </Link>
        </div>

        {products.length > 0 ? (
          <ProductGrid products={products} prioritizeFirst />
        ) : (
          <p className="rounded-2xl border border-line bg-white/60 px-6 py-16 text-center text-sm text-muted">
            منتجات هذه المجموعة قادمة قريبًا.
          </p>
        )}
      </section>

      <section className="border-t border-line bg-cream/50 py-14">
        <div className="container-luxe">
          <p className="eyebrow">EXPLORE MORE</p>
          <h2 className="display-lg mt-3">مجموعات أخرى قد تحبينها</h2>
          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            {others.map((other) => (
              <Link
                key={other.slug}
                href={`/collections/${other.slug}`}
                className="group flex items-center gap-4 rounded-2xl border border-line bg-white/70 p-4 transition-all hover:-translate-y-0.5 hover:shadow-card"
              >
                <div className="relative size-20 shrink-0 overflow-hidden rounded-xl">
                  <Image
                    src={other.image}
                    alt={other.nameAr}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-[0.6rem] font-bold tracking-[0.2em] text-gold-deep uppercase">
                    {other.nameEn}
                  </p>
                  <p className="mt-1 font-bold text-plum">مجموعة {other.nameAr}</p>
                  <p className="text-xs text-muted">{other.taglineAr}</p>
                </div>
                <ArrowLeft className="size-4 text-gold-deep transition-transform group-hover:-translate-x-1" aria-hidden />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
