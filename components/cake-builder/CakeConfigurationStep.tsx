"use client";

import { Input, Textarea } from "@/components/ui/Field";
import { BuilderSection, FieldGrid, FullWidth } from "./BuilderSection";
import { CakeOptionCard } from "./CakeOptionCard";
import { servingsForWeight } from "@/lib/pricing/engine";
import { formatINR } from "@/lib/utils";
import type { PricingCatalog, PricingCatalogOption } from "@/lib/pricing/types";
import type { BuilderErrors, BuilderState } from "./types";

const TIER_LABELS: Record<number, string> = {
  1: "Single tier",
  2: "Two tiers",
  3: "Three tiers",
  4: "Four or more",
};

export function CakeConfigurationStep({
  state,
  errors,
  update,
  catalog,
  optionsByType,
}: {
  state: BuilderState;
  errors: BuilderErrors;
  update: (patch: Partial<BuilderState>) => void;
  catalog: PricingCatalog;
  optionsByType: Record<string, PricingCatalogOption[]>;
}) {
  const weights = optionsByType.weight ?? [];
  const addOnGroups = new Map<string, typeof catalog.addOns>();
  for (const addOn of catalog.addOns) {
    addOnGroups.set(addOn.group, [
      ...(addOnGroups.get(addOn.group) ?? []),
      addOn,
    ]);
  }

  return (
    <BuilderSection
      step={3}
      id="step-build"
      title="Build your cake"
      description="Every choice updates the price on the right as you go."
    >
      <div className="space-y-9">
        <Group label="Cake style" required error={errors.style}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {(optionsByType.style ?? []).map((option) => (
              <CakeOptionCard
                key={option.value}
                option={option}
                variant="tile"
                weightKg={state.weightKg}
                selected={state.style === option.value}
                onSelect={() => update({ style: option.value })}
              />
            ))}
          </div>
        </Group>

        <Group label="Flavour" required error={errors.flavour}>
          <div className="flex flex-wrap gap-2.5">
            {(optionsByType.flavour ?? []).map((option) => (
              <CakeOptionCard
                key={option.value}
                option={option}
                weightKg={state.weightKg}
                selected={state.flavour === option.value}
                onSelect={() => update({ flavour: option.value })}
              />
            ))}
          </div>
        </Group>

        <Group label="Filling" hint="Optional">
          <div className="flex flex-wrap gap-2.5">
            {(optionsByType.filling ?? []).map((option) => (
              <CakeOptionCard
                key={option.value}
                option={option}
                weightKg={state.weightKg}
                selected={state.filling === option.value}
                onSelect={() =>
                  update({
                    filling: state.filling === option.value ? "" : option.value,
                  })
                }
              />
            ))}
          </div>
        </Group>

        <Group label="Shape" required error={errors.shape}>
          <div className="flex flex-wrap gap-2.5">
            {(optionsByType.shape ?? []).map((option) => (
              <CakeOptionCard
                key={option.value}
                option={option}
                weightKg={state.weightKg}
                selected={state.shape === option.value}
                onSelect={() => update({ shape: option.value })}
              />
            ))}
          </div>
        </Group>

        <Group
          label="Weight"
          required
          hint={`${servingsForWeight(state.weightKg)} · ${formatINR(catalog.basePricePerKg)}/kg base rate`}
        >
          <div className="flex flex-wrap gap-2.5">
            {weights.map((option) => {
              const value = option.numericValue ?? Number(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  data-selected={state.weightKg === value}
                  aria-pressed={state.weightKg === value}
                  onClick={() => update({ weightKg: value })}
                  className="choice-pill min-w-[92px] flex-col gap-0 px-4 py-2.5 leading-tight"
                >
                  <span>{option.label}</span>
                  <span className="text-[11px] font-medium opacity-70">
                    {formatINR(catalog.basePricePerKg * value)}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-3 max-w-xs">
            <Input
              label="Or enter a custom weight (kg)"
              type="number"
              step="0.5"
              min={catalog.minWeightKg}
              max={catalog.maxWeightKg}
              value={state.weightKg}
              onChange={(event) => {
                const value = Number(event.target.value);
                if (!Number.isFinite(value)) return;
                update({
                  weightKg: Math.min(
                    Math.max(value, catalog.minWeightKg),
                    catalog.maxWeightKg,
                  ),
                });
              }}
            />
          </div>
        </Group>

        <Group label="Egg preference" required>
          <div className="flex flex-wrap gap-2.5">
            {(["eggless", "with-egg"] as const).map((option) => (
              <button
                key={option}
                type="button"
                data-selected={state.eggPreference === option}
                aria-pressed={state.eggPreference === option}
                onClick={() => update({ eggPreference: option })}
                className="choice-pill min-w-[126px] px-4"
              >
                {option === "eggless" ? "Eggless" : "With egg"}
              </button>
            ))}
          </div>
        </Group>

        <Group label="Number of tiers">
          <div className="flex flex-wrap gap-2.5">
            {[1, 2, 3, 4].map((tier) => {
              const option = (optionsByType.tier ?? []).find(
                (item) => Number(item.value) === tier,
              );
              return (
                <button
                  key={tier}
                  type="button"
                  data-selected={state.tiers === tier}
                  aria-pressed={state.tiers === tier}
                  onClick={() => update({ tiers: tier })}
                  className="choice-pill min-w-[120px] flex-col gap-0 px-4 py-2.5 leading-tight"
                >
                  <span>{TIER_LABELS[tier]}</span>
                  <span className="text-[11px] font-medium opacity-70">
                    {option?.modifierAmount
                      ? `+${formatINR(option.modifierAmount)}`
                      : "Included"}
                  </span>
                </button>
              );
            })}
          </div>
        </Group>

        {catalog.addOns.length > 0 ? (
          <Group label="Add-ons" hint="Optional finishing touches">
            <div className="space-y-4">
              {[...addOnGroups.entries()].map(([group, items]) => (
                <div key={group}>
                  <p className="text-muted mb-2 text-[11px] font-bold tracking-[0.12em] uppercase">
                    {group}
                  </p>
                  <div className="flex flex-wrap gap-2.5">
                    {items.map((addOn) => (
                      <button
                        key={addOn.id}
                        type="button"
                        data-selected={state.addOns.includes(addOn.id)}
                        aria-pressed={state.addOns.includes(addOn.id)}
                        onClick={() =>
                          update({
                            addOns: state.addOns.includes(addOn.id)
                              ? state.addOns.filter((id) => id !== addOn.id)
                              : [...state.addOns, addOn.id],
                          })
                        }
                        className="choice-pill px-4"
                        title={addOn.description}
                      >
                        {addOn.name}
                        <span className="text-[11px] font-bold opacity-70">
                          +{formatINR(addOn.price)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Group>
        ) : null}

        <FieldGrid>
          <FullWidth>
            <Textarea
              label="Colours or theme"
              rows={2}
              maxLength={300}
              placeholder="Blush pink and gold, minimal florals, matte finish…"
              hint="Describe the palette or theme you have in mind."
              value={state.colourTheme}
              onChange={(event) => update({ colourTheme: event.target.value })}
            />
          </FullWidth>
          <FullWidth>
            <Input
              label="Message on cake"
              maxLength={120}
              placeholder="Happy Birthday Aarav"
              hint="Short messages pipe most cleanly — around 40 characters."
              value={state.message}
              onChange={(event) => update({ message: event.target.value })}
            />
          </FullWidth>
        </FieldGrid>
      </div>
    </BuilderSection>
  );
}

function Group({
  label,
  hint,
  required,
  error,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="border-0 p-0">
      <legend className="field-label">
        {label}
        {required ? <span className="text-coral"> *</span> : null}
        {hint ? (
          <span className="text-muted ml-2 font-normal">{hint}</span>
        ) : null}
      </legend>
      {children}
      {error ? <p className="field-error">{error}</p> : null}
    </fieldset>
  );
}
