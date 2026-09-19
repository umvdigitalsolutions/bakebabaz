import { createAdminCrud } from "@/lib/admin/crud";
import { deliverySlotSchema } from "@/lib/validation/admin";
import { DeliverySlot } from "@/models/DeliverySlot";

const crud = createAdminCrud({
  model: DeliverySlot,
  schema: deliverySlotSchema,
  sort: { sortOrder: 1 },
  searchFields: ["label"],
});

export const { GET, POST, PATCH, DELETE } = crud;
