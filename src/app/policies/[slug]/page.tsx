import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { brand } from "@/lib/catalog";
import { formatEGP } from "@/lib/format";

interface PolicySection {
  heading: string;
  paragraphs?: string[];
  list?: string[];
  table?: { headers: string[]; rows: string[][] };
}

interface Policy {
  slug: string;
  title: string;
  intro: string;
  updated: string;
  sections: PolicySection[];
}

const policies: Policy[] = [
  {
    slug: "shipping",
    title: "سياسة الشحن والتوصيل",
    intro:
      "نشحن إلى جميع محافظات مصر الـ 27 عبر شركاء شحن موثوقين. يمكنك الدفع نقدًا عند الاستلام — لا حاجة لأي دفع مقدم.",
    updated: "أكتوبر 2026",
    sections: [
      {
        heading: "رسوم الشحن",
        paragraphs: ["تُحسب رسوم الشحن حسب المحافظة، وتظهر تلقائيًا عند إتمام الطلب:"],
        table: {
          headers: ["المنطقة", "رسوم الشحن", "مدة التوصيل"],
          rows: [
            ["القاهرة، الجيزة، القليوبية، الإسكندرية", formatEGP(50), "١–٢ يوم عمل"],
            ["الدلتا والقناة", formatEGP(65), "٢–٣ أيام عمل"],
            ["الصعيد والفيوم", formatEGP(80), "٣–٤ أيام عمل"],
            ["المحافظات الحدودية", formatEGP(100), "٤–٦ أيام عمل"],
          ],
        },
      },
      {
        heading: "الشحن المجاني",
        list: [
          `شحن مجاني للطلبات من ${formatEGP(1000)} فأكثر في القاهرة والجيزة والإسكندرية والدلتا والقناة.`,
          `شحن مجاني من ${formatEGP(1200)} لمحافظات الصعيد، ومن ${formatEGP(1500)} للمحافظات الحدودية.`,
          "يُحسب الشحن المجاني على قيمة المنتجات قبل أي خصومات شحن.",
        ],
      },
      {
        heading: "مدة التوصيل",
        paragraphs: [
          "تبدأ مدة التوصيل من يوم العمل التالي لتأكيد الطلب هاتفيًا. الطلبات المقدمة في عطلات نهاية الأسبوع أو الأعياد تُعالج في أول يوم عمل.",
          "سيتواصل معك مندوب الشحن قبل التسليم. يرجى التأكد من صحة رقم الهاتف والعنوان لتفادي تأخير الشحنة.",
        ],
      },
      {
        heading: "الدفع عند الاستلام",
        paragraphs: [
          "الدفع نقدًا للمندوب عند استلام الشحنة. يمكنك فتح الشحنة والتأكد من المنتجات قبل السداد.",
          "لا نطلب أي بيانات بطاقة بنكية، ولا يتم تحصيل أي مبالغ مسبقًا.",
        ],
      },
    ],
  },
  {
    slug: "returns",
    title: "سياسة الاستبدال والاسترجاع",
    intro: `نريدك أن تكوني سعيدة بكل منتج من ريفيتا. يمكنك طلب الاسترجاع خلال ${brand.returnWindowDays} يومًا من الاستلام وفق الشروط التالية.`,
    updated: "أكتوبر 2026",
    sections: [
      {
        heading: "شروط الاسترجاع",
        list: [
          "أن يكون المنتج غير مفتوح وغير مستخدم وبحالته الأصلية.",
          "أن يكون التغليف الخارجي سليمًا مع الملصقات الأصلية.",
          "تقديم إثبات الشراء (رقم الطلب) خلال ١٤ يومًا من الاستلام.",
          "لا يمكن استرجاع المنتجات المفتوحة لأسباب صحية، إلا في حالة وجود عيب أو خطأ في الشحنة.",
        ],
      },
      {
        heading: "كيفية طلب الاسترجاع",
        list: [
          "تواصلي معنا على واتساب مع رقم الطلب وصور للمنتج والتغليف.",
          "سيراجع الفريق الطلب خلال ٤٨ ساعة عمل ويوافيك بطريقة إعادة الشحنة.",
          "بعد استلام المنتج وفحصه، يُسترد المبلغ خلال ٥–٧ أيام عمل.",
        ],
      },
      {
        heading: "طريقة استرداد المبلغ",
        paragraphs: [
          "لأن الدفع يتم عند الاستلام، يتم الاسترداد عبر محفظة إلكترونية (فودافون كاش / إنستاباي) أو تحويل بنكي. لا توجد رسوم استرداد في حالات العيب أو الخطأ من طرفنا.",
          "في حالة الاسترجاع لسبب غير عيب المنتج، قد تُخصم تكاليف شحن الإرجاع من المبلغ المسترد.",
        ],
      },
    ],
  },
  {
    slug: "privacy",
    title: "سياسة الخصوصية",
    intro:
      "خصوصيتك أمانة. نوضح هنا ما نجمعه من بيانات، وكيف نستخدمه ونحميه عند تسوقك من ريفيتا.",
    updated: "أكتوبر 2026",
    sections: [
      {
        heading: "البيانات التي نجمعها",
        list: [
          "بيانات الطلب: الاسم، رقم الهاتف، البريد (اختياري)، المحافظة، والعنوان التفصيلي.",
          "بيانات الحساب (إن أنشأت حسابًا): البريد الإلكتروني، الاسم، ورقم الهاتف.",
          "بيانات تقنية محدودة: عنوان IP لأغراض الحماية من الطلبات الوهمية.",
        ],
      },
      {
        heading: "كيف نستخدم البيانات",
        list: [
          "تجهيز الطلب والتواصل معك بخصوص الشحن والاستلام.",
          "تحسين تجربة التسوق والرد على استفساراتك.",
          "حماية المتجر من الاحتيال والطلبات الوهمية.",
          "إرسال العروض فقط إذا اشتركت في القائمة البريدية (ويمكنك إلغاء الاشتراك في أي وقت).",
        ],
      },
      {
        heading: "تخزين البيانات وحمايتها",
        list: [
          "تُخزَّن البيانات في قاعدة بيانات Supabase محمية بسياسات Row Level Security صارمة.",
          "لا يمكن لأي زائر أو عميل الوصول إلى بيانات طلبات عميل آخر.",
          "كلمات المرور تُشفَّر ولا تُخزَّن كنص صريح.",
          "لا نخزن أي بيانات بطاقات بنكية لأننا لا نستخدم الدفع الإلكتروني بالبطاقات حاليًا.",
        ],
      },
      {
        heading: "حقوقك",
        list: [
          "الاطلاع على بياناتك أو تصحيحها أو طلب حذفها.",
          "إلغاء الاشتراك في الرسائل التسويقية في أي وقت.",
          "التواصل معنا عبر البريد الرسمي لأي استفسار يتعلق بالخصوصية.",
        ],
      },
    ],
  },
  {
    slug: "terms",
    title: "الشروط والأحكام",
    intro:
      "باستخدامك موقع ريفيتا أو إتمام طلب، فإنك توافقين على الشروط الموضحة أدناه. نرجو قراءتها بعناية.",
    updated: "أكتوبر 2026",
    sections: [
      {
        heading: "الطلبات والأسعار",
        list: [
          "جميع الأسعار بالجنيه المصري وتشمل رسوم الشحن المذكورة عند إتمام الطلب.",
          "يجب تأكيد الطلب هاتفيًا قبل التجهيز، وقد نلغي الطلبات غير المؤكدة بعد ٤٨ ساعة.",
          "نحتفظ بحق رفض أو إلغاء أي طلب في حالة وجود خطأ سعري أو مخزون أو اشتباه في الاحتيال.",
        ],
      },
      {
        heading: "الدفع",
        paragraphs: [
          "الدفع متاح عند الاستلام فقط داخل مصر حاليًا. لا يتم طلب أي بيانات بطاقة بنكية.",
          "في حال رفض الاستلام أكثر من مرة، قد يتم تقييد رقم الهاتف من إنشاء طلبات جديدة.",
        ],
      },
      {
        heading: "المحتوى والملكية الفكرية",
        paragraphs: [
          "جميع الصور والنصوص والعلامات التجارية الخاصة بريفيتا مملوكة للمتجر، ولا يجوز استخدامها تجاريًا دون إذن مكتوب.",
        ],
      },
      {
        heading: "المسؤولية والقانون",
        paragraphs: [
          "نبذل أقصى جهد لضمان دقة المعلومات والصور، وقد تختلف الألوان قليلًا حسب الشاشة.",
          "المستحضرات مخصصة للاستخدام الخارجي فقط. في حال وجود حساسية، يرجى اختبار المنتج على منطقة صغيرة أو استشارة طبيب الجلدية.",
          "تخضع هذه الشروط لأحكام القوانين المعمول بها في جمهورية مصر العربية.",
        ],
      },
    ],
  },
];

export function generateStaticParams() {
  return policies.map((policy) => ({ slug: policy.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const policy = policies.find((item) => item.slug === slug);
  if (!policy) return { title: "الصفحة غير موجودة" };
  return {
    title: policy.title,
    description: policy.intro,
    alternates: { canonical: `/policies/${policy.slug}` },
  };
}

export default async function PolicyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const policy = policies.find((item) => item.slug === slug);
  if (!policy) notFound();

  return (
    <div className="bg-ivory">
      <section className="border-b border-line/70 bg-cream/50 py-12 md:py-16">
        <div className="container-luxe max-w-3xl">
          <nav aria-label="مسار التنقل" className="mb-4 text-[0.7rem] text-muted">
            <Link href="/" className="hover:text-plum">
              الرئيسية
            </Link>
            <span className="mx-2 text-gold" aria-hidden>
              /
            </span>
            <span className="text-plum">{policy.title}</span>
          </nav>
          <p className="eyebrow">LEGAL · REEVITA</p>
          <h1 className="display-xl mt-4">{policy.title}</h1>
          <p className="lead mt-4">{policy.intro}</p>
          <p className="mt-4 text-[0.68rem] text-muted">آخر تحديث: {policy.updated}</p>
        </div>
      </section>

      <article className="container-luxe max-w-3xl py-10 md:py-14">
        <div className="space-y-10">
          {policy.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="display-lg text-2xl">{section.heading}</h2>
              {section.paragraphs?.map((paragraph) => (
                <p key={paragraph} className="mt-3 text-[0.9rem] leading-9 text-muted">
                  {paragraph}
                </p>
              ))}
              {section.list && (
                <ul className="mt-4 space-y-2.5">
                  {section.list.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-[0.88rem] leading-8 text-ink">
                      <span className="mt-3 size-1.5 shrink-0 rounded-full bg-gold" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
              )}
              {section.table && (
                <div className="mt-4 overflow-x-auto rounded-xl border border-line">
                  <table className="w-full text-sm">
                    <thead className="bg-cream/70">
                      <tr>
                        {section.table.headers.map((header) => (
                          <th key={header} className="px-4 py-3 text-start text-[0.72rem] font-bold text-plum">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {section.table.rows.map((row) => (
                        <tr key={row.join("-")} className="border-t border-line">
                          {row.map((cell, index) => (
                            <td key={`${cell}-${index}`} className="px-4 py-3 text-[0.78rem] text-muted">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-line bg-white/60 p-6 text-center">
          <p className="text-sm font-bold text-plum">لديك سؤال بخصوص هذه السياسة؟</p>
          <p className="mt-1 text-xs text-muted">تواصلي معنا على {brand.email}</p>
          <Link href="/contact" className="btn btn-outline mt-4">
            تواصلي معنا
          </Link>
        </div>
      </article>
    </div>
  );
}
