"use client";

import { useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { brand } from "@/lib/catalog";
import { useI18n } from "@/lib/i18n";

const subscribe = (callback: () => void) => {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
};

const getSnapshot = () => {
  try {
    return sessionStorage.getItem("rv_wa_bubble_dismissed") === "true";
  } catch {
    return false;
  }
};

const getServerSnapshot = () => false;

export function WhatsAppFloatingButton() {
  const pathname = usePathname();
  const { locale } = useI18n();
  const isDismissed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const dismissBubble = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      sessionStorage.setItem("rv_wa_bubble_dismissed", "true");
      window.dispatchEvent(new Event("storage"));
    } catch {
      // Ignore
    }
  };

  // Don't show in admin dashboard
  if (pathname.startsWith("/admin")) return null;

  const phone = brand.whatsapp ? brand.whatsapp.replace(/\D/g, "") : "201157024375";
  const defaultMessage =
    locale === "ar"
      ? "أهلاً ريفيتا، أريد الاستفسار عن المنتجات والعروض"
      : "Hello REEVITA, I would like to inquire about products and offers";

  const waHref = `https://wa.me/${phone}?text=${encodeURIComponent(defaultMessage)}`;
  const tooltipText = locale === "ar" ? "كيف يمكنني مساعدتك؟" : "How can we help you?";

  return (
    <aside
      aria-label="WhatsApp Contact"
      className="fixed bottom-5 left-5 z-40 flex items-center gap-3 md:bottom-6 md:left-6"
    >
      {/* Floating WhatsApp Button */}
      <a
        href={waHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={locale === "ar" ? "تواصل معنا عبر واتساب" : "Chat with us on WhatsApp"}
        className="group relative flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_8px_24px_rgba(37,211,102,0.45)] transition-all duration-300 hover:scale-110 hover:shadow-[0_12px_32px_rgba(37,211,102,0.65)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2"
      >
        {/* Soft pulse radar ring */}
        <span
          className="absolute inset-0 -z-10 rounded-full bg-[#25D366] opacity-35 motion-safe:animate-ping"
          style={{ animationDuration: "3s" }}
          aria-hidden="true"
        />

        {/* WhatsApp Icon */}
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className="size-8 transition-transform duration-300 group-hover:scale-105"
          aria-hidden="true"
        >
          <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.02-1.25-.75-.67-1.26-1.5-1.4-1.76-.15-.25-.02-.39.11-.51.11-.11.25-.29.37-.44.12-.14.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.78 2.71 4.31 3.8.6.26 1.07.41 1.44.53.61.19 1.16.17 1.6.1.49-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.12-.22-.19-.47-.32" />
        </svg>
      </a>

      {/* Helpful Chat Bubble / Tooltip */}
      {!isDismissed && (
        <div
          role="status"
          className="relative hidden items-center gap-2.5 rounded-2xl border border-line/70 bg-white/95 px-3.5 py-2 text-xs font-semibold text-plum shadow-lg backdrop-blur-sm transition-all sm:flex"
        >
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gold-deep transition-colors"
          >
            {tooltipText}
          </a>
          <button
            type="button"
            onClick={dismissBubble}
            aria-label={locale === "ar" ? "إغلاق الرسالة" : "Dismiss message"}
            className="text-muted/60 hover:text-plum transition-colors"
          >
            <X className="size-3.5" aria-hidden="true" />
          </button>
        </div>
      )}
    </aside>
  );
}
