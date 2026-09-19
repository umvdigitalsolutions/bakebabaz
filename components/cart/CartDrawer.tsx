"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { Button, ButtonLink } from "@/components/ui/Button";
import { CartLineConfig } from "./CartLineConfig";
import { useCart } from "./CartProvider";
import { formatINR } from "@/lib/utils";

export function CartDrawer() {
  const { cart, drawerOpen, closeDrawer, setQuantity, removeItem, loading } =
    useCart();

  const isEmpty = !loading && cart.items.length === 0;

  return (
    <Drawer
      open={drawerOpen}
      onClose={closeDrawer}
      title={`Your cart${cart.items.length ? ` (${cart.items.length})` : ""}`}
      footer={
        isEmpty ? null : (
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-muted text-sm">Subtotal</span>
              <span className="font-display text-2xl tracking-[-0.02em]">
                {formatINR(cart.totals.subtotal)}
              </span>
            </div>
            <p className="text-muted text-xs">
              Delivery and any coupons are applied at checkout.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <ButtonLink
                href="/cart"
                variant="ghost"
                onClick={closeDrawer}
                className="w-full"
              >
                View cart
              </ButtonLink>
              <ButtonLink
                href="/checkout"
                variant="coral"
                onClick={closeDrawer}
                className="w-full"
              >
                Checkout
              </ButtonLink>
            </div>
          </div>
        )
      }
    >
      {loading ? (
        <div className="space-y-4 p-6">
          {[0, 1, 2].map((index) => (
            <div key={index} className="flex gap-4">
              <div className="skeleton size-20 rounded-2xl" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-3/4 rounded" />
                <div className="skeleton h-3 w-1/2 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : isEmpty ? (
        <div className="flex h-full flex-col items-center justify-center px-8 text-center">
          <div className="bg-cream text-coral grid size-14 place-items-center rounded-full">
            <ShoppingBag className="size-6" />
          </div>
          <h3 className="font-display mt-5 text-2xl tracking-[-0.02em]">
            Your cart is empty
          </h3>
          <p className="text-muted mt-2 text-sm">
            Browse our bakes, or design a cake from scratch.
          </p>
          <div className="mt-6 flex flex-col gap-3 self-stretch">
            <ButtonLink href="/shop" variant="coral" onClick={closeDrawer}>
              Browse the shop
            </ButtonLink>
            <ButtonLink
              href="/customize-your-cake"
              variant="ghost"
              onClick={closeDrawer}
            >
              Design your own cake
            </ButtonLink>
          </div>
        </div>
      ) : (
        <ul className="divide-line divide-y">
          {cart.items.map((item) => (
            <li key={item.key} className="flex gap-4 px-6 py-5">
              <Link
                href={item.slug ? `/product/${item.slug}` : "/cart"}
                onClick={closeDrawer}
                className="bg-cream relative size-20 flex-none overflow-hidden rounded-2xl"
              >
                {item.image?.url ? (
                  <Image
                    src={item.image.url}
                    alt={item.image.alt ?? item.name}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                ) : (
                  <span
                    className="grid h-full place-items-center text-xl"
                    aria-hidden
                  >
                    🎂
                  </span>
                )}
              </Link>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate leading-snug font-medium">
                      {item.name}
                    </p>
                    <p className="text-muted text-[11px] font-semibold tracking-[0.1em] uppercase">
                      {item.categoryName}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void removeItem(item.key)}
                    aria-label={`Remove ${item.name}`}
                    className="text-muted hover:bg-cream hover:text-coral-dark grid size-8 flex-none place-items-center rounded-full transition-colors"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>

                <CartLineConfig
                  config={item.config}
                  requiredDate={item.requiredDate}
                  deliverySlot={item.deliverySlot}
                  compact
                />

                {item.unavailableReason ? (
                  <p className="bg-coral-soft text-coral-dark mt-2 rounded-lg px-2.5 py-1.5 text-[12px] font-semibold">
                    {item.unavailableReason}
                  </p>
                ) : null}

                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="border-line inline-flex items-center rounded-full border">
                    <button
                      type="button"
                      onClick={() =>
                        void setQuantity(item.key, item.quantity - 1)
                      }
                      aria-label="Decrease quantity"
                      className="text-cocoa hover:bg-cream grid size-8 place-items-center rounded-full transition-colors"
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <span className="min-w-7 text-center text-sm font-semibold">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        void setQuantity(item.key, item.quantity + 1)
                      }
                      aria-label="Increase quantity"
                      className="text-cocoa hover:bg-cream grid size-8 place-items-center rounded-full transition-colors"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                  <span className="font-semibold">
                    {formatINR(item.lineTotal)}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Drawer>
  );
}
