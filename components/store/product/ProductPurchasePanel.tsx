"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Info, MessageCircle, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Field";
import { WhatsAppIcon } from "@/components/ui/icons";
import { Rating } from "@/components/ui/Rating";
import {
  DeliveryDatePicker,
  type SlotOption,
} from "@/components/checkout/DeliveryDatePicker";
import { useCart } from "@/components/cart/CartProvider";
import { calculateProductPrice, startingPrice } from "@/lib/pricing/product";
import { cn, formatINR } from "@/lib/utils";
import { whatsappLink, whatsappMessages } from "@/lib/whatsapp";
import type { CartItemConfig, EggPreference } from "@/types";

type Option = { name: string; surcharge: number; premium?: boolean };

/** Preselect the cheapest option so the shown price isn't quietly upsold. */
function cheapest(options: Option[]) {
  return options.reduce<Option | undefined>(
    (best, option) =>
      !best || option.surcharge < best.surcharge ? option : best,
    undefined,
  )?.name;
}

export type PurchaseProduct = {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  salePrice?: number;
  weights: {
    label: string;
    grams: number;
    price: number;
    salePrice?: number;
    servings?: string;
  }[];
  flavours: Option[];
  fillings: Option[];
  shapes: Option[];
  eggOptions: EggPreference[];
  addOns: {
    id: string;
    name: string;
    price: number;
    group: string;
    description?: string;
  }[];
  allowMessage: boolean;
  customisable: boolean;
  prepTimeHours: number;
  unlimitedStock: boolean;
  stock: number;
  rating: { average: number; count: number };
  status: string;
};

export function ProductPurchasePanel({
  product,
  slots,
  blockedDates,
  maxDaysAhead,
  brandName,
  whatsappNumber,
  referenceTime,
}: {
  product: PurchaseProduct;
  slots: SlotOption[];
  blockedDates: string[];
  maxDaysAhead: number;
  brandName: string;
  whatsappNumber: string;
  referenceTime: string;
}) {
  const router = useRouter();
  const { addProduct } = useCart();
  const scheduleRef = useRef<HTMLDivElement>(null);

  const [weightLabel, setWeightLabel] = useState(
    product.weights[0]?.label ?? "",
  );
  const [flavour, setFlavour] = useState(cheapest(product.flavours));
  const [filling, setFilling] = useState<string | undefined>();
  const [shape, setShape] = useState(cheapest(product.shapes));
  const [eggPreference, setEggPreference] = useState<EggPreference>(
    product.eggOptions[0] ?? "eggless",
  );
  const [message, setMessage] = useState("");
  const [notes, setNotes] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [date, setDate] = useState<string>();
  const [slot, setSlot] = useState<string>();
  const [submitting, setSubmitting] = useState<"cart" | "buy" | null>(null);
  const [errors, setErrors] = useState<{ date?: string; slot?: string }>({});

  const config: CartItemConfig = useMemo(
    () => ({
      weightLabel,
      weightGrams: product.weights.find((w) => w.label === weightLabel)?.grams,
      flavour,
      filling,
      shape,
      eggPreference,
      message: message.trim() || undefined,
      notes: notes.trim() || undefined,
      addOns: selectedAddOns
        .map((id) => product.addOns.find((addOn) => addOn.id === id))
        .filter(Boolean)
        .map((addOn) => ({
          id: addOn!.id,
          name: addOn!.name,
          price: addOn!.price,
        })),
    }),
    [
      weightLabel,
      flavour,
      filling,
      shape,
      eggPreference,
      message,
      notes,
      selectedAddOns,
      product,
    ],
  );

  // Instant preview only. The server prices the line again on every cart read.
  const quote = useMemo(
    () => calculateProductPrice(product, config, product.addOns),
    [product, config],
  );

  const soldOut = !product.unlimitedStock && product.stock <= 0;

  const validate = () => {
    const next: { date?: string; slot?: string } = {};
    if (!date) next.date = "Choose a delivery date.";
    if (!slot) next.slot = "Choose a delivery slot.";
    setErrors(next);
    const valid = Object.keys(next).length === 0;
    // The mobile "Add to cart" bar can be tapped from anywhere on the page, so
    // bring the missing fields into view rather than failing silently.
    if (!valid) {
      scheduleRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
    return valid;
  };

  const submit = async (mode: "cart" | "buy") => {
    if (!validate()) return;
    setSubmitting(mode);
    const added = await addProduct({
      productId: product.id,
      config,
      quantity,
      requiredDate: date,
      deliverySlot: slot,
    });
    setSubmitting(null);
    if (added && mode === "buy") router.push("/checkout");
  };

  const availableAddOns = product.addOns;
  const addOnGroups = useMemo(() => {
    const groups = new Map<string, PurchaseProduct["addOns"]>();
    for (const addOn of availableAddOns) {
      groups.set(addOn.group, [...(groups.get(addOn.group) ?? []), addOn]);
    }
    return [...groups.entries()];
  }, [availableAddOns]);

  return (
    <div className="space-y-7">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          {product.rating.count > 0 ? (
            <Rating
              value={product.rating.average}
              count={product.rating.count}
            />
          ) : null}
          {!product.unlimitedStock &&
          product.stock > 0 &&
          product.stock <= 5 ? (
            <span className="bg-coral-soft text-coral-dark rounded-full px-2.5 py-1 text-[11px] font-bold tracking-[0.08em] uppercase">
              Only {product.stock} left
            </span>
          ) : null}
        </div>

        <div className="mt-4 flex items-baseline gap-3">
          <span className="text-muted text-[11px] font-semibold tracking-[0.1em] uppercase">
            Starting from
          </span>
          <span className="font-display text-[34px] leading-none tracking-[-0.03em]">
            {formatINR(startingPrice(product))}
          </span>
        </div>
      </div>

      {product.weights.length > 0 ? (
        <OptionBlock label="Weight" required>
          <div className="flex flex-wrap gap-2.5">
            {product.weights.map((weight) => {
              const price = weight.salePrice ?? weight.price;
              return (
                <button
                  key={weight.label}
                  type="button"
                  data-selected={weightLabel === weight.label}
                  onClick={() => setWeightLabel(weight.label)}
                  className="choice-pill min-w-[112px] flex-col gap-0 px-4 py-2.5 leading-tight"
                >
                  <span>{weight.label}</span>
                  <span className="text-[11px] font-medium opacity-70">
                    {formatINR(price)}
                    {weight.servings ? ` · ${weight.servings}` : ""}
                  </span>
                </button>
              );
            })}
          </div>
        </OptionBlock>
      ) : null}

      {product.flavours.length > 0 ? (
        <OptionBlock label="Flavour" required>
          <div className="flex flex-wrap gap-2.5">
            {product.flavours.map((option) => (
              <button
                key={option.name}
                type="button"
                data-selected={flavour === option.name}
                onClick={() => setFlavour(option.name)}
                className="choice-pill px-4"
              >
                {option.name}
                {option.surcharge > 0 ? (
                  <span className="text-[11px] font-bold opacity-70">
                    +{formatINR(option.surcharge)}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </OptionBlock>
      ) : null}

      {product.fillings.length > 0 ? (
        <OptionBlock label="Filling" hint="Optional">
          <div className="flex flex-wrap gap-2.5">
            {product.fillings.map((option) => (
              <button
                key={option.name}
                type="button"
                data-selected={filling === option.name}
                onClick={() =>
                  setFilling(filling === option.name ? undefined : option.name)
                }
                className="choice-pill px-4"
              >
                {option.name}
                {option.surcharge > 0 ? (
                  <span className="text-[11px] font-bold opacity-70">
                    +{formatINR(option.surcharge)}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </OptionBlock>
      ) : null}

      {product.shapes.length > 0 ? (
        <OptionBlock label="Shape">
          <div className="flex flex-wrap gap-2.5">
            {product.shapes.map((option) => (
              <button
                key={option.name}
                type="button"
                data-selected={shape === option.name}
                onClick={() => setShape(option.name)}
                className="choice-pill px-4"
              >
                {option.name}
                {option.surcharge > 0 ? (
                  <span className="text-[11px] font-bold opacity-70">
                    +{formatINR(option.surcharge)}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </OptionBlock>
      ) : null}

      {product.eggOptions.length > 1 ? (
        <OptionBlock label="Egg preference" required>
          <div className="flex flex-wrap gap-2.5">
            {product.eggOptions.map((option) => (
              <button
                key={option}
                type="button"
                data-selected={eggPreference === option}
                onClick={() => setEggPreference(option)}
                className="choice-pill min-w-[118px] px-4"
              >
                {option === "eggless" ? "Eggless" : "With egg"}
              </button>
            ))}
          </div>
        </OptionBlock>
      ) : null}

      {product.allowMessage ? (
        <Input
          label="Message on cake"
          hint="Up to 40 characters pipes cleanly. Leave blank for no message."
          placeholder="Happy Birthday Aarav"
          maxLength={120}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
        />
      ) : null}

      {addOnGroups.length > 0 ? (
        <OptionBlock label="Add-ons" hint="Optional">
          <div className="space-y-4">
            {addOnGroups.map(([group, items]) => (
              <div key={group}>
                <p className="text-muted mb-2 text-[11px] font-bold tracking-[0.12em] uppercase">
                  {group}
                </p>
                <div className="flex flex-wrap gap-2.5">
                  {items.map((addOn) => (
                    <button
                      key={addOn.id}
                      type="button"
                      data-selected={selectedAddOns.includes(addOn.id)}
                      onClick={() =>
                        setSelectedAddOns((current) =>
                          current.includes(addOn.id)
                            ? current.filter((id) => id !== addOn.id)
                            : [...current, addOn.id],
                        )
                      }
                      className="choice-pill px-4"
                      title={addOn.description}
                    >
                      {addOn.name}
                      <span className="text-[11px] font-bold opacity-70">
                        +{formatINR(addOn.price)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </OptionBlock>
      ) : null}

      <div ref={scheduleRef} className="scroll-mt-28">
        <DeliveryDatePicker
          slots={slots}
          minLeadHours={product.prepTimeHours}
          blockedDates={blockedDates}
          maxDaysAhead={maxDaysAhead}
          date={date}
          slot={slot}
          onDateChange={(value) => {
            setDate(value);
            setSlot(undefined);
            setErrors((current) => ({ ...current, date: undefined }));
          }}
          onSlotChange={(value) => {
            setSlot(value);
            setErrors((current) => ({ ...current, slot: undefined }));
          }}
          dateError={errors.date}
          slotError={errors.slot}
          referenceTime={referenceTime}
        />
      </div>

      <Textarea
        label="Anything else we should know?"
        hint="Allergies, delivery instructions, or design notes."
        rows={3}
        maxLength={1000}
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
      />

      {/* Live breakdown so nothing about the price is a surprise. */}
      <div className="border-line bg-cream/60 rounded-[20px] border p-5">
        <p className="text-muted text-[11px] font-bold tracking-[0.14em] uppercase">
          Your price
        </p>
        <dl className="mt-3 space-y-1.5 text-sm">
          {quote.lineItems.map((line) => (
            <div key={line.key} className="flex justify-between gap-4">
              <dt className="text-muted min-w-0">
                {line.label}
                {line.hint ? (
                  <span className="ml-1.5 text-xs opacity-70">{line.hint}</span>
                ) : null}
              </dt>
              <dd className="flex-none font-medium">
                {formatINR(line.amount)}
              </dd>
            </div>
          ))}
          {quantity > 1 ? (
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Quantity</dt>
              <dd className="flex-none font-medium">× {quantity}</dd>
            </div>
          ) : null}
        </dl>
        <div className="border-line mt-3 flex items-baseline justify-between border-t pt-3">
          <span className="font-semibold">Total</span>
          <span className="font-display text-2xl tracking-[-0.02em]">
            {formatINR(quote.unitPrice * quantity)}
          </span>
        </div>
        <p className="text-muted mt-2 flex items-start gap-1.5 text-xs">
          <Info className="mt-0.5 size-3 flex-none" />
          Delivery is calculated from your PIN code at checkout.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="border-line inline-flex items-center rounded-full border">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            aria-label="Decrease quantity"
            className="hover:bg-cream grid size-11 place-items-center rounded-full transition-colors"
          >
            −
          </button>
          <span className="min-w-8 text-center font-semibold">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(50, q + 1))}
            aria-label="Increase quantity"
            className="hover:bg-cream grid size-11 place-items-center rounded-full transition-colors"
          >
            +
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Button
          variant="ghost"
          size="lg"
          disabled={soldOut}
          loading={submitting === "cart"}
          onClick={() => void submit("cart")}
        >
          <ShoppingBag className="size-[18px]" />
          Add to cart
        </Button>
        <Button
          variant="coral"
          size="lg"
          disabled={soldOut}
          loading={submitting === "buy"}
          onClick={() => void submit("buy")}
        >
          Buy now
        </Button>
      </div>

      {soldOut ? (
        <p className="bg-coral-soft text-coral-dark rounded-2xl px-4 py-3 text-sm font-semibold">
          This item is sold out right now.{" "}
          <Link
            href="/customize-your-cake"
            className="underline underline-offset-4"
          >
            Design something similar
          </Link>{" "}
          or message us to check the next batch.
        </p>
      ) : null}

      <a
        href={whatsappLink(
          whatsappNumber,
          whatsappMessages.product(brandName, product.name),
        )}
        target="_blank"
        rel="noopener noreferrer"
        className="border-line hover:border-coral hover:text-coral-dark flex items-center justify-center gap-2.5 rounded-full border py-3.5 text-sm font-semibold transition-colors"
      >
        <WhatsAppIcon className="size-[18px] text-[#25D366]" />
        Ask a question on WhatsApp
        <MessageCircle className="size-4 opacity-0" aria-hidden />
      </a>

      {/* Sticky mobile action bar — the price and CTA stay reachable. It sits
          directly above the site-wide mobile action bar, which owns bottom: 0. */}
      <div className="border-line bg-paper/95 fixed inset-x-0 bottom-[calc(75px+env(safe-area-inset-bottom))] z-[96] flex items-center gap-3 border-t px-4 py-2.5 shadow-[0_-8px_24px_rgba(61,37,33,.06)] backdrop-blur-lg md:hidden">
        <div className="min-w-0 flex-1">
          <p className="text-muted text-[11px] tracking-[0.08em] uppercase">
            Total
          </p>
          <p className="font-display text-xl leading-none tracking-[-0.02em]">
            {formatINR(quote.unitPrice * quantity)}
          </p>
        </div>
        <Button
          variant="coral"
          disabled={soldOut}
          loading={submitting === "cart"}
          onClick={() => void submit("cart")}
          className="flex-none"
        >
          Add to cart
        </Button>
      </div>
    </div>
  );
}

function OptionBlock({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="field-label">
        {label}
        {required ? <span className="text-coral"> *</span> : null}
        {hint ? (
          <span className="text-muted ml-2 font-normal">{hint}</span>
        ) : null}
      </p>
      {children}
    </div>
  );
}
