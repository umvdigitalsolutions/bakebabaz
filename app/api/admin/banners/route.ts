import { createAdminCrud } from "@/lib/admin/crud";
import { bannerSchema } from "@/lib/validation/admin";
import { Banner } from "@/models/Banner";

const crud = createAdminCrud({
  model: Banner,
  schema: bannerSchema,
  sort: { sortOrder: 1, createdAt: -1 },
  searchFields: ["title", "subtitle"],
});

export const { GET, POST, PATCH, DELETE } = crud;
