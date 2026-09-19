import type { Metadata } from "next";
import { connectToDatabase, serialize } from "@/lib/db/mongoose";
import { DeliveryZone } from "@/models/DeliveryZone";
import { DeliverySlot } from "@/models/DeliverySlot";
import { getStoreSettings } from "@/lib/data/settings";
import { AdminCard, AdminPage } from "@/components/admin/AdminShell";
import { BlockedDatesEditor } from "@/components/admin/BlockedDatesEditor";
import { SettingsForm } from "@/components/admin/SettingsForm";
import {
  DeliverySlotsManager,
  DeliveryZonesManager,
} from "@/components/admin/resources/DeliveryManagers";

export const metadata: Metadata = { title: "Delivery" };

export default async function AdminDeliveryPage() {
  await connectToDatabase();
  const [zones, slots, settings] = await Promise.all([
    DeliveryZone.find().sort({ pincode: 1 }).lean(),
    DeliverySlot.find().sort({ sortOrder: 1 }).lean(),
    getStoreSettings(),
  ]);

  return (
    <AdminPage
      title="Delivery"
      description="Zones, slots, lead times and closures. All of it is enforced again on the server at checkout."
    >
      <div className="space-y-6">
        <AdminCard
          title="Delivery rules"
          description="Applies across the store unless a zone overrides it."
        >
          <SettingsForm
            initial={settings as never}
            fields={[
              {
                name: "delivery.defaultFee",
                label: "Default delivery charge (₹)",
                type: "price",
              },
              {
                name: "delivery.freeDeliveryThreshold",
                label: "Free delivery above (₹)",
                type: "price",
              },
              {
                name: "delivery.minLeadHours",
                label: "Minimum lead time (hours)",
                type: "number",
                hint: "The soonest any order can be scheduled.",
              },
              {
                name: "delivery.maxDaysAhead",
                label: "Book up to (days ahead)",
                type: "number",
              },
              {
                name: "delivery.storeAddress",
                label: "Store address (for pickup)",
                type: "text",
                colSpan: 2,
              },
              {
                name: "delivery.pickupInstructions",
                label: "Pickup instructions",
                type: "textarea",
                colSpan: 2,
              },
              {
                name: "delivery.pickupEnabled",
                label: "Offer store pickup",
                type: "checkbox",
              },
              {
                name: "delivery.sameDayEnabled",
                label: "Allow same-day orders",
                type: "checkbox",
              },
            ]}
          />
        </AdminCard>

        <AdminCard
          title="Closed dates"
          description="Holidays and days you're not baking."
        >
          <BlockedDatesEditor initial={settings.delivery.blockedDates} />
        </AdminCard>

        <div>
          <h2 className="mb-3 text-[15px] font-semibold">Delivery zones</h2>
          <DeliveryZonesManager initial={serialize(zones) as never} />
        </div>

        <div>
          <h2 className="mb-3 text-[15px] font-semibold">Delivery slots</h2>
          <DeliverySlotsManager initial={serialize(slots) as never} />
        </div>
      </div>
    </AdminPage>
  );
}
