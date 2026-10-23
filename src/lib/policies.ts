import { brand } from "@/lib/catalog";
import { formatEGP } from "@/lib/format";

export interface PolicySection {
  heading: string;
  body: string[];
}

export interface PolicyPage {
  slug: string;
  title: string;
  description: string;
  sections: PolicySection[];
}

/**
 * Operational policy copy. Every number here comes from the configured catalogue
 * (COD fee, delivery window, free-shipping threshold, return window) — nothing is
 * drafted for legal effect. The banner on each page states that the merchant must
 * review these texts before launch; see docs/OWNER_INPUTS.md.
 */
export const policies: PolicyPage[] = [
  {
    slug: "shipping",
    title: "الشحن والتوصيل",
    description: "مواعيد التوصيل والتكلفة داخل مصر.",
    sections: [
      {
        heading: "نطاق التوصيل",
        body: ["نوصّل داخل جميع محافظات مصر فقط. الطلبات خارج مصر غير مدعومة حاليًا."],
      },
      {
        heading: "مدة التوصيل",
        body: [`المدة التقديرية للتوصيل: ${brand.deliveryEstimateAr} من تأكيد الطلب.`],
      },
      {
        heading: "تكلفة الشحن",
        body: [
          `تُحسب تكلفة الشحن حسب المحافظة وتظهر في صفحة إتمام الطلب قبل التأكيد.`,
          `الشحن مجاني للطلبات التي تبلغ ${formatEGP(brand.freeShippingThreshold)} أو أكثر.`,
        ],
      },
    ],
  },
  {
    slug: "returns",
    title: "الاسترجاع والاستبدال",
    description: "شروط الاسترجاع خلال المدة المعلنة.",
    sections: [
      {
        heading: "مدة الاسترجاع",
        body: [`يمكن طلب الاسترجاع خلال ${brand.returnWindowDays} يومًا من استلام الطلب.`],
      },
      {
        heading: "حالة المنتج",
        body: [
          "يجب أن يكون المنتج في عبوته الأصلية غير مفتوح وغير مستخدم.",
          "لا يمكن استرجاع المنتجات المفتوحة أو المستخدمة.",
        ],
      },
      {
        heading: "كيف أطلب استرجاعًا؟",
        body: [
          `تواصلي معنا على ${brand.supportPhoneDisplay} أو ${brand.email} مع رقم الطلب.`,
          "سيتم تأكيد الإجراء وتفاصيل الاستلام معك عبر الهاتف.",
        ],
      },
    ],
  },
  {
    slug: "terms",
    title: "الشروط والأحكام",
    description: "شروط إتمام الطلب والدفع عند الاستلام.",
    sections: [
      {
        heading: "الطلبات",
        body: [
          "يتم تأكيد كل طلب هاتفيًا قبل الشحن.",
          "تحتفظ REEVITA بحق إلغاء أي طلب لا يمكن تأكيده أو توصيله.",
        ],
      },
      {
        heading: "الدفع",
        body: [
          "الدفع عند الاستلام (Cash on Delivery) فقط. لا يتم تحصيل أي مبالغ عبر الإنترنت.",
          brand.codFee > 0
            ? `تُضاف رسوم الدفع عند الاستلام وقيمتها ${formatEGP(brand.codFee)} إلى إجمالي الطلب.`
            : "لا توجد رسوم إضافية للدفع عند الاستلام.",
          "جميع الأسعار معروضة بالجنيه المصري (EGP).",
        ],
      },
    ],
  },
  {
    slug: "privacy",
    title: "الخصوصية",
    description: "البيانات التي نجمعها وكيفية استخدامها.",
    sections: [
      {
        heading: "البيانات التي نجمعها",
        body: [
          "الاسم ورقم الهاتف والعنوان والمحافظة لتوصيل الطلب.",
          "البريد الإلكتروني اختياري ويُستخدم للتواصل وتأكيد الطلب فقط.",
          "لا نجمع بيانات بطاقات الدفع لأن الدفع يتم عند الاستلام.",
        ],
      },
      {
        heading: "الاستخدام والإفصاح",
        body: [
          "تُستخدم البيانات لتنفيذ الطلب والتواصل بشأنه فقط.",
          "لا نبيع بيانات العملاء. قد تُشارك بيانات التوصيل مع شركة الشحن لتسليم الطلب.",
        ],
      },
      {
        heading: "التواصل",
        body: [`لطلب الوصول إلى بياناتك أو تصحيحها أو حذفها تواصلي معنا على ${brand.email}.`],
      },
    ],
  },
];

export function getPolicy(slug: string): PolicyPage | null {
  return policies.find((policy) => policy.slug === slug) ?? null;
}
