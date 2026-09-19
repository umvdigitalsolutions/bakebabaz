import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock, MapPin, Package, Receipt } from "lucide-react";
import { getOrderForViewer } from "@/lib/data/orders";
import { getStoreSettings } from "@/lib/data/settings";
import { ButtonLink } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CartLineConfig } from "@/components/cart/CartLineConfig";
import { WhatsAppIcon } from "@/components/ui/icons";
import { formatDate, formatINR } from "@/lib/utils";
import { whatsappLink, whatsappMessages } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Order confirmed",
  robots: { index: false, follow: false },
};

export default async function OrderSuccessPage(props: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await props.params;
  const [order, settings] = await Promise.all([
    getOrderForViewer(orderNumber),
    getStoreSettings(),
  ]);

  if (!order) notFound();

  const paid = order.payment.status === "PAID";
  const cod = order.payment.method === "cod";
  const manual = order.payment.method === "manual";

  return (
    <div className="wrap max-w-[900px] pt-12 pb-24 sm:pt-16">
      <div className="text-center">
        <span
          aria-hidden
          className="bg-pistachio/15 mx-auto grid size-16 place-items-center rounded-full text-[#5b6034]"
        >
          <CheckCircle2 className="size-8" />
        </span>
        <p className="eyebrow eyebrow-plain mt-6 justify-center">
          {cod || manual
            ? "Order placed"
            : paid
              ? "Payment received"
              : "Order saved"}
        </p>
        <h1 className="display-2 mt-3 text-balance">
          Thank you, {order.contact.name.split(" ")[0]}.
        </h1>
        <p className="lede mx-auto mt-4 max-w-lg text-balance">
          {manual
            ? "We have received your order and will confirm your QR payment before preparing it."
            : cod
              ? "Your order is confirmed. Please keep the exact amount ready for delivery."
              : paid
                ? "Your payment is confirmed and your order is heading into our kitchen."
                : "Your order is saved but payment isn't confirmed yet. Contact the bakery and we'll help you complete it."}
        </p>

        <div className="border-line bg-cream mt-7 inline-flex flex-wrap items-center justify-center gap-3 rounded-2xl border px-6 py-4">
          <div className="text-left">
            <p className="text-muted text-[11px] font-bold tracking-[0.12em] uppercase">
              Order number
            </p>
            <p className="font-display text-2xl tracking-[-0.02em]">
              {order.orderNumber}
            </p>
          </div>
          <span className="bg-line hidden h-10 w-px sm:block" />
          <div className="text-left">
            <p className="text-muted text-[11px] font-bold tracking-[0.12em] uppercase">
              Payment
            </p>
            <Badge tone={paid ? "leaf" : cod ? "neutral" : "coral"}>
              {paid
                ? "Paid"
                : manual
                  ? "QR payment pending"
                  : cod
                    ? "Cash on delivery"
                    : order.payment.status === "FAILED"
                      ? "Payment failed"
                      : "Pending"}
            </Badge>
          </div>
        </div>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        <InfoCard
          icon={<Clock className="size-4" />}
          title={order.delivery.type === "pickup" ? "Pickup" : "Delivery"}
        >
          <p className="font-semibold">{formatDate(order.delivery.date)}</p>
          <p className="text-muted text-sm">{order.delivery.slot}</p>
        </InfoCard>

        <InfoCard
          icon={<MapPin className="size-4" />}
          title={
            order.delivery.type === "pickup" ? "Collect from" : "Deliver to"
          }
        >
          {order.delivery.type === "pickup" ? (
            <p className="text-sm leading-relaxed">
              {settings.delivery.storeAddress}
            </p>
          ) : order.delivery.address ? (
            <p className="text-sm leading-relaxed">
              {order.delivery.address.fullName}
              <br />
              {order.delivery.address.line1}
              {order.delivery.address.line2
                ? `, ${order.delivery.address.line2}`
                : ""}
              <br />
              {order.delivery.address.landmark
                ? `${order.delivery.address.landmark}, `
                : ""}
              {order.delivery.address.city} {order.delivery.address.pincode}
              <br />
              {order.delivery.address.phone}
            </p>
          ) : null}
        </InfoCard>
      </div>

      <section className="border-line mt-10 rounded-[26px] border bg-white p-6 sm:p-8">
        <h2 className="font-display flex items-center gap-2.5 text-[22px] tracking-[-0.02em]">
          <Package className="text-coral size-5" />
          Your order
        </h2>

        <ul className="divide-line border-line mt-6 divide-y border-y">
          {order.items.map((item, index) => (
            <li key={index} className="flex gap-4 py-5">
              <span className="bg-cream relative size-20 flex-none overflow-hidden rounded-2xl">
                {item.image?.url ? (
                  <Image
                    src={item.image.url}
                    alt=""
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                ) : (
                  <span
                    className="grid h-full place-items-center text-2xl"
                    aria-hidden
                  >
                    🎂
                  </span>
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{item.name}</p>
                <p className="text-muted text-[11px] font-semibold tracking-[0.1em] uppercase">
                  {item.categoryName} · Qty {item.quantity}
                </p>
                <CartLineConfig config={item.config} />

                {item.config.referenceImages?.length ? (
                  <div className="mt-3 flex gap-2">
                    {item.config.referenceImages.map((image, imageIndex) => (
                      <span
                        key={image.url}
                        className="bg-cream relative size-12 overflow-hidden rounded-lg"
                      >
                        <Image
                          src={image.url}
                          alt={`Reference ${imageIndex + 1}`}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
              <span className="flex-none font-semibold">
                {formatINR(item.lineTotal)}
              </span>
            </li>
          ))}
        </ul>

        <dl className="mt-6 space-y-2.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Subtotal</dt>
            <dd>{formatINR(order.amounts.subtotal)}</dd>
          </div>
          {order.amounts.discount > 0 ? (
            <div className="text-coral-dark flex justify-between">
              <dt>
                Discount{order.coupon?.code ? ` (${order.coupon.code})` : ""}
              </dt>
              <dd>−{formatINR(order.amounts.discount)}</dd>
            </div>
          ) : null}
          <div className="flex justify-between">
            <dt className="text-muted">
              {order.delivery.type === "pickup" ? "Pickup" : "Delivery"}
            </dt>
            <dd>
              {order.amounts.deliveryFee === 0
                ? "Free"
                : formatINR(order.amounts.deliveryFee)}
            </dd>
          </div>
          <div className="border-line flex items-baseline justify-between border-t pt-4">
            <dt className="font-semibold">Total</dt>
            <dd className="font-display text-[26px] tracking-[-0.03em]">
              {formatINR(order.amounts.total)}
            </dd>
          </div>
        </dl>

        {order.customerNotes ? (
          <div className="bg-cream mt-6 rounded-2xl px-5 py-4">
            <p className="text-muted flex items-center gap-2 text-[11px] font-bold tracking-[0.12em] uppercase">
              <Receipt className="size-3.5" />
              Your notes
            </p>
            <p className="mt-1.5 text-sm">{order.customerNotes}</p>
          </div>
        ) : null}
      </section>

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <ButtonLink href="/shop" variant="coral">
          Continue shopping
        </ButtonLink>
        <a
          href={whatsappLink(
            settings.brand.whatsapp,
            whatsappMessages.order(settings.brand.name, order.orderNumber),
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="border-line hover:border-coral inline-flex min-h-[50px] items-center gap-2.5 rounded-full border px-6 text-sm font-semibold transition-colors"
        >
          <WhatsAppIcon className="size-[18px] text-[#25D366]" />
          WhatsApp the bakery
        </a>
      </div>
    </div>
  );
}

function InfoCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-line rounded-[22px] border bg-white p-6">
      <p className="text-muted flex items-center gap-2 text-[11px] font-bold tracking-[0.12em] uppercase">
        <span className="text-coral">{icon}</span>
        {title}
      </p>
      <div className="mt-3">{children}</div>
    </div>
  );
}
