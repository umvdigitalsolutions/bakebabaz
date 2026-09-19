import { createAdminCrud } from "@/lib/admin/crud";
import { deliveryZoneSchema } from "@/lib/validation/admin";
import { DeliveryZone } from "@/models/DeliveryZone";

const crud = createAdminCrud({
  model: DeliveryZone,
  schema: deliveryZoneSchema,
  sort: { pincode: 1 },
  searchFields: ["pincode", "area"],
});

export const { GET, POST, PATCH, DELETE } = crud;
