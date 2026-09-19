import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChefHat, Printer } from "lucide-react";
import { connectToDatabase, serialize } from "@/lib/db/mongoose";
import { Order } from "@/models/Order";
import { getStoreSettings } from "@/lib/data/settings";
import {
  AdminCard,
  AdminPage,
  StatusBadge,
} from "@/components/admin/AdminShell";
import { OrderActions } from "@/components/admin/OrderActions";
import {
  OrderTimeline,
  STATUS_LABELS,
} from "@/components/shared/OrderTimeline";
import { CartLineConfig } from "@/components/cart/CartLineConfig";
import { WhatsAppIcon } from "@/components/ui/icons";
import {
  formatDate,
  formatDateTime,
  formatINR,
  isValidObjectId,
} from "@/lib/utils";
import { whatsappLink, whatsappMessages } from "@/lib/whatsapp";

export const metadata: Metadata = { title: "Order" };

export default async function AdminOrderPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  if (!isValidObjectId(id)) notFound();

  await connectToDatabase();
  const [doc, settings] = await Promise.all([
    Order.findById(id).lean(),
    getStoreSettings(),
  ]);
  if (!doc) notFound();

  const order = serialize(doc);

  return (
    <AdminPage
      title={`Order #${order.orderNumber}`}
      description={`Placed ${formatDateTime(order.createdAt)}`}
      actions={
        <>
          <Link
            href={`/admin/orders/${id}/kitchen`}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-[#16324f] bg-[#16324f] px-4 text-[13.5px] font-semibold text-white hover:bg-[#0f2439]"
          >
            <ChefHat className="size-4" />
            Kitchen sheet
          </Link>
          <Link
            href={`/admin/orders/${id}/kitchen?view=invoice`}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-[#e3e8ef] bg-white px-4 text-[13.5px] font-semibold hover:bg-[#f1f5f9]"
          >
            <Printer className="size-4" />
            Invoice
          </Link>
          <Link
            href="/admin/orders"
            className="inline-flex h-10 items-center px-2 text-[13px] font-semibold text-[#16324f] underline underline-offset-4"
          >
            ← All orders
          </Link>
        </>
      }
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            <StatusBadge
              status={order.status}
              label={STATUS_LABELS[order.status]}
            />
            <StatusBadge
              status={order.payment.status}
              label={`Payment: ${order.payment.status.toLowerCase().replace(/_/g, " ")}`}
            />
            <StatusBadge
              status="PENDING"
              label={
                order.payment.method === "manual"
                  ? "Manual QR payment"
                  : order.payment.method === "cod"
                    ? "Cash on delivery"
                    : "Razorpay"
              }
            />
            {order.delivery.type === "pickup" ? (
              <StatusBadge status="PENDING" label="Store pickup" />
            ) : null}
          </div>

          <AdminCard title="Items" padded={false}>
            <ul className="divide-y divide-[#e3e8ef]">
              {order.items.map((item, index) => (
                <li key={index} className="flex gap-4 p-5">
                  <span className="relative size-16 flex-none overflow-hidden rounded-lg bg-[#f1f5f9]">
                    {item.image?.url ? (
                      <Image
                        src={item.image.url}
                        alt=""
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    ) : null}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-[11.5px] text-[#94a3b8]">
                          {item.categoryName} · Qty {item.quantity} ·{" "}
                          {item.prepTimeHours}h prep
                        </p>
                      </div>
                      <p className="font-semibold tabular-nums">
                        {formatINR(item.lineTotal)}
                      </p>
                    </div>

                    <div className="mt-1.5 text-[#475569]">
                      <CartLineConfig config={item.config} />
                    </div>

                    {item.config.referenceImages?.length ? (
                      <div className="mt-3">
                        <p className="mb-1.5 text-[11px] font-semibold tracking-[0.08em] text-[#94a3b8] uppercase">
                          Reference images
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {item.config.referenceImages.map((image, i) => (
                            <a
                              key={image.url}
                              href={image.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="relative size-20 overflow-hidden rounded-lg border border-[#e3e8ef] bg-[#f1f5f9]"
                            >
                              <Image
                                src={image.url}
                                alt={`Reference ${i + 1}`}
                                fill
                                sizes="80px"
                                className="object-cover"
                              />
                            </a>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {item.breakdown?.length ? (
                      <details className="mt-3 text-[12.5px]">
                        <summary className="cursor-pointer font-semibold text-[#64748b]">
                          Price breakdown
                        </summary>
                        <ul className="mt-1.5 space-y-0.5 text-[#64748b]">
                          {item.breakdown.map((line) => (
                            <li
                              key={line.key}
                              className="flex justify-between gap-4"
                            >
                              <span>{line.label}</span>
                              <span className="tabular-nums">
                                {formatINR(line.amount)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </details>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>

            <dl className="space-y-2 border-t border-[#e3e8ef] p-5 text-[13.5px]">
              <div className="flex justify-between">
                <dt className="text-[#64748b]">Subtotal</dt>
                <dd className="tabular-nums">
                  {formatINR(order.amounts.subtotal)}
                </dd>
              </div>
              {order.amounts.discount > 0 ? (
                <div className="flex justify-between text-[#b3261e]">
                  <dt>
                    Discount
                    {order.coupon?.code ? ` (${order.coupon.code})` : ""}
                  </dt>
                  <dd className="tabular-nums">
                    −{formatINR(order.amounts.discount)}
                  </dd>
                </div>
              ) : null}
              <div className="flex justify-between">
                <dt className="text-[#64748b]">
                  Delivery
                  {order.delivery.zone ? ` · ${order.delivery.zone}` : ""}
                </dt>
                <dd className="tabular-nums">
                  {formatINR(order.amounts.deliveryFee)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-[#e3e8ef] pt-2 text-[15px] font-semibold">
                <dt>Total</dt>
                <dd className="tabular-nums">
                  {formatINR(order.amounts.total)}
                </dd>
              </div>
            </dl>
          </AdminCard>

          <AdminCard title="Timeline">
            <OrderTimeline
              status={order.status}
              deliveryType={order.delivery.type}
              history={order.statusHistory as never}
            />
          </AdminCard>

          {order.internalNotes.length > 0 ? (
            <AdminCard title="Internal notes">
              <ul className="space-y-3">
                {order.internalNotes.map((note, index) => (
                  <li key={index} className="rounded-lg bg-[#f8fafc] p-3">
                    <p className="text-[13.5px]">{note.text}</p>
                    <p className="mt-1 text-[11.5px] text-[#94a3b8]">
                      {formatDateTime(note.at)}
                      {note.by ? ` · ${note.by}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            </AdminCard>
          ) : null}
        </div>

        <div className="space-y-5">
          <AdminCard title="Customer">
            <p className="font-medium">{order.contact.name}</p>
            <p className="mt-1 text-[13px] text-[#475569]">
              <a
                href={`tel:${order.contact.phone}`}
                className="hover:underline"
              >
                {order.contact.phone}
              </a>
            </p>
            {order.contact.email ? (
              <p className="text-[13px] text-[#475569]">
                <a
                  href={`mailto:${order.contact.email}`}
                  className="hover:underline"
                >
                  {order.contact.email}
                </a>
              </p>
            ) : null}
            <a
              href={whatsappLink(
                order.contact.phone,
                whatsappMessages.order(settings.brand.name, order.orderNumber),
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex h-9 items-center gap-2 rounded-lg border border-[#e3e8ef] px-3 text-[12.5px] font-semibold hover:bg-[#f1f5f9]"
            >
              <WhatsAppIcon className="size-4 text-[#25D366]" />
              Message customer
            </a>
          </AdminCard>

          <AdminCard
            title={order.delivery.type === "pickup" ? "Pickup" : "Delivery"}
          >
            <p className="font-medium">{formatDate(order.delivery.date)}</p>
            <p className="text-[13px] text-[#64748b]">{order.delivery.slot}</p>
            {order.delivery.address ? (
              <p className="mt-3 border-t border-[#e3e8ef] pt-3 text-[13px] leading-relaxed text-[#475569]">
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
                {order.delivery.address.city}, {order.delivery.address.state}{" "}
                {order.delivery.address.pincode}
                <br />
                {order.delivery.address.phone}
              </p>
            ) : (
              <p className="mt-3 border-t border-[#e3e8ef] pt-3 text-[13px] text-[#475569]">
                {settings.delivery.storeAddress}
              </p>
            )}
          </AdminCard>

          {order.customerNotes ? (
            <AdminCard title="Customer notes">
              <p className="text-[13.5px]">{order.customerNotes}</p>
            </AdminCard>
          ) : null}

          <OrderActions
            orderId={id}
            status={order.status}
            paymentStatus={order.payment.status}
            deliveryType={order.delivery.type}
          />
        </div>
      </div>
    </AdminPage>
  );
}
