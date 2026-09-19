"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type Tab = { id: string; label: string; content?: string };

/**
 * Description, ingredients, storage, allergens and delivery — tabs on desktop,
 * stacked disclosures on mobile so nothing is hidden behind a tap.
 */
export function ProductDetails({ tabs }: { tabs: Tab[] }) {
  const present = tabs.filter((tab) => tab.content?.trim());
  const [active, setActive] = useState(present[0]?.id);

  if (!present.length) return null;

  return (
    <div>
      <div
        role="tablist"
        aria-label="Product details"
        className="border-line hidden flex-wrap gap-1 border-b sm:flex"
      >
        {present.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={active === tab.id}
            onClick={() => setActive(tab.id)}
            className={cn(
              "relative px-4 py-3.5 text-sm font-semibold transition-colors",
              active === tab.id ? "text-cocoa" : "text-muted hover:text-cocoa",
            )}
          >
            {tab.label}
            <span
              aria-hidden
              className={cn(
                "bg-coral absolute inset-x-3 -bottom-px h-0.5 transition-transform duration-200",
                active === tab.id ? "scale-x-100" : "scale-x-0",
              )}
            />
          </button>
        ))}
      </div>

      <div className="hidden sm:block">
        {present.map((tab) =>
          active === tab.id ? (
            <div
              key={tab.id}
              role="tabpanel"
              className="prose-warm max-w-[720px] pt-7 whitespace-pre-line"
            >
              {tab.content}
            </div>
          ) : null,
        )}
      </div>

      <div className="divide-line border-line divide-y border-y sm:hidden">
        {present.map((tab) => (
          <details key={tab.id} className="group">
            <summary className="font-display flex cursor-pointer items-center justify-between py-4 text-lg tracking-[-0.01em] [&::-webkit-details-marker]:hidden">
              {tab.label}
              <span
                aria-hidden
                className="bg-cream text-coral-dark grid size-8 place-items-center rounded-full transition-transform group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <div className="prose-warm pb-5 whitespace-pre-line">
              {tab.content}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
