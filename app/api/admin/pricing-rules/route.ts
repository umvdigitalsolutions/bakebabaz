import { createAdminCrud } from "@/lib/admin/crud";
import { pricingRuleSchema } from "@/lib/validation/admin";
import { PricingRule } from "@/models/PricingRule";

const crud = createAdminCrud({
  model: PricingRule,
  schema: pricingRuleSchema,
  sort: { sortOrder: 1 },
  searchFields: ["code", "label"],
  writeRole: "owner",
});

export const { GET, POST, PATCH, DELETE } = crud;
