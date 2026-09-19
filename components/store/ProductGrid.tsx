import { ProductCard } from "./ProductCard";
import type { ProductCardData } from "@/lib/data/catalog";
import { cn } from "@/lib/utils";

export function ProductGrid({
  products,
  className,
  priorityCount = 4,
}: {
  products: ProductCardData[];
  className?: string;
  priorityCount?: number;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-3 xl:grid-cols-4",
        className,
      )}
    >
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          priority={index < priorityCount}
        />
      ))}
    </div>
  );
}
