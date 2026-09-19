import { Check } from "lucide-react";
import { cn, formatDateTime } from "@/lib/utils";
import type { OrderStatus } from "@/types";

const DELIVERY_FLOW: OrderStatus[] = [
  "ORDER_PLACED",
  "PAYMENT_CONFIRMED",
  "CONFIRMED",
  "BAKING",
  "DECORATING",
  "READY",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

const PICKUP_FLOW: OrderStatus[] = [
  "ORDER_PLACED",
  "PAYMENT_CONFIRMED",
  "CONFIRMED",
  "BAKING",
  "DECORATING",
  "READY_FOR_PICKUP",
  "DELIVERED",
];

export const STATUS_LABELS: Record<OrderStatus, string> = {
  ORDER_PLACED: "Order placed",
  PAYMENT_CONFIRMED: "Payment confirmed",
  CONFIRMED: "Confirmed by the bakery",
  BAKING: "Baking",
  DECORATING: "Decorating",
  READY: "Ready",
  READY_FOR_PICKUP: "Ready for pickup",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

const STATUS_BLURBS: Partial<Record<OrderStatus, string>> = {
  ORDER_PLACED: "We've received your order.",
  PAYMENT_CONFIRMED: "Payment received and confirmed.",
  CONFIRMED: "Our team has reviewed and accepted your order.",
  BAKING: "Your cake is in the oven.",
  DECORATING: "Finishing touches are going on by hand.",
  READY: "Packed and waiting for its slot.",
  READY_FOR_PICKUP: "Ready at our counter — bring your order number.",
  OUT_FOR_DELIVERY: "On its way to you.",
  DELIVERED: "Delivered. We hope it was worth the wait.",
};

export function OrderTimeline({
  status,
  deliveryType,
  history,
}: {
  status: OrderStatus;
  deliveryType: "delivery" | "pickup";
  history?: { status: string; at: string; note?: string }[];
}) {
  if (status === "CANCELLED") {
    return (
      <div className="border-coral/30 bg-coral-soft rounded-2xl border px-5 py-4">
        <p className="text-coral-dark font-semibold">
          This order was cancelled
        </p>
        <p className="text-coral-dark/80 mt-1 text-sm">
          If this wasn&rsquo;t expected, message us with your order number and
          we&rsquo;ll sort it out.
        </p>
      </div>
    );
  }

  const flow = deliveryType === "pickup" ? PICKUP_FLOW : DELIVERY_FLOW;
  const currentIndex = flow.indexOf(status);
  const historyMap = new Map(
    (history ?? []).map((entry) => [entry.status, entry]),
  );

  return (
    <ol className="relative">
      {flow.map((step, index) => {
        const done = currentIndex >= 0 && index <= currentIndex;
        const active = index === currentIndex;
        const entry = historyMap.get(step);

        return (
          <li key={step} className="relative flex gap-4 pb-7 last:pb-0">
            {index < flow.length - 1 ? (
              <span
                aria-hidden
                className={cn(
                  "absolute top-8 left-[15px] h-[calc(100%-16px)] w-0.5",
                  done ? "bg-coral" : "bg-line",
                )}
              />
            ) : null}

            <span
              aria-hidden
              className={cn(
                "relative z-10 grid size-8 flex-none place-items-center rounded-full border-2 transition-colors",
                done
                  ? "border-coral bg-coral text-white"
                  : "border-line bg-paper text-muted",
                active && "ring-coral-soft ring-4",
              )}
            >
              {done ? (
                <Check className="size-4" strokeWidth={3} />
              ) : (
                <span className="size-1.5 rounded-full bg-current" />
              )}
            </span>

            <div className="min-w-0 pt-0.5">
              <p
                className={cn(
                  "leading-tight font-semibold",
                  done ? "text-cocoa" : "text-muted",
                )}
              >
                {STATUS_LABELS[step]}
              </p>
              {done && STATUS_BLURBS[step] ? (
                <p className="text-muted mt-0.5 text-sm">
                  {STATUS_BLURBS[step]}
                </p>
              ) : null}
              {entry ? (
                <p className="text-muted mt-1 text-xs">
                  {formatDateTime(entry.at)}
                  {entry.note ? ` · ${entry.note}` : ""}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
