import type { Metadata, Viewport } from "next";
import { Almarai, Amiri, Cormorant_Garamond } from "next/font/google";
import { brand } from "@/lib/catalog";
import { siteUrl } from "@/lib/env";
import { Providers } from "@/components/providers";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { JsonLd } from "@/components/ui/json-ld";
import "./globals.css";

const amiri = Amiri({
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  variable: "--font-amiri",
  display: "swap",
});

const almarai = Almarai({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "700", "800"],
  variable: "--font-almarai",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "ريفيتا REEVITA | جمال · عناية · تجدُّد — العناية الفاخرة بالجسم والشعر",
    template: "%s | REEVITA",
  },
  description:
    "ريفيتا — علامة مصرية للعناية الفاخرة بالجسم والشعر. لوشن، زبدة جسم، معطر شعر، وسبراي بروائح سيكسي وكوين وروبي مسك. الدفع عند الاستلام وشحن لكل محافظات مصر.",
  applicationName: "REEVITA",
  keywords: [
    "ريفيتا",
    "Reevita",
    "مستحضرات تجميل",
    "لوشن جسم",
    "زبدة جسم",
    "معطر شعر",
    "سبراي جسم",
    "شامبو",
    "العناية بالبشرة",
    "مصر",
    "الدفع عند الاستلام",
  ],
  authors: [{ name: "REEVITA Cosmetics" }],
  creator: "REEVITA Cosmetics",
  publisher: "REEVITA Cosmetics",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "ar_EG",
    url: siteUrl,
    siteName: "REEVITA",
    title: "ريفيتا REEVITA — طقوس جمال فاخرة، صُنعت في مصر",
    description:
      "لوشن وزبدة جسم وسبراي ومعطر شعر بروائح سيكسي وكوين وروبي مسك. الدفع عند الاستلام وشحن لكل محافظات مصر.",
    images: [
      {
        url: "/images/og/reevita-og.jpg",
        width: 1200,
        height: 630,
        alt: "REEVITA Cosmetics — Beauty, Care, Renew",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ريفيتا REEVITA — طقوس جمال فاخرة",
    description: "عناية فاخرة بالجسم والشعر بروائح استثنائية. الدفع عند الاستلام في مصر.",
    images: ["/images/og/reevita-og.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  icons: {
    icon: [
      { url: "/images/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/images/brand/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/images/brand/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/manifest.webmanifest",
  category: "shopping",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#3B0F24",
  colorScheme: "light",
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "REEVITA Cosmetics",
  alternateName: "ريفيتا",
  url: siteUrl,
  logo: `${siteUrl}/images/brand/icon-512.png`,
  description: brand.descriptionAr,
  sameAs: [brand.instagram, brand.tiktok, brand.facebook],
  contactPoint: {
    "@type": "ContactPoint",
    telephone: brand.supportPhone,
    contactType: "customer service",
    areaServed: "EG",
    availableLanguage: ["ar", "en"],
  },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "REEVITA",
  url: siteUrl,
  inLanguage: "ar-EG",
  potentialAction: {
    "@type": "SearchAction",
    target: `${siteUrl}/shop?search={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${amiri.variable} ${almarai.variable} ${cormorant.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh bg-ivory text-ink">
        <a href="#main" className="skip-link">
          تخطي إلى المحتوى الرئيسي
        </a>
        <Providers>
          <Header />
          <main id="main" className="min-h-[60vh]">
            {children}
          </main>
          <Footer />
          <CartDrawer />
        </Providers>
        <JsonLd data={[organizationJsonLd, websiteJsonLd]} />
      </body>
    </html>
  );
}
