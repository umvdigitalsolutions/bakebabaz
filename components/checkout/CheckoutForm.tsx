"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Lock, MapPin, QrCode, Store } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Field";
import {
  DeliveryDatePicker,
  indiaDateKey,
  slotIsAvailable,
  type SlotOption,
} from "./DeliveryDatePicker";
import { CartLineConfig } from "@/components/cart/CartLineConfig";
import { useCart } from "@/components/cart/CartProvider";
import { cn, formatINR, nanoid } from "@/lib/utils";
import {
  addressSchema,
  emailSchema,
  phoneSchema,
  safeText,
} from "@/lib/validation/common";
import type { PricedCartItem } from "@/types";

const formSchema = z.object({
  name: safeText(80, "Name").pipe(z.string().min(2, "Enter your full name.")),
  phone: phoneSchema,
  email: emailSchema.optional().or(z.literal("")),
  line1: z.string().optional(),
  line2: z.string().optional(),
  landmark: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  notes: z.string().max(1000).optional(),
});

type FormValues = z.infer<typeof formSchema>;

/**
 * Shoppers already pick a date and slot on the product page, so start checkout
 * from that choice instead of asking again. The latest chosen date wins, since
 * every line has to be ready by then; anything stale or now too soon is
 * dropped and the shopper picks afresh.
 */
function scheduleFromCart(
  items: PricedCartItem[],
  slots: SlotOption[],
  leadHours: number,
  referenceTime: string,
) {
  const nowMs = Date.parse(referenceTime);
  const today = indiaDateKey(nowMs);
  const latest = items
    .filter((item) => item.requiredDate && item.requiredDate >= today)
    .sort((a, b) => b.requiredDate!.localeCompare(a.requiredDate!))[0];
  if (!latest?.requiredDate) return { date: "", slot: "" };

  const chosen = slots.find((option) => option.label === latest.deliverySlot);
  const slotStillFits =
    chosen && slotIsAvailable(chosen, latest.requiredDate, nowMs, leadHours);
  return {
    date: latest.requiredDate,
    slot: slotStillFits ? chosen.label : "",
  };
}

export function CheckoutForm({
  slots,
  blockedDates,
  maxDaysAhead,
  pickupEnabled,
  pickupAddress,
  pickupInstructions,
  manualQrCode,
  manualInstructions,
  brandName,
  referenceTime,
}: {
  slots: SlotOption[];
  blockedDates: string[];
  maxDaysAhead: number;
  pickupEnabled: boolean;
  pickupAddress: string;
  pickupInstructions: string;
  manualQrCode?: { url: string; alt?: string };
  manualInstructions: string;
  brandName: string;
  referenceTime: string;
}) {
  const router = useRouter();
  const { cart, loading, refresh } = useCart();

  const [deliveryType, setDeliveryType] = useState<"delivery" | "pickup">(
    "delivery",
  );
  const [initialSchedule] = useState(() =>
    scheduleFromCart(cart.items, slots, cart.requiredLeadHours, referenceTime),
  );
  const [date, setDate] = useState(initialSchedule.date);
  const [slot, setSlot] = useState(initialSchedule.slot);
  const paymentMethod = "manual" as const;
  // The most recent PIN code lookup, remembered with the inputs it answered so
  // a stale result is never shown against a newer PIN code or subtotal.
  const [lookup, setLookup] = useState<{
    pincode: string;
    subtotal: number;
    quote?: { fee: number; zone?: string };
    error?: string;
  } | null>(null);
  const [stepErrors, setStepErrors] = useState<{
    date?: string;
    slot?: string;
  }>({});
  const [submitting, setSubmitting] = useState(false);

  // One key per checkout attempt: a double-submit reuses the same order.
  const [idempotencyKey, setIdempotencyKey] = useState(() => nanoid(24));

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      city: "Bikaner",
      state: "Rajasthan",
    },
  });

  const pincode = useWatch({ control, name: "pincode" });

  const subtotal = cart.totals.subtotal;
  const lookupPincode =
    deliveryType === "delivery" && pincode && /^\d{6}$/.test(pincode)
      ? pincode
      : null;
  const currentLookup =
    lookupPincode &&
    lookup?.pincode === lookupPincode &&
    lookup.subtotal === subtotal
      ? lookup
      : null;
  const checkingPincode = Boolean(lookupPincode && !currentLookup);
  const pincodeError = currentLookup?.error;
  const deliveryQuote =
    deliveryType === "pickup"
      ? { fee: 0, zone: "Store pickup" }
      : (currentLookup?.quote ?? null);

  // Look the PIN code up as it's typed so the fee is known before payment.
  useEffect(() => {
    if (!lookupPincode) return;

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      let result: { quote?: { fee: number; zone?: string }; error?: string };
      try {
        const response = await fetch(
          `/api/delivery/check?pincode=${lookupPincode}&subtotal=${subtotal}`,
        );
        const payload = await response.json();
        result = payload?.ok
          ? { quote: payload.data }
          : { error: payload?.error ?? "Couldn't check that PIN code." };
      } catch {
        result = { error: "Couldn't check that PIN code." };
      }
      if (!cancelled) {
        setLookup({ pincode: lookupPincode, subtotal, ...result });
      }
    }, 420);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [lookupPincode, subtotal]);

  const slotSurcharge = useMemo(
    () => slots.find((option) => option.label === slot)?.surcharge ?? 0,
    [slots, slot],
  );

  const deliveryFee = (deliveryQuote?.fee ?? 0) + slotSurcharge;
  const estimatedTotal = cart.totals.total + deliveryFee;
  const onSubmit = handleSubmit(async (values) => {
    const nextErrors: { date?: string; slot?: string } = {};
    if (!date) nextErrors.date = "Choose a delivery date.";
    if (!slot) nextErrors.slot = "Choose a delivery slot.";
    setStepErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      toast.error("Choose when you'd like this delivered.");
      return;
    }

    if (deliveryType === "delivery") {
      const address = addressSchema.safeParse({
        fullName: values.name,
        phone: values.phone,
        line1: values.line1 ?? "",
        line2: values.line2,
        landmark: values.landmark,
        city: values.city ?? "",
        state: values.state ?? "",
        pincode: values.pincode ?? "",
      });
      if (!address.success) {
        toast.error(
          address.error.issues[0]?.message ?? "Complete your delivery address.",
        );
        return;
      }
      if (pincodeError) {
        toast.error(pincodeError);
        return;
      }
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contact: {
            name: values.name,
            phone: values.phone,
            email: values.email || undefined,
          },
          deliveryType,
          address:
            deliveryType === "delivery"
              ? {
                  fullName: values.name,
                  phone: values.phone,
                  line1: values.line1,
                  line2: values.line2 || undefined,
                  landmark: values.landmark || undefined,
                  city: values.city,
                  state: values.state,
                  pincode: values.pincode,
                }
              : undefined,
          deliveryDate: date,
          deliverySlot: slot,
          notes: values.notes || undefined,
          paymentMethod,
          idempotencyKey,
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        // A rejected attempt gets a fresh key so a corrected retry is a new order.
        setIdempotencyKey(nanoid(24));
        throw new Error(payload?.error ?? "Checkout failed. Please try again.");
      }

      if (payload.data.paymentMethod === "manual") {
        await refresh();
        router.push(payload.data.redirectTo);
        return;
      }

      throw new Error("Manual QR payment is not available right now.");
    } catch (error) {
      setSubmitting(false);
      toast.error(
        error instanceof Error ? error.message : "Something went wrong.",
      );
    }
  });

  if (loading) {
    return (
      <div className="grid place-items-center py-24">
        <Loader2 className="text-coral size-6 animate-spin" />
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="border-line-strong/60 bg-cream/50 rounded-[26px] border border-dashed px-6 py-16 text-center">
        <h2 className="display-3">Your cart is empty</h2>
        <p className="lede mt-3">
          Add something to your cart before checking out.
        </p>
        <Link
          href="/shop"
          className="border-coral bg-coral mt-6 inline-flex min-h-[50px] items-center rounded-full border px-6 text-sm font-semibold text-white"
        >
          Browse the shop
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-14"
    >
      <div className="min-w-0 space-y-12">
        <Section number={1} title="Contact information">
          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              label="Full name"
              required
              autoComplete="name"
              error={errors.name?.message}
              {...register("name")}
            />
            <Input
              label="Phone"
              required
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              error={errors.phone?.message}
              {...register("phone")}
            />
            <div className="sm:col-span-2">
              <Input
                label="Email"
                type="email"
                autoComplete="email"
                hint="Your order confirmation goes here."
                error={errors.email?.message}
                {...register("email")}
              />
            </div>
          </div>
        </Section>

        <Section number={2} title="Delivery method">
          <div className="grid gap-3 sm:grid-cols-2">
            <MethodCard
              active={deliveryType === "delivery"}
              onClick={() => setDeliveryType("delivery")}
              icon={<MapPin className="size-4" />}
              title="Home delivery"
              description="Delivered to your door in your chosen slot."
            />
            {pickupEnabled ? (
              <MethodCard
                active={deliveryType === "pickup"}
                onClick={() => setDeliveryType("pickup")}
                icon={<Store className="size-4" />}
                title="Store pickup"
                description="Collect from our counter. No delivery charge."
              />
            ) : null}
          </div>

          {deliveryType === "pickup" ? (
            <div className="bg-cream mt-5 rounded-2xl px-5 py-4 text-sm">
              <p className="font-semibold">{pickupAddress}</p>
              <p className="text-muted mt-1.5">{pickupInstructions}</p>
            </div>
          ) : (
            <div className="mt-6 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Input
                    label="Address line 1"
                    required
                    autoComplete="address-line1"
                    placeholder="House / flat number, street"
                    {...register("line1")}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Input
                    label="Address line 2"
                    autoComplete="address-line2"
                    placeholder="Area, colony"
                    {...register("line2")}
                  />
                </div>
                <Input
                  label="Landmark"
                  placeholder="Near…"
                  {...register("landmark")}
                />
                <Input
                  label="PIN code"
                  required
                  inputMode="numeric"
                  maxLength={6}
                  autoComplete="postal-code"
                  error={pincodeError}
                  hint={
                    checkingPincode
                      ? "Checking availability…"
                      : deliveryQuote?.zone
                        ? `${deliveryQuote.zone} · delivery ${
                            deliveryQuote.fee === 0
                              ? "free"
                              : formatINR(deliveryQuote.fee)
                          }`
                        : undefined
                  }
                  {...register("pincode")}
                />
                <Input
                  label="City"
                  required
                  autoComplete="address-level2"
                  {...register("city")}
                />
                <Input
                  label="State"
                  required
                  autoComplete="address-level1"
                  {...register("state")}
                />
              </div>
            </div>
          )}
        </Section>

        <Section number={3} title="When would you like it?">
          <DeliveryDatePicker
            slots={slots}
            minLeadHours={cart.requiredLeadHours}
            blockedDates={blockedDates}
            maxDaysAhead={maxDaysAhead}
            date={date || undefined}
            slot={slot || undefined}
            onDateChange={(value) => {
              setDate(value);
              setSlot("");
              setStepErrors((current) => ({ ...current, date: undefined }));
            }}
            onSlotChange={(value) => {
              setSlot(value);
              setStepErrors((current) => ({ ...current, slot: undefined }));
            }}
            dateError={stepErrors.date}
            slotError={stepErrors.slot}
            label={deliveryType === "pickup" ? "Pickup date" : "Delivery date"}
            slotLabel={
              deliveryType === "pickup" ? "Pickup slot" : "Delivery slot"
            }
            referenceTime={referenceTime}
          />
        </Section>

        <Section number={4} title="Order notes">
          <Textarea
            label="Anything we should know?"
            rows={3}
            placeholder="Gate code, a surprise delivery, allergy reminders…"
            {...register("notes")}
          />
        </Section>

        <Section number={5} title="Payment">
          {manualQrCode?.url ? (
            <div className="border-line bg-cream/55 grid gap-5 rounded-2xl border p-5 sm:grid-cols-[148px_minmax(0,1fr)] sm:items-center">
              <span className="relative mx-auto aspect-square w-36 overflow-hidden rounded-lg bg-white">
                <Image
                  src={manualQrCode.url}
                  alt={manualQrCode.alt ?? "Payment QR code"}
                  fill
                  sizes="144px"
                  className="object-contain p-2"
                />
              </span>
              <div>
                <p className="flex items-center gap-2 font-semibold">
                  <QrCode className="text-coral size-4" />
                  Scan and pay the exact total
                </p>
                <p className="text-muted mt-2 text-sm leading-relaxed">
                  {manualInstructions}
                </p>
                <p className="text-muted mt-3 flex items-start gap-2 text-xs leading-relaxed">
                  <Lock className="text-pistachio mt-0.5 size-3.5 flex-none" />
                  Your order is submitted after payment and confirmed by the
                  bakery.
                </p>
              </div>
            </div>
          ) : (
            <p className="border-line bg-cream/55 text-muted rounded-2xl border px-5 py-4 text-sm">
              QR payment is temporarily unavailable. Please contact the bakery.
            </p>
          )}
        </Section>
      </div>

      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="border-line rounded-[26px] border bg-white p-6 shadow-[0_24px_60px_rgba(76,43,34,.08)]">
          <h2 className="font-display text-[22px] tracking-[-0.02em]">
            Your order
          </h2>

          <ul className="border-line mt-5 max-h-[280px] space-y-4 overflow-y-auto border-y py-5">
            {cart.items.map((item) => (
              <li key={item.key} className="flex gap-3">
                <span className="bg-cream relative size-14 flex-none overflow-hidden rounded-xl">
                  {item.image?.url ? (
                    <Image
                      src={item.image.url}
                      alt=""
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  ) : (
                    <span
                      className="grid h-full place-items-center"
                      aria-hidden
                    >
                      🎂
                    </span>
                  )}
                  <span className="bg-cocoa absolute -top-1 -right-1 grid size-5 place-items-center rounded-full text-[10px] font-bold text-white">
                    {item.quantity}
                  </span>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.name}</p>
                  <CartLineConfig config={item.config} compact />
                </div>
                <span className="flex-none text-sm font-semibold">
                  {formatINR(item.lineTotal)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="mt-5 space-y-2.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd className="font-medium">{formatINR(cart.totals.subtotal)}</dd>
            </div>
            {cart.totals.discount > 0 ? (
              <div className="text-coral-dark flex justify-between">
                <dt>
                  Discount
                  {cart.totals.couponCode ? ` (${cart.totals.couponCode})` : ""}
                </dt>
                <dd className="font-medium">
                  −{formatINR(cart.totals.discount)}
                </dd>
              </div>
            ) : null}
            <div className="flex justify-between">
              <dt className="text-muted">
                {deliveryType === "pickup" ? "Pickup" : "Delivery"}
                {deliveryQuote?.zone && deliveryType === "delivery"
                  ? ` · ${deliveryQuote.zone}`
                  : ""}
              </dt>
              <dd className="font-medium">
                {deliveryType === "pickup"
                  ? "Free"
                  : deliveryQuote
                    ? deliveryFee === 0
                      ? "Free"
                      : formatINR(deliveryFee)
                    : "—"}
              </dd>
            </div>
          </dl>

          <div className="border-line mt-5 flex items-baseline justify-between border-t pt-5">
            <span className="font-semibold">Total</span>
            <span className="font-display text-[28px] leading-none tracking-[-0.03em]">
              {formatINR(estimatedTotal)}
            </span>
          </div>

          <Button
            type="submit"
            variant="coral"
            size="lg"
            fullWidth
            className="mt-6"
            loading={submitting}
            disabled={submitting || !manualQrCode?.url}
          >
            I&apos;ve paid · Place order
          </Button>

          <p className="text-muted mt-3 text-center text-xs">
            The final amount is confirmed by our server before your order is
            submitted.
          </p>
        </div>
      </aside>
    </form>
  );
}

function Section({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <header className="mb-6 flex gap-4">
        <span
          aria-hidden
          className="bg-coral grid size-9 flex-none place-items-center rounded-xl text-[11px] font-bold text-white"
        >
          {String(number).padStart(2, "0")}
        </span>
        <h2 className="font-display text-[22px] leading-tight tracking-[-0.02em] sm:text-[25px]">
          {title}
        </h2>
      </header>
      {children}
    </section>
  );
}

function MethodCard({
  active,
  disabled,
  onClick,
  icon,
  title,
  description,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={cn(
        "flex items-start gap-3 rounded-2xl border p-4 text-left transition-colors",
        active
          ? "border-coral bg-coral-soft/50"
          : "border-line bg-paper hover:border-line-strong",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <span
        className={cn(
          "mt-0.5 grid size-8 flex-none place-items-center rounded-full",
          active ? "bg-coral text-white" : "bg-cream text-coral",
        )}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="text-muted mt-0.5 block text-xs leading-relaxed">
          {description}
        </span>
      </span>
    </button>
  );
}
