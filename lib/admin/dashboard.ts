import "server-only";
import { connectToDatabase, serialize } from "@/lib/db/mongoose";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";
import { User } from "@/models/User";
import { CustomCakeRequest } from "@/models/CustomCakeRequest";
import { Review } from "@/models/Review";
import { toDateInputValue, addDays } from "@/lib/utils";

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;

/** Everything the admin home screen needs, in one round of parallel queries. */
export async function getDashboardData() {
  await connectToDatabase();

  const now = new Date();
  const today = toDateInputValue(now);
  const tomorrow = toDateInputValue(addDays(now, 1));

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const paid = { "payment.status": "PAID" as const };

  const [
    todayRevenue,
    todayOrders,
    monthRevenue,
    pendingOrders,
    customRequests,
    ordersToday,
    ordersTomorrow,
    totalCustomers,
    lowStock,
    pendingReviews,
    recentOrders,
    upcomingOrders,
    revenueSeries,
    statusBreakdown,
    topProducts,
  ] = await Promise.all([
    Order.aggregate<{ total: number }>([
      { $match: { ...paid, createdAt: { $gte: startOfToday } } },
      { $group: { _id: null, total: { $sum: "$amounts.total" } } },
    ]),
    Order.countDocuments({ createdAt: { $gte: startOfToday } }),
    Order.aggregate<{ total: number }>([
      { $match: { ...paid, createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: "$amounts.total" } } },
    ]),
    Order.countDocuments({
      status: { $in: ["ORDER_PLACED", "PAYMENT_CONFIRMED", "CONFIRMED"] },
    }),
    CustomCakeRequest.countDocuments({
      status: { $in: ["NEW", "UNDER_REVIEW", "NEEDS_CLARIFICATION"] },
    }),
    Order.countDocuments({
      "delivery.date": today,
      status: { $nin: ["CANCELLED", "DELIVERED"] },
    }),
    Order.countDocuments({
      "delivery.date": tomorrow,
      status: { $nin: ["CANCELLED", "DELIVERED"] },
    }),
    User.countDocuments({}),
    Product.countDocuments({
      unlimitedStock: false,
      status: "active",
      $expr: { $lte: ["$stock", "$lowStockThreshold"] },
    }),
    Review.countDocuments({ approved: false }),
    Order.find().sort({ createdAt: -1 }).limit(8).lean(),
    Order.find({
      "delivery.date": { $gte: today },
      status: { $nin: ["CANCELLED", "DELIVERED"] },
    })
      .sort({ "delivery.date": 1 })
      .limit(10)
      .lean(),
    Order.aggregate<{ _id: string; revenue: number; orders: number }>([
      { $match: { ...paid, createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          revenue: { $sum: "$amounts.total" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Order.aggregate<{ _id: string; count: number }>([
      { $match: { status: { $ne: "CANCELLED" } } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Order.aggregate<{ _id: string; quantity: number; revenue: number }>([
      { $match: paid },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.name",
          quantity: { $sum: "$items.quantity" },
          revenue: { $sum: "$items.lineTotal" },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 6 },
    ]),
  ]);

  return {
    cards: {
      todayRevenue: todayRevenue[0]?.total ?? 0,
      todayOrders,
      monthRevenue: monthRevenue[0]?.total ?? 0,
      pendingOrders,
      customRequests,
      ordersToday,
      ordersTomorrow,
      totalCustomers,
      lowStock,
      pendingReviews,
    },
    recentOrders: serialize(recentOrders),
    upcomingOrders: serialize(upcomingOrders),
    charts: {
      revenue: revenueSeries.map((row) => ({
        month: row._id,
        revenue: row.revenue,
        orders: row.orders,
      })),
      status: statusBreakdown.map((row) => ({
        status: row._id,
        count: row.count,
      })),
      topProducts: topProducts.map((row) => ({
        name: row._id,
        quantity: row.quantity,
        revenue: row.revenue,
      })),
    },
  };
}
