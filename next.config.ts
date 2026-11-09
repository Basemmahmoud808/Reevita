import type { NextConfig } from "next";

const supabaseHost = (() => {
  try {
    return process.env.NEXT_PUBLIC_SUPABASE_URL
      ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
      : null;
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  poweredByHeader: false,
  devIndicators: false,
  reactStrictMode: true,
  compress: true,
  experimental: {
    // Adds SHA-384 integrity attributes to emitted Next.js chunks at build
    // time, so browsers can reject a modified script before it executes.
    sri: { algorithm: "sha384" },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [60, 70, 75, 80, 85, 90, 100],
    deviceSizes: [360, 420, 640, 768, 1024, 1280, 1536, 1920],
    remotePatterns: supabaseHost
      ? [
          {
            protocol: "https",
            hostname: supabaseHost,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
    contentDispositionType: "attachment",
    dangerouslyAllowSVG: false,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          {
            key: "Permissions-Policy",
            // Keep payment disabled until an online payment provider is enabled.
            value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://connect.facebook.net https://vercel.live",
              "style-src 'self' 'unsafe-inline'",
              `img-src 'self' data: blob: https://connect.facebook.net https://www.facebook.com ${supabaseHost ? `https://${supabaseHost}` : ""}`,
              "font-src 'self' data:",
              `connect-src 'self' https://connect.facebook.net https://www.facebook.com ${supabaseHost ? `https://${supabaseHost}` : ""} https://*.supabase.co https://*.vercel-insights.com https://vitals.vercel-insights.com`,
              "frame-ancestors 'none'",
              "form-action 'self'",
              "base-uri 'self'",
              "object-src 'none'",
            ]
              .map((s) => s.trim())
              .filter(Boolean)
              .join("; "),
          },
        ],
      },
      {
        source: "/images/(.*)",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
      },
    ];
  },
};

export default nextConfig;
