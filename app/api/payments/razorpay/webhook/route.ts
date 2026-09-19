import { fail, handleRouteError, ok } from "@/lib/api";
import { verifyWebhookSignature } from "@/lib/payments/razorpay";
import {
  settleOrderAsPaid,
  markOrderPaymentFailed,
} from "@/lib/payments/settle";
import { connectToDatabase } from "@/lib/db/mongoose";
import { Order } from "@/models/Order";

/**
 * Razorpay's server-to-server confirmation. This is the safety net for the case
 * where the customer's browser dies between paying and returning to the site —
 * the order still settles correctly.
 *
 * No same-origin check here: the request legitimately comes from Razorpay. The
 * HMAC signature is the authentication.
 */
export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature") ?? "";

    if (!verifyWebhookSignature(rawBody, signature)) {
      return fail("Invalid webhook signature.", 401);
    }

    const event = JSON.parse(rawBody) as {
      event: string;
      payload?: {
        payment?: {
          entity?: {
            id?: string;
            order_id?: string;
            error_description?: string;
          };
        };
      };
    };

    const payment = event.payload?.payment?.entity;
    if (!payment?.order_id || !payment.id) {
      return ok({ ignored: true });
    }

    if (event.event === "payment.captured" || event.event === "order.paid") {
      await settleOrderAsPaid({
        razorpayOrderId: payment.order_id,
        razorpayPaymentId: payment.id,
        source: "webhook",
      });
    } else if (event.event === "payment.failed") {
      await connectToDatabase();
      const order = await Order.findOne({
        "payment.razorpayOrderId": payment.order_id,
      })
        .select("_id")
        .lean();
      if (order) {
        await markOrderPaymentFailed(
          String(order._id),
          payment.error_description ?? "Payment failed at gateway",
        );
      }
    }

    return ok({ handled: event.event });
  } catch (error) {
    return handleRouteError(error, "razorpay:webhook");
  }
}
