import { z } from "zod";
import { dateStringSchema, imageRefSchema, objectId, safeText } from "./common";

const addOnLineSchema = z.object({
  id: z.string().optional(),
  name: safeText(80, "Add-on"),
  price: z.number().min(0),
});

/**
 * Note what is absent: no price, no total. The client describes what it wants;
 * the server alone decides what it costs.
 */
export const cartItemConfigSchema = z.object({
  weightLabel: safeText(40, "Weight").optional(),
  weightGrams: z.number().int().min(100).max(30_000).optional(),
  flavour: safeText(60, "Flavour").optional(),
  filling: safeText(60, "Filling").optional(),
  shape: safeText(40, "Shape").optional(),
  style: safeText(60, "Style").optional(),
  eggPreference: z.enum(["eggless", "with-egg"]).optional(),
  message: safeText(120, "Cake message").optional(),
  tiers: z.number().int().min(1).max(6).optional(),
  colourTheme: safeText(300, "Colours or theme").optional(),
  servings: z.number().int().min(1).max(2000).optional(),
  occasion: safeText(60, "Occasion").optional(),
  addOns: z.array(addOnLineSchema).max(20).optional(),
  referenceImages: z.array(imageRefSchema).max(6).optional(),
  notes: safeText(1000, "Notes").optional(),
});

export const addProductToCartSchema = z.object({
  productId: objectId,
  config: cartItemConfigSchema.optional(),
  quantity: z.number().int().min(1).max(50).default(1),
  requiredDate: dateStringSchema.optional(),
  deliverySlot: safeText(60, "Delivery slot").optional(),
});

export const addCustomCakeToCartSchema = z.object({
  config: cartItemConfigSchema,
  quantity: z.number().int().min(1).max(20).default(1),
  requiredDate: dateStringSchema,
  deliverySlot: safeText(60, "Delivery slot").optional(),
});

export const updateCartItemSchema = z.object({
  key: z.string().min(1).max(64),
  quantity: z.number().int().min(0).max(50).optional(),
  savedForLater: z.boolean().optional(),
});

export const couponSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .min(2, "Enter a coupon code.")
    .max(30)
    .regex(/^[A-Z0-9_-]+$/, "Coupon codes use letters and numbers only."),
});
