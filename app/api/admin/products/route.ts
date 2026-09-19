import { createAdminCrud } from "@/lib/admin/crud";
import { productSchema } from "@/lib/validation/admin";
import { Product } from "@/models/Product";

const crud = createAdminCrud({
  model: Product,
  schema: productSchema,
  sort: { updatedAt: -1 },
  searchFields: ["name", "slug", "sku", "tags"],
  populate: "category",
});

export const { GET, POST, PATCH, DELETE } = crud;
