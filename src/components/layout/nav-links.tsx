"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

export function NavLinks({ onNavigate, className }: { onNavigate?: () => void; className?: string }) {
  const pathname = usePathname();
  const { t } = useI18n();
  const links = [
    { href: "/shop", label: t("shop") },
    { href: "/collections", label: t("collections") },
    { href: "/shop?category=body-lotion", label: t("bodyCare"), category: "body-lotion" },
    { href: "/shop?category=shampoo", label: t("hairCare"), category: "shampoo" },
    { href: "/#story", label: t("ourStory") },
    { href: "/checkout", label: t("contact") },
  ];

  return (
    <ul className={cn("flex items-center gap-7", className)}>
      {links.map((link) => {
        const isActive = link.category
          ? false
          : pathname === link.href;
        return (
          <li key={`${link.href}-${link.label}`}>
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
