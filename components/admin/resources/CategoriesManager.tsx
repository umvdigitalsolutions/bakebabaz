"use client";

import Image from "next/image";
import {
  ResourceManager,
  type ResourceField,
} from "@/components/admin/ResourceManager";

/**
 * Column renderers are functions, so they cannot cross the server/client
 * boundary. Each resource keeps its table and form configuration in its own
 * client module, and the server page passes nothing but data.
 */
const fields: ResourceField[] = [
  { name: "name", label: "Name", type: "text", required: true },
  {
    name: "slug",
    label: "URL slug",
    type: "text",
    required: true,
    slugFrom: "name",
    hint: "Appears as /shop/your-slug",
  },
  { name: "icon", label: "Emoji icon", type: "text", placeholder: "🎂" },
  { name: "sortOrder", label: "Sort order", type: "number" },
  {
    name: "description",
    label: "Description",
    type: "textarea",
    hint: "Shown on the collection card and category header.",
  },
  {
    name: "image",
    label: "Cover image",
    type: "image",
    imageFolder: "categories",
  },
  {
    name: "prepTimeHours",
    label: "Minimum preparation (hours)",
    type: "number",
    hint: "Blocks delivery slots that don't allow enough time.",
    defaultValue: 6,
  },
  { name: "seo.title", label: "SEO title", type: "text" },
  { name: "seo.description", label: "SEO description", type: "textarea" },
  { name: "active", label: "Active", type: "checkbox", defaultValue: true },
  {
    name: "featured",
    label: "Feature on the homepage",
    type: "checkbox",
    hint: "The homepage shows the first four featured collections.",
  },
];

type Row = Record<string, unknown> & { _id: string };

export function CategoriesManager({ initial }: { initial: Row[] }) {
  return (
    <ResourceManager
      endpoint="/api/admin/categories"
      initial={initial}
      fields={fields}
      singular="Category"
      plural="Categories"
      emptyDescription="Create a category before adding products — every product needs one."
      columns={[
        {
          key: "name",
          label: "Category",
          render: (row) => (
            <div className="flex items-center gap-3">
              <span className="relative size-9 flex-none overflow-hidden rounded-lg bg-[#f1f5f9]">
                {(row.image as { url?: string } | undefined)?.url ? (
                  <Image
                    src={(row.image as { url: string }).url}
                    alt=""
                    fill
                    sizes="36px"
                    className="object-cover"
                  />
                ) : (
                  <span className="grid h-full place-items-center text-sm">
                    {String(row.icon ?? "🎂")}
                  </span>
                )}
              </span>
              <div className="min-w-0">
                <p className="truncate font-medium">{String(row.name)}</p>
                <p className="truncate text-[11.5px] text-[#94a3b8]">
                  /shop/{String(row.slug)}
                </p>
              </div>
            </div>
          ),
        },
        {
          key: "productCount",
          label: "Products",
          render: (row) => (
            <span className="tabular-nums">
              {String(row.productCount ?? 0)}
            </span>
          ),
        },
        {
          key: "prepTimeHours",
          label: "Prep",
          render: (row) => `${row.prepTimeHours ?? 0}h`,
        },
        { key: "sortOrder", label: "Order" },
        {
          key: "active",
          label: "Status",
          render: (row) => (
            <span
              className={
                row.active
                  ? "rounded-full bg-[#dcfce7] px-2.5 py-1 text-[11px] font-semibold text-[#166534]"
                  : "rounded-full bg-[#f1f5f9] px-2.5 py-1 text-[11px] font-semibold text-[#64748b]"
              }
            >
              {row.active ? "Active" : "Hidden"}
              {row.featured ? " · Featured" : ""}
            </span>
          ),
        },
      ]}
    />
  );
}
