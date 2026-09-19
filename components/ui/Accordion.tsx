"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export type AccordionItem = {
  question: string;
  answer: string;
};

/**
 * Matches the reference's FAQ: a Fraunces question, a hairline rule, and a
 * circular "+" that rotates into an "×" when open.
 */
export function Accordion({
  items,
  className,
  defaultOpen,
}: {
  items: AccordionItem[];
  className?: string;
  defaultOpen?: number;
}) {
  const [open, setOpen] = useState<number | null>(defaultOpen ?? null);

  if (!items.length) return null;

  return (
    <div className={cn("border-line border-t", className)}>
      {items.map((item, index) => {
        const isOpen = open === index;
        return (
          <div key={item.question} className="border-line border-b">
            <h3>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : index)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-6 py-6 text-left"
              >
                <span className="font-display text-[19px] leading-snug tracking-[-0.01em] sm:text-[23px]">
                  {item.question}
                </span>
                <span
                  className={cn(
                    "bg-cream text-coral-dark grid size-[34px] flex-none place-items-center rounded-full font-sans text-xl transition-transform duration-200",
                    isOpen && "rotate-45",
                  )}
                  aria-hidden
                >
                  +
                </span>
              </button>
            </h3>
            <div
              className={cn(
                "grid transition-[grid-template-rows] duration-300 ease-out",
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
              )}
            >
              <div className="overflow-hidden">
                <p className="text-muted max-w-[680px] pr-0 pb-7 sm:pr-14">
                  {item.answer}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
