import { z } from "zod";
import {
  addressSchema,
  dateStringSchema,
  emailSchema,
  phoneSchema,
  safeText,
} from "./common";

export const checkoutSchema = z
  .object({
    contact: z.object({
      name: safeText(80, "Name").pipe(z.string().min(2, "Enter your name.")),
      phone: phoneSchema,
      email: emailSchema.optional().or(z.literal("")),
    }),
    deliveryType: z.enum(["delivery", "pickup"]),
    address: addressSchema.optional(),
    deliveryDate: dateStringSchema,
    deliverySlot: safeText(60, "Delivery slot").pipe(
      z.string().min(2, "Choose a delivery slot."),
    ),
    notes: safeText(1000, "Order notes").optional(),
    paymentMethod: z.enum(["manual", "razorpay", "cod"]),
    /** Sent by the client so a double-submit reuses the same order. */
    idempotencyKey: z.string().min(8).max(64),
  })
  .refine((data) => data.deliveryType === "pickup" || Boolean(data.address), {
    message: "Enter a delivery address.",
    path: ["address"],
  });

export const verifyPaymentSchema = z.object({
  orderId: z.string().min(1),
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

export const paymentFailureSchema = z.object({
  orderId: z.string().min(1),
  reason: safeText(300, "Reason").optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
