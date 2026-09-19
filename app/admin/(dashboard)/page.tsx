import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarClock,
  IndianRupee,
  MessageSquareQuote,
  Package,
  ShoppingCart,
  Sparkles,
  Users,
} from "lucide-react";
import { getDashboardData } from "@/lib/admin/dashboard";
import {
  AdminCard,
  AdminEmpty,
  AdminPage,
  StatusBadge,
} from "@/components/admin/AdminShell";
import {
  OrdersChart,
  RevenueChart,
  StatusChart,
  TopProductsChart,
} from "@/components/admin/DashboardCharts";
import { formatDate, formatINR } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

export default async function AdminDashboardPage() {
  const data = await getDashboardData();
  const { cards } = data;

  const tiles = [
    {
      label: "Today's revenue",
      value: formatINR(cards.todayRevenue),
      icon: IndianRupee,
      href: "/admin/orders",
    },
    {
      label: "Today's orders",
      value: String(cards.todayOrders),
      icon: ShoppingCart,
      href: "/admin/orders",
    },
    {
      label: "Pending orders",
      value: String(cards.pendingOrders),
      icon: Package,
      href: "/admin/orders?status=ORDER_PLACED",
      accent: cards.pendingOrders > 0,
    },
    {
      label: "Custom cake requests",
      value: String(cards.customRequests),
      icon: Sparkles,
      href: "/admin/custom-orders",
      accent: cards.customRequests > 0,
    },
    {
      label: "Delivering today",
      value: String(cards.ordersToday),
      icon: CalendarClock,
      href: "/admin/orders",
      accent: cards.ordersToday > 0,
    },
    {
      label: "Delivering tomorrow",
      value: String(cards.ordersTomorrow),
      icon: CalendarClock,
      href: "/admin/orders",
    },
    {
      label: "Revenue this month",
      value: formatINR(cards.monthRevenue),
      icon: IndianRupee,
      href: "/admin/orders",
    },
    {
      label: "Total customers",
      value: String(cards.totalCustomers),
      icon: Users,
      href: "/admin/customers",
    },
    {
      label: "Low stock items",
      value: String(cards.lowStock),
      icon: AlertTriangle,
      href: "/admin/products",
      accent: cards.lowStock > 0,
    },
    {
      label: "Reviews to moderate",
      value: String(cards.pendingReviews),
      icon: MessageSquareQuote,
      href: "/admin/reviews",
      accent: cards.pendingReviews > 0,
    },
  ];

  return (
    <AdminPage
      title="Dashboard"
      description="Everything happening in the bakery right now."
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {tiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <Link
              key={tile.label}
              href={tile.href}
              className="admin-card p-4 transition-colors hover:border-[#16324f]/30"
            >
              <span className="flex items-center gap-2 text-[11.5px] font-medium text-[#64748b]">
                <Icon
                  className={
                    tile.accent
                      ? "size-3.5 text-[#b3261e]"
                      : "size-3.5 text-[#94a3b8]"
                  }
                />
                {tile.label}
              </span>
              <p className="mt-2 text-xl font-semibold tabular-nums">
                {tile.value}
              </p>
            </Link>
          );
        })}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <AdminCard
          title="Revenue"
          description="Paid orders over the last six months"
          className="lg:col-span-2"
        >
          <RevenueChart data={data.charts.revenue} />
        </AdminCard>

        <AdminCard
          title="Order status"
          description="Excluding cancelled orders"
        >
          <StatusChart data={data.charts.status} />
        </AdminCard>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <AdminCard title="Orders per month">
          <OrdersChart data={data.charts.revenue} />
        </AdminCard>

        <AdminCard
          title="Top products"
          description="By revenue from paid orders"
        >
          <TopProductsChart data={data.charts.topProducts} />
        </AdminCard>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <AdminCard
          title="Recent orders"
          padded={false}
          actions={
            <Link
              href="/admin/orders"
              className="text-[12.5px] font-semibold text-[#16324f] underline underline-offset-4"
            >
              View all
            </Link>
          }
        >
          {data.recentOrders.length === 0 ? (
            <div className="p-5">
              <AdminEmpty
                title="No orders yet"
                description="Orders placed on the storefront will appear here."
              />
            </div>
          ) : (
            <OrderRows orders={data.recentOrders} />
          )}
        </AdminCard>

        <AdminCard
          title="Upcoming deliveries"
          description="Sorted by required date"
          padded={false}
        >
          {data.upcomingOrders.length === 0 ? (
            <div className="p-5">
              <AdminEmpty
                title="Nothing scheduled"
                description="Upcoming deliveries and pickups will be listed here."
              />
            </div>
          ) : (
            <OrderRows orders={data.upcomingOrders} showDelivery />
          )}
        </AdminCard>
      </div>
    </AdminPage>
  );
}

function OrderRows({
  orders,
  showDelivery,
}: {
  orders: {
    _id: string;
    orderNumber: string;
    contact: { name: string; phone: string };
    status: string;
    createdAt: string;
    delivery: { date: string; slot: string; type: string };
    amounts: { total: number };
  }[];
  showDelivery?: boolean;
}) {
  return (
    <ul className="divide-y divide-[#e3e8ef]">
      {orders.map((order) => (
        <li key={order._id}>
          <Link
            href={`/admin/orders/${order._id}`}
            className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-[#f8fafc]"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13.5px] font-semibold">
                #{order.orderNumber} · {order.contact.name}
              </p>
              <p className="truncate text-[12px] text-[#64748b]">
                {showDelivery
                  ? `${formatDate(order.delivery.date)} · ${order.delivery.slot}`
                  : `${formatDate(order.createdAt)} · ${order.contact.phone}`}
              </p>
            </div>
            <StatusBadge status={order.status} />
            <span className="w-20 flex-none text-right text-[13.5px] font-semibold tabular-nums">
              {formatINR(order.amounts.total)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
