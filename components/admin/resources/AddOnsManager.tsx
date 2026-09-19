"use client";

import {
  ResourceManager,
  type ResourceField,
} from "@/components/admin/ResourceManager";
import { formatINR } from "@/lib/utils";

const fields: ResourceField[] = [
  { name: "name", label: "Name", type: "text", required: true },
  {
    name: "group",
    label: "Group",
    type: "text",
    defaultValue: "Extras",
    hint: "Add-ons are grouped by this label on the storefront.",
  },
  { name: "price", label: "Price", type: "price", required: true },
  { name: "description", label: "Description", type: "textarea" },
  { name: "image", label: "Image", type: "image", imageFolder: "media" },
  { name: "sortOrder", label: "Sort order", type: "number" },
  { name: "active", label: "Active", type: "checkbox", defaultValue: true },
];

type Row = Record<string, unknown> & { _id: string };

export function AddOnsManager({ initial }: { initial: Row[] }) {
  return (
    <ResourceManager
      endpoint="/api/admin/addons"
      initial={initial}
      fields={fields}
      singular="Add-on"
      plural="Add-ons"
      emptyDescription="Add extras customers can attach to any order."
      columns={[
        {
          key: "name",
          label: "Add-on",
          render: (row) => (
            <div>
              <p className="font-medium">{String(row.name)}</p>
              {row.description ? (
                <p className="text-[11.5px] text-[#94a3b8]">
                  {String(row.description)}
                </p>
              ) : null}
            </div>
          ),
        },
        { key: "group", label: "Group" },
        {
          key: "price",
          label: "Price",
          render: (row) => (
            <span className="font-medium tabular-nums">
              {formatINR(Number(row.price))}
            </span>
          ),
        },
        { key: "sortOrder", label: "Order" },
        {
          key: "active",
          label: "Status",
          render: (row) => (row.active ? "Active" : "Hidden"),
        },
      ]}
    />
  );
}
