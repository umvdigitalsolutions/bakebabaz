import { assertSameOrigin, handleRouteError, ok } from "@/lib/api";
import { paymentFailureSchema } from "@/lib/validation/checkout";
import { markOrderPaymentFailed } from "@/lib/payments/settle";

/** Records a cancelled or failed payment so the order can be retried. */
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const body = paymentFailureSchema.parse(await request.json());
    await markOrderPaymentFailed(body.orderId, body.reason);
    return ok({ recorded: true });
  } catch (error) {
    return handleRouteError(error, "razorpay:failed");
  }
}
