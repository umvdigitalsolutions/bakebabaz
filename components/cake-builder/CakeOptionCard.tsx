"use client";

import Image from "next/image";
import { cn, formatINR } from "@/lib/utils";
import type { PricingCatalogOption } from "@/lib/pricing/types";

/**
 * One selectable choice in the builder. Shows what it adds to the price so the
 * customer is never surprised by the total.
 */
export function CakeOptionCard({
  option,
  selected,
  onSelect,
  weightKg,
  variant = "pill",
}: {
  option: PricingCatalogOption;
  selected: boolean;
  onSelect: () => void;
  weightKg: number;
  variant?: "pill" | "tile";
}) {
  const delta =
    option.modifierKind === "per_kg"
      ? option.modifierAmount * weightKg
      : option.modifierAmount;

  if (variant === "tile") {
    return (
      <button
        type="button"
        onClick={onSelect}
        data-selected={selected}
        aria-pressed={selected}
        className={cn(
          "group bg-paper flex flex-col overflow-hidden rounded-2xl border text-left transition-all duration-200",
          selected
            ? "border-coral bg-coral-soft/50 shadow-[0_8px_20px_rgba(239,102,95,.12)]"
            : "border-line hover:border-line-strong",
        )}
      >
        {option.image ? (
          <span className="bg-cream relative block aspect-[4/3] w-full">
            <Image
              src={option.image.url}
              alt=""
              fill
              sizes="200px"
              className="object-cover"
            />
          </span>
        ) : null}
        <span className="flex flex-1 flex-col p-3.5">
          <span className="flex items-start justify-between gap-2">
            <span className="text-sm leading-snug font-semibold">
              {option.label}
            </span>
            {option.badge ? (
              <span className="bg-cocoa flex-none rounded-full px-2 py-0.5 text-[9.5px] font-bold tracking-[0.08em] text-white uppercase">
                {option.badge}
              </span>
            ) : null}
          </span>
          {option.description ? (
            <span className="text-muted mt-1 text-xs leading-relaxed">
              {option.description}
            </span>
          ) : null}
          <span
            className={cn(
              "mt-2 text-xs font-bold",
              delta > 0 ? "text-coral-dark" : "text-muted",
            )}
          >
            {delta > 0 ? `+${formatINR(delta)}` : "Included"}
          </span>
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      data-selected={selected}
      aria-pressed={selected}
      className="choice-pill flex-col gap-0 px-4 py-2.5 leading-tight"
      title={option.description}
    >
      <span className="flex items-center gap-1.5">
        {option.label}
        {option.badge ? (
          <span className="bg-cocoa rounded-full px-1.5 py-px text-[9px] font-bold tracking-[0.06em] text-white uppercase">
            {option.badge}
          </span>
        ) : null}
      </span>
      <span className="text-[11px] font-medium opacity-70">
        {delta > 0 ? `+${formatINR(delta)}` : "Included"}
      </span>
    </button>
  );
}
