"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Locale = "en" | "ar";

const dictionary = {
  en: {
    shop: "Shop",
    collections: "Collections",
    bodyCare: "Body Care",
    hairCare: "Hair Care",
    ourStory: "Our Story",
    trackOrder: "Track Order",
    shopNow: "Shop now",
    account: "Account",
    searchStore: "Search the store",
    closeSearch: "Close search",
    searchReevita: "Search REEVITA",
    searchPlaceholder: "Search lotion, shampoo, scent...",
    search: "Search",
    cart: "Shopping bag",
    closeMenu: "Close menu",
    openMenu: "Open menu",
    language: "العربية",
    freeShipping: "Free shipping over EGP 1,000",
    cashOnDelivery: "Cash on delivery across Egypt",
    delivery: "Delivery in 1–4 business days",
    contact: "Contact us",
    craftedInEgypt: "Crafted in Egypt",
    beautyCareRenew: "BEAUTY · CARE · RENEW",
    shopByRitual: "SHOP BY RITUAL",
    shopByType: "Shop by ritual",
    ritualDescription: "Thoughtfully made essentials for every step of your daily care ritual.",
    mostLoved: "THE MOST LOVED",
    bestsellers: "Bestsellers",
    bestsellersDescription: "Customer favourites made to bring a little more care to every day.",
    allProducts: "View all products",
    signatureScents: "SIGNATURE SCENTS",
    scentsTitle: "A scent for every mood",
    scentsDescription: "Discover refined fragrance families designed to become part of your signature.",
    exploreCollection: "Explore collection",
    bestseller: "Bestseller",
    new: "New",
    outOfStock: "Out of stock",
    limitedStock: "Limited stock",
    addToCart: "Add to bag",
    details: "View details",
    rating: "Rated",
    madeInEgypt: "Made with care in Egypt",
    allRights: "All rights reserved.",
    shippingPolicy: "Shipping & delivery",
    returnsPolicy: "Returns & exchanges",
    privacyPolicy: "Privacy policy",
    termsPolicy: "Terms & conditions",
    joinWorld: "Join the REEVITA world",
    newsletter: "Exclusive offers, care notes and new launches — straight to your inbox.",
    shopLinks: "Shop",
    reevitaLinks: "REEVITA",
    skip: "Skip to main content",
    menuShopByType: "Shop by category",
    noRisk: "No-risk checkout",
  },
  ar: {
    shop: "المتجر",
    collections: "العطور",
    bodyCare: "العناية بالجسم",
    hairCare: "العناية بالشعر",
    ourStory: "قصتنا",
    trackOrder: "تتبّع الطلب",
    shopNow: "تسوّقي الآن",
    account: "حسابي",
    searchStore: "البحث في المتجر",
    closeSearch: "إغلاق البحث",
    searchReevita: "ابحثي في ريفيتا",
    searchPlaceholder: "ابحثي عن لوشن، شامبو، عطر...",
    search: "بحث",
    cart: "سلة المشتريات",
    closeMenu: "إغلاق القائمة",
    openMenu: "فتح القائمة",
    language: "English",
    freeShipping: "شحن مجاني فوق 1,000 ج.م",
    cashOnDelivery: "الدفع عند الاستلام في كل محافظات مصر",
    delivery: "توصيل سريع ١–٤ أيام عمل",
    contact: "تواصلي معنا",
    craftedInEgypt: "صُنع بعناية في مصر",
    beautyCareRenew: "جمال · عناية · تجدّد",
    shopByRitual: "تسوّقي حسب نوع طقسك",
    shopByType: "تسوّقي حسب النوع",
    ritualDescription: "كل منتج خطوة في طقس يومي متكامل للعناية والجمال.",
    mostLoved: "الأكثر طلبًا",
    bestsellers: "الأكثر مبيعًا",
    bestsellersDescription: "منتجات أعادت عميلاتنا شراءها مرارًا.",
    allProducts: "كل المنتجات",
    signatureScents: "العطور المميزة",
    scentsTitle: "لكل مزاج رائحة",
    scentsDescription: "اكتشفي عائلات عطرية مصممة لتصبح جزءًا من حضورك.",
    exploreCollection: "اكتشفي المجموعة",
    bestseller: "الأكثر مبيعًا",
    new: "جديد",
    outOfStock: "نفد المخزون",
    limitedStock: "كمية محدودة",
    addToCart: "أضيفي للسلة",
    details: "عرض التفاصيل",
    rating: "التقييم",
    madeInEgypt: "صُنع بعناية في مصر",
    allRights: "جميع الحقوق محفوظة.",
    shippingPolicy: "الشحن والتوصيل",
    returnsPolicy: "الاستبدال والاسترجاع",
    privacyPolicy: "سياسة الخصوصية",
    termsPolicy: "الشروط والأحكام",
    joinWorld: "انضمي إلى عالم ريفيتا",
    newsletter: "عروض حصرية ونصائح عناية وإطلاقات جديدة إلى بريدك.",
    shopLinks: "تسوّقي",
    reevitaLinks: "ريفيتا",
    skip: "تخطي إلى المحتوى الرئيسي",
    menuShopByType: "تسوّقي حسب النوع",
    noRisk: "الدفع عند الاستلام",
  },
} as const;

type TranslationKey = keyof typeof dictionary.en;
type I18nContextValue = { locale: Locale; t: (key: TranslationKey) => string; toggleLocale: () => void };

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children, initialLocale = "en" }: { children: ReactNode; initialLocale?: Locale }) {
  const [locale, setLocale] = useState<Locale>(initialLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = "ltr";
    window.localStorage.setItem("reevita-locale", locale);
    document.cookie = `reevita-locale=${locale}; path=/; max-age=31536000; samesite=lax`;
  }, [locale]);

  const value = useMemo(
    () => ({
      locale,
      t: (key: TranslationKey) => dictionary[locale][key],
      toggleLocale: () => setLocale((current) => (current === "en" ? "ar" : "en")),
    }),
    [locale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used inside I18nProvider");
  return context;
}
