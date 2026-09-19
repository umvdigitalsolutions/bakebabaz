"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const STUDIO_STEPS = [
  "Occasion",
  "Size",
  "Flavour",
  "Style",
  "Colours",
  "Message",
  "References",
] as const;

export function StudioProgress({
  currentStep,
  onStepChange,
}: {
  currentStep: number;
  onStepChange: (step: number) => void;
}) {
  const progress = ((currentStep + 1) / STUDIO_STEPS.length) * 100;

  return (
    <div>
      <div className="mb-7 md:hidden">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-coral-dark text-[11px] font-bold tracking-[0.13em] uppercase">
              Step {currentStep + 1} of {STUDIO_STEPS.length}
            </p>
            <p className="font-display mt-1 text-2xl">
              {STUDIO_STEPS[currentStep]}
            </p>
          </div>
          <span className="text-muted text-xs tabular-nums">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="bg-cream-deep mt-3 h-1.5 overflow-hidden rounded-full">
          <div
            className="bg-coral h-full rounded-full transition-[width] duration-300 motion-reduce:transition-none"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <ol className="hidden grid-cols-7 gap-2 md:grid">
        {STUDIO_STEPS.map((label, index) => {
          const complete = index < currentStep;
          const active = index === currentStep;
          return (
            <li key={label}>
              <button
                type="button"
                onClick={() => onStepChange(index)}
                aria-current={active ? "step" : undefined}
                className="group w-full text-left"
              >
                <span
                  className={cn(
                    "mb-3 block h-1 rounded-full transition-colors",
                    index <= currentStep ? "bg-coral" : "bg-cream-deep",
                  )}
                />
                <span
                  className={cn(
                    "flex items-center gap-1.5 text-[10px] font-bold tracking-[0.08em] uppercase",
                    active ? "text-coral-dark" : "text-muted",
                  )}
                >
                  {complete ? <Check className="size-3" /> : `0${index + 1}`}
                  <span className="truncate">{label}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
