"use client";

import { Input } from "@/components/ui/Field";
import {
  DeliveryDatePicker,
  type SlotOption,
} from "@/components/checkout/DeliveryDatePicker";
import { BuilderSection, FieldGrid, FullWidth } from "./BuilderSection";
import { servingsForWeight } from "@/lib/pricing/engine";
import type { PricingCatalogOption } from "@/lib/pricing/types";
import type { BuilderErrors, BuilderState } from "./types";

export function CelebrationStep({
  state,
  errors,
  update,
  occasions,
  slots,
  minLeadHours,
  blockedDates,
  maxDaysAhead,
  referenceTime,
}: {
  state: BuilderState;
  errors: BuilderErrors;
  update: (patch: Partial<BuilderState>) => void;
  occasions: PricingCatalogOption[];
  slots: SlotOption[];
  minLeadHours: number;
  blockedDates: string[];
  maxDaysAhead: number;
  referenceTime: string;
}) {
  return (
    <BuilderSection
      step={2}
      id="step-celebration"
      title="Your celebration"
      description="The occasion and the date shape everything else."
    >
      <FieldGrid>
        <FullWidth>
          <fieldset className="border-0 p-0">
            <legend className="field-label">
              Occasion<span className="text-coral"> *</span>
            </legend>
            <div className="flex flex-wrap gap-2.5">
              {occasions.map((occasion) => (
                <button
                  key={occasion.value}
                  type="button"
                  data-selected={state.occasion === occasion.value}
                  aria-pressed={state.occasion === occasion.value}
                  onClick={() => update({ occasion: occasion.value })}
                  className="choice-pill min-w-[116px] px-4"
                >
                  {occasion.label}
                </button>
              ))}
            </div>
            {errors.occasion ? (
              <p className="field-error">{errors.occasion}</p>
            ) : null}
          </fieldset>
        </FullWidth>

        <FullWidth>
          <DeliveryDatePicker
            slots={slots}
            minLeadHours={minLeadHours}
            blockedDates={blockedDates}
            maxDaysAhead={maxDaysAhead}
            date={state.requiredDate || undefined}
            slot={state.deliverySlot || undefined}
            onDateChange={(value) =>
              update({ requiredDate: value, deliverySlot: "" })
            }
            onSlotChange={(value) => update({ deliverySlot: value })}
            dateError={errors.requiredDate}
            slotError={errors.deliverySlot}
            label="Required date"
            slotLabel="Preferred time"
            referenceTime={referenceTime}
          />
        </FullWidth>

        <Input
          label="Number of servings"
          type="number"
          min={1}
          max={2000}
          inputMode="numeric"
          placeholder={String(Math.round(state.weightKg * 10))}
          hint={`A ${state.weightKg} kg cake usually gives ${servingsForWeight(state.weightKg)}.`}
          value={state.servings}
          error={errors.servings}
          onChange={(event) => update({ servings: event.target.value })}
        />

        <Input
          label="Quantity"
          type="number"
          min={1}
          max={20}
          inputMode="numeric"
          hint="Ordering more than one identical cake?"
          value={state.quantity}
          onChange={(event) =>
            update({
              quantity: Math.max(
                1,
                Math.min(20, Number(event.target.value) || 1),
              ),
            })
          }
        />
      </FieldGrid>
    </BuilderSection>
  );
}
