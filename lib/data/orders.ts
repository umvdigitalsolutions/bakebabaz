import "server-only";
import {
  connectToDatabase,
  serialize,
  type Serialized,
} from "@/lib/db/mongoose";
import { Order, type IOrder } from "@/models/Order";

export type OrderView = Serialized<IOrder>;

/**
 * Fetches an order for the storefront.
 *
 * Customers can view a fresh order by its unguessable order number for a short
 * window after checkout. Admin views use a separate guarded data path.
 */
export async function getOrderForViewer(orderNumber: string) {
  await connectToDatabase();
  const order = await Order.findOne({ orderNumber }).lean();
  if (!order) return null;

  const age = Date.now() - new Date(order.createdAt).getTime();
  if (age > 1000 * 60 * 60 * 48) return null;

  return serialize(order) as OrderView;
}
