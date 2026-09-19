"use client";

import Link from "next/link";
import { CakeSlice, MessageCircle, ShoppingBag, Sparkles } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import { whatsappLink } from "@/lib/whatsapp";

export function MobileActionBar({
  whatsapp,
  message,
}: {
  whatsapp: string;
  message: string;
}) {
  const { count, openDrawer } = useCart();

  return (
    <nav
      aria-label="Quick actions"
      className="border-line bg-paper/96 fixed inset-x-0 bottom-0 z-[95] border-t px-3 pt-2 pb-[calc(8px+env(safe-area-inset-bottom))] shadow-[0_-12px_30px_rgba(61,37,33,.08)] backdrop-blur-xl md:hidden"
    >
      <div className="grid grid-cols-4 gap-1">
        <Link
          href="/shop"
          className="text-cocoa flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-bold"
        >
          <CakeSlice className="text-coral size-[19px]" />
          Shop
        </Link>
        <Link
          href="/customize-your-cake"
          className="text-cocoa flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-bold"
        >
          <Sparkles className="text-coral size-[19px]" />
          Custom
        </Link>
        <a
          href={whatsappLink(whatsapp, message)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-cocoa flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-bold"
        >
          <MessageCircle className="text-coral size-[19px]" />
          WhatsApp
        </a>
        <button
          type="button"
          onClick={openDrawer}
          className="text-cocoa relative flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-bold"
          aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`}
        >
          <span className="relative">
            <ShoppingBag className="text-coral size-[19px]" />
            {count > 0 ? (
              <span className="bg-cocoa absolute -top-2 -right-2 grid min-w-[17px] place-items-center rounded-full px-1 text-[10px] leading-[17px] text-white">
                {count > 99 ? "99+" : count}
              </span>
            ) : null}
          </span>
          Cart
        </button>
      </div>
    </nav>
  );
}
