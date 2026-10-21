import { ProductCard } from "@/components/product/product-card";
import { cn } from "@/lib/format";
import type { Product } from "@/lib/types";

export function ProductGrid({
  products,
  className,
  prioritizeFirst = false,
  columns = 4,
}: {
  products: Product[];
  className?: string;
  prioritizeFirst?: boolean;
  columns?: 3 | 4;
}) {
  return (
    <ul
      className={cn(
        "grid grid-cols-2 gap-x-4 gap-y-9 sm:gap-x-6 md:gap-x-7",
        columns === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3",
        className,
      )}
    >
      {products.map((product, index) => (
        <li key={product.id}>
          <ProductCard product={product} priority={prioritizeFirst && index < 2} />
        </li>
      ))}
    </ul>
  );
}
