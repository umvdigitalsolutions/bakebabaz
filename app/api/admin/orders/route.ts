import { fail, handleRouteError, ok } from "@/lib/api";
import { getVerifiedAdmin } from "@/lib/auth/guards";
import { connectToDatabase, serialize } from "@/lib/db/mongoose";
import { Order } from "@/models/Order";
import type { QueryFilter } from "mongoose";
import type { IOrder } from "@/models/Order";

/** Filtered, searchable order list for the admin table. */
export async function GET(request: Request) {
  try {
    const admin = await getVerifiedAdmin();
    if (!admin) return fail("Not authorised.", 401);

    await connectToDatabase();
    const url = new URL(request.url);
    const q = url.searchParams.get("q")?.trim();
    const status = url.searchParams.get("status");
    const paymentStatus = url.searchParams.get("paymentStatus");
    const paymentMethod = url.searchParams.get("paymentMethod");
    const deliveryDate = url.searchParams.get("deliveryDate");
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const limit = Math.min(
      Math.max(Number(url.searchParams.get("limit")) || 100, 1),
      500,
    );

    const filter: Record<string, unknown> = {};

    if (q) {
      const safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").slice(0, 60);
      const pattern = new RegExp(safe, "i");
      filter.$or = [
        { orderNumber: pattern },
        { "contact.name": pattern },
        { "contact.phone": pattern },
        { "contact.email": pattern },
      ];
    }
    if (status) filter.status = status;
    if (paymentStatus) filter["payment.status"] = paymentStatus;
    if (paymentMethod) filter["payment.method"] = paymentMethod;
    if (deliveryDate) filter["delivery.date"] = deliveryDate;
    if (from || to) {
      const range: Record<string, Date> = {};
      if (from) range.$gte = new Date(from);
      if (to) range.$lte = new Date(`${to}T23:59:59`);
      filter.createdAt = range;
    }

    const orders = await Order.find(filter as QueryFilter<IOrder>)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return ok(serialize(orders));
  } catch (error) {
    return handleRouteError(error, "admin:orders:list");
  }
}
