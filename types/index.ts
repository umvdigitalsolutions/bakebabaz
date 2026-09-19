/** Shared domain types used across server, client and admin code. */

export type ImageRef = {
  url: string;
  publicId?: string;
  alt?: string;
  width?: number;
  height?: number;
};

export type EggPreference = "eggless" | "with-egg";

export const ORDER_STATUSES = [
  "ORDER_PLACED",
  "PAYMENT_CONFIRMED",
  "CONFIRMED",
  "BAKING",
  "DECORATING",
  "READY",
  "READY_FOR_PICKUP",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = [
  "PENDING",
  "PAID",
  "FAILED",
  "REFUNDED",
  "COD_PENDING",
  "MANUAL_PENDING",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const CUSTOM_REQUEST_STATUSES = [
  "NEW",
  "UNDER_REVIEW",
  "NEEDS_CLARIFICATION",
  "QUOTED",
  "APPROVED",
  "PAYMENT_PENDING",
  "PAID",
  "IN_PRODUCTION",
  "COMPLETED",
  "REJECTED",
] as const;
export type CustomRequestStatus = (typeof CUSTOM_REQUEST_STATUSES)[number];

export const CUSTOMIZATION_TYPES = [
  "flavour",
  "filling",
  "shape",
  "style",
  "tier",
  "weight",
  "occasion",
] as const;
export type CustomizationType = (typeof CUSTOMIZATION_TYPES)[number];

export type PriceModifierKind = "flat" | "per_kg" | "percent";

export type PriceLine = {
  key: string;
  label: string;
  amount: number;
  /** Rendered as struck-through context, e.g. "₹700/kg × 1.5 kg". */
  hint?: string;
};

export type CustomCakeConfig = {
  occasion?: string;
  requiredDate?: string;
  deliverySlot?: string;
  servings?: number;
  style?: string;
  flavour?: string;
  filling?: string;
  shape?: string;
  weightKg?: number;
  eggPreference?: EggPreference;
  tiers?: number;
  colourTheme?: string;
  message?: string;
  addOns?: string[];
  notes?: string;
  referenceImages?: ImageRef[];
};

export type CartItemConfig = {
  weightLabel?: string;
  weightGrams?: number;
  flavour?: string;
  filling?: string;
  shape?: string;
  eggPreference?: EggPreference;
  message?: string;
  tiers?: number;
  colourTheme?: string;
  servings?: number;
  occasion?: string;
  style?: string;
  addOns?: { id?: string; name: string; price: number }[];
  referenceImages?: ImageRef[];
  notes?: string;
};

export type PricedCartItem = {
  key: string;
  kind: "product" | "custom";
  productId?: string;
  slug?: string;
  name: string;
  categoryName?: string;
  categoryId?: string;
  image?: ImageRef;
  config: CartItemConfig;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  breakdown: PriceLine[];
  requiredDate?: string;
  deliverySlot?: string;
  /** Minimum lead time this line needs, in hours. */
  prepTimeHours: number;
  unavailableReason?: string;
};

export type CartTotals = {
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  couponCode?: string;
  couponLabel?: string;
  freeDeliveryThreshold?: number;
};

export type ActionResult<T = undefined> =
  | { ok: true; data: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };
