import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  connectToDatabase,
  serialize,
  type Serialized,
} from "@/lib/db/mongoose";
import { Order, type IOrder } from "@/models/Order";
import { getStoreSettings, type StoreSettingsData } from "@/lib/data/settings";
import { PrintButton } from "@/components/admin/PrintButton";
import {
  formatDate,
  formatDateTime,
  formatINR,
  isValidObjectId,
} from "@/lib/utils";

export const metadata: Metadata = {
  title: "Kitchen sheet",
  robots: { index: false, follow: false },
};

/**
 * Two printable views on one route.
 *
 * The kitchen sheet is deliberately spare — only what the baker needs, in large
 * type, with no prices to clutter it. `?view=invoice` prints the customer
 * document instead.
 */
export default async function KitchenSheetPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const [{ id }, { view }] = await Promise.all([
    props.params,
    props.searchParams,
  ]);
  if (!isValidObjectId(id)) notFound();

  await connectToDatabase();
  const [doc, settings] = await Promise.all([
    Order.findById(id).lean(),
    getStoreSettings(),
  ]);
  if (!doc) notFound();

  const order = serialize(doc);
  const isInvoice = view === "invoice";

  return (
    <div className="mx-auto w-full max-w-[820px] px-4 py-6 lg:px-8">
      <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3 pl-12 lg:pl-0">
        <div>
          <h1 className="text-[20px] font-semibold">
            {isInvoice ? "Invoice" : "Kitchen order sheet"}
          </h1>
          <p className="text-[13px] text-[#64748b]">
            Order #{order.orderNumber}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/admin/orders/${id}/kitchen${isInvoice ? "" : "?view=invoice"}`}
            className="inline-flex h-10 items-center rounded-lg border border-[#e3e8ef] bg-white px-4 text-[13.5px] font-semibold hover:bg-[#f1f5f9]"
          >
            {isInvoice ? "Kitchen sheet" : "Invoice"}
          </Link>
          <PrintButton label={isInvoice ? "Print invoice" : "Print sheet"} />
          <Link
            href={`/admin/orders/${id}`}
            className="inline-flex h-10 items-center px-2 text-[13px] font-semibold text-[#16324f] underline underline-offset-4"
          >
            ← Back
          </Link>
        </div>
      </div>

      <div className="print-sheet rounded-xl border border-[#e3e8ef] bg-white p-8">
        {isInvoice ? (
          <InvoiceBody order={order} settings={settings} />
        ) : (
          <KitchenBody order={order} />
        )}
      </div>
    </div>
  );
}

type OrderDoc = Serialized<IOrder>;

function KitchenBody({ order }: { order: OrderDoc }) {
  const data = order;

  return (
    <div>
      <header className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-black pb-4">
        <div>
          <p className="text-[11px] font-bold tracking-[0.14em] text-[#64748b] uppercase">
            Kitchen order sheet
          </p>
          <p className="mt-1 text-[34px] leading-none font-bold">
            #{data.orderNumber}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-bold tracking-[0.14em] text-[#64748b] uppercase">
            Required
          </p>
          <p className="mt-1 text-[22px] leading-tight font-bold">
            {formatDate(data.delivery.date)}
          </p>
          <p className="text-[16px] font-semibold">{data.delivery.slot}</p>
          <p className="mt-1 text-[12px] tracking-[0.08em] uppercase">
            {data.delivery.type === "pickup" ? "Store pickup" : "Delivery"}
          </p>
        </div>
      </header>

      <ol className="mt-6 space-y-6">
        {data.items.map((item, index) => {
          const config = item.config;
          const spec = (
            [
              ["Weight", config.weightLabel],
              ["Flavour", config.flavour],
              ["Filling", config.filling],
              ["Shape", config.shape],
              ["Style", config.style],
              ["Tiers", config.tiers],
              [
                "Egg",
                config.eggPreference === "eggless"
                  ? "EGGLESS"
                  : config.eggPreference === "with-egg"
                    ? "With egg"
                    : undefined,
              ],
              ["Servings", config.servings],
              ["Theme / colours", config.colourTheme],
            ] as [string, unknown][]
          ).filter(([, value]) => value != null && value !== "");

          return (
            <li
              key={index}
              className="border-b border-[#cbd5e1] pb-6 last:border-0"
            >
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="text-[22px] leading-tight font-bold">
                  {item.quantity} × {item.name}
                </h2>
                <span className="text-[12px] font-semibold tracking-[0.08em] whitespace-nowrap text-[#64748b] uppercase">
                  {item.prepTimeHours}h prep
                </span>
              </div>

              {spec.length > 0 ? (
                <dl className="mt-3 grid grid-cols-2 gap-x-8 gap-y-1.5 sm:grid-cols-3">
                  {spec.map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-[10.5px] font-bold tracking-[0.1em] text-[#64748b] uppercase">
                        {label}
                      </dt>
                      <dd className="text-[15px] font-semibold">
                        {String(value)}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : null}

              {config.message ? (
                <div className="mt-4 border-2 border-black px-4 py-3">
                  <p className="text-[10.5px] font-bold tracking-[0.1em] text-[#64748b] uppercase">
                    Message on cake
                  </p>
                  <p className="mt-1 text-[20px] font-bold">
                    {String(config.message)}
                  </p>
                </div>
              ) : null}

              {item.config.addOns?.length ? (
                <p className="mt-3 text-[14px]">
                  <span className="font-bold">Add-ons: </span>
                  {item.config.addOns.map((addOn) => addOn.name).join(", ")}
                </p>
              ) : null}

              {config.notes ? (
                <p className="mt-3 text-[14px]">
                  <span className="font-bold">Notes: </span>
                  {String(config.notes)}
                </p>
              ) : null}

              {item.config.referenceImages?.length ? (
                <div className="mt-4">
                  <p className="mb-2 text-[10.5px] font-bold tracking-[0.1em] text-[#64748b] uppercase">
                    Reference images
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {item.config.referenceImages.map((image, i) => (
                      <span
                        key={image.url}
                        className="relative size-32 overflow-hidden rounded border border-[#cbd5e1]"
                      >
                        <Image
                          src={image.url}
                          alt={`Reference ${i + 1}`}
                          fill
                          sizes="128px"
                          className="object-cover"
                          unoptimized
                        />
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>

      {data.customerNotes ? (
        <div className="mt-6 border-2 border-black px-4 py-3">
          <p className="text-[10.5px] font-bold tracking-[0.1em] text-[#64748b] uppercase">
            Customer notes
          </p>
          <p className="mt-1 text-[15px] font-semibold">{data.customerNotes}</p>
        </div>
      ) : null}

      <footer className="mt-8 flex flex-wrap justify-between gap-4 border-t-2 border-black pt-4 text-[13px]">
        <span>
          <span className="font-bold">Customer: </span>
          {data.contact.name} · {data.contact.phone}
        </span>
        <span className="text-[#64748b]">
          Printed {formatDateTime(new Date())}
        </span>
      </footer>
    </div>
  );
}

function InvoiceBody({
  order,
  settings,
}: {
  order: OrderDoc;
  settings: StoreSettingsData;
}) {
  const data = order;

  return (
    <div>
      <header className="flex flex-wrap items-start justify-between gap-6 border-b border-[#cbd5e1] pb-6">
        <div>
          <p className="text-[20px] font-bold">{settings.brand.name}</p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-[#64748b]">
            {settings.brand.addressLines.join(", ")}
            <br />
            {settings.brand.phone} · {settings.brand.email}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-bold tracking-[0.14em] text-[#64748b] uppercase">
            Invoice
          </p>
          <p className="mt-1 text-[24px] leading-none font-bold">
            #{data.orderNumber}
          </p>
          <p className="mt-1 text-[12.5px] text-[#64748b]">
            {formatDate(data.createdAt)}
          </p>
        </div>
      </header>

      <div className="grid gap-6 border-b border-[#cbd5e1] py-6 sm:grid-cols-2">
        <div>
          <p className="text-[10.5px] font-bold tracking-[0.1em] text-[#64748b] uppercase">
            Billed to
          </p>
          <p className="mt-1.5 text-[13.5px] leading-relaxed">
            {data.contact.name}
            <br />
            {data.contact.phone}
            {data.contact.email ? (
              <>
                <br />
                {data.contact.email}
              </>
            ) : null}
          </p>
        </div>
        <div>
          <p className="text-[10.5px] font-bold tracking-[0.1em] text-[#64748b] uppercase">
            {data.delivery.type === "pickup" ? "Pickup" : "Delivery"}
          </p>
          <p className="mt-1.5 text-[13.5px] leading-relaxed">
            {formatDate(data.delivery.date)} · {data.delivery.slot}
            {data.delivery.address ? (
              <>
                <br />
                {data.delivery.address.line1}
                {data.delivery.address.line2
                  ? `, ${data.delivery.address.line2}`
                  : ""}
                <br />
                {data.delivery.address.city} {data.delivery.address.pincode}
              </>
            ) : null}
          </p>
        </div>
      </div>

      <table className="mt-6 w-full text-left text-[13.5px]">
        <thead>
          <tr className="border-b border-[#cbd5e1]">
            <th className="pb-2 text-[10.5px] font-bold tracking-[0.1em] text-[#64748b] uppercase">
              Item
            </th>
            <th className="pb-2 text-right text-[10.5px] font-bold tracking-[0.1em] text-[#64748b] uppercase">
              Qty
            </th>
            <th className="pb-2 text-right text-[10.5px] font-bold tracking-[0.1em] text-[#64748b] uppercase">
              Rate
            </th>
            <th className="pb-2 text-right text-[10.5px] font-bold tracking-[0.1em] text-[#64748b] uppercase">
              Amount
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#e3e8ef]">
          {data.items.map((item, index) => (
            <tr key={index}>
              <td className="py-2.5 pr-4">{item.name}</td>
              <td className="py-2.5 text-right tabular-nums">
                {item.quantity}
              </td>
              <td className="py-2.5 text-right tabular-nums">
                {formatINR(item.unitPrice)}
              </td>
              <td className="py-2.5 text-right tabular-nums">
                {formatINR(item.lineTotal)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <dl className="mt-6 ml-auto w-full max-w-[280px] space-y-1.5 text-[13.5px]">
        <div className="flex justify-between">
          <dt className="text-[#64748b]">Subtotal</dt>
          <dd className="tabular-nums">{formatINR(data.amounts.subtotal)}</dd>
        </div>
        {data.amounts.discount > 0 ? (
          <div className="flex justify-between">
            <dt className="text-[#64748b]">
              Discount{data.coupon?.code ? ` (${data.coupon.code})` : ""}
            </dt>
            <dd className="tabular-nums">
              −{formatINR(data.amounts.discount)}
            </dd>
          </div>
        ) : null}
        <div className="flex justify-between">
          <dt className="text-[#64748b]">Delivery</dt>
          <dd className="tabular-nums">
            {formatINR(data.amounts.deliveryFee)}
          </dd>
        </div>
        <div className="flex justify-between border-t border-black pt-2 text-[16px] font-bold">
          <dt>Total</dt>
          <dd className="tabular-nums">{formatINR(data.amounts.total)}</dd>
        </div>
      </dl>

      <p className="mt-8 border-t border-[#cbd5e1] pt-4 text-[12px] text-[#64748b]">
        Payment:{" "}
        {data.payment.method === "manual"
          ? "Manual QR payment"
          : data.payment.method === "cod"
            ? "Cash on delivery"
            : "Razorpay"}{" "}
        · {data.payment.status.toLowerCase().replace(/_/g, " ")}. Thank you for
        ordering from {settings.brand.name}.
      </p>
    </div>
  );
}

export type { OrderDoc };
