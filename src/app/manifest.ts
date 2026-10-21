import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/env";
import { brand } from "@/lib/catalog";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "REEVITA — ريفيتا",
    short_name: "REEVITA",
    description: brand.descriptionAr,
    start_url: "/",
    display: "standalone",
    background_color: "#FBF7F3",
    theme_color: "#3B0F24",
    lang: "ar",
    dir: "rtl",
    orientation: "portrait",
    icons: [
      { src: "/images/brand/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/images/brand/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/images/brand/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    categories: ["shopping", "beauty", "lifestyle"],
    id: siteUrl,
  };
}
