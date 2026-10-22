import type { Metadata, Viewport } from "next";
import { Almarai, Manrope } from "next/font/google";
import { brand } from "@/lib/catalog";
import { siteUrl } from "@/lib/env";
import { Providers } from "@/components/providers";
import { SiteChrome } from "@/components/layout/site-chrome";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { JsonLd } from "@/components/ui/json-ld";
import "./globals.css";

const almarai = Almarai({
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  variable: "--font-almarai",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "REEVITA | Beauty, care and renewal",
    template: "%s | REEVITA",
  },
  description:
    "REEVITA is an Egyptian body and hair care house creating gentle formulas and refined scents.",
  applicationName: "REEVITA",
  keywords: [
    "Reevita",
    "body care",
    "hair care",
    "beauty products",
    "Egypt",
  ],
  authors: [{ name: "REEVITA Cosmetics" }],
  creator: "REEVITA Cosmetics",
  publisher: "REEVITA Cosmetics",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "REEVITA",
    title: "REEVITA — Beauty, care and renewal",
    description: "Premium body and hair care, crafted in Egypt.",
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
    title: "REEVITA — Beauty, care and renewal",
    description: "Premium body and hair care, crafted in Egypt.",
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
  themeColor: "#29382D",
  colorScheme: "light",
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "REEVITA Cosmetics",
  url: siteUrl,
  logo: `${siteUrl}/images/brand/icon-512.png`,
  description: brand.descriptionEn,
  sameAs: [brand.instagram, brand.tiktok, brand.facebook],
  contactPoint: {
    "@type": "ContactPoint",
    telephone: brand.supportPhone,
    contactType: "customer service",
    areaServed: "EG",
    availableLanguage: ["en"],
  },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "REEVITA",
  url: siteUrl,
  inLanguage: "en",
  potentialAction: {
    "@type": "SearchAction",
    target: `${siteUrl}/shop?search={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      dir="ltr"
      className={`${almarai.variable} ${manrope.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh bg-ivory text-ink">
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        <Providers initialLocale="en">
          <SiteChrome part="header" />
          <main id="main" className="site-page min-h-[60vh]">
            {children}
          </main>
          <SiteChrome part="footer" />
          <CartDrawer />
        </Providers>
        <JsonLd data={[organizationJsonLd, websiteJsonLd]} />
      </body>
    </html>
  );
}
