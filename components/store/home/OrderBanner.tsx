import Image from "next/image";
import { ButtonLink } from "@/components/ui/Button";
import { WhatsAppIcon } from "@/components/ui/icons";
import { whatsappLink, whatsappMessages } from "@/lib/whatsapp";

export function OrderBanner({
  brandName,
  whatsapp,
  image,
}: {
  brandName: string;
  whatsapp: string;
  image?: { url: string; alt?: string };
}) {
  return (
    <section className="wrap-wide">
      <div className="bg-cocoa relative overflow-hidden rounded-[26px] lg:rounded-[38px]">
        {image ? (
          <Image
            src={image.url}
            alt=""
            fill
            sizes="100vw"
            className="object-cover opacity-40"
          />
        ) : null}
        <div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(90deg,rgba(61,37,33,.94)_0%,rgba(61,37,33,.82)_45%,rgba(61,37,33,.5)_100%)]"
        />
        <div className="relative z-10 px-6 py-16 sm:px-10 lg:px-[7%] lg:py-24">
          <p className="eyebrow mb-5 text-white">Ready when you are</p>
          <h2 className="display-2 max-w-[620px] text-balance text-white">
            Let&rsquo;s bake something worth remembering.
          </h2>
          <p className="mt-5 max-w-[570px] text-[17px] leading-relaxed text-white/80">
            Order online in a few taps, or send us your idea and we&rsquo;ll
            shape the design, pricing and timing with you.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/shop" variant="light">
              Start an order
            </ButtonLink>
            <ButtonLink
              href="/customize-your-cake"
              variant="ghost"
              className="hover:text-cocoa border-white/60 text-white hover:bg-white"
            >
              Design your own cake
            </ButtonLink>
            <a
              href={whatsappLink(whatsapp, whatsappMessages.general(brandName))}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[50px] items-center gap-2.5 rounded-full border border-white/30 px-6 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              <WhatsAppIcon className="size-[18px]" />
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
