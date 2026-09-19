import { z } from "zod";
import {
  dateStringSchema,
  emailSchema,
  imageRefSchema,
  phoneSchema,
  safeText,
} from "./common";

export const customCakeConfigSchema = z.object({
  occasion: safeText(60, "Occasion").pipe(
    z.string().min(2, "Choose an occasion."),
  ),
  requiredDate: dateStringSchema,
  deliverySlot: safeText(60, "Delivery slot").optional(),
  servings: z.coerce.number().int().min(1).max(2000).optional(),
  style: safeText(60, "Cake style").optional(),
  flavour: safeText(60, "Flavour").optional(),
  filling: safeText(60, "Filling").optional(),
  shape: safeText(40, "Shape").optional(),
  weightKg: z.coerce.number().min(0.5).max(30),
  eggPreference: z.enum(["eggless", "with-egg"]).default("eggless"),
  tiers: z.coerce.number().int().min(1).max(6).default(1),
  colourTheme: safeText(300, "Colours or theme").optional(),
  message: safeText(120, "Message on cake").optional(),
  addOns: z.array(z.string()).max(20).default([]),
  notes: safeText(2000, "Additional instructions").optional(),
  referenceImages: z.array(imageRefSchema).max(6).default([]),
});

export const customCakeRequestSchema = z.object({
  contact: z.object({
    name: safeText(80, "Name").pipe(z.string().min(2, "Enter your name.")),
    phone: phoneSchema,
    email: emailSchema.optional().or(z.literal("")),
  }),
  config: customCakeConfigSchema,
  consent: z.literal(true, {
    error: "Please accept the consent checkbox to continue.",
  }),
});

export const quoteRequestSchema = z.object({
  config: customCakeConfigSchema.partial().extend({
    weightKg: z.coerce.number().min(0.5).max(30),
  }),
});

export type CustomCakeRequestInput = z.infer<typeof customCakeRequestSchema>;
