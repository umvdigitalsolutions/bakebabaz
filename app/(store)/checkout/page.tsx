import type { Metadata } from "next";
import { getStoreSettings } from "@/lib/data/settings";
import { getActiveSlots } from "@/lib/delivery/validate";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const [settings, slots] = await Promise.all([
    getStoreSettings(),
    getActiveSlots(),
  ]);

  return (
    <div className="wrap py-12 sm:py-16">
      <header className="mb-10 sm:mb-14">
        <p className="eyebrow mb-4">Secure checkout</p>
        <h1 className="display-2">Almost yours</h1>
      </header>

      <CheckoutForm
        slots={slots.map((slot) => ({
          label: slot.label,
          startTime: slot.startTime,
          surcharge: slot.surcharge,
        }))}
        blockedDates={settings.delivery.blockedDates}
        maxDaysAhead={settings.delivery.maxDaysAhead}
        pickupEnabled={settings.delivery.pickupEnabled}
        pickupAddress={settings.delivery.storeAddress}
        pickupInstructions={settings.delivery.pickupInstructions}
        manualQrCode={settings.payments.manualQrCode}
        manualInstructions={settings.payments.manualInstructions}
        brandName={settings.brand.name}
        referenceTime={new Date().toISOString()}
      />
    </div>
  );
}
