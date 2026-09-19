"use client";

import {
  ResourceManager,
  type ResourceField,
} from "@/components/admin/ResourceManager";
import { formatINR } from "@/lib/utils";

const zoneFields: ResourceField[] = [
  {
    name: "pincode",
    label: "PIN code",
    type: "text",
    required: true,
    placeholder: "334001",
  },
  {
    name: "area",
    label: "Area name",
    type: "text",
    required: true,
    placeholder: "Bikaner City / Kote Gate",
  },
  { name: "fee", label: "Delivery charge (₹)", type: "price", required: true },
  {
    name: "minOrder",
    label: "Minimum order (₹)",
    type: "price",
    hint: "0 means no minimum for this area.",
  },
  {
    name: "freeAbove",
    label: "Free delivery above (₹)",
    type: "price",
    hint: "Leave blank to use the store-wide threshold.",
  },
  {
    name: "sameDayAvailable",
    label: "Same-day delivery available",
    type: "checkbox",
    defaultValue: true,
  },
  { name: "active", label: "Active", type: "checkbox", defaultValue: true },
];

const slotFields: ResourceField[] = [
  {
    name: "label",
    label: "Slot label",
    type: "text",
    required: true,
    placeholder: "10:00 AM – 12:00 PM",
  },
  {
    name: "startTime",
    label: "Starts at",
    type: "time",
    required: true,
    hint: "Used to check the order has enough preparation time.",
  },
  { name: "endTime", label: "Ends at", type: "time", required: true },
  { name: "surcharge", label: "Surcharge (₹)", type: "price" },
  {
    name: "maxOrders",
    label: "Max orders per day",
    type: "number",
    hint: "0 means unlimited.",
  },
  { name: "sortOrder", label: "Sort order", type: "number" },
  { name: "active", label: "Active", type: "checkbox", defaultValue: true },
];

type Row = Record<string, unknown> & { _id: string };

export function DeliveryZonesManager({ initial }: { initial: Row[] }) {
  return (
    <ResourceManager
      endpoint="/api/admin/delivery-zones"
      initial={initial}
      fields={zoneFields}
      singular="Zone"
      plural="Delivery zones"
      searchPlaceholder="Search by PIN code or area…"
      emptyDescription="Add a PIN code before customers in that area can check out."
      columns={[
        {
          key: "pincode",
          label: "PIN code",
          render: (row) => (
            <span className="font-mono font-semibold">
              {String(row.pincode)}
            </span>
          ),
        },
        { key: "area", label: "Area" },
        {
          key: "fee",
          label: "Charge",
          render: (row) => formatINR(Number(row.fee)),
        },
        {
          key: "minOrder",
          label: "Min order",
          render: (row) =>
            Number(row.minOrder) ? formatINR(Number(row.minOrder)) : "—",
        },
        {
          key: "sameDayAvailable",
          label: "Same day",
          render: (row) => (row.sameDayAvailable ? "Yes" : "No"),
        },
        {
          key: "active",
          label: "Status",
          render: (row) => (row.active ? "Active" : "Off"),
        },
      ]}
    />
  );
}

export function DeliverySlotsManager({ initial }: { initial: Row[] }) {
  return (
    <ResourceManager
      endpoint="/api/admin/delivery-slots"
      initial={initial}
      fields={slotFields}
      singular="Slot"
      plural="Delivery slots"
      emptyDescription="Customers need at least one slot before they can check out."
      columns={[
        { key: "label", label: "Slot" },
        {
          key: "startTime",
          label: "Window",
          render: (row) => `${row.startTime} – ${row.endTime}`,
        },
        {
          key: "surcharge",
          label: "Surcharge",
          render: (row) =>
            Number(row.surcharge) ? formatINR(Number(row.surcharge)) : "—",
        },
        {
          key: "maxOrders",
          label: "Capacity",
          render: (row) =>
            Number(row.maxOrders) ? String(row.maxOrders) : "Unlimited",
        },
        { key: "sortOrder", label: "Order" },
        {
          key: "active",
          label: "Status",
          render: (row) => (row.active ? "Active" : "Off"),
        },
      ]}
    />
  );
}
