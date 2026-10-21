import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Droplets, Heart, Leaf, Quote, Sparkles, Star } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { ProductGrid } from "@/components/product/product-grid";
import { blurForSlug } from "@/lib/images";
import { brand, fragrances, testimonials } from "@/lib/catalog";
import { formatEGP } from "@/lib/format";
import type { Category, Product } from "@/lib/types";

export function Ticker() {
  const items = ["REEVITA", "BEAUTY", "CARE", "RENEW", "BODY", "HAIR", "SCENT", "EGYPT"];
  return (
    <section aria-label="REEVITA — Beauty, Care, Renew" className="overflow-hidden border-y border-gold/20 bg-plum py-3">
      <div className="ticker">
        {[0, 1].map((copy) => (
          <div
            key={copy}
            aria-hidden={copy === 1}
            className="flex shrink-0 items-center gap-8 pe-8 text-[0.68rem] font-semibold tracking-[0.42em] text-ivory/80 uppercase"
          >
            {items.map((item) => (
              <span key={`${copy}-${item}`} className="flex items-center gap-8">
                {item}
                <span className="text-gold" aria-hidden>
                  ✦
                </span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

export function CategoryStrip({ items }: { items: Category[] }) {
  return (
    <section className="section-pad bg-ivory">
      <div className="container-luxe">
        <SectionHeading
          eyebrow="SHOP BY RITUAL"
          title="تسوّقي حسب نوع طقسك"
          description="كل منتج في ريفيتا خطوة في طقس يومي كامل — من التنظيف إلى الترطيب إلى العطر."
          align="center"
          className="mb-12"
        />
        <div className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-5">
          {items.map((category, index) => (
            <Reveal key={category.slug} delay={index * 70} className="snap-start">
              <Link href={`/shop?category=${category.slug}`} className="group block">
                <div className="arch-frame relative aspect-[3/4] w-[62vw] max-w-[240px] overflow-hidden bg-cream sm:w-full">
                  <Image
                    src={category.image}
                    alt={category.nameAr}
                    fill
                    sizes="(max-width: 640px) 60vw, 20vw"
                    placeholder="blur"
                    blurDataURL={blurForSlug(category.image.split("/").pop()?.replace(".webp", ""))}
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-plum/70 via-plum/10 to-transparent" aria-hidden />
                  <div className="absolute inset-x-0 bottom-0 p-4 text-center">
                    <p className="text-sm font-bold text-ivory">{category.nameAr}</p>
                    <p className="mt-0.5 text-[0.62rem] tracking-[0.18em] text-gold uppercase">{category.nameEn}</p>
                  </div>
                </div>
                <p className="mt-3 hidden text-center text-[0.72rem] text-muted sm:block">{category.shortAr}</p>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Bestsellers({ products }: { products: Product[] }) {
  return (
    <section className="section-pad bg-cream/50">
      <div className="container-luxe">
        <SectionHeading
          eyebrow="THE MOST LOVED"
          title="الأكثر طلبًا في ريفيتا"
          description="المنتجات التي أعادت عميلاتنا شراءها مرارًا — روائح تدوم، ترطيب يلمس الفرق، وعناية تُشعرك بالرفاهية."
          action={{ href: "/shop", label: "كل المنتجات" }}
          className="mb-12"
        />
        <ProductGrid products={products} />
      </div>
    </section>
  );
}

export function CollectionEdit() {
  return (
    <section className="relative overflow-hidden bg-plum-deep py-20 md:py-28">
      <div className="pointer-events-none absolute -top-32 start-1/3 size-[460px] rounded-full bg-wine/30 blur-[120px]" aria-hidden />
      <div className="pointer-events-none absolute bottom-0 end-0 size-[360px] rounded-full bg-gold/10 blur-[100px]" aria-hidden />
      <div className="container-luxe relative">
        <SectionHeading
          eyebrow="SIGNATURE SCENTS"
          title="لكل مزاج… رائحة"
          description="ثلاث عائلات عطرية تختصر شخصيتك: كوين الملكية، سيكسي الدافئة، وروبي مسك الناعمة."
          align="center"
          tone="light"
          className="mb-12"
        />

        <div className="grid gap-5 md:grid-cols-3">
          {fragrances
            .filter((fragrance) => fragrance.slug !== "botanical")
            .map((fragrance, index) => (
              <Reveal key={fragrance.slug} delay={index * 100}>
                <Link
                  href={`/collections/${fragrance.slug}`}
                  className="group relative block overflow-hidden rounded-[1.5rem] border border-ivory/10"
                  style={{ backgroundColor: fragrance.color }}
                >
                  <div className="relative aspect-[4/5]">
                    <Image
                      src={fragrance.image}
                      alt={`مجموعة ${fragrance.nameAr}`}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      placeholder="blur"
                      blurDataURL={blurForSlug(fragrance.image.split("/").pop()?.replace(".webp", ""))}
                      className="object-cover opacity-90 transition-all duration-700 group-hover:scale-105 group-hover:opacity-100"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-plum-deep via-plum-deep/45 to-transparent" aria-hidden />
                  </div>
                  <div className="absolute inset-x-0 bottom-0 p-6 text-ivory">
                    <p className="eyebrow-plain text-[0.58rem]" style={{ color: fragrance.accent }}>
                      {fragrance.nameEn.toUpperCase()} COLLECTION
                    </p>
                    <h3 className="mt-2 text-3xl font-bold text-ivory">{fragrance.nameAr}</h3>
                    <p className="mt-1 text-sm text-ivory/70">{fragrance.taglineAr}</p>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {fragrance.notesAr.map((note) => (
                        <span
                          key={note}
                          className="rounded-full border border-ivory/25 px-2.5 py-1 text-[0.62rem] text-ivory/80"
                        >
                          {note}
                        </span>
                      ))}
                    </div>
                    <span className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-gold transition-transform group-hover:-translate-x-1">
                      اكتشفي المجموعة
                      <ArrowLeft className="size-3.5" aria-hidden />
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
        </div>
      </div>
    </section>
  );
}

export function BrandStory() {
  return (
    <section className="section-pad overflow-hidden bg-ivory">
      <div className="container-luxe grid items-center gap-14 lg:grid-cols-2">
        <Reveal className="relative order-2 lg:order-1">
          <div className="relative mx-auto aspect-[4/5] w-full max-w-[440px]">
            <div className="absolute inset-0 -translate-x-4 translate-y-4 rounded-[2rem] border border-gold/40" aria-hidden />
            <div className="relative h-full overflow-hidden rounded-[1.5rem] bg-cream shadow-luxe">
              <Image
                src="/images/products/body-butter-queen.webp"
                alt="زبدة الجسم كوين من ريفيتا"
                fill
                sizes="(max-width: 1024px) 88vw, 40vw"
                placeholder="blur"
                blurDataURL={blurForSlug("body-butter-queen")}
                className="object-cover"
              />
            </div>
            <div className="absolute -bottom-8 -end-4 hidden w-36 overflow-hidden rounded-2xl border-4 border-ivory shadow-card sm:block">
              <div className="relative aspect-[3/4]">
                <Image
                  src="/images/products/shampoo-aloe-vera.webp"
                  alt="شامبو ألوفيرا من ريفيتا"
                  fill
                  sizes="144px"
                  placeholder="blur"
                  blurDataURL={blurForSlug("shampoo-aloe-vera")}
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal className="order-1 lg:order-2" delay={120}>
          <p className="eyebrow">OUR STORY · قصتنا</p>
          <h2 className="display-xl mt-5">
            وُلدت ريفيتا من إيمان
            <br />
            أن الجمال <span className="text-gold-deep">طقس</span> لا رفاهية
          </h2>
          <p className="lead mt-6">
            بدأت الفكرة من رغبة بسيطة: منتجات عناية فاخرة تُصنع في مصر، بمكونات لطيفة على البشرة،
            وبأسعار تجعل الطقس اليومي متاحًا لكل امرأة. اليوم، كل عبوة ريفيتا تُملأ بعناية، وتُختبر
            إحساسًا قبل أن تُختبر جودة.
          </p>

          <ul className="mt-8 grid gap-5 sm:grid-cols-2">
            {[
              { icon: Leaf, title: "خلاصات نباتية", text: "زبدة الشيا، الألوفيرا، فيتامين E وخلاصات مختارة." },
              { icon: Droplets, title: "تركيبات لطيفة", text: "خالية من السلفات والبارابين، مناسبة للاستخدام اليومي." },
              { icon: Heart, title: "صُنع في مصر", text: "إنتاج مصري بمعايير جودة صارمة وعناية بكل تفصيلة." },
              { icon: Sparkles, title: "روائح تُروى", text: "عطور مصممة لتبقى معك — من الصباح حتى المساء." },
            ].map((value) => (
              <li key={value.title} className="flex gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-cream text-gold-deep">
                  <value.icon className="size-4.5" aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-bold text-plum">{value.title}</p>
                  <p className="mt-1 text-[0.78rem] leading-6 text-muted">{value.text}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link href="/about" className="btn btn-primary">
              اقرئي قصتنا
              <ArrowLeft className="size-4" aria-hidden />
            </Link>
            <p className="text-xs text-muted">
              أكثر من <span className="font-bold text-plum">1,200</span> تجربة جمال موثوقة
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function Ritual({ products }: { products: Product[] }) {
  const steps = [
    { title: "نظّفي", subtitle: "شامبو لطيف", slug: "shampoo-aloe-vera", icon: Droplets },
    { title: "غذّي", subtitle: "زبدة الجسم", slug: "body-butter-queen", icon: Leaf },
    { title: "عطّري", subtitle: "معطر أو سبراي", slug: "hair-mist-queen", icon: Sparkles },
  ];

  return (
    <section className="section-pad bg-cream/50">
      <div className="container-luxe">
        <SectionHeading
          eyebrow="THE REEVITA RITUAL"
          title="ثلاث خطوات… وطقس مكتمل"
          description="رتّبي طقسك اليومي بترتيب بسيط يعطي بشرتك وشعرك أقصى عناية."
          align="center"
          className="mb-12"
        />
        <div className="grid gap-5 md:grid-cols-3">
          {steps.map((step, index) => {
            const product = products.find((item) => item.slug === step.slug);
            return (
              <Reveal key={step.title} delay={index * 100}>
                <Link
                  href={product ? `/products/${product.slug}` : "/shop"}
                  className="group flex h-full flex-col overflow-hidden rounded-[1.35rem] border border-line bg-white/70 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-card"
                >
                  <div className="flex items-center justify-between">
                    <span className="latin text-3xl text-gold/70">0{index + 1}</span>
                    <span className="flex size-10 items-center justify-center rounded-full bg-cream text-gold-deep">
                      <step.icon className="size-4.5" aria-hidden />
                    </span>
                  </div>
                  <div className="relative mt-5 aspect-[16/10] overflow-hidden rounded-xl bg-cream">
                    {product && (
                      <Image
                        src={product.images[0]?.url ?? ""}
                        alt={product.nameAr}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        placeholder="blur"
                        blurDataURL={blurForSlug(product.slug)}
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    )}
                  </div>
                  <h3 className="display-lg mt-5 text-2xl">{step.title}</h3>
                  <p className="mt-1 text-sm text-muted">{step.subtitle}</p>
                  {product && (
                    <p className="mt-3 text-[0.78rem] font-bold text-plum">
                      {product.nameAr} · {formatEGP(product.price)}
                    </p>
                  )}
                  <span className="mt-auto inline-flex items-center gap-2 pt-4 text-xs font-bold text-gold-deep">
                    اكتشفي المنتج
                    <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-1" aria-hidden />
                  </span>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function Testimonials() {
  return (
    <section className="section-pad bg-ivory">
      <div className="container-luxe">
        <SectionHeading
          eyebrow="REAL REVIEWS"
          title="ماذا قالت عميلات ريفيتا؟"
          align="center"
          className="mb-12"
        />
        <div className="grid gap-5 md:grid-cols-3">
          {testimonials.map((testimonial, index) => {
            const product = productName(testimonial.product);
            return (
              <Reveal key={testimonial.name} delay={index * 100}>
                <figure className="flex h-full flex-col rounded-[1.35rem] border border-line bg-white/60 p-6">
                  <Quote className="size-7 text-gold/60" aria-hidden />
                  <blockquote className="mt-4 flex-1 text-[0.86rem] leading-8 text-ink">
                    “{testimonial.quote}”
                  </blockquote>
                  <div className="mt-5 flex items-center gap-1" aria-label={`تقييم ${testimonial.rating} من 5`}>
                    {Array.from({ length: testimonial.rating }).map((_, starIndex) => (
                      <Star key={starIndex} className="size-3.5 fill-gold text-gold" aria-hidden />
                    ))}
                  </div>
                  <figcaption className="mt-3 border-t border-line pt-3">
                    <p className="text-sm font-bold text-plum">{testimonial.name}</p>
                    <p className="text-[0.7rem] text-muted">
                      {testimonial.city}
                      {product ? ` — ${product}` : ""}
                    </p>
                  </figcaption>
                </figure>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function productName(slug: string): string | null {
  const map: Record<string, string> = {
    "body-lotion-queen": "لوشن الجسم كوين",
    "shampoo-aloe-vera": "شامبو ألوفيرا",
    "hair-mist-ruby-musk": "معطر الشعر روبي مسك",
  };
  return map[slug] ?? null;
}

export function GalleryStrip({ products }: { products: Product[] }) {
  const picks = ["hair-mist-queen", "body-splash-sexy", "body-butter-ruby-musk", "shampoo-blueberry", "body-lotion-sexy", "body-splash-queen"];
  const images = picks
    .map((slug) => products.find((product) => product.slug === slug))
    .filter((product): product is Product => Boolean(product));

  return (
    <section className="bg-cream/60 py-14">
      <div className="container-luxe mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">ON INSTAGRAM</p>
          <h2 className="display-lg mt-3">لحظات ريفيتا @reevita.eg</h2>
        </div>
        <a
          href={brand.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-2 border-b border-plum/25 pb-1 text-sm font-bold text-plum transition-colors hover:text-gold-deep"
        >
          تابعينا
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" aria-hidden />
        </a>
      </div>
      <div className="container-luxe">
        <div className="grid grid-cols-3 gap-2 sm:gap-3 md:grid-cols-6">
          {images.map((product) => (
            <Link
              key={product.slug}
              href={`/products/${product.slug}`}
              className="group relative aspect-square overflow-hidden rounded-xl bg-sand"
            >
              <Image
                src={product.images[0]?.url ?? ""}
                alt={product.nameAr}
                fill
                sizes="(max-width: 768px) 33vw, 16vw"
                placeholder="blur"
                blurDataURL={blurForSlug(product.slug)}
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <span className="absolute inset-0 flex items-center justify-center bg-plum/35 opacity-0 transition-opacity group-hover:opacity-100">
                <ArrowLeft className="size-5 text-ivory" aria-hidden />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ClosingCta() {
  return (
    <section className="section-pad bg-ivory">
      <div className="container-luxe">
        <Reveal className="relative overflow-hidden rounded-[2rem] border border-gold/30 bg-blush/60 px-6 py-14 text-center sm:px-14">
          <div className="pointer-events-none absolute -top-16 start-1/4 size-64 rounded-full bg-ivory/70 blur-3xl" aria-hidden />
          <div className="relative">
            <p className="eyebrow justify-center">THE PERFECT GIFT</p>
            <h2 className="display-xl mx-auto mt-5 max-w-2xl">
              هدية تُشبهها،
              <br className="sm:hidden" /> أو هدية لنفسك
            </h2>
            <p className="lead mx-auto mt-5 max-w-xl">
              اجمعي لوشن وزبدة الجسم من نفس العائلة العطرية، وأضيفي معطر الشعر — طقم ريفيتا الكامل
              يوصل بتغليف أنيق جاهز للإهداء.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/shop" className="btn btn-primary w-full sm:w-auto">
                ابدئي التسوق
                <ArrowLeft className="size-4" aria-hidden />
              </Link>
              <a
                href={`https://wa.me/${brand.whatsapp}?text=${encodeURIComponent("أهلًا ريفيتا، أريد مساعدة في اختيار الهدية")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline w-full sm:w-auto"
              >
                استشارة هدية على واتساب
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function ValueStrip() {
  const values = [
    { icon: Leaf, title: "سلفات فري", text: "تركيبات لطيفة على البشرة" },
    { icon: Droplets, title: "ترطيب يدوم", text: "زبدة الشيا وفيتامين E" },
    { icon: Sparkles, title: "روائح فاخرة", text: "تدوم من الصباح للمساء" },
    { icon: Heart, title: "صنع في مصر", text: "بجودة ومعايير صارمة" },
  ];
  return (
    <section className="border-y border-line/70 bg-ivory">
      <div className="container-luxe grid grid-cols-2 divide-x divide-line/70 py-8 md:grid-cols-4 rtl:divide-x-reverse">
        {values.map((value) => (
          <div key={value.title} className="flex items-center justify-center gap-3 px-3 py-3">
            <value.icon className="size-5 shrink-0 text-gold-deep" aria-hidden />
            <div>
              <p className="text-[0.8rem] font-bold text-plum">{value.title}</p>
              <p className="text-[0.66rem] text-muted">{value.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
