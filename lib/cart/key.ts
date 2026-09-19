import type { CartItemConfig } from "@/types";

/**
 * Deterministic key for a catalogue line so adding the same configuration twice
 * increments the quantity instead of creating a duplicate row. Custom cakes get
 * a random key — every one is bespoke.
 */
export function productCartKey(productId: string, config: CartItemConfig) {
  const parts = [
    productId,
    config.weightLabel ?? "",
    config.weightGrams ?? "",
    config.flavour ?? "",
    config.filling ?? "",
    config.shape ?? "",
    config.eggPreference ?? "",
    (config.message ?? "").trim().toLowerCase(),
    (config.addOns ?? [])
      .map((addOn) => addOn.id ?? addOn.name)
      .sort()
      .join("+"),
  ];
  return `p_${hash(parts.join("|"))}`;
}

function hash(input: string) {
  let h = 5381;
  for (let i = 0; i < input.length; i += 1) {
    h = ((h << 5) + h) ^ input.charCodeAt(i);
  }
  return (h >>> 0).toString(36);
}
