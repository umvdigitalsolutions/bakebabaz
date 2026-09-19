import type { Metadata } from "next";
import { connectToDatabase, serialize } from "@/lib/db/mongoose";
import { Review } from "@/models/Review";
import { AdminPage } from "@/components/admin/AdminShell";
import { ReviewModeration } from "@/components/admin/ReviewModeration";

export const metadata: Metadata = { title: "Reviews" };

export default async function AdminReviewsPage() {
  await connectToDatabase();
  const reviews = await Review.find()
    .populate<{ product: { name: string; slug: string } }>(
      "product",
      "name slug",
    )
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();

  return (
    <AdminPage
      title="Reviews"
      description="Nothing appears on the storefront until you approve it. Product ratings recalculate automatically."
    >
      <ReviewModeration initial={serialize(reviews) as never} />
    </AdminPage>
  );
}
