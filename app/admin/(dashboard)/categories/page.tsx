import type { Metadata } from "next";
import { connectToDatabase, serialize } from "@/lib/db/mongoose";
import { Category } from "@/models/Category";
import { Product } from "@/models/Product";
import { AdminPage } from "@/components/admin/AdminShell";
import { CategoriesManager } from "@/components/admin/resources/CategoriesManager";

export const metadata: Metadata = { title: "Categories" };

export default async function AdminCategoriesPage() {
  await connectToDatabase();
  const [categories, counts] = await Promise.all([
    Category.find().sort({ sortOrder: 1, name: 1 }).lean(),
    Product.aggregate<{ _id: string; count: number }>([
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]),
  ]);

  const countMap = new Map(counts.map((row) => [String(row._id), row.count]));
  const rows = serialize(categories).map((category) => ({
    ...category,
    productCount: countMap.get(String(category._id)) ?? 0,
  }));

  return (
    <AdminPage
      title="Categories"
      description="Collections shown across the shop. Reorder with the sort field."
    >
      <CategoriesManager initial={rows as never} />
    </AdminPage>
  );
}
