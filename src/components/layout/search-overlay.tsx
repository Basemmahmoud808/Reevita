"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

export function SearchOverlay() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { t } = useI18n();

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const value = query.trim();
    if (!value) return;
    setOpen(false);
    router.push(`/shop?search=${encodeURIComponent(value)}`);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="search-trigger reference-header-icon"
        aria-label={t("searchStore")}
      >
        <Search className="size-5" aria-hidden />
      </button>

      <div
        className={cn(
          "fixed inset-0 z-[120] flex items-start justify-center px-4 pt-[12vh] transition-opacity duration-300",
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
        aria-hidden={!open}
      >
        <button
          type="button"
          tabIndex={open ? 0 : -1}
          className="absolute inset-0 h-full w-full bg-plum-deep/60 backdrop-blur-md"
          onClick={() => setOpen(false)}
          aria-label={t("closeSearch")}
        />
        <div className="relative w-full max-w-xl rounded-3xl border border-gold/30 bg-ivory p-6 shadow-luxe">
          <div className="flex items-center justify-between">
            <p className="eyebrow-plain text-[0.62rem] text-gold-deep">{t("searchReevita")}</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full p-1.5 text-muted hover:bg-cream hover:text-plum"
              aria-label={t("closeSearch")}
              tabIndex={open ? 0 : -1}
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>
          <form onSubmit={submit} className="mt-4">
            <label htmlFor="site-search" className="sr-only">
              {t("search")}
            </label>
            <div className="flex items-center gap-3 rounded-full border border-line bg-white px-5 py-3">
              <Search className="size-5 text-gold-deep" aria-hidden />
              <input
                ref={inputRef}
                id="site-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("searchPlaceholder")}
                className="w-full border-0 bg-transparent text-sm outline-none placeholder:text-muted/70"
                tabIndex={open ? 0 : -1}
              />
              <button type="submit" className="btn btn-primary px-4 py-2 text-xs" tabIndex={open ? 0 : -1}>
                {t("search")}
              </button>
            </div>
          </form>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            {["Queen Lotion", "Aloe Vera Shampoo", "Hair Mist", "Body Butter"].map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => {
                  setOpen(false);
                  router.push(`/shop?search=${encodeURIComponent(term)}`);
                }}
                className="rounded-full border border-line px-3 py-1.5 text-muted transition-colors hover:border-gold hover:text-plum"
                tabIndex={open ? 0 : -1}
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
