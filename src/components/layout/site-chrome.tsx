"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export function SiteChrome({ part }: { part: "header" | "footer" }) {
  const pathname = usePathname();
  if (pathname === "/" || pathname.startsWith("/admin")) return null;
  return part === "header" ? <Header /> : <Footer />;
}
