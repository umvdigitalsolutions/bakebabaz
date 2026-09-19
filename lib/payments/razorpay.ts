import "server-only";
import crypto from "node:crypto";
import Razorpay from "razorpay";

let client: Razorpay | null = null;

export function isRazorpayConfigured() {
  return Boolean(
    process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET,
  );
}

export function getRazorpay() {
  if (!isRazorpayConfigured()) {
    throw new Error(
      "Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.",
    );
  }
  if (!client) {
    client = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });
  }
  return client;
}

/**
 * Creates the Razorpay order. `amountInRupees` always comes from a
 * server-computed order document — never from the browser.
 */
export async function createRazorpayOrder(options: {
  amountInRupees: number;
  receipt: string;
  notes?: Record<string, string>;
}) {
  const razorpay = getRazorpay();
  return razorpay.orders.create({
    amount: Math.round(options.amountInRupees * 100), // paise
    currency: "INR",
    receipt: options.receipt.slice(0, 40),
    notes: options.notes,
  });
}

/**
 * HMAC-SHA256 over `order_id|payment_id` using the secret key. A payment is
 * only ever marked PAID after this returns true — never on the client callback.
 */
export function verifyPaymentSignature(options: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  signature: string;
}) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${options.razorpayOrderId}|${options.razorpayPaymentId}`)
    .digest("hex");

  const provided = Buffer.from(options.signature ?? "", "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  if (provided.length !== expectedBuffer.length) return false;
  return crypto.timingSafeEqual(provided, expectedBuffer);
}

/** Verifies the `X-Razorpay-Signature` header on webhook deliveries. */
export function verifyWebhookSignature(rawBody: string, signature: string) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  const provided = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  if (provided.length !== expectedBuffer.length) return false;
  return crypto.timingSafeEqual(provided, expectedBuffer);
}

export async function fetchPayment(paymentId: string) {
  return getRazorpay().payments.fetch(paymentId);
}
