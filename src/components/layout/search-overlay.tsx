"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/format";

export function SearchOverlay() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

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
        className="flex size-10 items-center justify-center rounded-full text-plum transition-colors hover:bg-cream"
        aria-label="البحث في المتجر"
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
          aria-label="إغلاق البحث"
        />
        <div className="relative w-full max-w-xl rounded-3xl border border-gold/30 bg-ivory p-6 shadow-luxe">
          <div className="flex items-center justify-between">
            <p className="eyebrow-plain text-[0.62rem] text-gold-deep">SEARCH REEVITA</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full p-1.5 text-muted hover:bg-cream hover:text-plum"
              aria-label="إغلاق البحث"
              tabIndex={open ? 0 : -1}
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>
          <form onSubmit={submit} className="mt-4">
            <label htmlFor="site-search" className="sr-only">
              ابحثي عن منتج
            </label>
            <div className="flex items-center gap-3 rounded-full border border-line bg-white px-5 py-3">
              <Search className="size-5 text-gold-deep" aria-hidden />
              <input
                ref={inputRef}
                id="site-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="ابحثي عن لوشن، شامبو، عطر…"
                className="w-full border-0 bg-transparent text-sm outline-none placeholder:text-muted/70"
                tabIndex={open ? 0 : -1}
              />
              <button type="submit" className="btn btn-primary px-4 py-2 text-xs" tabIndex={open ? 0 : -1}>
                بحث
              </button>
            </div>
          </form>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            {["لوشن كوين", "شامبو ألوفيرا", "معطر شعر", "زبدة جسم"].map((term) => (
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
