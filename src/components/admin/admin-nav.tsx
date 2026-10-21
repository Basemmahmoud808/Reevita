"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, ShoppingCart, Store, Truck } from "lucide-react";
import { cn } from "@/lib/format";

const links = [
  { href: "/admin", label: "لوحة التحكم", icon: LayoutDashboard },
  { href: "/admin/orders", label: "الطلبات", icon: ShoppingCart },
  { href: "/admin/products", label: "المنتجات والمخزون", icon: Package },
  { href: "/admin/shipping", label: "الشحن والمحافظات", icon: Truck },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="لوحة الإدارة" className="lg:sticky lg:top-28 lg:self-start">
      <ul className="flex gap-1.5 overflow-x-auto rounded-2xl border border-line bg-white/70 p-2 lg:flex-col lg:overflow-visible lg:p-2">
        {links.map((link) => {
          const active = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
          return (
            <li key={link.href} className="shrink-0">
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-bold transition-colors",
                  active ? "bg-plum text-ivory" : "text-plum hover:bg-cream",
                )}
              >
                <link.icon className="size-4" aria-hidden />
                {link.label}
              </Link>
            </li>
          );
        })}
        <li className="shrink-0 lg:mt-2 lg:border-t lg:border-line lg:pt-2">
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-bold text-muted transition-colors hover:bg-cream hover:text-plum"
          >
            <Store className="size-4" aria-hidden />
            عرض المتجر
          </Link>
        </li>
      </ul>
    </nav>
  );
}
