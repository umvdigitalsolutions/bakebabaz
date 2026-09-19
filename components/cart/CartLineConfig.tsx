import { formatDate } from "@/lib/utils";
import type { CartItemConfig } from "@/types";

/**
 * Renders the full configuration of a cart line so a shopper (and later the
 * kitchen) can see exactly what was ordered.
 */
export function CartLineConfig({
  config,
  requiredDate,
  deliverySlot,
  compact,
}: {
  config: CartItemConfig;
  requiredDate?: string;
  deliverySlot?: string;
  compact?: boolean;
}) {
  const rows: { label: string; value: string }[] = [];

  if (config.weightLabel)
    rows.push({ label: "Weight", value: config.weightLabel });
  if (config.eggPreference) {
    rows.push({
      label: "Egg",
      value: config.eggPreference === "eggless" ? "Eggless" : "With egg",
    });
  }
  if (config.flavour) rows.push({ label: "Flavour", value: config.flavour });
  if (config.filling) rows.push({ label: "Filling", value: config.filling });
  if (config.shape) rows.push({ label: "Shape", value: config.shape });
  if (config.style) rows.push({ label: "Style", value: config.style });
  if (config.tiers && config.tiers > 1) {
    rows.push({ label: "Tiers", value: String(config.tiers) });
  }
  if (config.servings) {
    rows.push({ label: "Servings", value: String(config.servings) });
  }
  if (config.occasion) rows.push({ label: "Occasion", value: config.occasion });
  if (config.colourTheme) {
    rows.push({ label: "Colours", value: config.colourTheme });
  }
  if (config.message) {
    rows.push({ label: "Message", value: `“${config.message}”` });
  }
  if (config.addOns?.length) {
    rows.push({
      label: "Add-ons",
      value: config.addOns.map((addOn) => addOn.name).join(", "),
    });
  }
  if (requiredDate) {
    rows.push({
      label: "Delivery",
      value: [formatDate(requiredDate), deliverySlot]
        .filter(Boolean)
        .join(" · "),
    });
  }
  if (config.referenceImages?.length) {
    rows.push({
      label: "Reference",
      value: `${config.referenceImages.length} image${config.referenceImages.length === 1 ? "" : "s"} attached`,
    });
  }
  if (config.notes && !compact) {
    rows.push({ label: "Notes", value: config.notes });
  }

  if (!rows.length) return null;

  return (
    <dl className="text-muted mt-1.5 space-y-0.5 text-[12.5px] leading-relaxed">
      {rows.map((row) => (
        <div key={row.label} className="flex gap-1.5">
          <dt className="text-cocoa/70 flex-none font-semibold">
            {row.label}:
          </dt>
          <dd className="min-w-0 break-words">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
