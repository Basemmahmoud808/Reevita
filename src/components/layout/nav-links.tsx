"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/format";

const links = [
  { href: "/shop", label: "المتجر" },
  { href: "/collections", label: "العطور" },
  { href: "/shop?category=body-lotion", label: "العناية بالجسم", match: "/shop", category: "body-lotion" },
  { href: "/shop?category=shampoo", label: "العناية بالشعر", match: "/shop", category: "shampoo" },
  { href: "/about", label: "قصتنا" },
  { href: "/track", label: "تتبّع الطلب" },
];

export function NavLinks({ onNavigate, className }: { onNavigate?: () => void; className?: string }) {
  const pathname = usePathname();

  return (
    <ul className={cn("flex items-center gap-7", className)}>
      {links.map((link) => {
        const isActive = link.category
          ? false
          : link.href === "/shop"
            ? pathname === "/shop" && !link.category
            : pathname === link.href;
        return (
          <li key={link.href}>
            <Link
              href={link.href}
              onClick={onNavigate}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "link-underline text-[0.84rem] font-bold text-plum transition-colors hover:text-gold-deep",
                isActive && "text-gold-deep",
              )}
            >
              {link.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
