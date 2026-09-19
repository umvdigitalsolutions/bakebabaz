import { z } from "zod";
import {
  imageRefSchema,
  objectId,
  pincodeSchema,
  safeText,
  slugSchema,
} from "./common";
import {
  CUSTOMIZATION_TYPES,
  ORDER_STATUSES,
  CUSTOM_REQUEST_STATUSES,
} from "@/types";

export const categorySchema = z.object({
  name: safeText(80, "Name").pipe(z.string().min(2, "Enter a category name.")),
  slug: slugSchema,
  description: safeText(600, "Description").optional(),
  image: imageRefSchema.optional().nullable(),
  icon: safeText(8, "Icon").optional(),
  seo: z
    .object({
      title: safeText(160, "SEO title").optional(),
      description: safeText(320, "SEO description").optional(),
    })
    .optional(),
  active: z.boolean().default(true),
  featured: z.boolean().default(false),
  sortOrder: z.coerce.number().int().default(0),
  prepTimeHours: z.coerce.number().min(0).max(720).default(6),
});

const productOptionSchema = z.object({
  name: safeText(60, "Option"),
  surcharge: z.coerce.number().min(0).default(0),
  premium: z.boolean().optional(),
});

const weightVariantSchema = z.object({
  label: safeText(40, "Label").pipe(z.string().min(1, "Add a weight label.")),
  grams: z.coerce.number().int().min(1),
  price: z.coerce.number().min(0),
  salePrice: z.coerce.number().min(0).optional().nullable(),
  stock: z.coerce.number().int().min(0).optional().nullable(),
  sku: safeText(40, "SKU").optional(),
  servings: safeText(40, "Servings").optional(),
});

export const productSchema = z.object({
  name: safeText(140, "Name").pipe(z.string().min(2, "Enter a product name.")),
  slug: slugSchema,
  sku: safeText(40, "SKU").optional(),
  category: objectId,
  shortDescription: safeText(400, "Short description").optional(),
  description: safeText(6000, "Description").optional(),
  images: z.array(imageRefSchema).max(12).default([]),
  basePrice: z.coerce.number().min(0),
  salePrice: z.coerce.number().min(0).optional().nullable(),
  weights: z.array(weightVariantSchema).max(20).default([]),
  flavours: z.array(productOptionSchema).max(40).default([]),
  fillings: z.array(productOptionSchema).max(40).default([]),
  shapes: z.array(productOptionSchema).max(20).default([]),
  eggOptions: z.array(z.enum(["eggless", "with-egg"])).default(["eggless"]),
  addOns: z.array(objectId).default([]),
  tags: z.array(safeText(40, "Tag")).max(30).default([]),
  occasions: z.array(safeText(40, "Occasion")).max(20).default([]),
  stock: z.coerce.number().int().min(0).default(0),
  unlimitedStock: z.boolean().default(true),
  lowStockThreshold: z.coerce.number().int().min(0).default(5),
  customisable: z.boolean().default(true),
  allowMessage: z.boolean().default(true),
  featured: z.boolean().default(false),
  bestseller: z.boolean().default(false),
  isVegetarian: z.boolean().default(true),
  ingredients: safeText(2000, "Ingredients").optional(),
  allergens: safeText(1000, "Allergens").optional(),
  storageInstructions: safeText(1000, "Storage").optional(),
  deliveryInfo: safeText(1000, "Delivery info").optional(),
  prepTimeHours: z.coerce.number().min(0).max(720).default(6),
  seo: z
    .object({
      title: safeText(160, "SEO title").optional(),
      description: safeText(320, "SEO description").optional(),
    })
    .optional(),
  status: z.enum(["active", "draft", "archived"]).default("active"),
  sortOrder: z.coerce.number().int().default(0),
});

export const customizationOptionSchema = z.object({
  type: z.enum(CUSTOMIZATION_TYPES),
  label: safeText(60, "Label").pipe(z.string().min(1, "Enter a label.")),
  value: safeText(60, "Value").pipe(z.string().min(1, "Enter a value.")),
  description: safeText(300, "Description").optional(),
  image: imageRefSchema.optional().nullable(),
  modifierKind: z.enum(["flat", "per_kg", "percent"]).default("flat"),
  modifierAmount: z.coerce.number().default(0),
  numericValue: z.coerce.number().optional().nullable(),
  extraPrepHours: z.coerce.number().min(0).max(720).default(0),
  badge: safeText(30, "Badge").optional(),
  active: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
});

export const addOnSchema = z.object({
  name: safeText(80, "Name").pipe(z.string().min(2, "Enter a name.")),
  description: safeText(300, "Description").optional(),
  price: z.coerce.number().min(0),
  image: imageRefSchema.optional().nullable(),
  group: safeText(40, "Group").default("Extras"),
  active: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
});

export const pricingRuleSchema = z.object({
  code: safeText(40, "Code").pipe(
    z.string().regex(/^[a-z0-9_]+$/, "Use lowercase letters and underscores."),
  ),
  label: safeText(80, "Label").pipe(z.string().min(2, "Enter a label.")),
  kind: z.enum(["flat", "per_kg", "percent"]).default("flat"),
  amount: z.coerce.number(),
  description: safeText(300, "Description").optional(),
  active: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
});

export const deliveryZoneSchema = z.object({
  pincode: pincodeSchema,
  area: safeText(80, "Area").pipe(z.string().min(2, "Enter an area name.")),
  fee: z.coerce.number().min(0),
  minOrder: z.coerce.number().min(0).default(0),
  freeAbove: z.coerce.number().min(0).optional().nullable(),
  sameDayAvailable: z.boolean().default(true),
  active: z.boolean().default(true),
});

export const deliverySlotSchema = z.object({
  label: safeText(60, "Label").pipe(z.string().min(2, "Enter a slot label.")),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM."),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM."),
  surcharge: z.coerce.number().min(0).default(0),
  maxOrders: z.coerce.number().int().min(0).default(0),
  active: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
});

export const couponAdminSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .min(2)
    .max(30)
    .regex(/^[A-Z0-9_-]+$/, "Use letters, numbers, hyphens and underscores."),
  description: safeText(200, "Description").optional(),
  type: z.enum(["percentage", "fixed", "free_delivery"]),
  value: z.coerce.number().min(0),
  minOrder: z.coerce.number().min(0).default(0),
  maxDiscount: z.coerce.number().min(0).optional().nullable(),
  startsAt: z.string().optional().nullable(),
  expiresAt: z.string().optional().nullable(),
  usageLimit: z.coerce.number().int().min(0).default(0),
  perUserLimit: z.coerce.number().int().min(0).default(0),
  categories: z.array(objectId).default([]),
  products: z.array(objectId).default([]),
  appliesToCustomCakes: z.boolean().default(true),
  active: z.boolean().default(true),
});

export const bannerSchema = z.object({
  title: safeText(120, "Title").pipe(z.string().min(2, "Enter a title.")),
  subtitle: safeText(240, "Subtitle").optional(),
  desktopImage: imageRefSchema.optional().nullable(),
  mobileImage: imageRefSchema.optional().nullable(),
  ctaLabel: safeText(40, "CTA label").optional(),
  ctaLink: safeText(200, "CTA link").optional(),
  placement: z
    .enum(["home_hero", "home_strip", "shop_top"])
    .default("home_strip"),
  startsAt: z.string().optional().nullable(),
  endsAt: z.string().optional().nullable(),
  active: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
});

export const orderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  note: safeText(300, "Note").optional(),
});

export const orderPaymentStatusSchema = z.object({
  status: z.enum([
    "PENDING",
    "PAID",
    "FAILED",
    "REFUNDED",
    "COD_PENDING",
    "MANUAL_PENDING",
  ]),
  note: safeText(300, "Note").optional(),
});

export const customRequestUpdateSchema = z.object({
  status: z.enum(CUSTOM_REQUEST_STATUSES).optional(),
  quoteAmount: z.coerce.number().min(0).optional(),
  quoteNote: safeText(600, "Quote note").optional(),
  internalNote: safeText(1000, "Internal note").optional(),
  customerNote: safeText(1000, "Customer note").optional(),
});

export const reviewModerationSchema = z.object({
  approved: z.boolean().optional(),
  adminReply: safeText(1000, "Reply").optional(),
});
