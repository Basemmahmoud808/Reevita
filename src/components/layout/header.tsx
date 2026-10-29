"use client";

import { CartButton } from "@/components/cart/cart-button";
import { Logo } from "@/components/brand/logo";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { ReevitaNavigation } from "@/components/layout/reevita-navigation";

export function Header() {
  return (
    <header className="reference-header sticky top-0 z-50">
      <div className="reference-container flex min-h-[74px] items-center gap-5">
        <Logo size="md" withTagline={false} className="reference-header-logo shrink-0" />

        <div className="hidden min-w-0 flex-1 justify-center lg:flex">
          <ReevitaNavigation />
        </div>

        <div className="ms-auto flex shrink-0 items-center gap-2 sm:gap-3">
          <MobileMenu />
          <CartButton className="reference-header-icon" />
        </div>
      </div>
    </header>
  );
}
