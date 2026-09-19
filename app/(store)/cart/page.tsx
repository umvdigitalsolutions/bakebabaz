import type { Metadata } from "next";
import { getStoreSettings } from "@/lib/data/settings";
import { CartPageView } from "@/components/cart/CartPageView";

export const metadata: Metadata = {
  title: "Your cart",
  robots: { index: false, follow: false },
};

export default async function CartPage() {
  const settings = await getStoreSettings();

  return (
    <div className="wrap pt-10 pb-24 sm:pt-14">
      <header className="mb-10 sm:mb-14">
        <p className="eyebrow mb-4">Almost there</p>
        <h1 className="display-2">Your cart</h1>
      </header>

      <CartPageView
        freeDeliveryThreshold={settings.delivery.freeDeliveryThreshold}
      />
    </div>
  );
}
