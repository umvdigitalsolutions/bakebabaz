import { createAdminCrud } from "@/lib/admin/crud";
import { customizationOptionSchema } from "@/lib/validation/admin";
import { CustomizationOption } from "@/models/CustomizationOption";

const crud = createAdminCrud({
  model: CustomizationOption,
  schema: customizationOptionSchema,
  sort: { type: 1, sortOrder: 1 },
  searchFields: ["label", "value", "type"],
});

export const { GET, POST, PATCH, DELETE } = crud;
