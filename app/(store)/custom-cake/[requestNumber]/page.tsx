import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock, MessageSquare } from "lucide-react";
import { connectToDatabase, serialize } from "@/lib/db/mongoose";
import { CustomCakeRequest } from "@/models/CustomCakeRequest";
import { getStoreSettings } from "@/lib/data/settings";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { WhatsAppIcon } from "@/components/ui/icons";
import { formatDate, formatDateTime, formatINR } from "@/lib/utils";
import { whatsappLink, whatsappMessages } from "@/lib/whatsapp";
import {
  REQUEST_STATUS_BLURBS,
  REQUEST_STATUS_LABELS,
} from "@/lib/custom-request-status";

export const metadata: Metadata = {
  title: "Your cake request",
  robots: { index: false, follow: false },
};

const GUEST_VIEW_WINDOW_MS = 1000 * 60 * 60 * 24 * 7;

/** Kept out of the component body so render stays free of clock reads. */
function isBeyondGuestWindow(createdAt: Date) {
  return Date.now() - new Date(createdAt).getTime() > GUEST_VIEW_WINDOW_MS;
}

export default async function CustomCakeRequestPage(props: {
  params: Promise<{ requestNumber: string }>;
}) {
  const { requestNumber } = await props.params;
  await connectToDatabase();

  const doc = await CustomCakeRequest.findOne({ requestNumber }).lean();
  if (!doc) notFound();

  // Confirmation links stay available briefly without requiring an account.
  if (isBeyondGuestWindow(doc.createdAt)) {
    notFound();
  }

  const request = serialize(doc);
  const settings = await getStoreSettings();

  const details = [
    { label: "Occasion", value: request.celebration.occasion },
    {
      label: "Required date",
      value: `${formatDate(request.celebration.requiredDate)}${
        request.celebration.deliverySlot
          ? ` · ${request.celebration.deliverySlot}`
          : ""
      }`,
    },
    { label: "Servings", value: request.celebration.servings },
    { label: "Style", value: request.cake.style },
    { label: "Flavour", value: request.cake.flavour },
    { label: "Filling", value: request.cake.filling },
    { label: "Shape", value: request.cake.shape },
    { label: "Weight", value: `${request.cake.weightKg} kg` },
    {
      label: "Egg",
      value: request.cake.eggPreference === "eggless" ? "Eggless" : "With egg",
    },
    {
      label: "Tiers",
      value: request.cake.tiers > 1 ? request.cake.tiers : null,
    },
    { label: "Colours / theme", value: request.cake.colourTheme },
    {
      label: "Message",
      value: request.cake.message ? `“${request.cake.message}”` : null,
    },
    {
      label: "Add-ons",
      value: request.cake.addOns.length
        ? request.cake.addOns.map((addOn) => addOn.name).join(", ")
        : null,
    },
  ].filter((row) => row.value);

  return (
    <div className="wrap max-w-[900px] pt-12 pb-24 sm:pt-16">
      <div className="text-center">
        <span
          aria-hidden
          className="bg-coral-soft text-coral-dark mx-auto grid size-16 place-items-center rounded-full"
        >
          <CheckCircle2 className="size-8" />
        </span>
        <p className="eyebrow eyebrow-plain mt-6 justify-center">
          Request #{request.requestNumber}
        </p>
        <h1 className="display-2 mt-3 text-balance">
          Thank you, {request.contact.name.split(" ")[0]}.
        </h1>
        <p className="lede mx-auto mt-4 max-w-lg text-balance">
          {REQUEST_STATUS_BLURBS[request.status]}
        </p>
        <div className="mt-6">
          <Badge tone={request.status === "REJECTED" ? "coral" : "coral"}>
            {REQUEST_STATUS_LABELS[request.status]}
          </Badge>
        </div>
      </div>

      <section className="border-line mt-12 rounded-[26px] border bg-white p-6 sm:p-8">
        <h2 className="font-display text-[22px] tracking-[-0.02em]">
          Your design
        </h2>

        {request.referenceImages.length > 0 ? (
          <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-5">
            {request.referenceImages.map((image, index) => (
              <span
                key={image.url}
                className="bg-cream relative aspect-square overflow-hidden rounded-2xl"
              >
                <Image
                  src={image.url}
                  alt={`Reference ${index + 1}`}
                  fill
                  sizes="160px"
                  className="object-cover"
                />
              </span>
            ))}
          </div>
        ) : null}

        <dl className="border-line mt-6 grid gap-x-8 gap-y-2 border-t pt-6 text-sm sm:grid-cols-2">
          {details.map((row) => (
            <div key={row.label} className="flex gap-2">
              <dt className="text-muted w-[120px] flex-none font-semibold">
                {row.label}
              </dt>
              <dd className="min-w-0 break-words">{String(row.value)}</dd>
            </div>
          ))}
        </dl>

        {request.notes ? (
          <div className="bg-cream mt-6 rounded-2xl px-5 py-4">
            <p className="text-muted text-[11px] font-bold tracking-[0.12em] uppercase">
              Your instructions
            </p>
            <p className="mt-1.5 text-sm">{request.notes}</p>
          </div>
        ) : null}

        <div className="border-line mt-6 flex items-baseline justify-between border-t pt-5">
          <span className="text-sm font-semibold">
            {request.quote?.amount ? "Quoted price" : "Estimated price"}
          </span>
          <span className="font-display text-[28px] tracking-[-0.03em]">
            {formatINR(request.quote?.amount ?? request.estimate.total)}
          </span>
        </div>
        {request.quote?.note ? (
          <p className="text-muted mt-2 text-sm">{request.quote.note}</p>
        ) : null}
      </section>

      {request.customerNotes.length > 0 ? (
        <section className="border-line mt-8 rounded-[26px] border bg-white p-6 sm:p-8">
          <h2 className="font-display flex items-center gap-2.5 text-[22px] tracking-[-0.02em]">
            <MessageSquare className="text-coral size-5" />
            Messages from the bakery
          </h2>
          <ul className="mt-5 space-y-4">
            {request.customerNotes.map((note, index) => (
              <li key={index} className="bg-cream rounded-2xl px-5 py-4">
                <p className="text-sm">{note.text}</p>
                <p className="text-muted mt-1.5 text-xs">
                  {formatDateTime(note.at)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <ButtonLink href="/shop" variant="ghost">
          Browse the shop
        </ButtonLink>
        <a
          href={whatsappLink(
            settings.brand.whatsapp,
            whatsappMessages.customCake(
              settings.brand.name,
              request.requestNumber,
            ),
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="border-coral bg-coral hover:bg-coral-dark inline-flex min-h-[50px] items-center gap-2.5 rounded-full border px-6 text-sm font-semibold text-white transition-colors"
        >
          <WhatsAppIcon className="size-[18px]" />
          Discuss on WhatsApp
        </a>
      </div>

      <p className="text-muted mt-8 flex items-center justify-center gap-2 text-center text-sm">
        <Clock className="size-4" />
        We usually reply within a few hours during bakery hours.
      </p>
    </div>
  );
}
