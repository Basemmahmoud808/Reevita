import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Check,
  Clock,
  Leaf,
  PackageCheck,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";
import { getProductBySlug, getProducts } from "@/lib/data/catalog";
import { brand, getFragrance } from "@/lib/catalog";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductPurchase } from "@/components/product/product-purchase";
import { ProductGrid } from "@/components/product/product-grid";
import { Accordion } from "@/components/ui/accordion";
import { Rating } from "@/components/ui/rating";
import { Reveal } from "@/components/ui/reveal";
import { JsonLd } from "@/components/ui/json-ld";
import { formatEGP } from "@/lib/format";
import { siteUrl } from "@/lib/env";
import type { Product } from "@/lib/types";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "المنتج غير موجود" };
  return {
    title: `${product.nameAr} — ${product.size}`,
    description: product.shortAr,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title: `${product.nameAr} | REEVITA`,
      description: product.shortAr,
      type: "website",
      images: [{ url: product.images[0]?.url ?? "/images/og/reevita-og.jpg", alt: product.nameAr }],
    },
  };
}

function buildJsonLd(product: Product) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.nameAr,
    alternateName: product.nameEn,
    description: product.shortAr,
    sku: product.sku,
    image: product.images.map((image) => `${siteUrl}${image.url}`),
    brand: { "@type": "Brand", name: "REEVITA" },
    category: product.categoryNameAr,
    offers: {
      "@type": "Offer",
      url: `${siteUrl}/products/${product.slug}`,
      priceCurrency: "EGP",
      price: product.price,
      availability:
        product.stockStatus === "out_of_stock"
          ? "https://schema.org/OutOfStock"
          : "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: "REEVITA" },
    },
    ...(product.reviews > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.rating,
            reviewCount: product.reviews,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const allProducts = await getProducts();
  const siblings = allProducts.filter((item) => item.categorySlug === product.categorySlug);
  const related = allProducts
    .filter(
      (item) =>
        item.slug !== product.slug &&
        (item.fragranceSlug === product.fragranceSlug || item.categorySlug === product.categorySlug),
    )
    .slice(0, 4);
  const fragrance = getFragrance(product.fragranceSlug);

  const accordionItems = [
    {
      title: "الوصف الكامل",
      content: <p className="leading-8">{product.descriptionAr}</p>,
    },
    {
      title: "المكونات",
      content: (
        <div className="space-y-3">
          <p className="leading-8">{product.ingredientsAr}</p>
          <p className="flex items-start gap-2 rounded-xl bg-cream/70 p-3 text-[0.75rem] leading-6 text-plum">
            <Leaf className="mt-0.5 size-4 shrink-0 text-gold-deep" aria-hidden />
            تركيبات خالية من السلفات والبارابين. ننصح بإجراء اختبار حساسية على منطقة صغيرة من الجلد
            قبل الاستخدام الكامل.
          </p>
        </div>
      ),
    },
    {
      title: "طريقة الاستخدام",
      content: <p className="leading-8">{product.howToUseAr}</p>,
    },
    {
      title: "الشحن والاسترجاع",
      content: (
        <div className="space-y-2 leading-7">
          <p>شحن لكل محافظات مصر: ٥٠–١٠٠ ج.م حسب المحافظة، ومجاني فوق {formatEGP(brand.freeShippingThreshold)}.</p>
          <p>التوصيل من ١–٤ أيام عمل. الدفع عند الاستلام فقط.</p>
          <p>إمكانية الاسترجاع خلال {brand.returnWindowDays} يومًا للمنتجات غير المفتوحة.</p>
          <Link href="/policies/shipping" className="font-bold text-gold-deep hover:underline">
            تفاصيل سياسة الشحن
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="bg-ivory">
      <JsonLd data={buildJsonLd(product)} />

      <div className="container-luxe pt-7">
        <nav aria-label="مسار التنقل" className="text-[0.7rem] text-muted">
          <Link href="/" className="transition-colors hover:text-plum">
            الرئيسية
          </Link>
          <span className="mx-2 text-gold" aria-hidden>
            /
          </span>
          <Link href="/shop" className="transition-colors hover:text-plum">
            المتجر
          </Link>
          <span className="mx-2 text-gold" aria-hidden>
            /
          </span>
          <Link
            href={`/shop?category=${product.categorySlug}`}
            className="transition-colors hover:text-plum"
          >
            {product.categoryNameAr}
          </Link>
          <span className="mx-2 text-gold" aria-hidden>
            /
          </span>
          <span className="text-plum">{product.nameAr}</span>
        </nav>
      </div>

      <section className="container-luxe grid gap-10 py-8 lg:grid-cols-[1.02fr_1fr] lg:gap-14 lg:py-12">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <ProductGallery images={product.images} name={product.nameAr} slug={product.slug} />
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            {[
              { icon: Truck, label: "شحن لكل مصر" },
              { icon: ShieldCheck, label: "دفع عند الاستلام" },
              { icon: RotateCcw, label: "استرجاع ١٤ يوم" },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-line bg-white/60 px-2 py-3">
                <item.icon className="mx-auto size-4 text-gold-deep" aria-hidden />
                <p className="mt-1.5 text-[0.64rem] font-semibold text-muted">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="eyebrow text-[0.6rem]">
              {product.categoryNameAr} · {product.fragranceNameAr}
            </p>
            {product.badge && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-berry/10 px-3 py-1 text-[0.62rem] font-bold text-berry">
                <Sparkles className="size-3" aria-hidden />
                {product.badge}
              </span>
            )}
          </div>

          <h1 className="display-xl mt-3">{product.nameAr}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <Rating rating={product.rating} reviews={product.reviews} size="md" />
            <span className="text-[0.7rem] text-muted">·</span>
            <span className="text-[0.7rem] font-semibold text-muted">{product.size}</span>
            <span className="text-[0.7rem] text-muted">·</span>
            <span className="text-[0.7rem] font-semibold text-muted">{product.sku}</span>
          </div>

          <p className="mt-5 text-[0.95rem] leading-8 text-ink">{product.shortAr}</p>

          {siblings.length > 1 && (
            <div className="mt-6">
              <p className="label">اختاري الرائحة / النوع</p>
              <div className="flex flex-wrap gap-2">
                {siblings.map((sibling) => (
                  <Link
                    key={sibling.id}
                    href={`/products/${sibling.slug}`}
                    aria-current={sibling.slug === product.slug ? "page" : undefined}
                    className={
                      sibling.slug === product.slug
                        ? "rounded-full border border-plum bg-plum px-4 py-2 text-xs font-bold text-ivory"
                        : "rounded-full border border-line bg-white/70 px-4 py-2 text-xs font-bold text-plum transition-colors hover:border-gold"
                    }
                  >
                    {sibling.variantLabelAr ?? sibling.fragranceNameAr}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="mt-7 rounded-2xl border border-line bg-white/70 p-5">
            <ProductPurchase product={product} />
          </div>

          <ul className="mt-6 space-y-2.5">
            {product.benefits.map((benefit) => (
              <li key={benefit} className="flex items-start gap-2.5 text-sm text-ink">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-gold/15">
                  <Check className="size-3 text-gold-deep" aria-hidden />
                </span>
                {benefit}
              </li>
            ))}
          </ul>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <div className="flex items-start gap-3 rounded-xl border border-line bg-cream/50 p-3.5">
              <PackageCheck className="size-4.5 shrink-0 text-gold-deep" aria-hidden />
              <div>
                <p className="text-xs font-bold text-plum">توصيل سريع</p>
                <p className="text-[0.7rem] leading-5 text-muted">{brand.deliveryEstimateAr} لكل المحافظات</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-line bg-cream/50 p-3.5">
              <Clock className="size-4.5 shrink-0 text-gold-deep" aria-hidden />
              <div>
                <p className="text-xs font-bold text-plum">الدفع عند الاستلام</p>
                <p className="text-[0.7rem] leading-5 text-muted">افتحي الشحنة وادفعي بعد التأكد</p>
              </div>
            </div>
          </div>

          {fragrance && fragrance.slug !== "botanical" && (
            <Link
              href={`/collections/${fragrance.slug}`}
              className="mt-5 flex items-center justify-between rounded-xl border border-gold/30 bg-gold/5 px-4 py-3 transition-colors hover:bg-gold/10"
            >
              <span className="text-xs font-bold text-plum">
                اكتشفي مجموعة {fragrance.nameAr} كاملة
              </span>
              <span className="text-[0.65rem] text-gold-deep">{fragrance.taglineAr}</span>
            </Link>
          )}

          <Accordion items={accordionItems} className="mt-8" />
        </div>
      </section>

      {related.length > 0 && (
        <section className="border-t border-line bg-cream/40 py-14 md:py-20">
          <div className="container-luxe">
            <Reveal className="mb-9 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow">COMPLETE THE RITUAL</p>
                <h2 className="display-lg mt-3">أكملي طقسك</h2>
              </div>
              <Link href="/shop" className="text-sm font-bold text-plum transition-colors hover:text-gold-deep">
                كل المنتجات ←
              </Link>
            </Reveal>
            <ProductGrid products={related} />
          </div>
        </section>
      )}
    </div>
  );
}
