import type { CustomCakeConfig, PriceLine } from "@/types";
import type {
  CustomCakeQuote,
  PricingCatalog,
  PricingCatalogOption,
} from "./types";

const round = (n: number) => Math.round(n * 100) / 100;
const roundRupee = (n: number) => Math.round(n);

function findOption(
  catalog: PricingCatalog,
  type: string,
  value?: string,
): PricingCatalogOption | undefined {
  if (!value) return undefined;
  return catalog.options.find(
    (option) => option.type === type && option.value === value,
  );
}

function applyModifier(
  option: Pick<PricingCatalogOption, "modifierKind" | "modifierAmount">,
  weightKg: number,
  base: number,
) {
  switch (option.modifierKind) {
    case "per_kg":
      return option.modifierAmount * weightKg;
    case "percent":
      return (base * option.modifierAmount) / 100;
    default:
      return option.modifierAmount;
  }
}

function ruleAmount(
  catalog: PricingCatalog,
  code: string,
  weightKg: number,
  base: number,
) {
  const rule = catalog.rules.find((item) => item.code === code);
  if (!rule) return { amount: 0, label: "" };
  const amount = applyModifier(
    { modifierKind: rule.kind, modifierAmount: rule.amount },
    weightKg,
    base,
  );
  return { amount, label: rule.label };
}

export function clampWeight(catalog: PricingCatalog, weightKg?: number) {
  const value = Number(weightKg) || catalog.minWeightKg;
  return Math.min(Math.max(value, catalog.minWeightKg), catalog.maxWeightKg);
}

/**
 * The single source of truth for custom cake pricing.
 *
 * This module is deliberately pure and dependency-free so the browser can call
 * it for live feedback while the server calls it again — with a catalog read
 * fresh from the database — before any money moves. A tampered client changes
 * nothing, because the server never reads a price off the request.
 */
export function calculateCustomCakePrice(
  catalog: PricingCatalog,
  config: CustomCakeConfig,
  now: Date = new Date(),
): CustomCakeQuote {
  const lineItems: PriceLine[] = [];
  const warnings: string[] = [];
  const weightKg = clampWeight(catalog, config.weightKg);

  // 1. Base cake — rate per kilogram from settings.
  const base = catalog.basePricePerKg * weightKg;
  lineItems.push({
    key: "base",
    label: "Base cake",
    amount: roundRupee(base),
    hint: `₹${catalog.basePricePerKg}/kg × ${weightKg} kg`,
  });

  let prepTimeHours = catalog.minLeadHours;
  let running = base;

  const addOptionLine = (
    type: string,
    value: string | undefined,
    keyPrefix: string,
    fallbackLabel: string,
  ) => {
    const option = findOption(catalog, type, value);
    if (!option) return;
    prepTimeHours = Math.max(
      prepTimeHours,
      catalog.minLeadHours + option.extraPrepHours,
    );
    const amount = applyModifier(option, weightKg, base);
    if (amount === 0) return;
    lineItems.push({
      key: `${keyPrefix}:${option.value}`,
      label: `${fallbackLabel} · ${option.label}`,
      amount: roundRupee(amount),
      hint:
        option.modifierKind === "per_kg"
          ? `₹${option.modifierAmount}/kg × ${weightKg} kg`
          : undefined,
    });
    running += amount;
  };

  // 2–5. Every configurable choice contributes through the same DB-driven path.
  addOptionLine("flavour", config.flavour, "flavour", "Flavour");
  addOptionLine("filling", config.filling, "filling", "Filling");
  addOptionLine("shape", config.shape, "shape", "Shape");
  addOptionLine("style", config.style, "style", "Design");

  // 6. Tiers.
  const tiers = Math.max(1, Math.min(Number(config.tiers) || 1, 6));
  if (tiers > 1) {
    const tierOption = findOption(catalog, "tier", String(tiers));
    if (tierOption) {
      prepTimeHours = Math.max(
        prepTimeHours,
        catalog.minLeadHours + tierOption.extraPrepHours,
      );
      const amount = applyModifier(tierOption, weightKg, base);
      if (amount) {
        lineItems.push({
          key: `tier:${tiers}`,
          label: `Tiers · ${tierOption.label}`,
          amount: roundRupee(amount),
        });
        running += amount;
      }
    } else {
      const { amount, label } = ruleAmount(
        catalog,
        "tier_surcharge",
        weightKg,
        base,
      );
      const total = amount * (tiers - 1);
      if (total) {
        lineItems.push({
          key: `tier:${tiers}`,
          label: `${label || "Additional tiers"} · ${tiers} tiers`,
          amount: roundRupee(total),
        });
        running += total;
      }
    }
  }

  // 7. Egg preference (eggless recipes cost more to develop in some kitchens).
  if (config.eggPreference === "eggless") {
    const { amount, label } = ruleAmount(catalog, "eggless", weightKg, base);
    if (amount) {
      lineItems.push({
        key: "eggless",
        label: label || "Eggless recipe",
        amount: roundRupee(amount),
      });
      running += amount;
    }
  }

  // 8. Message piping.
  if (config.message?.trim()) {
    const { amount, label } = ruleAmount(
      catalog,
      "cake_message",
      weightKg,
      base,
    );
    if (amount) {
      lineItems.push({
        key: "message",
        label: label || "Message on cake",
        amount: roundRupee(amount),
      });
      running += amount;
    }
  }

  // 9. Add-ons.
  const selectedAddOns = (config.addOns ?? [])
    .map((id) => catalog.addOns.find((addOn) => addOn.id === id))
    .filter((addOn): addOn is NonNullable<typeof addOn> => Boolean(addOn));
  for (const addOn of selectedAddOns) {
    lineItems.push({
      key: `addon:${addOn.id}`,
      label: `Add-on · ${addOn.name}`,
      amount: roundRupee(addOn.price),
    });
    running += addOn.price;
  }

  // 10. Rush surcharge when the required date sits inside the rush window.
  if (config.requiredDate) {
    const required = requiredMoment(config.requiredDate, config.deliverySlot);
    const hoursAway = (required.getTime() - now.getTime()) / 3_600_000;
    if (hoursAway < prepTimeHours) {
      warnings.push(
        `This design needs about ${prepTimeHours} hours of lead time. Please choose a later date.`,
      );
    } else if (hoursAway <= catalog.rushWindowHours) {
      const { amount, label } = ruleAmount(
        catalog,
        "rush_order",
        weightKg,
        running,
      );
      if (amount) {
        lineItems.push({
          key: "rush",
          label: label || "Priority / rush order",
          amount: roundRupee(amount),
        });
        running += amount;
      }
    }
  }

  const subtotal = roundRupee(running);
  return {
    lineItems,
    subtotal,
    total: subtotal,
    prepTimeHours,
    warnings,
  };
}

/** Resolve the selected slot's first time in India Standard Time. */
function requiredMoment(dateKey: string, deliverySlot?: string) {
  const match = deliverySlot?.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  let hours = 9;
  let minutes = 0;

  if (match) {
    hours = Number(match[1]) % 12;
    if (match[3].toUpperCase() === "PM") hours += 12;
    minutes = Number(match[2]);
  }

  return new Date(
    `${dateKey}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00+05:30`,
  );
}

/** Servings guidance shown next to the weight selector. */
export function servingsForWeight(weightKg: number) {
  const low = Math.round(weightKg * 8);
  const high = Math.round(weightKg * 12);
  return `${low}–${high} servings`;
}

export { round, roundRupee };
