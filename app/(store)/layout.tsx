import { getStoreSettings } from "@/lib/data/settings";
import { getPricedCart } from "@/lib/cart/service";
import { Header } from "@/components/store/Header";
import { Footer } from "@/components/store/Footer";
import { AnnouncementBar } from "@/components/store/AnnouncementBar";
import { WhatsAppButton } from "@/components/store/WhatsAppButton";
import { MobileActionBar } from "@/components/store/MobileActionBar";
import { CartProvider } from "@/components/cart/CartProvider";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { whatsappMessages } from "@/lib/whatsapp";

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, cart] = await Promise.all([
    getStoreSettings(),
    getPricedCart(),
  ]);

  return (
    <CartProvider
      initialCart={{
        items: cart.items,
        savedForLater: cart.savedForLater,
        totals: cart.totals,
        couponError: cart.couponError,
        requiredLeadHours: cart.requiredLeadHours,
      }}
    >
      <div className="flex min-h-dvh flex-col pb-[82px] md:pb-0">
        {settings.announcement.enabled && settings.announcement.text ? (
          <AnnouncementBar
            text={settings.announcement.text}
            link={settings.announcement.link}
          />
        ) : null}

        <Header
          brandName={settings.brand.name}
          location={settings.brand.location}
        />

        <main className="flex-1">{children}</main>

        <Footer settings={settings} />
      </div>

      <CartDrawer />
      <WhatsAppButton
        number={settings.brand.whatsapp}
        message={whatsappMessages.general(settings.brand.name)}
      />
      <MobileActionBar
        whatsapp={settings.brand.whatsapp}
        message={whatsappMessages.general(settings.brand.name)}
      />
    </CartProvider>
  );
}
