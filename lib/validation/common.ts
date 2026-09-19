import { z } from "zod";

export const objectId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid identifier.");

export const phoneSchema = z
  .string()
  .trim()
  .regex(
    /^(\+91[\s-]?)?[6-9]\d{9}$/,
    "Enter a valid 10-digit Indian mobile number.",
  );

export const emailSchema = z
  .email("Enter a valid email address.")
  .toLowerCase();

export const pincodeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "Enter a valid 6-digit PIN code.");

export const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid date.");

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and hyphens only.")
  .min(2)
  .max(90);

const CONTROL_CHARS = /[\u0000-\u001F\u007F]/g;

/** Strips control characters and angle brackets from free-text fields. */
export const safeText = (max: number, label = "This field") =>
  z
    .string()
    .trim()
    .max(max, `${label} must be under ${max} characters.`)
    .transform((value) =>
      value.replace(CONTROL_CHARS, "").replace(/[<>]/g, ""),
    );

export const imageRefSchema = z.object({
  url: z.url(),
  publicId: z.string().optional(),
  alt: z.string().max(160).optional(),
  width: z.number().optional(),
  height: z.number().optional(),
});

export const addressSchema = z.object({
  label: safeText(30, "Label").optional(),
  fullName: safeText(80, "Name").pipe(z.string().min(2, "Enter a full name.")),
  phone: phoneSchema,
  line1: safeText(140, "Address").pipe(
    z.string().min(4, "Enter your street address."),
  ),
  line2: safeText(140, "Address line 2").optional(),
  landmark: safeText(120, "Landmark").optional(),
  city: safeText(60, "City").pipe(z.string().min(2, "Enter a city.")),
  state: safeText(60, "State").pipe(z.string().min(2, "Enter a state.")),
  pincode: pincodeSchema,
});

export type AddressInput = z.infer<typeof addressSchema>;
