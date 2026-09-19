"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  BookmarkPlus,
  Minus,
  Plus,
  ShoppingBag,
  Tag,
  Trash2,
  Truck,
  Undo2,
} from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { CartLineConfig } from "./CartLineConfig";
import { useCart } from "./CartProvider";
import { cn, formatINR } from "@/lib/utils";
import type { PricedCartItem } from "@/types";

export function CartPageView({
  freeDeliveryThreshold,
}: {
  freeDeliveryThreshold: number;
}) {
  const {
    cart,
    loading,
    setQuantity,
    setSavedForLater,
    removeItem,
    applyCoupon,
    removeCoupon,
  } = useCart();

  const [code, setCode] = useState("");
  const [applying, setApplying] = useState(false);

  if (loading) {
    return (
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_370px]">
        <div className="space-y-6">
          {[0, 1].map((index) => (
            <Skeleton key={index} className="h-40 w-full rounded-[24px]" />
          ))}
        </div>
        <Skeleton className="h-80 w-full rounded-[26px]" />
      </div>
    );
  }

  if (cart.items.length === 0 && cart.savedForLater.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingBag className="size-6" />}
        title="Your cart is empty"
        description="Nothing here yet. Browse our bakes, or design a cake from scratch with live pricing."
        actionLabel="Browse the shop"
        actionHref="/shop"
        secondaryLabel="Design your own cake"
        secondaryHref="/customize-your-cake"
      />
    );
  }

  const remainingForFreeDelivery = freeDeliveryThreshold - cart.totals.subtotal;

  const blockingIssue = cart.items.find((item) => item.unavailableReason);

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_370px] lg:gap-14">
      <div className="min-w-0">
        {cart.items.length > 0 ? (
          <ul className="divide-line border-line divide-y border-y">
            {cart.items.map((item) => (
              <CartRow
                key={item.key}
                item={item}
                onQuantity={(quantity) => void setQuantity(item.key, quantity)}
                onRemove={() => void removeItem(item.key)}
                onSave={() => void setSavedForLater(item.key, true)}
              />
            ))}
          </ul>
        ) : (
          <div className="border-line-strong/60 bg-cream/50 rounded-[24px] border border-dashed px-6 py-10 text-center">
            <p className="font-display text-xl">
              Nothing in your cart right now
            </p>
            <p className="text-muted mt-2 text-sm">
              Your saved items are below — move one back to continue.
            </p>
          </div>
        )}

        {cart.savedForLater.length > 0 ? (
          <section className="mt-12">
            <h2 className="display-3 mb-5">Saved for later</h2>
            <ul className="divide-line border-line divide-y border-y">
              {cart.savedForLater.map((item) => (
                <CartRow
                  key={item.key}
                  item={item}
                  saved
                  onQuantity={(quantity) =>
                    void setQuantity(item.key, quantity)
                  }
                  onRemove={() => void removeItem(item.key)}
                  onSave={() => void setSavedForLater(item.key, false)}
                />
              ))}
            </ul>
          </section>
        ) : null}

        <div className="mt-8">
          <ButtonLink href="/shop" variant="outline" size="sm">
            ← Continue shopping
          </ButtonLink>
        </div>
      </div>

      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="border-line rounded-[26px] border bg-white p-6 shadow-[0_24px_60px_rgba(76,43,34,.08)]">
          <h2 className="font-display text-[22px] tracking-[-0.02em]">
            Order summary
          </h2>

          <form
            className="mt-5"
            onSubmit={async (event) => {
              event.preventDefault();
              if (!code.trim()) return;
              setApplying(true);
              const applied = await applyCoupon(code.trim());
              setApplying(false);
              if (applied) setCode("");
            }}
          >
            <label className="field-label" htmlFor="coupon">
              <span className="inline-flex items-center gap-2">
                <Tag className="text-coral size-3.5" />
                Coupon code
              </span>
            </label>
            {cart.totals.couponCode ? (
              <div className="border-coral/30 bg-coral-soft flex items-center justify-between gap-3 rounded-xl border px-4 py-3">
                <span className="text-coral-dark text-sm font-semibold">
                  {cart.totals.couponCode}
                  {cart.totals.couponLabel ? (
                    <span className="ml-2 font-normal opacity-80">
                      {cart.totals.couponLabel}
                    </span>
                  ) : null}
                </span>
                <button
                  type="button"
                  onClick={() => void removeCoupon()}
                  className="text-coral-dark text-xs font-bold tracking-[0.08em] uppercase underline underline-offset-2"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  id="coupon"
                  value={code}
                  onChange={(event) =>
                    setCode(event.target.value.toUpperCase())
                  }
                  placeholder="WELCOME10"
                  className="field min-h-11 flex-1 uppercase"
                  autoComplete="off"
                />
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  loading={applying}
                  className="min-h-11 flex-none"
                >
                  Apply
                </Button>
              </div>
            )}
            {cart.couponError ? (
              <p className="field-error">{cart.couponError}</p>
            ) : null}
          </form>

          <dl className="border-line mt-6 space-y-2.5 border-t pt-5 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd className="font-medium">{formatINR(cart.totals.subtotal)}</dd>
            </div>
            {cart.totals.discount > 0 ? (
              <div className="text-coral-dark flex justify-between">
                <dt>Discount</dt>
                <dd className="font-medium">
                  −{formatINR(cart.totals.discount)}
                </dd>
              </div>
            ) : null}
            <div className="flex justify-between">
              <dt className="text-muted">Delivery</dt>
              <dd className="text-muted text-xs">Calculated at checkout</dd>
            </div>
          </dl>

          <div className="border-line mt-5 flex items-baseline justify-between border-t pt-5">
            <span className="font-semibold">Total</span>
            <span className="font-display text-[28px] leading-none tracking-[-0.03em]">
              {formatINR(cart.totals.total)}
            </span>
          </div>

          {remainingForFreeDelivery > 0 ? (
            <div className="bg-cream mt-5 rounded-2xl px-4 py-3">
              <p className="text-muted flex items-start gap-2 text-[13px] leading-relaxed">
                <Truck className="text-coral mt-0.5 size-3.5 flex-none" />
                Add {formatINR(remainingForFreeDelivery)} more for free delivery
                across Bikaner.
              </p>
              <div className="bg-line mt-2.5 h-1.5 overflow-hidden rounded-full">
                <div
                  className="bg-coral h-full rounded-full transition-[width] duration-500"
                  style={{
                    width: `${Math.min(
                      100,
                      (cart.totals.subtotal / freeDeliveryThreshold) * 100,
                    )}%`,
                  }}
                />
              </div>
            </div>
          ) : cart.totals.subtotal > 0 ? (
            <p className="bg-pistachio/12 mt-5 flex items-center gap-2 rounded-2xl px-4 py-3 text-[13px] font-semibold text-[#5b6034]">
              <Truck className="size-4" />
              You&rsquo;ve unlocked free delivery.
            </p>
          ) : null}

          {blockingIssue ? (
            <p className="bg-coral-soft text-coral-dark mt-5 rounded-2xl px-4 py-3 text-[13px] font-semibold">
              {blockingIssue.unavailableReason} Please update or remove that
              item before checking out.
            </p>
          ) : null}

          <ButtonLink
            href="/checkout"
            variant="coral"
            size="lg"
            fullWidth
            className={cn(
              "mt-6",
              (cart.items.length === 0 || blockingIssue) &&
                "pointer-events-none opacity-50",
            )}
          >
            Proceed to checkout
          </ButtonLink>

          <p className="text-muted mt-3 text-center text-xs">
            Prices are recalculated on our servers at checkout.
          </p>
        </div>
      </aside>
    </div>
  );
}

function CartRow({
  item,
  saved,
  onQuantity,
  onRemove,
  onSave,
}: {
  item: PricedCartItem;
  saved?: boolean;
  onQuantity: (quantity: number) => void;
  onRemove: () => void;
  onSave: () => void;
}) {
  return (
    <li className="flex gap-4 py-6 sm:gap-6">
      <Link
        href={item.slug ? `/product/${item.slug}` : "/cart"}
        className="bg-cream relative size-24 flex-none overflow-hidden rounded-2xl sm:size-32"
      >
        {item.image?.url ? (
          <Image
            src={item.image.url}
            alt={item.image.alt ?? item.name}
            fill
            sizes="128px"
            className="object-cover"
          />
        ) : (
          <span className="grid h-full place-items-center text-3xl" aria-hidden>
            🎂
          </span>
        )}
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-muted text-[11px] font-semibold tracking-[0.1em] uppercase">
              {item.categoryName}
            </p>
            <h3 className="font-display mt-1 text-[19px] leading-snug tracking-[-0.02em]">
              {item.slug ? (
                <Link
                  href={`/product/${item.slug}`}
                  className="hover:text-coral-dark"
                >
                  {item.name}
                </Link>
              ) : (
                item.name
              )}
            </h3>
            <CartLineConfig
              config={item.config}
              requiredDate={item.requiredDate}
              deliverySlot={item.deliverySlot}
            />
          </div>
          <p className="flex-none font-semibold">{formatINR(item.lineTotal)}</p>
        </div>

        {item.unavailableReason ? (
          <p className="bg-coral-soft text-coral-dark mt-3 inline-block rounded-lg px-3 py-1.5 text-[12.5px] font-semibold">
            {item.unavailableReason}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          {!saved ? (
            <div className="border-line inline-flex items-center rounded-full border">
              <button
                type="button"
                onClick={() => onQuantity(item.quantity - 1)}
                aria-label="Decrease quantity"
                className="hover:bg-cream grid size-9 place-items-center rounded-full transition-colors"
              >
                <Minus className="size-3.5" />
              </button>
              <span className="min-w-8 text-center text-sm font-semibold">
                {item.quantity}
              </span>
              <button
                type="button"
                onClick={() => onQuantity(item.quantity + 1)}
                aria-label="Increase quantity"
                className="hover:bg-cream grid size-9 place-items-center rounded-full transition-colors"
              >
                <Plus className="size-3.5" />
              </button>
            </div>
          ) : null}

          <button
            type="button"
            onClick={onSave}
            className="text-muted hover:text-coral-dark inline-flex items-center gap-1.5 text-[13px] font-semibold transition-colors"
          >
            {saved ? (
              <>
                <Undo2 className="size-3.5" />
                Move to cart
              </>
            ) : (
              <>
                <BookmarkPlus className="size-3.5" />
                Save for later
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onRemove}
            className="text-muted hover:text-coral-dark inline-flex items-center gap-1.5 text-[13px] font-semibold transition-colors"
          >
            <Trash2 className="size-3.5" />
            Remove
          </button>
        </div>
      </div>
    </li>
  );
}
