"use client";

import {
  ResourceManager,
  type ResourceField,
} from "@/components/admin/ResourceManager";
import { CUSTOMIZATION_TYPES } from "@/types";
import { formatINR } from "@/lib/utils";

export const TYPE_LABELS: Record<string, string> = {
  flavour: "Flavour",
  filling: "Filling",
  shape: "Shape",
  style: "Cake style",
  tier: "Tiers",
  weight: "Weight",
  occasion: "Occasion",
};

/** Shared by both tables: options and rules describe prices the same way. */
function priceLabel(row: Record<string, unknown>) {
  const amount = Number(row.modifierAmount ?? row.amount ?? 0);
  const kind = String(row.modifierKind ?? row.kind ?? "flat");
  if (!amount) return "Included";
  if (kind === "percent") return `+${amount}%`;
  if (kind === "per_kg") return `+${formatINR(amount)}/kg`;
  return `+${formatINR(amount)}`;
}

const optionFields: ResourceField[] = [
  {
    name: "type",
    label: "Option type",
    type: "select",
    required: true,
    options: CUSTOMIZATION_TYPES.map((type) => ({
      value: type,
      label: TYPE_LABELS[type] ?? type,
    })),
  },
  { name: "label", label: "Label", type: "text", required: true },
  {
    name: "value",
    label: "Value",
    type: "text",
    required: true,
    slugFrom: "label",
    hint: "Stored on orders. Lowercase, no spaces.",
  },
  { name: "description", label: "Description", type: "textarea" },
  {
    name: "modifierKind",
    label: "Price applies as",
    type: "select",
    required: true,
    defaultValue: "flat",
    options: [
      { value: "flat", label: "Flat amount (₹)" },
      { value: "per_kg", label: "Per kilogram (₹/kg)" },
      { value: "percent", label: "Percent of base (%)" },
    ],
  },
  { name: "modifierAmount", label: "Amount", type: "price", defaultValue: 0 },
  {
    name: "numericValue",
    label: "Numeric value",
    type: "number",
    step: 0.5,
    hint: "For weight options, the value in kilograms.",
  },
  {
    name: "extraPrepHours",
    label: "Extra preparation (hours)",
    type: "number",
    hint: "Added to the lead time when this option is chosen.",
    defaultValue: 0,
  },
  { name: "badge", label: "Badge", type: "text", placeholder: "Premium" },
  { name: "sortOrder", label: "Sort order", type: "number" },
  { name: "active", label: "Active", type: "checkbox", defaultValue: true },
];

const ruleFields: ResourceField[] = [
  {
    name: "code",
    label: "Code",
    type: "text",
    required: true,
    hint: "Referenced by the pricing engine. Lowercase with underscores.",
  },
  { name: "label", label: "Label", type: "text", required: true },
  {
    name: "kind",
    label: "Applies as",
    type: "select",
    required: true,
    defaultValue: "flat",
    options: [
      { value: "flat", label: "Flat amount (₹)" },
      { value: "per_kg", label: "Per kilogram (₹/kg)" },
      { value: "percent", label: "Percent (%)" },
    ],
  },
  { name: "amount", label: "Amount", type: "price", required: true },
  { name: "description", label: "Description", type: "textarea" },
  { name: "sortOrder", label: "Sort order", type: "number" },
  { name: "active", label: "Active", type: "checkbox", defaultValue: true },
];

type Row = Record<string, unknown> & { _id: string };

export function CustomizationOptionsManager({ initial }: { initial: Row[] }) {
  return (
    <ResourceManager
      endpoint="/api/admin/customizations"
      initial={initial}
      fields={optionFields}
      singular="Option"
      plural="Cake options"
      emptyDescription="Add flavours, fillings, shapes and styles for the cake builder."
      columns={[
        {
          key: "type",
          label: "Type",
          render: (row) => (
            <span className="rounded-full bg-[#eef2f6] px-2.5 py-1 text-[11px] font-semibold text-[#475569] capitalize">
              {TYPE_LABELS[String(row.type)] ?? String(row.type)}
            </span>
          ),
        },
        {
          key: "label",
          label: "Option",
          render: (row) => (
            <div>
              <p className="font-medium">{String(row.label)}</p>
              <p className="text-[11.5px] text-[#94a3b8]">
                {String(row.value)}
              </p>
            </div>
          ),
        },
        {
          key: "modifierAmount",
          label: "Price",
          render: (row) => (
            <span className="font-medium tabular-nums">{priceLabel(row)}</span>
          ),
        },
        {
          key: "extraPrepHours",
          label: "Extra prep",
          render: (row) =>
            Number(row.extraPrepHours) ? `+${row.extraPrepHours}h` : "—",
        },
        {
          key: "active",
          label: "Status",
          render: (row) => (row.active ? "Active" : "Hidden"),
        },
      ]}
    />
  );
}

export function PricingRulesManager({ initial }: { initial: Row[] }) {
  return (
    <ResourceManager
      endpoint="/api/admin/pricing-rules"
      initial={initial}
      fields={ruleFields}
      singular="Pricing rule"
      plural="Pricing rules"
      emptyDescription="Rules cover charges that aren't tied to one option, like rush fees."
      columns={[
        {
          key: "label",
          label: "Rule",
          render: (row) => (
            <div>
              <p className="font-medium">{String(row.label)}</p>
              <p className="text-[11.5px] text-[#94a3b8]">{String(row.code)}</p>
            </div>
          ),
        },
        {
          key: "amount",
          label: "Amount",
          render: (row) => (
            <span className="font-medium tabular-nums">{priceLabel(row)}</span>
          ),
        },
        { key: "description", label: "Notes" },
        {
          key: "active",
          label: "Status",
          render: (row) => (row.active ? "Active" : "Off"),
        },
      ]}
    />
  );
}
