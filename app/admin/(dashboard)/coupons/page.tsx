import type { Metadata } from "next";
import { connectToDatabase, serialize } from "@/lib/db/mongoose";
import { Coupon } from "@/models/Coupon";
import { AdminPage } from "@/components/admin/AdminShell";
import { CouponsManager } from "@/components/admin/resources/CouponsManager";

export const metadata: Metadata = { title: "Coupons" };

export default async function AdminCouponsPage() {
  await connectToDatabase();
  const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();

  const rows = serialize(coupons).map((coupon) => ({
    ...coupon,
    startsAt: coupon.startsAt ? String(coupon.startsAt).slice(0, 10) : "",
    expiresAt: coupon.expiresAt ? String(coupon.expiresAt).slice(0, 10) : "",
  }));

  return (
    <AdminPage
      title="Coupons"
      description="Every code is validated on the server at checkout — the browser can't apply a discount on its own."
    >
      <CouponsManager initial={rows as never} />
    </AdminPage>
  );
}
