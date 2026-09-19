import type { Metadata } from "next";
import { connectToDatabase, serialize } from "@/lib/db/mongoose";
import { Product } from "@/models/Product";
import { AdminPage } from "@/components/admin/AdminShell";
import { ProductTable, type ProductRow } from "@/components/admin/ProductTable";

export const metadata: Metadata = { title: "Products" };

export default async function AdminProductsPage() {
  await connectToDatabase();
  const products = await Product.find()
    .populate<{ category: { name: string } }>("category", "name")
    .sort({ updatedAt: -1 })
    .limit(400)
    .lean();

  return (
    <AdminPage
      title="Products"
      description="Everything in the shop. New products appear on the storefront the moment you set them active."
    >
      <ProductTable initial={serialize(products) as unknown as ProductRow[]} />
    </AdminPage>
  );
}
