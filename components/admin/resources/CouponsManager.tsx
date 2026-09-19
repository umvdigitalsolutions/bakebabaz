"use client";

import {
  ResourceManager,
  type ResourceField,
} from "@/components/admin/ResourceManager";
import { formatDate, formatINR } from "@/lib/utils";

const fields: ResourceField[] = [
  {
    name: "code",
    label: "Code",
    type: "text",
    required: true,
    placeholder: "WELCOME10",
    hint: "Customers type this at checkout. Letters, numbers, - and _ only.",
  },
  {
    name: "type",
    label: "Discount type",
    type: "select",
    required: true,
    options: [
      { value: "percentage", label: "Percentage off" },
      { value: "fixed", label: "Fixed amount off" },
      { value: "free_delivery", label: "Free delivery" },
    ],
  },
  {
    name: "value",
    label: "Value",
    type: "number",
    required: true,
    hint: "Percent for percentage coupons, rupees for fixed. Use 0 for free delivery.",
  },
  { name: "description", label: "Description", type: "text", colSpan: 2 },
  { name: "minOrder", label: "Minimum order (₹)", type: "price" },
  {
    name: "maxDiscount",
    label: "Maximum discount (₹)",
    type: "price",
    hint: "Caps percentage coupons. Leave blank for no cap.",
  },
  { name: "startsAt", label: "Starts on", type: "date" },
  { name: "expiresAt", label: "Expires on", type: "date" },
  {
    name: "usageLimit",
    label: "Total uses",
    type: "number",
    hint: "0 means unlimited.",
  },
  {
    name: "perUserLimit",
    label: "Uses per customer",
    type: "number",
    hint: "0 means unlimited.",
  },
  {
    name: "appliesToCustomCakes",
    label: "Also applies to custom cakes",
    type: "checkbox",
    defaultValue: true,
  },
  { name: "active", label: "Active", type: "checkbox", defaultValue: true },
];

type Row = Record<string, unknown> & { _id: string };

export function CouponsManager({ initial }: { initial: Row[] }) {
  return (
    <ResourceManager
      endpoint="/api/admin/coupons"
      initial={initial}
      fields={fields}
      singular="Coupon"
      plural="Coupons"
      emptyDescription="Create a discount code to run a promotion."
      columns={[
        {
          key: "code",
          label: "Code",
          render: (row) => (
            <div>
              <p className="font-mono text-[13px] font-semibold">
                {String(row.code)}
              </p>
              {row.description ? (
                <p className="text-[11.5px] text-[#94a3b8]">
                  {String(row.description)}
                </p>
              ) : null}
            </div>
          ),
        },
        {
          key: "value",
          label: "Discount",
          render: (row) => {
            const type = String(row.type);
            if (type === "free_delivery") return "Free delivery";
            if (type === "percentage") {
              return `${row.value}%${
                row.maxDiscount
                  ? ` (max ${formatINR(Number(row.maxDiscount))})`
                  : ""
              }`;
            }
            return formatINR(Number(row.value));
          },
        },
        {
          key: "minOrder",
          label: "Min order",
          render: (row) =>
            Number(row.minOrder) ? formatINR(Number(row.minOrder)) : "—",
        },
        {
          key: "usedCount",
          label: "Used",
          render: (row) =>
            `${row.usedCount ?? 0}${
              Number(row.usageLimit) ? ` / ${row.usageLimit}` : ""
            }`,
        },
        {
          key: "expiresAt",
          label: "Expires",
          render: (row) =>
            row.expiresAt ? formatDate(String(row.expiresAt)) : "No expiry",
        },
        {
          key: "active",
          label: "Status",
          render: (row) => {
            const expired =
              row.expiresAt && new Date(String(row.expiresAt)) < new Date();
            const label = !row.active ? "Off" : expired ? "Expired" : "Active";
            return (
              <span
                className={
                  label === "Active"
                    ? "rounded-full bg-[#dcfce7] px-2.5 py-1 text-[11px] font-semibold text-[#166534]"
                    : "rounded-full bg-[#f1f5f9] px-2.5 py-1 text-[11px] font-semibold text-[#64748b]"
                }
              >
                {label}
              </span>
            );
          },
        },
      ]}
    />
  );
}
