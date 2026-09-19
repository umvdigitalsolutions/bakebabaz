import { assertSameOrigin, fail, handleRouteError, ok } from "@/lib/api";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { verifyPaymentSchema } from "@/lib/validation/checkout";
import { verifyPaymentSignature } from "@/lib/payments/razorpay";
import {
  settleOrderAsPaid,
  markOrderPaymentFailed,
} from "@/lib/payments/settle";

/**
 * The browser tells us a payment succeeded; we believe the signature, not the
 * browser. An order is only ever marked PAID after this HMAC check passes.
 */
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const limit = rateLimit(clientKey(request, "verify"), 30, 300);
    if (!limit.allowed) return fail("Too many attempts.", 429);

    const body = verifyPaymentSchema.parse(await request.json());

    const valid = verifyPaymentSignature({
      razorpayOrderId: body.razorpay_order_id,
      razorpayPaymentId: body.razorpay_payment_id,
      signature: body.razorpay_signature,
    });

    if (!valid) {
      await markOrderPaymentFailed(
        body.orderId,
        "Signature verification failed",
      );
      return fail(
        "We couldn't verify this payment. If money was deducted it will be refunded automatically — please contact us with your order number.",
        400,
      );
    }

    const settled = await settleOrderAsPaid({
      razorpayOrderId: body.razorpay_order_id,
      razorpayPaymentId: body.razorpay_payment_id,
      razorpaySignature: body.razorpay_signature,
      source: "verify",
    });

    if (!settled.ok) return fail(settled.error, 404);

    return ok({
      orderNumber: settled.order.orderNumber,
      redirectTo: `/order-success/${settled.order.orderNumber}`,
    });
  } catch (error) {
    return handleRouteError(error, "razorpay:verify");
  }
}
