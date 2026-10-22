"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { NavLinks } from "@/components/layout/nav-links";
import { categories } from "@/lib/catalog";
import { cn } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const { t } = useI18n();

  function closeOnLinkClick(event: React.MouseEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest("a")) setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex size-10 items-center justify-center rounded-full text-plum transition-colors hover:bg-cream lg:hidden"
        aria-label={t("openMenu")}
        aria-expanded={open}
        aria-controls="mobile-menu"
      >
        <Menu className="size-5" aria-hidden />
      </button>

      <div
        id="mobile-menu"
        aria-hidden={!open}
        className={cn(
          "fixed inset-0 z-[115] lg:hidden",
          open ? "pointer-events-auto" : "pointer-events-none",
        )}
      >
        <button
          type="button"
          tabIndex={open ? 0 : -1}
          onClick={() => setOpen(false)}
          className={cn(
            "absolute inset-0 h-full w-full bg-plum-deep/50 backdrop-blur-sm transition-opacity duration-400",
            open ? "opacity-100" : "opacity-0",
          )}
          aria-label={t("closeMenu")}
        />
        <div
          onClick={closeOnLinkClick}
          className={cn(
            "absolute inset-y-0 right-0 flex w-[86%] max-w-sm flex-col bg-ivory shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
            open ? "translate-x-0" : "translate-x-full",
          )}
        >
          <div className="flex items-center justify-between border-b border-line px-5 py-5">
            <Logo size="sm" />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full border border-line p-2 text-plum transition-colors hover:bg-cream"
              aria-label={t("closeMenu")}
              tabIndex={open ? 0 : -1}
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-6">
            <NavLinks onNavigate={() => setOpen(false)} className="flex-col items-start gap-5" />

            <div className="my-6 gold-rule" />

            <p className="eyebrow-plain mb-3 text-[0.6rem] text-gold-deep">{t("menuShopByType")}</p>
            <ul className="space-y-2">
              {categories.map((category) => (
                <li key={category.slug}>
                  <Link
                    href={`/shop?category=${category.slug}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-cream"
                  >
                    {category.nameEn}
                    <ArrowLeft className="size-3.5 text-gold-deep" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>

            <div className="my-6 gold-rule" />

            <ul className="space-y-2 text-sm font-semibold">
              <li>
                <Link href="/account" onClick={() => setOpen(false)} className="block rounded-xl px-3 py-2.5 hover:bg-cream">
                  {t("account")}
                </Link>
              </li>
              <li>
                <Link href="/faq" onClick={() => setOpen(false)} className="block rounded-xl px-3 py-2.5 hover:bg-cream">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/contact" onClick={() => setOpen(false)} className="block rounded-xl px-3 py-2.5 hover:bg-cream">
                  {t("contact")}
                </Link>
              </li>
            </ul>
          </div>

          <div className="border-t border-line bg-cream/60 px-5 py-5">
            <Link href="/#collection" onClick={() => setOpen(false)} className="btn btn-primary w-full">
              {t("shopNow")}
              <ArrowLeft className="size-4" aria-hidden />
            </Link>
            <p className="mt-3 text-center text-[0.7rem] text-muted">{t("noRisk")} · {t("delivery")}</p>
          </div>
        </div>
      </div>
    </>
  );
}
