"use client";

import Image from "next/image";
import {
  ResourceManager,
  type ResourceField,
} from "@/components/admin/ResourceManager";
import { formatDate } from "@/lib/utils";

const fields: ResourceField[] = [
  { name: "title", label: "Title", type: "text", required: true },
  { name: "subtitle", label: "Subtitle", type: "text" },
  {
    name: "placement",
    label: "Placement",
    type: "select",
    required: true,
    defaultValue: "home_strip",
    options: [
      { value: "home_hero", label: "Homepage hero" },
      { value: "home_strip", label: "Homepage strip" },
      { value: "shop_top", label: "Top of shop" },
    ],
  },
  {
    name: "desktopImage",
    label: "Desktop image",
    type: "image",
    imageFolder: "banners",
  },
  {
    name: "mobileImage",
    label: "Mobile image",
    type: "image",
    imageFolder: "banners",
  },
  { name: "ctaLabel", label: "Button label", type: "text" },
  {
    name: "ctaLink",
    label: "Button link",
    type: "text",
    placeholder: "/shop/gift-hampers",
  },
  { name: "startsAt", label: "Starts on", type: "date" },
  { name: "endsAt", label: "Ends on", type: "date" },
  { name: "sortOrder", label: "Sort order", type: "number" },
  { name: "active", label: "Active", type: "checkbox", defaultValue: true },
];

type Row = Record<string, unknown> & { _id: string };

export function BannersManager({ initial }: { initial: Row[] }) {
  return (
    <ResourceManager
      endpoint="/api/admin/banners"
      initial={initial}
      fields={fields}
      singular="Banner"
      plural="Banners"
      emptyDescription="Schedule a festive banner and it appears automatically between its start and end dates."
      columns={[
        {
          key: "title",
          label: "Banner",
          render: (row) => (
            <div className="flex items-center gap-3">
              <span className="relative h-9 w-16 flex-none overflow-hidden rounded-lg bg-[#f1f5f9]">
                {(row.desktopImage as { url?: string } | undefined)?.url ? (
                  <Image
                    src={(row.desktopImage as { url: string }).url}
                    alt=""
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                ) : null}
              </span>
              <div className="min-w-0">
                <p className="truncate font-medium">{String(row.title)}</p>
                {row.subtitle ? (
                  <p className="truncate text-[11.5px] text-[#94a3b8]">
                    {String(row.subtitle)}
                  </p>
                ) : null}
              </div>
            </div>
          ),
        },
        {
          key: "placement",
          label: "Placement",
          render: (row) => String(row.placement).replace(/_/g, " "),
        },
        {
          key: "startsAt",
          label: "Runs",
          render: (row) =>
            row.startsAt || row.endsAt
              ? `${row.startsAt ? formatDate(String(row.startsAt)) : "now"} → ${
                  row.endsAt ? formatDate(String(row.endsAt)) : "ongoing"
                }`
              : "Always",
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
