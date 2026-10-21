import Link from "next/link";
import { Suspense } from "react";
import { User } from "lucide-react";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { NavLinks } from "@/components/layout/nav-links";
import { SearchOverlay } from "@/components/layout/search-overlay";
import { CartButton } from "@/components/cart/cart-button";
import { Logo } from "@/components/brand/logo";

export function Header() {
  return (
    <>
      <AnnouncementBar />
      <header className="sticky top-0 z-50 border-b border-line/70 bg-ivory/88 backdrop-blur-xl">
        <div className="container-luxe flex h-[74px] items-center justify-between gap-3">
          <div className="flex items-center gap-1 lg:hidden">
            <MobileMenu />
          </div>

          <div className="flex items-center gap-8 xl:gap-12">
            <Logo size="md" className="shrink-0" />
            <nav aria-label="التنقل الرئيسي" className="hidden lg:block">
              <Suspense
                fallback={<div className="h-4 w-72" aria-hidden />}
              >
                <NavLinks />
              </Suspense>
            </nav>
          </div>

          <div className="flex items-center gap-0.5 sm:gap-1">
            <SearchOverlay />
            <Link
              href="/account"
              className="flex size-10 items-center justify-center rounded-full text-plum transition-colors hover:bg-cream"
              aria-label="حسابي"
            >
              <User className="size-5" aria-hidden />
            </Link>
            <CartButton />
            <Link href="/shop" className="btn btn-primary ms-2 hidden px-5 py-2.5 text-xs xl:inline-flex">
              تسوّقي الآن
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}
