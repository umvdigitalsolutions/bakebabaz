"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Plus } from "lucide-react";
import { cn, formatINR } from "@/lib/utils";
import { Rating } from "@/components/ui/Rating";
import { useCart } from "@/components/cart/CartProvider";
import type { ProductCardData } from "@/lib/data/catalog";

export function ProductCard({
  product,
  priority,
  className,
}: {
  product: ProductCardData;
  priority?: boolean;
  className?: string;
}) {
  const { addProduct } = useCart();
  const [adding, setAdding] = useState(false);

  // Nearly every bake is eggless and customisable, so stacking every badge
  // buries the photo. Two is enough to stay informative.
  const badges = [
    product.bestseller && {
      label: "Bestseller",
      className: "bg-cocoa text-white",
    },
    product.isEggless && {
      label: "Eggless",
      className: "bg-white/95 text-[#5b6034]",
    },
    product.customisable && {
      label: "Customisable",
      className: "bg-coral-soft text-coral-dark",
    },
  ]
    .filter((badge): badge is { label: string; className: string } =>
      Boolean(badge),
    )
    .slice(0, 2);

  const quickAdd = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setAdding(true);
    try {
      await addProduct({ productId: product.id, quantity: 1 });
    } finally {
      setAdding(false);
    }
  };

  return (
    <article className={cn("group flex flex-col", className)}>
      {/* The image and its overlay controls share one positioning context, so
          the buttons anchor to the photo rather than the whole card. */}
      <div className="relative">
        <Link
          href={`/product/${product.slug}`}
          className="bg-cream block overflow-hidden rounded-[22px]"
        >
          <div className="relative aspect-[4/5]">
            {product.image ? (
              <Image
                src={product.image.url}
                alt={product.image.alt ?? product.name}
                fill
                preload={priority}
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className={cn(
                  "object-cover duration-[600ms] ease-out",
                  product.hoverImage
                    ? "transition-opacity group-hover:opacity-0"
                    : "transition-transform group-hover:scale-[1.04]",
                )}
              />
            ) : (
              <span
                className="grid h-full place-items-center text-4xl"
                aria-hidden
              >
                🎂
              </span>
            )}

            {product.hoverImage ? (
              <Image
                src={product.hoverImage.url}
                alt=""
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              />
            ) : null}

            {product.outOfStock ? (
              <div className="bg-paper/70 absolute inset-0 grid place-items-center">
                <span className="bg-cocoa rounded-full px-4 py-2 text-[11px] font-bold tracking-[0.12em] text-white uppercase">
                  Sold out
                </span>
              </div>
            ) : null}
          </div>

          <div className="pointer-events-none absolute top-3 left-3 flex flex-col items-start gap-1.5">
            {badges.map((badge) => (
              <span
                key={badge.label}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[10px] font-bold tracking-[0.1em] uppercase",
                  badge.className,
                )}
              >
                {badge.label}
              </span>
            ))}
          </div>
        </Link>

        {!product.outOfStock ? (
          <button
            type="button"
            onClick={quickAdd}
            disabled={adding}
            aria-label={`Quick add ${product.name} to cart`}
            className="bg-cocoa hover:bg-coral absolute right-3 bottom-3 grid size-10 translate-y-2 place-items-center rounded-full text-white opacity-0 shadow-lg transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 focus-visible:translate-y-0 focus-visible:opacity-100 disabled:opacity-60 pointer-coarse:translate-y-0 pointer-coarse:opacity-100"
          >
            <Plus className={cn("size-4", adding && "animate-spin")} />
          </button>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col pt-4">
        {product.categoryName ? (
          <p className="text-muted text-[11px] font-semibold tracking-[0.12em] uppercase">
            {product.categoryName}
          </p>
        ) : null}
        <h3 className="mt-1.5">
          <Link
            href={`/product/${product.slug}`}
            className="font-display hover:text-coral-dark text-[19px] leading-snug tracking-[-0.02em] transition-colors"
          >
            {product.name}
          </Link>
        </h3>

        {product.ratingCount > 0 ? (
          <Rating
            value={product.rating}
            count={product.ratingCount}
            className="mt-2"
          />
        ) : null}

        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-muted text-[11px] font-medium tracking-[0.08em] uppercase">
            From
          </span>
          <span className="font-semibold">{formatINR(product.price)}</span>
          {product.compareAt ? (
            <span className="text-muted text-sm line-through">
              {formatINR(product.compareAt)}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
