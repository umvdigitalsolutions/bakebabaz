import type { PriceLine, PriceModifierKind } from "@/types";

/**
 * A flattened, serialisable snapshot of everything the pricing engine needs.
 * Built once on the server from the database, then handed to the browser so the
 * builder can show instant feedback using the *same* code path the server uses.
 */
export type PricingCatalogOption = {
  type: string;
  label: string;
  value: string;
  description?: string;
  modifierKind: PriceModifierKind;
  modifierAmount: number;
  numericValue?: number;
  extraPrepHours: number;
  badge?: string;
  image?: { url: string; alt?: string };
};

export type PricingCatalogAddOn = {
  id: string;
  name: string;
  description?: string;
  price: number;
  group: string;
  image?: { url: string; alt?: string };
};

export type PricingRuleSnapshot = {
  code: string;
  label: string;
  kind: PriceModifierKind;
  amount: number;
};

export type PricingCatalog = {
  basePricePerKg: number;
  minWeightKg: number;
  maxWeightKg: number;
  rushWindowHours: number;
  minLeadHours: number;
  mode: "instant" | "approval";
  maxReferenceImages: number;
  maxImageSizeMb: number;
  options: PricingCatalogOption[];
  addOns: PricingCatalogAddOn[];
  rules: PricingRuleSnapshot[];
};

export type CustomCakeQuote = {
  lineItems: PriceLine[];
  subtotal: number;
  total: number;
  prepTimeHours: number;
  warnings: string[];
};

export type { PriceLine };
