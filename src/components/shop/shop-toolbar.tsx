"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Search, SlidersHorizontal, Loader2 } from "lucide-react";

const sortOptions = [
  { value: "featured", label: "الأكثر تميزًا" },
  { value: "newest", label: "الأحدث" },
  { value: "best-selling", label: "الأكثر مبيعًا" },
  { value: "price-asc", label: "السعر: من الأقل للأعلى" },
  { value: "price-desc", label: "السعر: من الأعلى للأقل" },
];

export function ShopToolbar({ total }: { total: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const currentSort = searchParams.get("sort") ?? "featured";
  const currentSearch = searchParams.get("search") ?? "";

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      const query = params.toString();
      startTransition(() => {
        router.push(query ? `/shop?${query}` : "/shop", { scroll: false });
      });
    },
    [router, searchParams],
  );

  return (
    <div className="flex flex-col gap-4 border-b border-line pb-6 md:flex-row md:items-center md:justify-between">
      <form
        action="/shop"
        method="get"
        className="flex flex-1 items-center gap-2 rounded-full border border-line bg-white/80 px-4 py-2.5"
        role="search"
      >
        <Search className="size-4 shrink-0 text-gold-deep" aria-hidden />
        <label htmlFor="shop-search" className="sr-only">
          ابحثي في المتجر
        </label>
        <input
          id="shop-search"
          name="search"
          type="search"
          defaultValue={currentSearch}
          placeholder="ابحثي بالاسم أو الرائحة…"
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted/70"
        />
        <button type="submit" className="text-xs font-bold text-plum transition-colors hover:text-gold-deep">
          بحث
        </button>
      </form>

      <div className="flex items-center justify-between gap-3 md:justify-end">
        <p className="flex items-center gap-2 text-xs text-muted">
          <SlidersHorizontal className="size-3.5" aria-hidden />
          {pending ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : null}
          <span>{total} منتج</span>
        </p>
        <label htmlFor="sort" className="sr-only">
          ترتيب المنتجات
        </label>
        <select
          id="sort"
          value={currentSort}
          onChange={(event) => updateParam("sort", event.target.value)}
          className="field w-auto py-2 text-xs"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
