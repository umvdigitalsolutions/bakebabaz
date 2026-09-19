"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "bestselling", label: "Bestselling" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "rating", label: "Top rated" },
];

export function SortSelect({ hideLabel }: { hideLabel?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  return (
    <label className="flex min-w-0 items-center gap-2.5 text-sm">
      <span className={cn("text-muted", hideLabel && "sr-only")}>Sort</span>
      <select
        value={searchParams.get("sort") ?? "featured"}
        onChange={(event) => {
          const params = new URLSearchParams(searchParams.toString());
          if (event.target.value === "featured") params.delete("sort");
          else params.set("sort", event.target.value);
          params.delete("page");
          const query = params.toString();
          startTransition(() => {
            router.push(query ? `${pathname}?${query}` : pathname, {
              scroll: false,
            });
          });
        }}
        className="field min-h-10 w-auto min-w-0 py-2 text-sm sm:min-w-[170px]"
      >
        {OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
