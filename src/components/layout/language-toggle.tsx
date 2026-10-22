"use client";

import { Languages } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function LanguageToggle() {
  const { locale, t, toggleLocale } = useI18n();
  return (
    <button
      type="button"
      onClick={toggleLocale}
      className="reference-language-toggle inline-flex h-8 items-center gap-2 border border-[#ded8cc] px-3 text-[0.62rem] font-bold text-[#344238] transition-colors hover:bg-[#ebe4d8]"
      aria-label={`Switch language to ${locale === "en" ? "Arabic" : "English"}`}
    >
      <Languages className="size-3.5" aria-hidden />
      <span>{t("language")}</span>
    </button>
  );
}
