import "server-only";
import { connectToDatabase } from "@/lib/db/mongoose";
import { Order } from "@/models/Order";
import { Cart } from "@/models/Cart";
import { User } from "@/models/User";
import { getStoreSettings } from "@/lib/data/settings";
import { notify } from "@/lib/notifications/service";

/**
 * The one place an order becomes PAID.
 *
 * Callable from the verify endpoint and the webhook; both arrive at the same
 * state and the operation is idempotent, so a duplicate webhook after a
 * successful client verification changes nothing.
 */
export async function settleOrderAsPaid(options: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature?: string;
  source: "verify" | "webhook";
}) {
  await connectToDatabase();

  const order = await Order.findOne({
    "payment.razorpayOrderId": options.razorpayOrderId,
  });
  if (!order) return { ok: false as const, error: "Order not found." };

  if (order.payment.status === "PAID") {
    return { ok: true as const, order, alreadyPaid: true };
  }

  order.payment.status = "PAID";
  order.payment.razorpayPaymentId = options.razorpayPaymentId;
  if (options.razorpaySignature) {
    order.payment.razorpaySignature = options.razorpaySignature;
  }
  order.payment.paidAt = new Date();
  order.payment.failureReason = undefined;
  order.status = "PAYMENT_CONFIRMED";
  order.statusHistory.push({
    status: "PAYMENT_CONFIRMED",
    at: new Date(),
    note: `Verified via ${options.source}`,
    by: "system",
  });

  await order.save();

  // Clear the basket only once money has actually moved.
  await Cart.updateOne(
    { user: order.user, items: { $exists: true } },
    { $set: { items: [], couponCode: null } },
  );

  if (order.user) {
    await User.updateOne(
      { _id: order.user },
      {
        $inc: {
          "stats.orderCount": 1,
          "stats.totalSpent": order.amounts.total,
        },
        $set: { "stats.lastOrderAt": new Date() },
      },
    );
  }

  const settings = await getStoreSettings();
  await notify("payment_confirmed", {
    orderNumber: order.orderNumber,
    customerName: order.contact.name,
    customerEmail: order.contact.email,
    total: order.amounts.total,
    brandName: settings.brand.name,
  });
  await notify("admin_new_order", {
    orderNumber: order.orderNumber,
    customerName: order.contact.name,
    deliveryDate: order.delivery.date,
    deliverySlot: order.delivery.slot,
    total: order.amounts.total,
    paymentMethod: "Razorpay (paid)",
  });

  return { ok: true as const, order, alreadyPaid: false };
}

export async function markOrderPaymentFailed(orderId: string, reason?: string) {
  await connectToDatabase();
  const order = await Order.findById(orderId);
  if (!order || order.payment.status === "PAID") return;

  order.payment.status = "FAILED";
  order.payment.failureReason = reason?.slice(0, 300);
  order.statusHistory.push({
    status: order.status,
    at: new Date(),
    note: `Payment failed: ${reason ?? "unknown"}`,
    by: "system",
  });
  await order.save();

  await notify("payment_failed", {
    orderNumber: order.orderNumber,
    customerName: order.contact.name,
    customerEmail: order.contact.email,
  });
}
