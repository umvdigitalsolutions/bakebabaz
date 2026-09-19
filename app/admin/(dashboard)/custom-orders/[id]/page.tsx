import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connectToDatabase, serialize } from "@/lib/db/mongoose";
import { CustomCakeRequest } from "@/models/CustomCakeRequest";
import { getStoreSettings } from "@/lib/data/settings";
import {
  AdminCard,
  AdminPage,
  StatusBadge,
} from "@/components/admin/AdminShell";
import { CustomRequestActions } from "@/components/admin/CustomRequestActions";
import { WhatsAppIcon } from "@/components/ui/icons";
import { REQUEST_STATUS_LABELS } from "@/lib/custom-request-status";
import {
  formatDate,
  formatDateTime,
  formatINR,
  isValidObjectId,
} from "@/lib/utils";
import { whatsappLink, whatsappMessages } from "@/lib/whatsapp";

export const metadata: Metadata = { title: "Custom cake request" };

export default async function AdminCustomOrderPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  if (!isValidObjectId(id)) notFound();

  await connectToDatabase();
  const [doc, settings] = await Promise.all([
    CustomCakeRequest.findById(id).lean(),
    getStoreSettings(),
  ]);
  if (!doc) notFound();

  const request = serialize(doc);

  const spec: [string, string | number | undefined][] = [
    ["Occasion", request.celebration.occasion],
    ["Required date", formatDate(request.celebration.requiredDate)],
    ["Preferred time", request.celebration.deliverySlot],
    ["Servings", request.celebration.servings],
    ["Style", request.cake.style],
    ["Flavour", request.cake.flavour],
    ["Filling", request.cake.filling],
    ["Shape", request.cake.shape],
    ["Weight", `${request.cake.weightKg} kg`],
    ["Egg", request.cake.eggPreference === "eggless" ? "Eggless" : "With egg"],
    ["Tiers", request.cake.tiers],
    ["Colours / theme", request.cake.colourTheme],
    ["Message on cake", request.cake.message],
    [
      "Add-ons",
      request.cake.addOns.length
        ? request.cake.addOns.map((addOn) => addOn.name).join(", ")
        : undefined,
    ],
  ];

  return (
    <AdminPage
      title={`Request #${request.requestNumber}`}
      description={`Submitted ${formatDateTime(request.createdAt)}`}
      actions={
        <Link
          href="/admin/custom-orders"
          className="inline-flex h-10 items-center px-2 text-[13px] font-semibold text-[#16324f] underline underline-offset-4"
        >
          ← All requests
        </Link>
      }
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <div>
            <StatusBadge
              status={request.status}
              label={REQUEST_STATUS_LABELS[request.status]}
            />
          </div>

          {request.referenceImages.length > 0 ? (
            <AdminCard
              title="Inspiration"
              description="What the customer wants it to look like."
            >
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {request.referenceImages.map((image, index) => (
                  <a
                    key={image.url}
                    href={image.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative aspect-square overflow-hidden rounded-lg border border-[#e3e8ef] bg-[#f1f5f9]"
                  >
                    <Image
                      src={image.url}
                      alt={`Reference ${index + 1}`}
                      fill
                      sizes="(max-width: 640px) 50vw, 240px"
                      className="object-cover transition-transform duration-300 hover:scale-105"
                    />
                  </a>
                ))}
              </div>
            </AdminCard>
          ) : null}

          <AdminCard title="Requested configuration">
            <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
              {spec
                .filter(([, value]) => value != null && value !== "")
                .map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-[10.5px] font-semibold tracking-[0.08em] text-[#94a3b8] uppercase">
                      {label}
                    </dt>
                    <dd className="mt-0.5 text-[14px] font-medium">
                      {String(value)}
                    </dd>
                  </div>
                ))}
            </dl>

            {request.notes ? (
              <div className="mt-5 rounded-lg bg-[#f8fafc] p-4">
                <p className="text-[10.5px] font-semibold tracking-[0.08em] text-[#94a3b8] uppercase">
                  Additional instructions
                </p>
                <p className="mt-1.5 text-[13.5px]">{request.notes}</p>
              </div>
            ) : null}
          </AdminCard>

          <AdminCard title="Calculated estimate">
            <dl className="space-y-1.5 text-[13.5px]">
              {request.estimate.lineItems.map((line) => (
                <div key={line.key} className="flex justify-between gap-4">
                  <dt className="text-[#64748b]">
                    {line.label}
                    {line.hint ? (
                      <span className="ml-1.5 text-[11.5px] text-[#94a3b8]">
                        {line.hint}
                      </span>
                    ) : null}
                  </dt>
                  <dd className="tabular-nums">{formatINR(line.amount)}</dd>
                </div>
              ))}
              <div className="flex justify-between border-t border-[#e3e8ef] pt-2 font-semibold">
                <dt>Engine estimate</dt>
                <dd className="tabular-nums">
                  {formatINR(request.estimate.total)}
                </dd>
              </div>
              {request.quote?.amount ? (
                <div className="flex justify-between text-[15px] font-semibold text-[#16324f]">
                  <dt>Your quote</dt>
                  <dd className="tabular-nums">
                    {formatINR(request.quote.amount)}
                  </dd>
                </div>
              ) : null}
            </dl>
            {request.quote?.note ? (
              <p className="mt-3 rounded-lg bg-[#f8fafc] p-3 text-[13px]">
                {request.quote.note}
              </p>
            ) : null}
          </AdminCard>

          {request.customerNotes.length > 0 ? (
            <AdminCard title="Messages sent to the customer">
              <ul className="space-y-3">
                {request.customerNotes.map((note, index) => (
                  <li key={index} className="rounded-lg bg-[#eef6fb] p-3">
                    <p className="text-[13.5px]">{note.text}</p>
                    <p className="mt-1 text-[11.5px] text-[#64748b]">
                      {formatDateTime(note.at)}
                      {note.by ? ` · ${note.by}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            </AdminCard>
          ) : null}

          {request.internalNotes.length > 0 ? (
            <AdminCard title="Internal notes">
              <ul className="space-y-3">
                {request.internalNotes.map((note, index) => (
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
            <p className="font-medium">{request.contact.name}</p>
            <p className="mt-1 text-[13px] text-[#475569]">
              <a
                href={`tel:${request.contact.phone}`}
                className="hover:underline"
              >
                {request.contact.phone}
              </a>
            </p>
            {request.contact.email ? (
              <p className="text-[13px] text-[#475569]">
                <a
                  href={`mailto:${request.contact.email}`}
                  className="hover:underline"
                >
                  {request.contact.email}
                </a>
              </p>
            ) : null}
            <a
              href={whatsappLink(
                request.contact.phone,
                whatsappMessages.customCake(
                  settings.brand.name,
                  request.requestNumber,
                ),
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex h-9 items-center gap-2 rounded-lg border border-[#e3e8ef] px-3 text-[12.5px] font-semibold hover:bg-[#f1f5f9]"
            >
              <WhatsAppIcon className="size-4 text-[#25D366]" />
              Message on WhatsApp
            </a>
          </AdminCard>

          <CustomRequestActions
            requestId={id}
            status={request.status}
            estimate={request.estimate.total}
            quotedAmount={request.quote?.amount}
          />
        </div>
      </div>
    </AdminPage>
  );
}
