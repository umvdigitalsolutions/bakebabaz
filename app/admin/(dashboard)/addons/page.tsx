import type { Metadata } from "next";
import { connectToDatabase, serialize } from "@/lib/db/mongoose";
import { AddOn } from "@/models/AddOn";
import { AdminPage } from "@/components/admin/AdminShell";
import { AddOnsManager } from "@/components/admin/resources/AddOnsManager";

export const metadata: Metadata = { title: "Add-ons" };

export default async function AdminAddOnsPage() {
  await connectToDatabase();
  const addOns = await AddOn.find().sort({ sortOrder: 1, name: 1 }).lean();

  return (
    <AdminPage
      title="Add-ons"
      description="Candles, toppers, cards and extras offered on products and in the cake builder."
    >
      <AddOnsManager initial={serialize(addOns) as never} />
    </AdminPage>
  );
}
