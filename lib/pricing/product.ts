import type { CartItemConfig, PriceLine } from "@/types";
import type { IProduct } from "@/models/Product";
import { formatWeight } from "@/lib/utils";

const roundRupee = (n: number) => Math.round(n);

export type ProductPricingInput = Pick<
  IProduct,
  | "name"
  | "basePrice"
  | "salePrice"
  | "weights"
  | "flavours"
  | "fillings"
  | "shapes"
  | "prepTimeHours"
>;

export type ProductQuote = {
  lineItems: PriceLine[];
  unitPrice: number;
  prepTimeHours: number;
  warnings: string[];
};

/**
 * Prices one catalogue product line from its stored variants. Called by the
 * cart on every read and again at checkout — the browser's number is only ever
 * a preview.
 */
export function calculateProductPrice(
  product: ProductPricingInput,
  config: CartItemConfig,
  addOnCatalog: { id: string; name: string; price: number }[] = [],
): ProductQuote {
  const lineItems: PriceLine[] = [];
  const warnings: string[] = [];

  const variant =
    product.weights?.find(
      (weight) =>
        weight.label === config.weightLabel ||
        (config.weightGrams != null && weight.grams === config.weightGrams),
    ) ?? product.weights?.[0];

  const baseFromVariant = variant
    ? (variant.salePrice ?? variant.price)
    : (product.salePrice ?? product.basePrice);

  lineItems.push({
    key: "base",
    label: variant ? `${product.name} · ${variant.label}` : product.name,
    amount: roundRupee(baseFromVariant),
    hint: variant ? formatWeight(variant.grams) : undefined,
  });

  let running = baseFromVariant;

  const applyOption = (
    options: { name: string; surcharge: number }[] | undefined,
    selected: string | undefined,
    key: string,
    label: string,
  ) => {
    if (!selected || !options?.length) return;
    const match = options.find((option) => option.name === selected);
    if (!match) {
      warnings.push(`${label} "${selected}" is no longer available.`);
      return;
    }
    if (match.surcharge > 0) {
      lineItems.push({
        key: `${key}:${match.name}`,
        label: `${label} · ${match.name}`,
        amount: roundRupee(match.surcharge),
      });
      running += match.surcharge;
    }
  };

  applyOption(product.flavours, config.flavour, "flavour", "Flavour");
  applyOption(product.fillings, config.filling, "filling", "Filling");
  applyOption(product.shapes, config.shape, "shape", "Shape");

  for (const selected of config.addOns ?? []) {
    const match = addOnCatalog.find(
      (addOn) => addOn.id === selected.id || addOn.name === selected.name,
    );
    if (!match) continue;
    lineItems.push({
      key: `addon:${match.id}`,
      label: `Add-on · ${match.name}`,
      amount: roundRupee(match.price),
    });
    running += match.price;
  }

  return {
    lineItems,
    unitPrice: roundRupee(running),
    prepTimeHours: product.prepTimeHours ?? 6,
    warnings,
  };
}

/** "Starting from" figure used on product cards and listings. */
export function startingPrice(product: {
  basePrice: number;
  salePrice?: number;
  weights?: { price: number; salePrice?: number }[];
}) {
  const candidates: number[] = [];
  if (product.weights?.length) {
    for (const weight of product.weights) {
      candidates.push(weight.salePrice ?? weight.price);
    }
  }
  candidates.push(product.salePrice ?? product.basePrice);
  return Math.min(...candidates.filter((n) => Number.isFinite(n) && n > 0));
}

export function compareAtPrice(product: {
  basePrice: number;
  salePrice?: number;
  weights?: { price: number; salePrice?: number }[];
}) {
  const first = product.weights?.[0];
  if (first?.salePrice && first.salePrice < first.price) return first.price;
  if (product.salePrice && product.salePrice < product.basePrice) {
    return product.basePrice;
  }
  return undefined;
}
