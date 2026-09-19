import { createAdminCrud } from "@/lib/admin/crud";
import { addOnSchema } from "@/lib/validation/admin";
import { AddOn } from "@/models/AddOn";

const crud = createAdminCrud({
  model: AddOn,
  schema: addOnSchema,
  sort: { sortOrder: 1, name: 1 },
  searchFields: ["name", "group"],
});

export const { GET, POST, PATCH, DELETE } = crud;
