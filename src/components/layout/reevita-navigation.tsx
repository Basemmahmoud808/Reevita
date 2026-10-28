"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const groups = [
  {
    label: "Categories",
    items: [
      { href: "/#best-sellers", label: "Best Sellers", description: "Explore REEVITA favourites." },
    ],
  },
  {
    label: "About Us",
    items: [
      { href: "/#story", label: "Our Philosophy", description: "Clean, effective, gentle formulas." },
    ],
  },
];

export function ReevitaNavigation() {
  const [open, setOpen] = useState<string | null>(null);
  const pathname = usePathname();
  const isCollectionsPage = pathname.startsWith("/collections");

  return (
    <div className="relative">
      <nav aria-label="Main navigation" className="hidden items-center gap-5 whitespace-nowrap text-xs lg:flex">
        <Link className={pathname === "/" ? "reference-nav-active" : undefined} aria-current={pathname === "/" ? "page" : undefined} href="/">Home</Link>
        <Link className={pathname === "/shop" ? "reference-nav-active" : undefined} aria-current={pathname === "/shop" ? "page" : undefined} href="/shop">Shop</Link>
        <Link className={isCollectionsPage ? "reference-nav-active" : undefined} aria-current={isCollectionsPage ? "page" : undefined} href="/collections">Collections</Link>
        {groups.map((group) => (
          <div key={group.label} className="relative">
            <button
              type="button"
              className="flex items-center gap-1 whitespace-nowrap"
              aria-expanded={open === group.label}
              onClick={() => setOpen((value) => (value === group.label ? null : group.label))}
            >
              {group.label}
              <ChevronDown className={`size-3 transition-transform ${open === group.label ? "rotate-180" : ""}`} />
            </button>
            {open === group.label && (
              <div className="absolute start-1/2 top-full z-50 mt-4 w-64 -translate-x-1/2 rounded-xl border border-[#ded8cc] bg-[#f7f3eb] p-2 shadow-lg">
                {group.items.map((item) => (
                  <Link key={item.label} href={item.href} onClick={() => setOpen(null)} className="block rounded-lg p-3 text-start hover:bg-[#ebe5d9]">
                    <span className="block text-xs font-bold">{item.label}</span>
                    <span className="mt-1 block text-[0.65rem] leading-5 text-[#77766e]">{item.description}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
        <Link className={pathname === "/checkout" ? "reference-nav-active" : undefined} aria-current={pathname === "/checkout" ? "page" : undefined} href="/checkout">Checkout</Link>
      </nav>
    </div>
  );
}
