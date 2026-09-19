import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connectToDatabase, serialize } from "@/lib/db/mongoose";
import { Product } from "@/models/Product";
import { Category } from "@/models/Category";
import { AddOn } from "@/models/AddOn";
import { AdminPage } from "@/components/admin/AdminShell";
import {
  ProductEditor,
  type ProductDraft,
} from "@/components/admin/ProductEditor";
import { isValidObjectId } from "@/lib/utils";

export const metadata: Metadata = { title: "Edit product" };

export default async function EditProductPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  if (!isValidObjectId(id)) notFound();

  await connectToDatabase();
  const [product, categories, addOns] = await Promise.all([
    Product.findById(id).lean(),
    Category.find().select("name").sort({ sortOrder: 1 }).lean(),
    AddOn.find({ active: true })
      .select("name price group")
      .sort({ sortOrder: 1 })
      .lean(),
  ]);

  if (!product) notFound();

  const draft = serialize(product) as unknown as ProductDraft;

  return (
    <AdminPage
      title={product.name}
      description={`/product/${product.slug}`}
      actions={
        <div className="flex gap-3">
          <Link
            href={`/product/${product.slug}`}
            target="_blank"
            className="text-[13px] font-semibold text-[#16324f] underline underline-offset-4"
          >
            View on site ↗
          </Link>
          <Link
            href="/admin/products"
            className="text-[13px] font-semibold text-[#16324f] underline underline-offset-4"
          >
            ← Back
          </Link>
        </div>
      }
    >
      <ProductEditor
        initial={draft}
        categories={serialize(categories) as never}
        addOns={serialize(addOns) as never}
      />
    </AdminPage>
  );
}
