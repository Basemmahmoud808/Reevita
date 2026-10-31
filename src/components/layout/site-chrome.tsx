"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export function SiteChrome({ part }: { part: "header" | "footer" }) {
  const pathname = usePathname();
  // The root layout owns the public chrome. Keeping it here (rather than
  // duplicating it in individual pages) gives assistive technology one header,
  // one footer and one set of social links on every storefront route.
  if (pathname.startsWith("/admin")) return null;
  return part === "header" ? <Header /> : <Footer />;
}
