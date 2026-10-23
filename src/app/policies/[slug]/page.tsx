import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { brand } from "@/lib/catalog";
import { getPolicy, policies } from "@/lib/policies";

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return policies.map((policy) => ({ slug: policy.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const policy = getPolicy(slug);
  if (!policy) return { title: "سياسة غير موجودة", robots: { index: false, follow: false } };
  return { title: policy.title, description: policy.description, robots: { index: false, follow: true } };
}

export default async function PolicyPage({ params }: PageProps) {
  const { slug } = await params;
  const policy = getPolicy(slug);
  if (!policy) notFound();

  return (
    <div className="container-luxe max-w-2xl py-10 md:py-14">
      <p className="eyebrow">REEVITA POLICIES</p>
      <h1 className="display-xl mt-3">{policy.title}</h1>
      <p className="lead mt-3">{policy.description}</p>

      <p className="mt-6 rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 text-[0.75rem] leading-6 text-plum">
        هذه صياغة تشغيلية معتمدة على بيانات المتجر الحالية، وتخضع لمراجعة الإدارة القانونية قبل
        الإطلاق. لأي استفسار تواصلي معنا على <span dir="ltr">{brand.supportPhoneDisplay}</span>.
      </p>

      <div className="mt-8 space-y-8">
        {policy.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="display-md text-xl">{section.heading}</h2>
            <ul className="mt-3 space-y-2 text-sm leading-7 text-muted">
              {section.body.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <nav aria-label="صفحات السياسات" className="mt-10 flex flex-wrap gap-3 border-t border-line pt-6 text-xs">
        {policies.map((item) => (
          <Link key={item.slug} href={`/policies/${item.slug}`} className="font-bold text-gold-deep hover:underline">
            {item.title}
          </Link>
        ))}
      </nav>
    </div>
  );
}
