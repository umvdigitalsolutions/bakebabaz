import { assertSameOrigin, fail, handleRouteError, ok } from "@/lib/api";
import { getVerifiedAdmin, canManage } from "@/lib/auth/guards";
import { connectToDatabase, serialize } from "@/lib/db/mongoose";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";
import {
  orderPaymentStatusSchema,
  orderStatusSchema,
} from "@/lib/validation/admin";
import { safeText } from "@/lib/validation/common";
import { isValidObjectId } from "@/lib/utils";
import { notify } from "@/lib/notifications/service";
import { STATUS_LABELS } from "@/components/shared/OrderTimeline";
import { z } from "zod";

const patchSchema = z.union([
  z.object({ action: z.literal("status") }).and(orderStatusSchema),
  z.object({ action: z.literal("payment") }).and(orderPaymentStatusSchema),
  z.object({
    action: z.literal("note"),
    text: safeText(1000, "Note").pipe(z.string().min(1, "Write a note.")),
  }),
]);

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await getVerifiedAdmin();
    if (!admin) return fail("Not authorised.", 401);

    const { id } = await ctx.params;
    if (!isValidObjectId(id)) return fail("Invalid order.", 400);

    await connectToDatabase();
    const order = await Order.findById(id).lean();
    if (!order) return fail("Order not found.", 404);

    return ok(serialize(order));
  } catch (error) {
    return handleRouteError(error, "admin:order:get");
  }
}

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(request);
    const admin = await getVerifiedAdmin();
    if (!admin) return fail("Not authorised.", 401);

    const { id } = await ctx.params;
    if (!isValidObjectId(id)) return fail("Invalid order.", 400);

    const body = patchSchema.parse(await request.json());
    await connectToDatabase();

    const order = await Order.findById(id);
    if (!order) return fail("Order not found.", 404);

    if (body.action === "status") {
      const previous = order.status;
      order.status = body.status;
      order.statusHistory.push({
        status: body.status,
        at: new Date(),
        note: body.note,
        by: admin.email,
      });

      // Cancelling releases any stock the order was holding.
      if (body.status === "CANCELLED" && previous !== "CANCELLED") {
        for (const item of order.items) {
          if (!item.product) continue;
          await Product.updateOne(
            { _id: item.product, unlimitedStock: false },
            { $inc: { stock: item.quantity, salesCount: -item.quantity } },
          );
        }
      }

      await order.save();
      await notify("order_status_changed", {
        orderNumber: order.orderNumber,
        customerName: order.contact.name,
        customerEmail: order.contact.email,
        status: STATUS_LABELS[body.status],
        note: body.note,
      });
    } else if (body.action === "payment") {
      if (!canManage(admin, "manager")) {
        return fail("Only managers and owners can change payment status.", 403);
      }
      order.payment.status = body.status;
      if (body.status === "PAID" && !order.payment.paidAt) {
        order.payment.paidAt = new Date();
      }
      order.statusHistory.push({
        status: order.status,
        at: new Date(),
        note: `Payment marked ${body.status}${body.note ? ` — ${body.note}` : ""}`,
        by: admin.email,
      });
      await order.save();
    } else {
      order.internalNotes.push({
        text: body.text,
        at: new Date(),
        by: admin.email,
      });
      await order.save();
    }

    return ok(serialize(order.toObject()));
  } catch (error) {
    return handleRouteError(error, "admin:order:update");
  }
}
