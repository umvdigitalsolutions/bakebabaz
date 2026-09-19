import "server-only";
import { cookies } from "next/headers";
import { connectToDatabase } from "@/lib/db/mongoose";
import { Cart, type ICart, type ICartItem } from "@/models/Cart";
import { AddOn } from "@/models/AddOn";
import { Product } from "@/models/Product";
import { Category } from "@/models/Category";
import { Coupon } from "@/models/Coupon";
import { CouponRedemption } from "@/models/Coupon";
import { getPricingCatalog } from "@/lib/pricing/catalog";
import { calculateCustomCakePrice } from "@/lib/pricing/engine";
import { calculateProductPrice } from "@/lib/pricing/product";
import { getStoreSettings } from "@/lib/data/settings";
import { CART_COOKIE } from "@/lib/auth/session";
import { nanoid } from "@/lib/utils";
import type { CartTotals, PricedCartItem } from "@/types";

export type PricedCart = {
  token: string;
  items: PricedCartItem[];
  savedForLater: PricedCartItem[];
  totals: CartTotals;
  couponError?: string;
  /** Longest preparation window across every active line, in hours. */
  requiredLeadHours: number;
};

const emptyCart = (token: string): PricedCart => ({
  token,
  items: [],
  savedForLater: [],
  totals: { subtotal: 0, discount: 0, deliveryFee: 0, total: 0 },
  requiredLeadHours: 0,
});

/** Reads the cart cookie without creating one — safe inside Server Components. */
export async function readCartToken() {
  const store = await cookies();
  return store.get(CART_COOKIE)?.value;
}

/**
 * Returns the cart token, minting one if needed. Only callable from Route
 * Handlers and Server Actions, where cookies are writable.
 */
export async function ensureCartToken() {
  const store = await cookies();
  const existing = store.get(CART_COOKIE)?.value;
  if (existing) return existing;
  const token = nanoid(24);
  store.set(CART_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 60,
  });
  return token;
}

export async function loadCartDocument(token: string, createIfMissing = false) {
  await connectToDatabase();
  let cart = await Cart.findOne({ token });

  if (!cart && createIfMissing) {
    cart = await Cart.create({
      token,
      items: [],
    });
  }

  return cart;
}

/**
 * Recomputes every line from live database values. Nothing about price is ever
 * read back from the stored cart, so a tampered client changes nothing.
 */
export async function priceCart(cart: ICart | null): Promise<PricedCart> {
  if (!cart) return emptyCart("");
  await connectToDatabase();

  const [catalog, settings, addOnDocs] = await Promise.all([
    getPricingCatalog(),
    getStoreSettings(),
    AddOn.find({ active: true }).lean(),
  ]);

  const addOnCatalog = addOnDocs.map((addOn) => ({
    id: String(addOn._id),
    name: addOn.name,
    price: addOn.price,
  }));

  const productIds = cart.items
    .filter((item) => item.kind === "product" && item.product)
    .map((item) => item.product!);

  const products = productIds.length
    ? await Product.find({ _id: { $in: productIds } })
        .populate<{
          category: { _id: string; name: string; prepTimeHours: number };
        }>("category", "name prepTimeHours")
        .lean()
    : [];

  const productMap = new Map(products.map((p) => [String(p._id), p]));

  const active: PricedCartItem[] = [];
  const saved: PricedCartItem[] = [];
  let requiredLeadHours = 0;

  for (const item of cart.items) {
    const priced = await priceCartItem(item, {
      catalog,
      addOnCatalog,
      productMap,
    });
    if (!priced) continue;
    if (item.savedForLater) {
      saved.push(priced);
    } else {
      active.push(priced);
      requiredLeadHours = Math.max(requiredLeadHours, priced.prepTimeHours);
    }
  }

  const subtotal = active.reduce((sum, item) => sum + item.lineTotal, 0);

  let discount = 0;
  let couponCode: string | undefined;
  let couponLabel: string | undefined;
  let couponError: string | undefined;
  let freeDelivery = false;

  if (cart.couponCode) {
    const result = await evaluateCoupon({
      code: cart.couponCode,
      subtotal,
      items: active,
      userId: cart.user ? String(cart.user) : undefined,
    });
    if (result.ok) {
      discount = result.discount;
      couponCode = result.code;
      couponLabel = result.label;
      freeDelivery = result.freeDelivery;
    } else {
      couponError = result.error;
    }
  }

  return {
    token: cart.token,
    items: active,
    savedForLater: saved,
    totals: {
      subtotal: Math.round(subtotal),
      discount: Math.round(discount),
      deliveryFee: 0,
      total: Math.round(Math.max(subtotal - discount, 0)),
      couponCode,
      couponLabel: freeDelivery
        ? `${couponLabel} · free delivery`
        : couponLabel,
      freeDeliveryThreshold: settings.delivery.freeDeliveryThreshold,
    },
    couponError,
    requiredLeadHours,
  };
}

async function priceCartItem(
  item: ICartItem,
  ctx: {
    catalog: Awaited<ReturnType<typeof getPricingCatalog>>;
    addOnCatalog: { id: string; name: string; price: number }[];
    productMap: Map<string, Record<string, unknown>>;
  },
): Promise<PricedCartItem | null> {
  if (item.kind === "custom") {
    const quote = calculateCustomCakePrice(ctx.catalog, {
      flavour: item.config.flavour,
      filling: item.config.filling,
      shape: item.config.shape,
      style: item.config.style,
      weightKg: (item.config.weightGrams ?? 1000) / 1000,
      eggPreference: item.config.eggPreference,
      tiers: item.config.tiers,
      message: item.config.message,
      addOns: (item.config.addOns ?? []).map((addOn) => addOn.id ?? ""),
      requiredDate: item.requiredDate,
      servings: item.config.servings,
      occasion: item.config.occasion,
    });

    return {
      key: item.key,
      kind: "custom",
      name: item.name,
      categoryName: item.categoryName ?? "Custom Cakes",
      image: item.image ?? item.config.referenceImages?.[0],
      config: item.config,
      quantity: item.quantity,
      unitPrice: quote.total,
      lineTotal: quote.total * item.quantity,
      breakdown: quote.lineItems,
      requiredDate: item.requiredDate,
      deliverySlot: item.deliverySlot,
      prepTimeHours: quote.prepTimeHours,
      unavailableReason: quote.warnings[0],
    };
  }

  const product = ctx.productMap.get(String(item.product)) as
    | (Record<string, unknown> & {
        name: string;
        slug: string;
        status: string;
        stock: number;
        unlimitedStock: boolean;
        images?: { url: string; alt?: string }[];
        category?: { _id?: unknown; name?: string; prepTimeHours?: number };
        weights?: { label: string; grams: number }[];
      })
    | undefined;

  if (!product) return null;

  const quote = calculateProductPrice(
    product as never,
    item.config,
    ctx.addOnCatalog,
  );

  let unavailableReason: string | undefined = quote.warnings[0];
  if (product.status !== "active") {
    unavailableReason = "This item is no longer available.";
  } else if (!product.unlimitedStock && product.stock < item.quantity) {
    unavailableReason =
      product.stock > 0
        ? `Only ${product.stock} left in stock.`
        : "Out of stock.";
  }

  return {
    key: item.key,
    kind: "product",
    productId: String(item.product),
    slug: product.slug,
    name: product.name,
    categoryName: product.category?.name ?? item.categoryName,
    categoryId: product.category?._id
      ? String(product.category._id)
      : undefined,
    image: item.image ?? product.images?.[0],
    config: item.config,
    quantity: item.quantity,
    unitPrice: quote.unitPrice,
    lineTotal: quote.unitPrice * item.quantity,
    breakdown: quote.lineItems,
    requiredDate: item.requiredDate,
    deliverySlot: item.deliverySlot,
    prepTimeHours: Math.max(
      quote.prepTimeHours,
      product.category?.prepTimeHours ?? 0,
    ),
    unavailableReason,
  };
}

export type CouponEvaluation =
  | {
      ok: true;
      code: string;
      label: string;
      discount: number;
      freeDelivery: boolean;
      type: string;
    }
  | { ok: false; error: string };

/** Every coupon check happens here, on the server, against live documents. */
export async function evaluateCoupon(options: {
  code: string;
  subtotal: number;
  items: PricedCartItem[];
  userId?: string;
  contactKey?: string;
}): Promise<CouponEvaluation> {
  await connectToDatabase();
  const coupon = await Coupon.findOne({
    code: options.code.toUpperCase().trim(),
  }).lean();

  if (!coupon || !coupon.active) {
    return { ok: false, error: "That coupon code isn't valid." };
  }

  const now = new Date();
  if (coupon.startsAt && now < new Date(coupon.startsAt)) {
    return { ok: false, error: "This coupon isn't active yet." };
  }
  if (coupon.expiresAt && now > new Date(coupon.expiresAt)) {
    return { ok: false, error: "This coupon has expired." };
  }
  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
    return { ok: false, error: "This coupon has been fully redeemed." };
  }
  if (options.subtotal < coupon.minOrder) {
    return {
      ok: false,
      error: `Add ₹${Math.ceil(coupon.minOrder - options.subtotal)} more to use this coupon.`,
    };
  }

  if (coupon.perUserLimit > 0) {
    const contactKey = options.contactKey ?? options.userId;
    if (contactKey) {
      const used = await CouponRedemption.countDocuments({
        coupon: coupon._id,
        contactKey,
      });
      if (used >= coupon.perUserLimit) {
        return { ok: false, error: "You've already used this coupon." };
      }
    }
  }

  // Restrict the discount base when the coupon targets specific products.
  let eligibleSubtotal = options.subtotal;
  const restrictedProducts = coupon.products?.map(String) ?? [];
  const restrictedCategories = coupon.categories?.map(String) ?? [];

  if (restrictedProducts.length || restrictedCategories.length) {
    const eligible = options.items.filter((item) => {
      if (item.kind === "custom") return coupon.appliesToCustomCakes;
      if (item.productId && restrictedProducts.includes(item.productId)) {
        return true;
      }
      return Boolean(
        item.categoryId && restrictedCategories.includes(item.categoryId),
      );
    });
    eligibleSubtotal = eligible.reduce((sum, item) => sum + item.lineTotal, 0);
    if (eligibleSubtotal <= 0) {
      return {
        ok: false,
        error: "This coupon doesn't apply to the items in your cart.",
      };
    }
  } else if (!coupon.appliesToCustomCakes) {
    eligibleSubtotal = options.items
      .filter((item) => item.kind !== "custom")
      .reduce((sum, item) => sum + item.lineTotal, 0);
    if (eligibleSubtotal <= 0) {
      return { ok: false, error: "This coupon doesn't apply to custom cakes." };
    }
  }

  let discount = 0;
  if (coupon.type === "percentage") {
    discount = (eligibleSubtotal * coupon.value) / 100;
    if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
  } else if (coupon.type === "fixed") {
    discount = Math.min(coupon.value, eligibleSubtotal);
  }

  return {
    ok: true,
    code: coupon.code,
    label: coupon.description || coupon.code,
    discount: Math.round(discount),
    freeDelivery: coupon.type === "free_delivery",
    type: coupon.type,
  };
}

export async function getPricedCart(): Promise<PricedCart> {
  const token = await readCartToken();
  if (!token) return emptyCart("");
  const cart = await loadCartDocument(token);
  return priceCart(cart);
}
