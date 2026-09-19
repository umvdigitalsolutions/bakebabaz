import type { Metadata } from "next";
import Link from "next/link";
import { connectToDatabase, serialize } from "@/lib/db/mongoose";
import { Category } from "@/models/Category";
import { AddOn } from "@/models/AddOn";
import { AdminPage } from "@/components/admin/AdminShell";
import { ProductEditor, emptyProduct } from "@/components/admin/ProductEditor";

export const metadata: Metadata = { title: "New product" };

export default async function NewProductPage() {
  await connectToDatabase();
  const [categories, addOns] = await Promise.all([
    Category.find({ active: true })
      .select("name")
      .sort({ sortOrder: 1 })
      .lean(),
    AddOn.find({ active: true })
      .select("name price group")
      .sort({ sortOrder: 1 })
      .lean(),
  ]);

  return (
    <AdminPage
      title="New product"
      description="Add a cake, hamper or bake to the shop."
      actions={
        <Link
          href="/admin/products"
          className="text-[13px] font-semibold text-[#16324f] underline underline-offset-4"
        >
          ← Back to products
        </Link>
      }
    >
      <ProductEditor
        initial={emptyProduct}
        categories={serialize(categories) as never}
        addOns={serialize(addOns) as never}
      />
    </AdminPage>
  );
}
