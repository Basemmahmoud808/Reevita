"use client";

import { CartButton } from "@/components/cart/cart-button";
import { Logo } from "@/components/brand/logo";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { NavLinks } from "@/components/layout/nav-links";

export function Header() {
  return (
    <header className="reference-header sticky top-0 z-50">
      <div className="reference-container flex min-h-[74px] items-center gap-5">
        <Logo size="md" withTagline={false} className="reference-header-logo shrink-0" />

        <nav aria-label="Primary navigation" className="ms-auto hidden lg:block">
          <NavLinks />
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3 lg:ms-2">
          <MobileMenu />
          <CartButton className="reference-header-icon" />
        </div>
      </div>
    </header>
  );
}
