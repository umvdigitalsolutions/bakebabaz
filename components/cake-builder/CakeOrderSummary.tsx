"use client";

import Image from "next/image";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import { CakePriceBreakdown } from "./CakePriceBreakdown";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";
import type { CustomCakeQuote } from "@/lib/pricing/types";
import type { BuilderState } from "./types";

export function CakeOrderSummary({
  state,
  quote,
  labels,
  mode,
  submitting,
  onSubmit,
}: {
  state: BuilderState;
  quote: CustomCakeQuote;
  labels: Record<string, string>;
  mode: "instant" | "approval";
  submitting: boolean;
  onSubmit: () => void;
}) {
  const rows = [
    { label: "Occasion", value: labels[state.occasion] },
    {
      label: "Date",
      value: state.requiredDate
        ? [formatDate(state.requiredDate), state.deliverySlot]
            .filter(Boolean)
            .join(" · ")
        : undefined,
    },
    { label: "Style", value: labels[state.style] },
    { label: "Flavour", value: labels[state.flavour] },
    { label: "Filling", value: labels[state.filling] },
    { label: "Shape", value: labels[state.shape] },
    { label: "Weight", value: `${state.weightKg} kg` },
    {
      label: "Egg",
      value: state.eggPreference === "eggless" ? "Eggless" : "With egg",
    },
    {
      label: "Tiers",
      value: state.tiers > 1 ? String(state.tiers) : undefined,
    },
    { label: "Servings", value: state.servings || undefined },
    { label: "Colours", value: state.colourTheme || undefined },
    {
      label: "Message",
      value: state.message ? `“${state.message}”` : undefined,
    },
  ].filter((row) => row.value);

  return (
    <div className="border-line rounded-[26px] border bg-white p-6 shadow-[0_24px_60px_rgba(76,43,34,.08)]">
      <h2 className="font-display text-[22px] tracking-[-0.02em]">
        Your cake so far
      </h2>

      {state.referenceImages.length > 0 ? (
        <div className="mt-4 flex gap-2">
          {state.referenceImages.slice(0, 4).map((image, index) => (
            <span
              key={image.publicId ?? image.url}
              className="bg-cream relative size-14 overflow-hidden rounded-xl"
            >
              <Image
                src={image.url}
                alt={`Reference ${index + 1}`}
                fill
                sizes="56px"
                className="object-cover"
              />
            </span>
          ))}
          {state.referenceImages.length > 4 ? (
            <span className="bg-cream text-muted grid size-14 flex-none place-items-center rounded-xl text-xs font-semibold">
              +{state.referenceImages.length - 4}
            </span>
          ) : null}
        </div>
      ) : null}

      {rows.length > 0 ? (
        <dl className="border-line mt-5 space-y-1.5 border-t pt-5 text-[13px]">
          {rows.map((row) => (
            <div key={row.label} className="flex gap-2">
              <dt className="text-muted w-[74px] flex-none font-semibold">
                {row.label}
              </dt>
              <dd className="min-w-0 break-words">{row.value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="text-muted mt-4 text-sm">
          Start choosing options and your cake will take shape here.
        </p>
      )}

      <div className="border-line mt-6 border-t pt-5">
        <CakePriceBreakdown quote={quote} quantity={state.quantity} />
      </div>

      {quote.warnings.length > 0 ? (
        <div className="bg-coral-soft text-coral-dark mt-4 flex gap-2.5 rounded-2xl px-4 py-3 text-[13px]">
          <AlertTriangle className="mt-0.5 size-4 flex-none" />
          <p>{quote.warnings[0]}</p>
        </div>
      ) : null}

      <Button
        variant="coral"
        size="lg"
        fullWidth
        className="mt-6"
        loading={submitting}
        onClick={onSubmit}
      >
        {mode === "instant" ? "Add to cart" : "Send my cake request →"}
      </Button>

      <p className="text-muted mt-3 flex items-start gap-2 text-xs leading-relaxed">
        <ShieldCheck className="text-pistachio mt-0.5 size-3.5 flex-none" />
        {mode === "instant"
          ? "This estimate is recalculated on our servers before payment — the price you see at checkout is the price you pay."
          : "This is a request, not a confirmed order. We'll review the design and send you a final quote and a secure payment link."}
      </p>
    </div>
  );
}

/** The condensed mobile version that sticks to the bottom of the screen. */
export function MobileSummaryBar({
  quote,
  quantity,
  mode,
  submitting,
  onSubmit,
}: {
  quote: CustomCakeQuote;
  quantity: number;
  mode: "instant" | "approval";
  submitting: boolean;
  onSubmit: () => void;
}) {
  return (
    <div className="border-line bg-paper/95 fixed inset-x-0 bottom-0 z-[80] flex items-center gap-3 border-t px-4 py-3 backdrop-blur-lg lg:hidden">
      <div className="min-w-0 flex-1">
        <p className="text-muted text-[11px] tracking-[0.08em] uppercase">
          Estimated total
        </p>
        <p className="font-display text-xl leading-none tracking-[-0.02em]">
          ₹{(quote.total * quantity).toLocaleString("en-IN")}
        </p>
      </div>
      <Button
        variant="coral"
        loading={submitting}
        onClick={onSubmit}
        className="flex-none"
      >
        {mode === "instant" ? "Add to cart" : "Send request"}
      </Button>
    </div>
  );
}
