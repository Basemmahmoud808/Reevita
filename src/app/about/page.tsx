import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Droplets, FlaskConical, Heart, Leaf, Sparkles } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { brand } from "@/lib/catalog";
import { blurForSlug } from "@/lib/images";

export const metadata: Metadata = {
  title: "قصتنا — عن ريفيتا",
  description:
    "قصة ريفيتا: علامة مصرية للعناية الفاخرة بالجسم والشعر، بتركيبات نباتية لطيفة وروائح تحكي قصتك.",
  alternates: { canonical: "/about" },
};

const values = [
  {
    icon: Leaf,
    title: "نباتي أولًا",
    text: "نبدأ من زبدة الشيا، الألوفيرا، زيت اللوز وفيتامين E — مكونات نعرف أثرها على البشرة.",
  },
  {
    icon: FlaskConical,
    title: "لطيف بلا تنازلات",
    text: "خالٍ من السلفات والبارابين. تركيبات مختبرة إحساسًا وفاعلية قبل أن تصل إليك.",
  },
  {
    icon: Heart,
    title: "صُنع في مصر",
    text: "إنتاج وتغليف محليان بمعايير صارمة، لندعم صناعة مصرية نفتخر بها.",
  },
  {
    icon: Sparkles,
    title: "رائحة تُروى",
    text: "عطور من تصميمنا: سيكسي، كوين، وروبي مسك — كل عائلة تحكي مزاجًا مختلفًا.",
  },
];

const ingredients = [
  { name: "زبدة الشيا", benefit: "ترطيب عميق وتغذية للبشرة الجافة" },
  { name: "الألوفيرا", benefit: "تهدئة الفروة والحفاظ على توازنها" },
  { name: "فيتامين E", benefit: "مضاد أكسدة يحمي نعومة البشرة" },
  { name: "زيت اللوز الحلو", benefit: "امتصاص سريع ونعومة حريرية" },
  { name: "البانثينول", benefit: "تقوية الشعر وترطيب أليافه" },
  { name: "خلاصة الورد", benefit: "عبير فاخر وإحساس بالرفاهية" },
];

export default function AboutPage() {
  return (
    <div className="bg-ivory">
      <section className="relative overflow-hidden border-b border-line/70 bg-cream/40 py-14 md:py-20">
        <div className="pointer-events-none absolute -top-20 end-1/4 size-80 rounded-full bg-blush/70 blur-[100px]" aria-hidden />
        <div className="container-luxe relative grid items-center gap-12 md:grid-cols-2">
          <div>
            <p className="eyebrow">OUR STORY</p>
            <h1 className="display-hero mt-5">
              جمالٌ يُصنع
              <br />
              <span className="text-gold-deep">بعناية مصرية</span>
            </h1>
            <p className="lead mt-6 max-w-lg">
              ريفيتا ليست مجرد مستحضرات عناية. هي دعوة لتحويل العناية اليومية إلى طقس صغير تشبهينه:
              رائحة تفتحين بها صباحك، ولمسة ترطبين بها يومك.
            </p>
            <div className="mt-7 flex gap-8">
              <div>
                <p className="text-2xl font-bold text-plum">{brand.launchYear}</p>
                <p className="text-[0.68rem] text-muted">سنة التأسيس</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-plum">14</p>
                <p className="text-[0.68rem] text-muted">منتجًا في المجموعة</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-plum">27</p>
                <p className="text-[0.68rem] text-muted">محافظة نصل إليها</p>
              </div>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute inset-0 translate-x-3 translate-y-3 rounded-[2rem] border border-gold/40" aria-hidden />
            <div className="relative aspect-[4/5] overflow-hidden rounded-[1.5rem]">
              <Image
                src="/images/products/body-lotion-queen.webp"
                alt="لوشن الجسم كوين من ريفيتا"
                fill
                priority
                sizes="(max-width: 768px) 88vw, 45vw"
                placeholder="blur"
                blurDataURL={blurForSlug("body-lotion-queen")}
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="section-pad">
        <div className="container-luxe grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <Reveal>
            <div className="relative aspect-[4/5] overflow-hidden rounded-[1.5rem] bg-cream">
              <Image
                src="/images/products/body-butter-ruby-musk.webp"
                alt="زبدة الجسم روبي مسك من ريفيتا"
                fill
                sizes="(max-width: 1024px) 88vw, 40vw"
                placeholder="blur"
                blurDataURL={blurForSlug("body-butter-ruby-musk")}
                className="object-cover"
              />
            </div>
          </Reveal>
          <Reveal delay={100} className="flex flex-col justify-center">
            <p className="eyebrow">FROM EGYPT, WITH CARE</p>
            <h2 className="display-xl mt-4">
              بدأنا بسؤال بسيط:
              <br />
              لماذا تكون العناية الفاخرة بعيدة؟
            </h2>
            <div className="mt-6 space-y-4 text-[0.95rem] leading-8 text-muted">
              <p>
                في عام {brand.launchYear}، قررنا أن نصنع عناية تستحق أن تكون جزءًا من يومك: تركيبات
                نباتية لطيفة، روائح مدروسة، وتغليف يليق برفوفك — بسعر عادل.
              </p>
              <p>
                عملنا مع مختصين في تركيب المستحضرات، واختبرنا كل قوام وكل رائحة مرات عديدة حتى وصلنا
                إلى توليفة ريفيتا: فخامة هادئة، وبساطة صادقة.
              </p>
              <p>
                اليوم، منتجاتنا تُصنع وتُغلّف في مصر، وتوصل إلى 27 محافظة. وكل طلب يحمل معه نفس الوعد:
                جودة تشعرين بها، وعناية تستحقينها.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-cream/50 py-16 md:py-20">
        <div className="container-luxe">
          <SectionHeading
            eyebrow="WHAT WE STAND FOR"
            title="مبادئنا الأربعة"
            align="center"
            className="mb-12"
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value, index) => (
              <Reveal key={value.title} delay={index * 80}>
                <div className="flex h-full flex-col rounded-2xl border border-line bg-white/70 p-6">
                  <span className="flex size-11 items-center justify-center rounded-full bg-cream text-gold-deep">
                    <value.icon className="size-5" aria-hidden />
                  </span>
                  <h3 className="display-md mt-4 text-lg">{value.title}</h3>
                  <p className="mt-2 text-[0.8rem] leading-7 text-muted">{value.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad" id="ingredients">
        <div className="container-luxe">
          <SectionHeading
            eyebrow="KEY INGREDIENTS"
            title="مكونات نعرف قصتها"
            description="نختار كل مكوّن لسبب واضح، ونكتب لك ما يفعله بصراحة."
            className="mb-10"
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ingredients.map((ingredient, index) => (
              <Reveal key={ingredient.name} delay={index * 60}>
                <div className="flex items-start gap-3 rounded-xl border border-line bg-white/60 p-4">
                  <Leaf className="mt-0.5 size-4 shrink-0 text-gold-deep" aria-hidden />
                  <div>
                    <p className="text-sm font-bold text-plum">{ingredient.name}</p>
                    <p className="mt-0.5 text-[0.72rem] leading-6 text-muted">{ingredient.benefit}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-plum-deep py-16 text-ivory md:py-20">
        <div className="pointer-events-none absolute -bottom-24 end-1/3 size-80 rounded-full bg-wine/30 blur-[110px]" aria-hidden />
        <div className="container-luxe relative flex flex-col items-center text-center">
          <Droplets className="size-8 text-gold" aria-hidden />
          <h2 className="display-xl mt-5 text-ivory">جرّبي طقس ريفيتا</h2>
          <p className="mt-3 max-w-xl text-sm leading-8 text-ivory/70">
            ابدئي بمنتج واحد، وسترين الفرق في ملمس بشرتك ورائحتك. كل ما تحتاجينه هو خطوة صغيرة نحو عناية
            تستحقينها.
          </p>
          <Link href="/shop" className="btn btn-gold mt-8">
            تسوّقي المجموعة
            <ArrowLeft className="size-4" aria-hidden />
          </Link>
        </div>
      </section>
    </div>
  );
}
