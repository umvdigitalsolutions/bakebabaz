import "server-only";
import { connectToDatabase } from "@/lib/db/mongoose";
import { AddOn } from "@/models/AddOn";
import { CustomizationOption } from "@/models/CustomizationOption";
import { PricingRule } from "@/models/PricingRule";
import { getStoreSettings } from "@/lib/data/settings";
import { customizationOptions, pricingRules } from "@/scripts/seed-data";
import type { PricingCatalog } from "./types";
import type { PriceModifierKind } from "@/types";

/**
 * Builds the pricing catalog from the database. The identical object is used by
 * the server at checkout and shipped to the builder for live preview, so the two
 * can never drift apart.
 */
export async function getPricingCatalog(): Promise<PricingCatalog> {
  await connectToDatabase();
  const settings = await getStoreSettings();

  const [options, addOns, rules, optionCount, ruleCount] = await Promise.all([
    CustomizationOption.find({ active: true })
      .sort({ type: 1, sortOrder: 1 })
      .lean(),
    AddOn.find({ active: true }).sort({ sortOrder: 1 }).lean(),
    PricingRule.find({ active: true }).sort({ sortOrder: 1 }).lean(),
    CustomizationOption.countDocuments({}),
    PricingRule.countDocuments({}),
  ]);

  // A brand-new database has no admin choices yet. Use the same defaults as
  // the idempotent seed script, but respect an existing collection where the
  // owner has intentionally disabled every option.
  const resolvedOptions =
    options.length > 0 || optionCount > 0 ? options : customizationOptions;
  const resolvedRules =
    rules.length > 0 || ruleCount > 0 ? rules : pricingRules;

  return {
    basePricePerKg: settings.customCake.basePricePerKg,
    minWeightKg: settings.customCake.minWeightKg,
    maxWeightKg: settings.customCake.maxWeightKg,
    rushWindowHours: settings.customCake.rushWindowHours,
    minLeadHours: settings.customCake.minLeadHours,
    mode: settings.customCake.mode,
    maxReferenceImages: settings.customCake.maxReferenceImages,
    maxImageSizeMb: settings.customCake.maxImageSizeMb,
    options: resolvedOptions.map((option) => ({
      type: option.type,
      label: option.label,
      value: option.value,
      description: "description" in option ? option.description : undefined,
      modifierKind: option.modifierKind,
      modifierAmount: option.modifierAmount,
      numericValue: "numericValue" in option ? option.numericValue : undefined,
      extraPrepHours:
        "extraPrepHours" in option ? (option.extraPrepHours ?? 0) : 0,
      badge: "badge" in option ? option.badge : undefined,
      image:
        "image" in option && option.image?.url
          ? { url: option.image.url, alt: option.image.alt }
          : undefined,
    })),
    addOns: addOns.map((addOn) => ({
      id: String(addOn._id),
      name: addOn.name,
      description: addOn.description,
      price: addOn.price,
      group: addOn.group,
      image: addOn.image?.url
        ? { url: addOn.image.url, alt: addOn.image.alt }
        : undefined,
    })),
    rules: resolvedRules.map((rule) => ({
      code: rule.code,
      label: rule.label,
      kind: rule.kind as PriceModifierKind,
      amount: rule.amount,
    })),
  };
}
