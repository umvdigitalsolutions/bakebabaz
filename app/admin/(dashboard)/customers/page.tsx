import type { Metadata } from "next";
import { connectToDatabase, serialize } from "@/lib/db/mongoose";
import { User } from "@/models/User";
import { Order } from "@/models/Order";
import {
  AdminCard,
  AdminEmpty,
  AdminPage,
} from "@/components/admin/AdminShell";
import { CustomerTable } from "@/components/admin/CustomerTable";

export const metadata: Metadata = { title: "Customers" };

export default async function AdminCustomersPage() {
  await connectToDatabase();

  const users = await User.find()
    .select("name email phone stats createdAt marketingOptIn")
    .sort({ "stats.lastOrderAt": -1, createdAt: -1 })
    .limit(300)
    .lean();

  // Guest checkouts never create an account, so the totals come from orders.
  const [guestSummary] = await Order.aggregate<{ count: number }>([
    { $match: { user: { $exists: false } } },
    { $group: { _id: null, count: { $sum: 1 } } },
  ]);

  return (
    <AdminPage
      title="Customers"
      description="Everyone with an account. Customer details are never exposed outside this panel."
    >
      {users.length === 0 ? (
        <AdminCard>
          <AdminEmpty
            title="No customers yet"
            description="Registered customers appear here with their order history and lifetime value."
          />
        </AdminCard>
      ) : (
        <>
          <CustomerTable initial={serialize(users) as never} />
          {guestSummary?.count ? (
            <p className="mt-3 text-[12.5px] text-[#64748b]">
              Plus {guestSummary.count} guest order
              {guestSummary.count === 1 ? "" : "s"} placed without an account —
              find those under Orders.
            </p>
          ) : null}
        </>
      )}
    </AdminPage>
  );
}
