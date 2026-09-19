"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useTransition,
} from "react";
import { toast } from "sonner";
import type { CartItemConfig, CartTotals, PricedCartItem } from "@/types";

export type CartState = {
  items: PricedCartItem[];
  savedForLater: PricedCartItem[];
  totals: CartTotals;
  couponError?: string;
  requiredLeadHours: number;
};

const emptyState: CartState = {
  items: [],
  savedForLater: [],
  totals: { subtotal: 0, discount: 0, deliveryFee: 0, total: 0 },
  requiredLeadHours: 0,
};

type AddProductInput = {
  productId: string;
  config?: CartItemConfig;
  quantity?: number;
  requiredDate?: string;
  deliverySlot?: string;
};

type AddCustomInput = {
  config: CartItemConfig;
  quantity?: number;
  requiredDate: string;
  deliverySlot?: string;
};

type CartContextValue = {
  cart: CartState;
  count: number;
  loading: boolean;
  pending: boolean;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  refresh: () => Promise<void>;
  addProduct: (input: AddProductInput) => Promise<boolean>;
  addCustomCake: (input: AddCustomInput) => Promise<boolean>;
  setQuantity: (key: string, quantity: number) => Promise<void>;
  setSavedForLater: (key: string, saved: boolean) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
  applyCoupon: (code: string) => Promise<boolean>;
  removeCoupon: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

async function request(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.ok) {
    throw new Error(
      payload?.error ?? "Something went wrong. Please try again.",
    );
  }
  return payload.data;
}

/**
 * The cart is priced on the server and handed to the provider as `initialCart`,
 * so the first paint already shows the right badge and totals — no fetch on
 * mount, no empty-then-populated flash. Mutations return the freshly priced
 * cart, which keeps this state authoritative without polling.
 */
export function CartProvider({
  children,
  initialCart,
}: {
  children: React.ReactNode;
  initialCart?: CartState;
}) {
  const [cart, setCart] = useState<CartState>(initialCart ?? emptyState);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const loading = false;

  const refresh = useCallback(async () => {
    try {
      const data = await request("/api/cart");
      setCart(data ?? emptyState);
    } catch {
      // A failed refresh leaves the last known cart on screen rather than
      // wiping it — losing a cart is worse than showing a slightly stale one.
    }
  }, []);

  const mutate = useCallback(
    async (
      url: string,
      init: RequestInit,
      options?: { successMessage?: string; openDrawer?: boolean },
    ) => {
      try {
        const data = await request(url, init);
        setCart(data ?? emptyState);
        // The drawer opening is confirmation enough; a toast on top of it
        // would sit over the drawer's checkout buttons on small screens.
        if (options?.openDrawer) setDrawerOpen(true);
        else if (options?.successMessage) toast.success(options.successMessage);
        return true;
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Something went wrong.",
        );
        return false;
      }
    },
    [],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      count: cart.items.reduce((sum, item) => sum + item.quantity, 0),
      loading,
      pending,
      drawerOpen,
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
      refresh,
      addProduct: (input) =>
        mutate(
          "/api/cart/items",
          { method: "POST", body: JSON.stringify(input) },
          { successMessage: "Added to your cart", openDrawer: true },
        ),
      addCustomCake: (input) =>
        mutate(
          "/api/cart/custom",
          { method: "POST", body: JSON.stringify(input) },
          {
            successMessage: "Your custom cake is in the cart",
            openDrawer: true,
          },
        ),
      setQuantity: async (key, quantity) => {
        startTransition(() => {});
        await mutate("/api/cart/items", {
          method: "PATCH",
          body: JSON.stringify({ key, quantity }),
        });
      },
      setSavedForLater: async (key, saved) => {
        await mutate(
          "/api/cart/items",
          {
            method: "PATCH",
            body: JSON.stringify({ key, savedForLater: saved }),
          },
          { successMessage: saved ? "Saved for later" : "Moved back to cart" },
        );
      },
      removeItem: async (key) => {
        await mutate(
          `/api/cart/items?key=${encodeURIComponent(key)}`,
          { method: "DELETE" },
          { successMessage: "Removed from cart" },
        );
      },
      applyCoupon: (code) =>
        mutate(
          "/api/cart/coupon",
          { method: "POST", body: JSON.stringify({ code }) },
          { successMessage: "Coupon applied" },
        ),
      removeCoupon: async () => {
        await mutate("/api/cart/coupon", { method: "DELETE" });
      },
    }),
    [cart, loading, pending, drawerOpen, refresh, mutate],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside <CartProvider>.");
  }
  return context;
}
