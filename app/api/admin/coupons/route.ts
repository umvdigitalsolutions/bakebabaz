import { createAdminCrud } from "@/lib/admin/crud";
import { couponAdminSchema } from "@/lib/validation/admin";
import { Coupon } from "@/models/Coupon";

const crud = createAdminCrud({
  model: Coupon,
  schema: couponAdminSchema,
  sort: { createdAt: -1 },
  searchFields: ["code", "description"],
});

export const { GET, POST, PATCH, DELETE } = crud;
