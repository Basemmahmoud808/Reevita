"use client";

import { ChevronDown, Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const groups = [
  {
    label: "Categories",
    items: [
      { href: "#collection", label: "Best Sellers", description: "Explore REEVITA favourites." },
    ],
  },
  {
    label: "About Us",
    items: [
      { href: "#story", label: "Our Philosophy", description: "Clean, effective, gentle formulas." },
    ],
  },
];

export function ReevitaNavigation() {
  const [open, setOpen] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        className="reference-header-icon md:hidden"
        aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen((value) => !value)}
      >
        {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>

      <nav aria-label="Main navigation" className="hidden items-center gap-8 text-[0.7rem] md:flex">
        <Link className="reference-nav-active" href="/">Home</Link>
        <a href="#collection">Shop</a>
        {groups.map((group) => (
          <div key={group.label} className="relative">
            <button
              type="button"
              className="flex items-center gap-1"
              aria-expanded={open === group.label}
              onClick={() => setOpen((value) => (value === group.label ? null : group.label))}
            >
              {group.label}
              <ChevronDown className={`size-3 transition-transform ${open === group.label ? "rotate-180" : ""}`} />
            </button>
            {open === group.label && (
              <div className="absolute start-1/2 top-full z-50 mt-4 w-64 -translate-x-1/2 rounded-xl border border-[#ded8cc] bg-[#f7f3eb] p-2 shadow-lg">
                {group.items.map((item) => (
                  <a key={item.label} href={item.href} onClick={() => setOpen(null)} className="block rounded-lg p-3 text-start hover:bg-[#ebe5d9]">
                    <span className="block text-xs font-bold">{item.label}</span>
                    <span className="mt-1 block text-[0.65rem] leading-5 text-[#77766e]">{item.description}</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
        <a href="/checkout">Checkout</a>
      </nav>

      {mobileOpen && (
        <div className="absolute end-0 top-full z-50 mt-3 w-72 rounded-xl border border-[#ded8cc] bg-[#f7f3eb] p-3 shadow-lg md:hidden">
          <Link href="/" onClick={() => setMobileOpen(false)} className="block rounded-lg px-3 py-2.5 text-sm font-semibold hover:bg-[#ebe5d9]">Home</Link>
          <a href="#collection" onClick={() => setMobileOpen(false)} className="block rounded-lg px-3 py-2.5 text-sm font-semibold hover:bg-[#ebe5d9]">Shop</a>
          {groups.flatMap((group) => group.items).map((item) => (
            <a key={item.label} href={item.href} onClick={() => setMobileOpen(false)} className="block rounded-lg px-3 py-2.5 text-sm font-semibold hover:bg-[#ebe5d9]">
              {item.label}
            </a>
          ))}
          <a href="/checkout" onClick={() => setMobileOpen(false)} className="block rounded-lg px-3 py-2.5 text-sm font-semibold hover:bg-[#ebe5d9]">Checkout</a>
        </div>
      )}
    </div>
  );
}
