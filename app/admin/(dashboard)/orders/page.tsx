import type { Metadata } from "next";
import { connectToDatabase, serialize } from "@/lib/db/mongoose";
import { Order } from "@/models/Order";
import { AdminPage } from "@/components/admin/AdminShell";
import { OrdersTable, type OrderRow } from "@/components/admin/OrdersTable";
import type { QueryFilter } from "mongoose";
import type { IOrder } from "@/models/Order";

export const metadata: Metadata = { title: "Orders" };

export default async function AdminOrdersPage(props: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await props.searchParams;
  await connectToDatabase();

  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;

  const orders = await Order.find(filter as QueryFilter<IOrder>)
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  return (
    <AdminPage
      title="Orders"
      description="Search, filter and move orders through the kitchen."
    >
      <OrdersTable initial={serialize(orders) as unknown as OrderRow[]} />
    </AdminPage>
  );
}
