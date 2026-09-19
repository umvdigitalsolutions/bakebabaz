import { formatINR } from "@/lib/utils";
import type { CustomCakeQuote } from "@/lib/pricing/types";

export function CakePriceBreakdown({
  quote,
  quantity = 1,
  deliveryLabel,
}: {
  quote: CustomCakeQuote;
  quantity?: number;
  deliveryLabel?: string;
}) {
  return (
    <div>
      <dl className="space-y-2 text-sm">
        {quote.lineItems.map((line) => (
          <div
            key={line.key}
            className="flex items-start justify-between gap-4"
          >
            <dt className="text-muted min-w-0">
              <span className="block">{line.label}</span>
              {line.hint ? (
                <span className="block text-xs opacity-70">{line.hint}</span>
              ) : null}
            </dt>
            <dd className="flex-none font-medium tabular-nums">
              {line.key === "base" ? "" : "+"}
              {formatINR(line.amount)}
            </dd>
          </div>
        ))}

        {quantity > 1 ? (
          <div className="border-line flex items-center justify-between gap-4 border-t pt-2">
            <dt className="text-muted">Quantity</dt>
            <dd className="font-medium">× {quantity}</dd>
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted">Delivery</dt>
          <dd className="text-muted text-xs">
            {deliveryLabel ?? "Calculated at checkout"}
          </dd>
        </div>
      </dl>

      <div className="border-line mt-4 flex items-baseline justify-between border-t pt-4">
        <span className="text-sm font-semibold">Estimated total</span>
        <span className="font-display text-[28px] leading-none tracking-[-0.03em]">
          {formatINR(quote.total * quantity)}
        </span>
      </div>
    </div>
  );
}
