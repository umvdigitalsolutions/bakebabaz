import "server-only";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import { Cart } from "@/models/Cart";
import { Order, type IOrderItem } from "@/models/Order";
import { Product } from "@/models/Product";
import { Coupon, CouponRedemption } from "@/models/Coupon";
import { DeliverySlot } from "@/models/DeliverySlot";
import { getStoreSettings } from "@/lib/data/settings";
import {
  evaluateCoupon,
  loadCartDocument,
  priceCart,
} from "@/lib/cart/service";
import {
  resolveDeliveryFee,
  validateDeliveryWindow,
} from "@/lib/delivery/validate";
import { generateOrderNumber } from "./numbering";
import { HttpError } from "@/lib/api";
import type { CheckoutInput } from "@/lib/validation/checkout";

export type CreatedOrder = {
  id: string;
  orderNumber: string;
  total: number;
  paymentMethod: "manual" | "razorpay" | "cod";
  reused: boolean;
};

/**
 * Turns a cart into an order.
 *
 * Everything that touches money is derived here, on the server:
 * line prices are recomputed from live product documents, the coupon is
 * re-evaluated, the delivery fee comes from the zone table, and the delivery
 * window is re-checked against the kitchen's lead time. The request body only
 * supplies contact details, an address, a date/slot choice and a payment
 * method — never an amount.
 */
export async function createOrderFromCart(
  input: CheckoutInput,
  context: { cartToken: string },
): Promise<CreatedOrder> {
  await connectToDatabase();
  const settings = await getStoreSettings();

  // Idempotency: a double-clicked or retried submit returns the first order.
  const existing = await Order.findOne({
    idempotencyKey: input.idempotencyKey,
  }).lean();
  if (existing) {
    return {
      id: String(existing._id),
      orderNumber: existing.orderNumber,
      total: existing.amounts.total,
      paymentMethod: existing.payment.method,
      reused: true,
    };
  }

  const cartDoc = await loadCartDocument(context.cartToken);
  if (
    !cartDoc ||
    cartDoc.items.filter((item) => !item.savedForLater).length === 0
  ) {
    throw new HttpError("Your cart is empty.", 400);
  }

  const priced = await priceCart(cartDoc);
  if (priced.items.length === 0) {
    throw new HttpError("Your cart is empty.", 400);
  }

  const blocked = priced.items.find((item) => item.unavailableReason);
  if (blocked) {
    throw new HttpError(`${blocked.name}: ${blocked.unavailableReason}`, 409);
  }

  // --- Delivery window -----------------------------------------------------
  const windowCheck = await validateDeliveryWindow({
    date: input.deliveryDate,
    slot: input.deliverySlot,
    requiredLeadHours: priced.requiredLeadHours,
  });
  if (!windowCheck.ok) throw new HttpError(windowCheck.error, 409);

  // --- Delivery fee --------------------------------------------------------
  const feeCheck = await resolveDeliveryFee({
    type: input.deliveryType,
    pincode: input.address?.pincode,
    subtotal: priced.totals.subtotal,
  });
  if (!feeCheck.ok) throw new HttpError(feeCheck.error, 409);

  const slotDoc = await DeliverySlot.findOne({
    label: input.deliverySlot,
    active: true,
  }).lean();
  let deliveryFee = feeCheck.fee + (slotDoc?.surcharge ?? 0);

  // --- Coupon --------------------------------------------------------------
  const contactKey = input.contact.phone;
  let discount = 0;
  let couponSnapshot:
    { code: string; discount: number; type: string } | undefined;

  if (cartDoc.couponCode) {
    const result = await evaluateCoupon({
      code: cartDoc.couponCode,
      subtotal: priced.totals.subtotal,
      items: priced.items,
      contactKey,
    });
    if (result.ok) {
      discount = result.discount;
      if (result.freeDelivery) deliveryFee = 0;
      couponSnapshot = {
        code: result.code,
        discount: result.discount,
        type: result.type,
      };
    }
    // An invalid coupon is silently dropped rather than blocking checkout —
    // the customer still sees the recomputed total before paying.
  }

  const subtotal = priced.totals.subtotal;
  const total = Math.max(Math.round(subtotal - discount + deliveryFee), 0);

  // --- Payment method availability ----------------------------------------
  if (input.paymentMethod === "manual") {
    if (
      !settings.payments.manualEnabled ||
      !settings.payments.manualQrCode?.url
    ) {
      throw new HttpError("QR payment isn't available right now.", 409);
    }
  } else if (input.paymentMethod === "cod") {
    if (!settings.payments.codEnabled) {
      throw new HttpError("Cash on delivery isn't available right now.", 409);
    }
    if (
      settings.payments.codMaxAmount &&
      total > settings.payments.codMaxAmount
    ) {
      throw new HttpError(
        `Cash on delivery is available on orders up to ₹${settings.payments.codMaxAmount}. Please pay online for this order.`,
        409,
      );
    }
  } else if (!settings.payments.razorpayEnabled) {
    throw new HttpError("Online payment isn't available right now.", 409);
  }

  // --- Stock reservation ---------------------------------------------------
  const stockDecrements: { id: mongoose.Types.ObjectId; qty: number }[] = [];
  for (const item of priced.items) {
    if (item.kind !== "product" || !item.productId) continue;
    const product = await Product.findById(item.productId)
      .select("unlimitedStock stock name")
      .lean();
    if (!product)
      throw new HttpError(`${item.name} is no longer available.`, 409);
    if (!product.unlimitedStock) {
      if (product.stock < item.quantity) {
        throw new HttpError(
          product.stock > 0
            ? `Only ${product.stock} of ${product.name} left in stock.`
            : `${product.name} just sold out.`,
          409,
        );
      }
      stockDecrements.push({
        id: new mongoose.Types.ObjectId(item.productId),
        qty: item.quantity,
      });
    }
  }

  // --- Snapshot the order --------------------------------------------------
  const items: IOrderItem[] = priced.items.map((item) => ({
    kind: item.kind,
    product: item.productId
      ? new mongoose.Types.ObjectId(item.productId)
      : undefined,
    name: item.name,
    slug: item.slug,
    categoryName: item.categoryName,
    image: item.image,
    config: item.config,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    lineTotal: item.lineTotal,
    breakdown: item.breakdown,
    prepTimeHours: item.prepTimeHours,
  }));

  const orderNumber = await generateOrderNumber();
  const isCod = input.paymentMethod === "cod";
  const isManual = input.paymentMethod === "manual";

  const order = await Order.create({
    orderNumber,
    contact: {
      name: input.contact.name,
      phone: input.contact.phone,
      email: input.contact.email || undefined,
    },
    items,
    delivery: {
      type: input.deliveryType,
      address: input.deliveryType === "delivery" ? input.address : undefined,
      date: input.deliveryDate,
      slot: input.deliverySlot,
      zone: feeCheck.zone,
      fee: deliveryFee,
    },
    amounts: { subtotal, discount, deliveryFee, total },
    coupon: couponSnapshot,
    payment: {
      method: input.paymentMethod,
      status: isCod ? "COD_PENDING" : isManual ? "MANUAL_PENDING" : "PENDING",
    },
    status: "ORDER_PLACED",
    statusHistory: [{ status: "ORDER_PLACED", at: new Date(), by: "customer" }],
    customerNotes: input.notes,
    idempotencyKey: input.idempotencyKey,
  });

  // Decrement stock only once the order document exists.
  for (const decrement of stockDecrements) {
    await Product.updateOne(
      { _id: decrement.id, stock: { $gte: decrement.qty } },
      { $inc: { stock: -decrement.qty, salesCount: decrement.qty } },
    );
  }

  if (couponSnapshot) {
    await Promise.all([
      Coupon.updateOne(
        { code: couponSnapshot.code },
        { $inc: { usedCount: 1 } },
      ),
      CouponRedemption.create({
        coupon: (
          await Coupon.findOne({ code: couponSnapshot.code })
            .select("_id")
            .lean()
        )?._id,
        contactKey,
        order: order._id,
        discount: couponSnapshot.discount,
      }),
    ]);
  }

  // COD orders are final immediately; card orders empty the cart only after
  // the payment is verified, so a failed payment doesn't lose the basket.
  if (isCod) {
    await Cart.updateOne(
      { _id: cartDoc._id },
      { $set: { items: [], couponCode: null } },
    );
  }

  return {
    id: String(order._id),
    orderNumber: order.orderNumber,
    total,
    paymentMethod: input.paymentMethod,
    reused: false,
  };
}
