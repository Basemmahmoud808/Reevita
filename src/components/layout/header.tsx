"use client";

import Link from "next/link";
import { Home } from "lucide-react";
import { CartButton } from "@/components/cart/cart-button";
import { Logo } from "@/components/brand/logo";

export function Header() {
  return (
    <header className="reference-header sticky top-0 z-50">
      <div className="reference-container flex h-[74px] items-center justify-between">
        <div className="order-3 flex items-center gap-4">
          <Link href="/" aria-label="Home" className="reference-header-icon hidden sm:inline-flex">
            <Home className="size-[17px]" aria-hidden />
          </Link>
          <CartButton className="reference-header-icon" />
        </div>

        <Logo size="md" withTagline={false} className="reference-header-logo order-1" />
      </div>
    </header>
  );
}
