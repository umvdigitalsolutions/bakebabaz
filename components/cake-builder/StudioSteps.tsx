"use client";

import {
  Baby,
  BriefcaseBusiness,
  CakeSlice,
  Check,
  Heart,
  PartyPopper,
  Sparkles,
} from "lucide-react";
import { CakeOptionCard } from "./CakeOptionCard";
import { ReferenceUploader } from "./ReferenceUploader";
import {
  DeliveryDatePicker,
  type SlotOption,
} from "@/components/checkout/DeliveryDatePicker";
import { Checkbox, Input, Textarea } from "@/components/ui/Field";
import { formatDate, formatINR } from "@/lib/utils";
import { servingsForWeight } from "@/lib/pricing/engine";
import type { BuilderErrors, BuilderState } from "./types";
import type {
  CustomCakeQuote,
  PricingCatalog,
  PricingCatalogOption,
} from "@/lib/pricing/types";

const OCCASION_ICONS = [
  PartyPopper,
  Heart,
  Sparkles,
  CakeSlice,
  Baby,
  BriefcaseBusiness,
];

const COLOUR_PALETTES = [
  { name: "Ivory", colours: ["#fff9ee", "#e8d8c2", "#b99164"] },
  { name: "Blush", colours: ["#f7dedc", "#d98e99", "#8c3948"] },
  { name: "Sage", colours: ["#dce1cd", "#9ba879", "#526044"] },
  { name: "Cocoa", colours: ["#ead9ca", "#986f5e", "#43251f"] },
  { name: "Berry", colours: ["#f0ccd9", "#b84c72", "#651f3d"] },
  { name: "Sky", colours: ["#dfeef3", "#8dbac8", "#345b69"] },
  { name: "Lilac", colours: ["#ece2ef", "#b49abb", "#6e4d76"] },
  { name: "Chef's choice", colours: ["#f6c3b8", "#ef665f", "#3d2521"] },
];

const FLAVOUR_FALLBACKS: Record<string, string> = {
  chocolate: "/products/chocolate-truffle-cake.jpg",
  "belgian-chocolate": "/products/chocolate-mousse-cake.jpg",
  vanilla: "/products/vanilla-cake.jpg",
  "red-velvet": "/products/strawberry-cake.jpg",
  butterscotch: "/products/butterscotch-cake.jpg",
  "black-forest": "/products/blackforest-cake.jpg",
  pineapple: "/products/pineapple-cake.jpg",
  blueberry: "/products/blueberry-cake.jpg",
  strawberry: "/products/strawberry-cake.jpg",
  "lotus-biscoff": "/products/biscoff-cheesecake-slice.jpg",
  hazelnut: "/products/chocolate-mousse-cake.jpg",
  custom: "/brand/founder/mishika-dawra-founder-cake.jpeg",
};

const STYLE_FALLBACKS: Record<string, string> = {
  minimal: "/products/vanilla-cake.jpg",
  buttercream: "/products/strawberry-cake.jpg",
  floral: "/brand/founder/mishika-dawra-floral-cake.jpeg",
  designer: "/brand/founder/mishika-dawra-custom-cakes.jpeg",
  fondant: "/brand/founder/mishika-dawra-custom-cakes.jpeg",
  photo: "/brand/founder/mishika-dawra-founder-cake.jpeg",
  theme: "/brand/instagram/sewing-machine-themed-cake.jpeg",
  kids: "/brand/instagram/customised-cakes.jpeg",
  wedding: "/brand/founder/mishika-dawra-floral-cake.jpeg",
  other: "/brand/founder/mishika-dawra-founder-cake.jpeg",
};

export function StudioStep({
  step,
  state,
  errors,
  update,
  catalog,
  optionsByType,
  slots,
  blockedDates,
  maxDaysAhead,
  referenceTime,
  quote,
  labels,
  brandName,
  onEdit,
}: {
  step: number;
  state: BuilderState;
  errors: BuilderErrors;
  update: (patch: Partial<BuilderState>) => void;
  catalog: PricingCatalog;
  optionsByType: Record<string, PricingCatalogOption[]>;
  slots: SlotOption[];
  blockedDates: string[];
  maxDaysAhead: number;
  referenceTime: string;
  quote: CustomCakeQuote;
  labels: Record<string, string>;
  brandName: string;
  onEdit: (step: number) => void;
}) {
  switch (step) {
    case 0:
      return (
        <StepFrame
          number="01"
          eyebrow="The moment"
          title="What are we celebrating?"
          description="The occasion and timing give our kitchen the right starting point."
        >
          <Group label="Choose an occasion" required error={errors.occasion}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {(optionsByType.occasion ?? []).map((occasion, index) => {
                const Icon = OCCASION_ICONS[index % OCCASION_ICONS.length];
                return (
                  <button
                    key={occasion.value}
                    type="button"
                    data-selected={state.occasion === occasion.value}
                    aria-pressed={state.occasion === occasion.value}
                    onClick={() => update({ occasion: occasion.value })}
                    className="group border-line bg-paper data-[selected=true]:border-coral data-[selected=true]:bg-coral-soft/60 hover:border-line-strong flex min-h-[108px] flex-col items-start justify-between rounded-lg border p-4 text-left transition-colors"
                  >
                    <Icon className="text-coral size-5" strokeWidth={1.7} />
                    <span className="text-sm font-semibold">
                      {occasion.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </Group>

          <DeliveryDatePicker
            slots={slots}
            minLeadHours={quote.prepTimeHours}
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
        </StepFrame>
      );

    case 1: {
      const weights = optionsByType.weight ?? [];
      return (
        <StepFrame
          number="02"
          eyebrow="The gathering"
          title="How many smiles are we serving?"
          description="Choose a weight or tell us the guest count. We will help you keep portions comfortable."
        >
          <Group
            label="Cake size"
            required
            hint={`${servingsForWeight(state.weightKg)} · ${formatINR(catalog.basePricePerKg)}/kg base`}
          >
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {weights.map((option) => {
                const value = option.numericValue ?? Number(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    data-selected={state.weightKg === value}
                    aria-pressed={state.weightKg === value}
                    onClick={() => update({ weightKg: value })}
                    className="border-line bg-paper data-[selected=true]:border-coral data-[selected=true]:bg-coral-soft/60 hover:border-line-strong min-h-[92px] rounded-lg border p-3 text-center transition-colors"
                  >
                    <span className="font-display block text-xl">
                      {option.label}
                    </span>
                    <span className="text-muted mt-1 block text-[11px]">
                      {servingsForWeight(value)}
                    </span>
                  </button>
                );
              })}
            </div>
            <Input
              label="Custom weight (kg)"
              type="number"
              step="0.5"
              min={catalog.minWeightKg}
              max={catalog.maxWeightKg}
              wrapperClassName="mt-4 max-w-[240px]"
              value={state.weightKg}
              onChange={(event) => {
                const value = Number(event.target.value);
                if (Number.isFinite(value)) {
                  update({
                    weightKg: Math.min(
                      Math.max(value, catalog.minWeightKg),
                      catalog.maxWeightKg,
                    ),
                  });
                }
              }}
            />
          </Group>

          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              label="Number of servings"
              type="number"
              min={1}
              max={2000}
              inputMode="numeric"
              placeholder={String(Math.round(state.weightKg * 10))}
              hint={`A ${state.weightKg} kg cake usually serves ${servingsForWeight(state.weightKg)}.`}
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
              hint="For identical cakes."
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
          </div>

          <Group label="Number of tiers">
            <div className="flex flex-wrap gap-2.5">
              {[1, 2, 3, 4].map((tier) => (
                <button
                  key={tier}
                  type="button"
                  data-selected={state.tiers === tier}
                  aria-pressed={state.tiers === tier}
                  onClick={() => update({ tiers: tier })}
                  className="choice-pill min-w-[112px]"
                >
                  {tier === 1 ? "Single tier" : `${tier} tiers`}
                </button>
              ))}
            </div>
          </Group>
        </StepFrame>
      );
    }

    case 2:
      return (
        <StepFrame
          number="03"
          eyebrow="The flavour"
          title="Choose the part everyone remembers."
          description="Start with the sponge, then add a filling and your egg preference."
        >
          <Group label="Flavour" required error={errors.flavour}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {(optionsByType.flavour ?? []).map((option) => (
                <CakeOptionCard
                  key={option.value}
                  option={{
                    ...option,
                    image:
                      option.image ??
                      (FLAVOUR_FALLBACKS[option.value]
                        ? {
                            url: FLAVOUR_FALLBACKS[option.value],
                            alt: `${option.label} cake`,
                          }
                        : undefined),
                  }}
                  variant="tile"
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
                  option={{
                    ...option,
                    image:
                      option.image ??
                      (STYLE_FALLBACKS[option.value]
                        ? {
                            url: STYLE_FALLBACKS[option.value],
                            alt: `${option.label} cake inspiration`,
                          }
                        : undefined),
                  }}
                  weightKg={state.weightKg}
                  selected={state.filling === option.value}
                  onSelect={() =>
                    update({
                      filling:
                        state.filling === option.value ? "" : option.value,
                    })
                  }
                />
              ))}
            </div>
          </Group>

          <Group label="Egg preference" required>
            <div className="flex gap-2.5">
              {(["eggless", "with-egg"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  data-selected={state.eggPreference === option}
                  aria-pressed={state.eggPreference === option}
                  onClick={() => update({ eggPreference: option })}
                  className="choice-pill min-w-[132px]"
                >
                  {option === "eggless" ? "Eggless" : "With egg"}
                </button>
              ))}
            </div>
          </Group>
        </StepFrame>
      );

    case 3:
      return (
        <StepFrame
          number="04"
          eyebrow="The silhouette"
          title="Set the style of your cake."
          description="Choose the visual language first. Our team will refine the details with you."
        >
          <Group label="Cake style" required error={errors.style}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
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

          {catalog.addOns.length > 0 ? (
            <Group label="Finishing touches" hint="Optional">
              <div className="flex flex-wrap gap-2.5">
                {catalog.addOns.map((addOn) => (
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
                    className="choice-pill"
                    title={addOn.description}
                  >
                    {addOn.name}
                    <span className="text-[11px] opacity-70">
                      +{formatINR(addOn.price)}
                    </span>
                  </button>
                ))}
              </div>
            </Group>
          ) : null}
        </StepFrame>
      );

    case 4:
      return (
        <StepFrame
          number="05"
          eyebrow="The palette"
          title="Give it a colour story."
          description="Choose a starting palette or describe the colours you have in mind."
        >
          <Group label="Colour direction">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {COLOUR_PALETTES.map((palette) => (
                <button
                  key={palette.name}
                  type="button"
                  data-selected={state.colourTheme === palette.name}
                  aria-pressed={state.colourTheme === palette.name}
                  onClick={() => update({ colourTheme: palette.name })}
                  className="border-line bg-paper data-[selected=true]:border-coral data-[selected=true]:bg-coral-soft/40 hover:border-line-strong rounded-lg border p-3 text-left transition-colors"
                >
                  <span className="mb-3 flex" aria-hidden>
                    {palette.colours.map((colour) => (
                      <span
                        key={colour}
                        className="border-paper -mr-1 block size-8 rounded-full border-2"
                        style={{ backgroundColor: colour }}
                      />
                    ))}
                  </span>
                  <span className="text-sm font-semibold">{palette.name}</span>
                </button>
              ))}
            </div>
          </Group>
          <Textarea
            label="Or describe your own palette"
            rows={3}
            maxLength={300}
            placeholder="Blush pink and muted gold, with a soft matte finish..."
            hint="Selecting a palette above will replace this description."
            value={state.colourTheme}
            onChange={(event) => update({ colourTheme: event.target.value })}
          />
        </StepFrame>
      );

    case 5:
      return (
        <StepFrame
          number="06"
          eyebrow="The personal touch"
          title="What should the cake say?"
          description="Add the words that matter and any details our bakers should know."
        >
          <Input
            label="Message on cake"
            maxLength={120}
            placeholder="Happy Birthday, Aarav"
            hint={`${state.message.length}/120 characters. Short messages pipe most cleanly.`}
            value={state.message}
            onChange={(event) => update({ message: event.target.value })}
          />
          <Textarea
            label="Special instructions"
            rows={6}
            maxLength={2000}
            placeholder="Tell us about the mood, finish, exact spelling, allergies, or details that would make it feel personal..."
            hint="Please mention allergies here. Our team will confirm what can be accommodated."
            value={state.notes}
            onChange={(event) => update({ notes: event.target.value })}
          />
        </StepFrame>
      );

    default:
      return (
        <StepFrame
          number="07"
          eyebrow="The final details"
          title="Show us what you are imagining."
          description="References help us understand the mood. Add your contact details, review everything, and send the request."
        >
          <Group
            label="Reference images"
            hint="Optional, but especially useful for custom designs"
          >
            <ReferenceUploader
              images={state.referenceImages}
              onChange={(images) => update({ referenceImages: images })}
              maxImages={catalog.maxReferenceImages}
              maxSizeMb={catalog.maxImageSizeMb}
            />
          </Group>

          <div className="border-line grid gap-5 border-t pt-7 sm:grid-cols-2">
            <Input
              label="Your name"
              required
              autoComplete="name"
              placeholder="Aarav Sharma"
              value={state.name}
              error={errors.name}
              onChange={(event) => update({ name: event.target.value })}
            />
            <Input
              label="Phone / WhatsApp"
              required
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="98765 43210"
              value={state.phone}
              error={errors.phone}
              onChange={(event) => update({ phone: event.target.value })}
            />
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              hint="Optional. We will send confirmation here when provided."
              value={state.email}
              error={errors.email}
              wrapperClassName="sm:col-span-2"
              onChange={(event) => update({ email: event.target.value })}
            />
          </div>

          <OrderReview
            state={state}
            labels={labels}
            quote={quote}
            onEdit={onEdit}
          />

          <Checkbox
            checked={state.consent}
            onChange={(event) => update({ consent: event.target.checked })}
            error={errors.consent}
            label={
              <>
                I agree that {brandName} may use these details to prepare and
                discuss my cake request. <span className="text-coral">*</span>
              </>
            }
          />
        </StepFrame>
      );
  }
}

function StepFrame({
  number,
  eyebrow,
  title,
  description,
  children,
}: {
  number: string;
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <header className="border-line mb-8 border-b pb-7">
        <div className="flex items-center gap-3">
          <span className="text-coral-dark text-[11px] font-bold tracking-[0.12em]">
            {number}
          </span>
          <span className="bg-line h-px w-7" />
          <span className="text-muted text-[11px] font-bold tracking-[0.12em] uppercase">
            {eyebrow}
          </span>
        </div>
        <h3 className="font-display mt-3 text-3xl leading-tight sm:text-[40px]">
          {title}
        </h3>
        <p className="text-muted mt-3 max-w-[640px] text-sm leading-relaxed sm:text-base">
          {description}
        </p>
      </header>
      <div className="space-y-8">{children}</div>
    </div>
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
    <fieldset className="min-w-0 border-0 p-0">
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

function OrderReview({
  state,
  labels,
  quote,
  onEdit,
}: {
  state: BuilderState;
  labels: Record<string, string>;
  quote: CustomCakeQuote;
  onEdit: (step: number) => void;
}) {
  const groups = [
    {
      label: "Celebration",
      step: 0,
      value: [
        labels[state.occasion],
        state.requiredDate ? formatDate(state.requiredDate) : "Date needed",
        state.deliverySlot,
      ]
        .filter(Boolean)
        .join(" · "),
    },
    {
      label: "Size",
      step: 1,
      value: `${state.weightKg} kg · ${state.tiers} tier${state.tiers > 1 ? "s" : ""}${state.servings ? ` · ${state.servings} servings` : ""}`,
    },
    {
      label: "Flavour",
      step: 2,
      value: [
        labels[state.flavour],
        labels[state.filling],
        state.eggPreference === "eggless" ? "Eggless" : "With egg",
      ]
        .filter(Boolean)
        .join(" · "),
    },
    {
      label: "Design",
      step: 3,
      value: [labels[state.style], labels[state.shape]]
        .filter(Boolean)
        .join(" · "),
    },
    { label: "Colours", step: 4, value: state.colourTheme || "Open to ideas" },
    { label: "Message", step: 5, value: state.message || "No cake message" },
  ];

  return (
    <section className="border-line bg-cream/60 rounded-lg border p-5 sm:p-6">
      <div className="flex items-baseline justify-between gap-4">
        <h4 className="font-display text-2xl">Your design summary</h4>
        <span className="text-coral-dark text-sm font-bold tabular-nums">
          {formatINR(quote.total * state.quantity)} est.
        </span>
      </div>
      <dl className="mt-5 divide-y divide-[var(--color-line)]">
        {groups.map((group) => (
          <div
            key={group.label}
            className="grid grid-cols-[90px_1fr_auto] gap-3 py-3 text-sm"
          >
            <dt className="text-muted font-semibold">{group.label}</dt>
            <dd className="min-w-0 break-words">{group.value}</dd>
            <dd>
              <button
                type="button"
                onClick={() => onEdit(group.step)}
                className="text-coral-dark text-xs font-bold underline underline-offset-4"
              >
                Edit
              </button>
            </dd>
          </div>
        ))}
      </dl>
      <p className="text-muted mt-4 flex items-start gap-2 text-xs leading-relaxed">
        <Check className="text-pistachio mt-0.5 size-3.5 flex-none" />
        Your estimate is recalculated from the bakery&rsquo;s current pricing.
        The final design and quote are confirmed by our team.
      </p>
    </section>
  );
}
