"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn, formatINR } from "@/lib/utils";
import type { CategoryData } from "@/lib/data/catalog";
import { SortSelect } from "./SortSelect";

export type Facets = {
  flavours: string[];
  occasions: string[];
  weights: string[];
  minPrice: number;
  maxPrice: number;
};

const PRICE_BANDS = [
  { label: "Under ₹500", min: 0, max: 500 },
  { label: "₹500 – ₹1,000", min: 500, max: 1000 },
  { label: "₹1,000 – ₹2,000", min: 1000, max: 2000 },
  { label: "₹2,000 – ₹5,000", min: 2000, max: 5000 },
  { label: "Above ₹5,000", min: 5000, max: undefined },
];

/** Chip groups longer than this collapse behind a "Show all" toggle. */
const CHIP_LIMIT = 8;

export function ShopFilters({
  categories,
  facets,
  activeCategorySlug,
  totalResults,
}: {
  categories: CategoryData[];
  facets: Facets;
  activeCategorySlug?: string;
  totalResults: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [mobileOpen, setMobileOpen] = useState(false);

  /** Every filter is a URL parameter, so results are shareable and bookmarkable. */
  const setParam = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value == null || value === "") params.delete(key);
        else params.set(key, value);
      }
      params.delete("page");
      const query = params.toString();
      startTransition(() => {
        router.push(query ? `${pathname}?${query}` : pathname, {
          scroll: false,
        });
      });
    },
    [pathname, router, searchParams],
  );

  // Clearing filters keeps the shopper in the collection they're browsing.
  const clearAll = () => {
    const sort = searchParams.get("sort");
    startTransition(() => {
      router.push(
        sort ? `${pathname}?sort=${encodeURIComponent(sort)}` : pathname,
        {
          scroll: false,
        },
      );
    });
  };

  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [mobileOpen]);

  const activeFilters = [
    searchParams.get("q") && { key: "q", label: `“${searchParams.get("q")}”` },
    searchParams.get("flavour") && {
      key: "flavour",
      label: searchParams.get("flavour")!,
    },
    searchParams.get("occasion") && {
      key: "occasion",
      label: searchParams.get("occasion")!,
    },
    searchParams.get("weight") && {
      key: "weight",
      label: searchParams.get("weight")!,
    },
    searchParams.get("eggless") && { key: "eggless", label: "Eggless" },
    searchParams.get("veg") && { key: "veg", label: "Vegetarian" },
    searchParams.get("inStock") && { key: "inStock", label: "In stock" },
    (searchParams.get("min") || searchParams.get("max")) && {
      key: "price",
      label: `${formatINR(Number(searchParams.get("min") ?? 0))} – ${
        searchParams.get("max")
          ? formatINR(Number(searchParams.get("max")))
          : "any"
      }`,
    },
  ].filter(Boolean) as { key: string; label: string }[];

  const toggle = (key: string, value: string) =>
    setParam({ [key]: searchParams.get(key) === value ? undefined : value });

  const body = (
    <div className={cn("space-y-8", pending && "opacity-60")}>
      <FilterGroup title="Collections">
        <ul className="space-y-1.5">
          <li>
            <FilterLink
              href="/shop"
              active={!activeCategorySlug}
              onNavigate={() => setMobileOpen(false)}
            >
              All bakes
            </FilterLink>
          </li>
          {categories.map((category) => (
            <li key={category.id}>
              <FilterLink
                href={`/shop/${category.slug}`}
                active={activeCategorySlug === category.slug}
                onNavigate={() => setMobileOpen(false)}
              >
                <span>{category.name}</span>
                {category.productCount != null ? (
                  <span className="text-muted text-xs">
                    {category.productCount}
                  </span>
                ) : null}
              </FilterLink>
            </li>
          ))}
        </ul>
      </FilterGroup>

      <FilterGroup title="Price">
        <div className="flex flex-wrap gap-2">
          {PRICE_BANDS.map((band) => {
            const active =
              searchParams.get("min") === String(band.min) &&
              (band.max == null
                ? !searchParams.get("max")
                : searchParams.get("max") === String(band.max));
            return (
              <ToggleChip
                key={band.label}
                active={active}
                onClick={() =>
                  setParam(
                    active
                      ? { min: undefined, max: undefined }
                      : {
                          min: String(band.min),
                          max: band.max ? String(band.max) : undefined,
                        },
                  )
                }
              >
                {band.label}
              </ToggleChip>
            );
          })}
        </div>
      </FilterGroup>

      <FilterGroup title="Dietary">
        <div className="flex flex-wrap gap-2">
          <ToggleChip
            active={searchParams.get("eggless") === "1"}
            onClick={() => toggle("eggless", "1")}
          >
            Eggless
          </ToggleChip>
          <ToggleChip
            active={searchParams.get("veg") === "1"}
            onClick={() => toggle("veg", "1")}
          >
            Vegetarian
          </ToggleChip>
          <ToggleChip
            active={searchParams.get("inStock") === "1"}
            onClick={() => toggle("inStock", "1")}
          >
            In stock only
          </ToggleChip>
        </div>
      </FilterGroup>

      <ChipGroup
        title="Flavour"
        values={facets.flavours}
        active={searchParams.get("flavour")}
        onToggle={(value) => toggle("flavour", value)}
      />
      <ChipGroup
        title="Occasion"
        values={facets.occasions}
        active={searchParams.get("occasion")}
        onToggle={(value) => toggle("occasion", value)}
      />
      <ChipGroup
        title="Weight"
        values={facets.weights}
        active={searchParams.get("weight")}
        onToggle={(value) => toggle("weight", value)}
      />

      {activeFilters.length > 0 ? (
        <Button variant="outline" size="sm" onClick={clearAll} fullWidth>
          Clear all filters
        </Button>
      ) : null}
    </div>
  );

  return (
    <>
      {/* Mobile trigger, sharing its row with the sort control */}
      <div className="mb-5 flex items-center justify-between gap-3 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="border-line inline-flex min-h-11 flex-none items-center gap-2 rounded-full border bg-white px-4 text-sm font-semibold"
        >
          <SlidersHorizontal className="size-4" />
          Filters
          {activeFilters.length > 0 ? (
            <span className="bg-coral grid size-5 place-items-center rounded-full text-[11px] text-white">
              {activeFilters.length}
            </span>
          ) : null}
        </button>
        <SortSelect hideLabel />
      </div>

      {activeFilters.length > 0 ? (
        <div className="mb-6 flex flex-wrap gap-2 lg:hidden">
          {activeFilters.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() =>
                filter.key === "price"
                  ? setParam({ min: undefined, max: undefined })
                  : setParam({ [filter.key]: undefined })
              }
              aria-label={`Remove filter: ${filter.label}`}
              className="bg-coral-soft text-coral-dark inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-semibold"
            >
              {filter.label}
              <X className="size-3" />
            </button>
          ))}
        </div>
      ) : null}

      <aside className="hidden lg:block">{body}</aside>

      {mobileOpen ? (
        <div
          className="fixed inset-0 z-[200] lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Filters"
        >
          <div
            className="bg-cocoa/40 absolute inset-0"
            onClick={() => setMobileOpen(false)}
          />
          <div className="bg-paper absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col rounded-t-[26px]">
            <div className="border-line flex flex-none items-center justify-between border-b px-6 py-4">
              <h2 className="font-display text-2xl tracking-[-0.02em]">
                Filters
              </h2>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close filters"
                className="border-line grid size-9 place-items-center rounded-full border"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
              {body}
            </div>
            <div className="border-line flex-none border-t px-6 pt-4 pb-[calc(16px+env(safe-area-inset-bottom))]">
              <Button
                variant="coral"
                fullWidth
                onClick={() => setMobileOpen(false)}
              >
                Show {totalResults} {totalResults === 1 ? "result" : "results"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function FilterGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-muted mb-3.5 text-[11px] font-bold tracking-[0.14em] uppercase">
        {title}
      </h3>
      {children}
    </div>
  );
}

function ChipGroup({
  title,
  values,
  active,
  onToggle,
}: {
  title: string;
  values: string[];
  active: string | null;
  onToggle: (value: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  if (!values.length) return null;

  const activeIndex = active ? values.indexOf(active) : -1;
  // Never hide the chip that's currently applied.
  const showAll = expanded || activeIndex >= CHIP_LIMIT;
  const visible = showAll ? values : values.slice(0, CHIP_LIMIT);
  const hidden = values.length - CHIP_LIMIT;

  return (
    <FilterGroup title={title}>
      <div className="flex flex-wrap gap-2">
        {visible.map((value) => (
          <ToggleChip
            key={value}
            active={active === value}
            onClick={() => onToggle(value)}
          >
            {value}
          </ToggleChip>
        ))}
      </div>
      {hidden > 0 && activeIndex < CHIP_LIMIT ? (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          aria-expanded={expanded}
          className="text-coral-dark mt-3 text-[13px] font-semibold underline-offset-4 hover:underline"
        >
          {expanded ? "Show fewer" : `Show all ${values.length}`}
        </button>
      ) : null}
    </FilterGroup>
  );
}

function FilterLink({
  href,
  active,
  onNavigate,
  children,
}: {
  href: string;
  active?: boolean;
  onNavigate: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-[15px] transition-colors",
        active
          ? "bg-coral-soft text-coral-dark font-semibold"
          : "hover:bg-cream",
      )}
    >
      {children}
    </Link>
  );
}

function ToggleChip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      data-selected={active}
      aria-pressed={active}
      onClick={onClick}
      className="choice-pill min-h-10 px-3.5 text-[13px]"
    >
      {children}
    </button>
  );
}
