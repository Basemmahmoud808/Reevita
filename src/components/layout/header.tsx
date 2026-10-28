"use client";

import Link from "next/link";
import { Home } from "lucide-react";
import { CartButton } from "@/components/cart/cart-button";
import { Logo } from "@/components/brand/logo";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { ReevitaNavigation } from "@/components/layout/reevita-navigation";
import { SearchOverlay } from "@/components/layout/search-overlay";

export function Header() {
  return (
    <header className="reference-header sticky top-0 z-50">
      <div className="reference-container flex h-[74px] items-center justify-between">
        <div className="flex items-center gap-3">
          <MobileMenu />
          <Link href="/" aria-label="Home" className="reference-header-icon hidden sm:inline-flex">
            <Home className="size-[17px]" aria-hidden />
          </Link>
          <SearchOverlay />
          <CartButton className="reference-header-icon" />
        </div>

        <Logo size="md" withTagline={false} className="reference-header-logo" />

        <div className="hidden items-center gap-5 md:flex">
          <ReevitaNavigation />
          <LanguageToggle />
        </div>
      </div>
    </header>
  );
}
