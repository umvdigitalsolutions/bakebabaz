"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { Button, ButtonLink } from "@/components/ui/Button";
import { CakeStudioPreview } from "./CakeStudioPreview";
import { StudioProgress, STUDIO_STEPS } from "./StudioProgress";
import { StudioStep } from "./StudioSteps";
import {
  initialBuilderState,
  type BuilderErrors,
  type BuilderState,
} from "./types";
import { calculateCustomCakePrice } from "@/lib/pricing/engine";
import { whatsappLink } from "@/lib/whatsapp";
import type { PricingCatalog, PricingCatalogOption } from "@/lib/pricing/types";
import type { SlotOption } from "@/components/checkout/DeliveryDatePicker";
import styles from "./CakeBuilder.module.css";

export function CakeBuilder({
  catalog,
  slots,
  blockedDates,
  maxDaysAhead,
  brandName,
  whatsappNumber,
  referenceTime,
}: {
  catalog: PricingCatalog;
  slots: SlotOption[];
  blockedDates: string[];
  maxDaysAhead: number;
  brandName: string;
  whatsappNumber: string;
  referenceTime: string;
}) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [state, setState] = useState<BuilderState>(() => initialBuilderState());
  const [errors, setErrors] = useState<BuilderErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const optionsByType = useMemo(() => {
    const grouped: Record<string, PricingCatalogOption[]> = {};
    for (const option of catalog.options) {
      grouped[option.type] = [...(grouped[option.type] ?? []), option];
    }
    return grouped;
  }, [catalog.options]);

  const labels = useMemo(() => {
    const map: Record<string, string> = {};
    for (const option of catalog.options) map[option.value] = option.label;
    return map;
  }, [catalog.options]);

  const quote = useMemo(
    () =>
      calculateCustomCakePrice(
        catalog,
        {
          occasion: state.occasion,
          requiredDate: state.requiredDate || undefined,
          deliverySlot: state.deliverySlot || undefined,
          servings: Number(state.servings) || undefined,
          style: state.style || undefined,
          flavour: state.flavour || undefined,
          filling: state.filling || undefined,
          shape: state.shape || undefined,
          weightKg: state.weightKg,
          eggPreference: state.eggPreference,
          tiers: state.tiers,
          message: state.message || undefined,
          addOns: state.addOns,
        },
        new Date(referenceTime),
      ),
    [catalog, referenceTime, state],
  );

  const update = (patch: Partial<BuilderState>) => {
    setState((current) => ({ ...current, ...patch }));
    setErrors((current) => {
      const next = { ...current };
      for (const key of Object.keys(patch)) {
        delete next[key as keyof BuilderState];
      }
      return next;
    });
  };

  const errorsForStep = (step: number) => {
    const next: BuilderErrors = {};
    if (step === 0) {
      if (!state.occasion) next.occasion = "Choose an occasion.";
      if (!state.requiredDate) next.requiredDate = "Choose a required date.";
      if (!state.deliverySlot) next.deliverySlot = "Choose a preferred time.";
    }
    if (step === 2 && !state.flavour) next.flavour = "Choose a flavour.";
    if (step === 3) {
      if (!state.style) next.style = "Choose a cake style.";
      if (!state.shape) next.shape = "Choose a shape.";
    }
    if (step === 6) {
      if (state.name.trim().length < 2) next.name = "Please enter your name.";
      if (!/^(\+91[\s-]?)?[6-9]\d{9}$/.test(state.phone.replace(/\s/g, ""))) {
        next.phone = "Enter a valid 10-digit Indian mobile number.";
      }
      if (state.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(state.email)) {
        next.email = "Enter a valid email address.";
      }
      if (!state.consent) next.consent = "Please accept this to continue.";
    }
    return next;
  };

  const goToStep = (step: number) => {
    const next = Math.max(0, Math.min(STUDIO_STEPS.length - 1, step));
    setDirection(next >= currentStep ? 1 : -1);
    setCurrentStep(next);
  };

  const continueToNext = () => {
    const nextErrors = errorsForStep(currentStep);
    setErrors((current) => ({ ...current, ...nextErrors }));
    if (Object.keys(nextErrors).length > 0) {
      toast.error("Please complete the highlighted details.");
      return;
    }
    goToStep(currentStep + 1);
  };

  const validateAll = () => {
    const next: BuilderErrors = {};
    for (const step of [0, 2, 3, 6]) Object.assign(next, errorsForStep(step));
    setErrors(next);
    if (Object.keys(next).length === 0) return true;

    const firstKey = Object.keys(next)[0] as keyof BuilderState;
    const step = ["occasion", "requiredDate", "deliverySlot"].includes(firstKey)
      ? 0
      : firstKey === "flavour"
        ? 2
        : ["style", "shape"].includes(firstKey)
          ? 3
          : 6;
    goToStep(step);
    toast.error("Please complete the highlighted details.");
    return false;
  };

  const submit = async () => {
    if (!validateAll()) return;
    if (quote.warnings.length) {
      toast.error(quote.warnings[0]);
      goToStep(0);
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/custom-cake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contact: {
            name: state.name,
            phone: state.phone,
            email: state.email || undefined,
          },
          config: {
            occasion: state.occasion,
            requiredDate: state.requiredDate,
            deliverySlot: state.deliverySlot,
            servings: Number(state.servings) || undefined,
            style: state.style,
            flavour: state.flavour,
            filling: state.filling || undefined,
            shape: state.shape,
            weightKg: state.weightKg,
            eggPreference: state.eggPreference,
            tiers: state.tiers,
            colourTheme: state.colourTheme || undefined,
            message: state.message || undefined,
            addOns: state.addOns,
            notes: state.notes || undefined,
            referenceImages: state.referenceImages,
          },
          consent: true,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error ?? "Could not send your request.");
      }
      router.push(`/custom-cake/${payload.data.requestNumber}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const whatsAppMessage = [
    `Hi ${brandName}, I'd like to discuss a custom cake.`,
    "",
    `Occasion: ${labels[state.occasion] ?? "Not selected"}`,
    `Date: ${state.requiredDate || "Not selected"}${state.deliverySlot ? `, ${state.deliverySlot}` : ""}`,
    `Size: ${state.weightKg} kg, ${state.tiers} tier${state.tiers > 1 ? "s" : ""}`,
    `Flavour: ${labels[state.flavour] ?? "Not selected"}`,
    `Style: ${labels[state.style] ?? "Not selected"}`,
    `Shape: ${labels[state.shape] ?? "Not selected"}`,
    `Colours: ${state.colourTheme || "Open to ideas"}`,
    `Message: ${state.message || "None"}`,
    state.notes ? `Notes: ${state.notes}` : "",
    "",
    "I will attach any reference images in this WhatsApp chat.",
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <div>
      <StudioProgress currentStep={currentStep} onStepChange={goToStep} />

      <div className={`${styles.studioLayout} mt-8`}>
        <aside className={styles.previewColumn}>
          <CakeStudioPreview
            state={state}
            quote={quote}
            labels={labels}
            optionsByType={optionsByType}
          />
        </aside>

        <div className="border-line min-w-0 rounded-lg border bg-white shadow-[0_24px_60px_rgba(76,43,34,.08)]">
          <div className="min-h-[580px] p-5 sm:p-8 lg:p-10">
            <AnimatePresence mode="wait" initial={false} custom={direction}>
              <motion.div
                key={currentStep}
                custom={direction}
                initial={
                  reduceMotion
                    ? { opacity: 1 }
                    : { opacity: 0, x: direction * 18 }
                }
                animate={{ opacity: 1, x: 0 }}
                exit={
                  reduceMotion
                    ? { opacity: 1 }
                    : { opacity: 0, x: direction * -12 }
                }
                transition={{ duration: reduceMotion ? 0 : 0.24 }}
              >
                <StudioStep
                  step={currentStep}
                  state={state}
                  errors={errors}
                  update={update}
                  catalog={catalog}
                  optionsByType={optionsByType}
                  slots={slots}
                  blockedDates={blockedDates}
                  maxDaysAhead={maxDaysAhead}
                  referenceTime={referenceTime}
                  quote={quote}
                  labels={labels}
                  brandName={brandName}
                  onEdit={goToStep}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="border-line bg-paper/95 sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3 border-t p-4 backdrop-blur-lg sm:px-8 sm:py-5 lg:static lg:px-10">
            <Button
              type="button"
              variant="quiet"
              onClick={() => goToStep(currentStep - 1)}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="size-4" />
              Back
            </Button>

            {currentStep < STUDIO_STEPS.length - 1 ? (
              <Button type="button" variant="coral" onClick={continueToNext}>
                Continue
                <ArrowRight className="size-4" />
              </Button>
            ) : (
              <div className="flex flex-1 flex-wrap justify-end gap-2 sm:flex-none">
                <ButtonLink
                  href={whatsappLink(whatsappNumber, whatsAppMessage)}
                  variant="outline"
                  className="px-4"
                >
                  <MessageCircle className="size-4" />
                  WhatsApp summary
                </ButtonLink>
                <Button
                  type="button"
                  variant="coral"
                  loading={submitting}
                  onClick={() => void submit()}
                >
                  <Send className="size-4" />
                  Send Custom Cake Request
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
