import { createAdminCrud } from "@/lib/admin/crud";
import { categorySchema } from "@/lib/validation/admin";
import { Category } from "@/models/Category";
import { Product } from "@/models/Product";

const crud = createAdminCrud({
  model: Category,
  schema: categorySchema,
  sort: { sortOrder: 1, name: 1 },
  searchFields: ["name", "slug"],
  // Deleting a category would orphan its products, so we refuse.
  beforeDelete: async (id) => {
    const count = await Product.countDocuments({ category: id });
    return count > 0
      ? `${count} product${count === 1 ? "" : "s"} still use this category. Move them first, or deactivate the category instead.`
      : null;
  },
});

export const { GET, POST, PATCH, DELETE } = crud;
