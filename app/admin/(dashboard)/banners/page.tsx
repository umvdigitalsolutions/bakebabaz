import type { Metadata } from "next";
import { connectToDatabase, serialize } from "@/lib/db/mongoose";
import { Banner } from "@/models/Banner";
import { AdminPage } from "@/components/admin/AdminShell";
import { BannersManager } from "@/components/admin/resources/BannersManager";

export const metadata: Metadata = { title: "Banners" };

export default async function AdminBannersPage() {
  await connectToDatabase();
  const banners = await Banner.find()
    .sort({ sortOrder: 1, createdAt: -1 })
    .lean();

  const rows = serialize(banners).map((banner) => ({
    ...banner,
    startsAt: banner.startsAt ? String(banner.startsAt).slice(0, 10) : "",
    endsAt: banner.endsAt ? String(banner.endsAt).slice(0, 10) : "",
  }));

  return (
    <AdminPage
      title="Banners"
      description="Seasonal promotions — Raksha Bandhan, Diwali, Christmas, Valentine's and more."
    >
      <BannersManager initial={rows as never} />
    </AdminPage>
  );
}
