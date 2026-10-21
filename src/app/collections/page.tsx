import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { fragrances } from "@/lib/catalog";
import { Reveal } from "@/components/ui/reveal";
import { blurForSlug } from "@/lib/images";

export const metadata: Metadata = {
  title: "مجموعات العطور — سيكسي، كوين، روبي مسك",
  description: "اكتشفي ثلاث عائلات عطرية من ريفيتا: كوين الملكية، سيكسي الدافئة، وروبي مسك الناعمة.",
  alternates: { canonical: "/collections" },
};

export default function CollectionsPage() {
  return (
    <div className="bg-ivory">
      <section className="border-b border-line/70 bg-cream/50 py-14 md:py-20">
        <div className="container-luxe">
          <p className="eyebrow">SIGNATURE COLLECTIONS</p>
          <h1 className="display-xl mt-4">لكل مزاج… رائحة</h1>
          <p className="lead mt-4 max-w-2xl">
            ثلاث عائلات عطرية تصمم شخصيتك: حضور ملكي، دفء أنثوي، أو نعومة مخملية. اختاري ما يشبهك،
            وابنِ طقسك الكامل من نفس العائلة.
          </p>
        </div>
      </section>

      <section className="container-luxe grid gap-6 py-12 md:py-16">
        {fragrances
          .filter((fragrance) => fragrance.slug !== "botanical")
          .map((fragrance, index) => (
            <Reveal key={fragrance.slug} delay={index * 80}>
              <Link
                href={`/collections/${fragrance.slug}`}
                className="group grid overflow-hidden rounded-[1.5rem] border border-line bg-white/60 md:grid-cols-[1.1fr_1fr]"
              >
                <div className="relative aspect-[16/10] md:aspect-auto md:min-h-[340px]">
                  <Image
                    src={fragrance.image}
                    alt={`مجموعة ${fragrance.nameAr}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 55vw"
                    placeholder="blur"
                    blurDataURL={blurForSlug(fragrance.image.split("/").pop()?.replace(".webp", ""))}
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-plum/50 to-transparent md:bg-gradient-to-l" aria-hidden />
                  <span
                    className="absolute top-4 start-4 rounded-full px-3 py-1.5 text-[0.6rem] font-bold text-ivory"
                    style={{ backgroundColor: fragrance.color }}
                  >
                    {fragrance.nameEn.toUpperCase()}
                  </span>
                </div>
                <div className="flex flex-col justify-center p-7 md:p-10">
                  <p className="eyebrow-plain text-[0.58rem] text-gold-deep">{fragrance.moodAr}</p>
                  <h2 className="display-lg mt-3 text-3xl">{fragrance.nameAr}</h2>
                  <p className="mt-2 text-sm font-semibold text-berry">{fragrance.taglineAr}</p>
                  <p className="mt-4 text-sm leading-8 text-muted">{fragrance.descriptionAr}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {fragrance.notesAr.map((note) => (
                      <span
                        key={note}
                        className="rounded-full border border-line px-3 py-1 text-[0.68rem] font-semibold text-plum"
                      >
                        {note}
                      </span>
                    ))}
                  </div>
                  <span className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-plum transition-transform group-hover:-translate-x-1">
                    اكتشفي المجموعة
                    <ArrowLeft className="size-4 text-gold-deep" aria-hidden />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
      </section>
    </div>
  );
}
