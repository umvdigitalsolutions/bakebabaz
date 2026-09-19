import { assertSameOrigin, fail, handleRouteError, ok } from "@/lib/api";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { checkoutSchema } from "@/lib/validation/checkout";
import { createOrderFromCart } from "@/lib/orders/create";
import { readCartToken } from "@/lib/cart/service";
import { getStoreSettings } from "@/lib/data/settings";
import {
  createRazorpayOrder,
  isRazorpayConfigured,
} from "@/lib/payments/razorpay";
import { connectToDatabase } from "@/lib/db/mongoose";
import { Order } from "@/models/Order";
import { notify } from "@/lib/notifications/service";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const limit = rateLimit(clientKey(request, "checkout"), 20, 300);
    if (!limit.allowed) {
      return fail("Too many checkout attempts. Please wait a moment.", 429);
    }

    const body = checkoutSchema.parse(await request.json());
    const cartToken = await readCartToken();
    if (!cartToken) return fail("Your cart is empty.", 400);

    const settings = await getStoreSettings();

    const order = await createOrderFromCart(body, { cartToken });

    // Manual QR and COD orders are placed pending staff confirmation.
    if (order.paymentMethod === "manual" || order.paymentMethod === "cod") {
      if (!order.reused) {
        await notify("order_placed", {
          orderNumber: order.orderNumber,
          customerName: body.contact.name,
          customerEmail: body.contact.email,
          deliveryDate: body.deliveryDate,
          deliverySlot: body.deliverySlot,
          total: order.total,
          brandName: settings.brand.name,
        });
        await notify("admin_new_order", {
          orderNumber: order.orderNumber,
          customerName: body.contact.name,
          deliveryDate: body.deliveryDate,
          deliverySlot: body.deliverySlot,
          total: order.total,
          paymentMethod:
            order.paymentMethod === "manual"
              ? "Manual QR payment"
              : "Cash on delivery",
        });
      }
      return ok({
        orderId: order.id,
        orderNumber: order.orderNumber,
        paymentMethod: order.paymentMethod,
        redirectTo: `/order-success/${order.orderNumber}`,
      });
    }

    if (!isRazorpayConfigured()) {
      return fail(
        "Online payment isn't configured yet. Please choose cash on delivery, or contact the bakery.",
        503,
      );
    }

    // The Razorpay order is created from the *server-computed* total.
    const razorpayOrder = await createRazorpayOrder({
      amountInRupees: order.total,
      receipt: order.orderNumber,
      notes: {
        orderNumber: order.orderNumber,
        customer: body.contact.name.slice(0, 60),
      },
    });

    await connectToDatabase();
    await Order.updateOne(
      { _id: order.id },
      { $set: { "payment.razorpayOrderId": razorpayOrder.id } },
    );

    return ok({
      orderId: order.id,
      orderNumber: order.orderNumber,
      paymentMethod: "razorpay",
      razorpay: {
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      },
      customer: {
        name: body.contact.name,
        email: body.contact.email,
        phone: body.contact.phone,
      },
    });
  } catch (error) {
    return handleRouteError(error, "checkout");
  }
}
