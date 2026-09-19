import type { Metadata } from "next";
import Image from "next/image";
import { ArrowDown, Heart, MessageCircle, Sparkles } from "lucide-react";
import { CakeBuilder } from "@/components/cake-builder/CakeBuilder";
import { InspirationGallery } from "@/components/cake-builder/InspirationGallery";
import { ProcessSteps } from "@/components/store/home/ProcessSteps";
import { Accordion } from "@/components/ui/Accordion";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { BreadcrumbJsonLd, FaqJsonLd } from "@/components/shared/JsonLd";
import { getStoreSettings } from "@/lib/data/settings";
import { getPricingCatalog } from "@/lib/pricing/catalog";
import { getActiveSlots } from "@/lib/delivery/validate";
import { whatsappLink, whatsappMessages } from "@/lib/whatsapp";
import { smartQuotes } from "@/lib/utils";
import pageStyles from "./CustomizePage.module.css";

export const metadata: Metadata = {
  title: "Custom Cakes in Bikaner | Design Your Cake",
  description:
    "Design a custom birthday, anniversary or wedding cake with Bake Baba'z in Bikaner. Choose the flavour, size, style and colours, then share your references for a personal quote.",
  alternates: { canonical: "/customize-your-cake" },
};

const processSteps = [
  {
    title: "Design your idea",
    body: "Choose the occasion, size, flavour, style and colours in the studio above.",
  },
  {
    title: "We refine it together",
    body: "Our team reviews your request, checks the details, and confirms the final design and quote.",
  },
  {
    title: "We bake your moment",
    body: "Your cake is made to order in our Bikaner kitchen and prepared for the date you selected.",
  },
];

export default async function CustomizeYourCakePage() {
  const [settings, catalog, slots] = await Promise.all([
    getStoreSettings(),
    getPricingCatalog(),
    getActiveSlots(),
  ]);

  const { customCake, brand } = settings;
  const faqs = settings.faqs.filter((faq) => faq.active).slice(0, 6);
  const heroImage = customCake.heroImage?.url ?? "/brand/ai-bakery-hero.png";

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Customize your cake", href: "/customize-your-cake" },
        ]}
      />
      <FaqJsonLd faqs={faqs} />

      <section className="bg-paper relative flex flex-col overflow-hidden sm:block sm:min-h-[650px] lg:max-h-[760px] lg:min-h-[calc(100svh-150px)]">
        {/* Phones stack the photo under the copy; wider screens overlay it. */}
        <div className="relative order-last h-[280px] sm:absolute sm:inset-0 sm:h-auto">
          <Image
            src={heroImage}
            alt={
              customCake.heroImage?.alt ??
              "A custom celebration cake from Bake Baba'z"
            }
            fill
            preload
            sizes="100vw"
            className="object-cover object-center sm:object-[64%_center] lg:object-center"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,#fffaf4_0%,rgba(255,250,244,0)_40%)] sm:bg-[linear-gradient(90deg,rgba(255,250,244,.98)_0%,rgba(255,250,244,.91)_42%,rgba(255,250,244,.28)_69%,rgba(255,250,244,.06)_100%)]" />
        </div>

        <div className="wrap relative z-10 flex flex-col justify-center pt-12 pb-8 sm:min-h-[650px] sm:py-16 lg:max-h-[760px] lg:min-h-[calc(100svh-150px)]">
          <div className="max-w-[640px]">
            <p className="eyebrow mb-5">
              {customCake.heroEyebrow || "Custom cake studio"}
            </p>
            <h1 className="display-1 max-w-[620px] text-balance">
              {smartQuotes(customCake.heroHeading || "Made for your moment.")}
            </h1>
            <p className="lede mt-6 max-w-[540px] text-pretty">
              {smartQuotes(
                customCake.heroDescription ||
                  "Tell us what you're celebrating. We'll turn your idea into something delicious.",
              )}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="#studio" variant="coral" size="lg">
                Start designing
                <ArrowDown className="size-4" />
              </ButtonLink>
              <ButtonLink href="#inspiration" variant="ghost" size="lg">
                See our creations
              </ButtonLink>
            </div>
            <div className="border-line mt-9 flex max-w-[570px] flex-wrap gap-x-3 gap-y-2 border-t pt-5 text-xs font-semibold sm:gap-x-5 sm:text-sm">
              <span>Freshly baked</span>
              <span className="text-coral" aria-hidden>
                •
              </span>
              <span>Made to order</span>
              <span className="text-coral" aria-hidden>
                •
              </span>
              <span>Crafted with love</span>
            </div>
          </div>
        </div>
      </section>

      <section id="studio" className="wrap scroll-mt-24 py-16 sm:py-24">
        <Reveal className="mb-10 grid gap-5 lg:grid-cols-[1fr_.72fr] lg:items-end">
          <div>
            <p className="eyebrow mb-4">Your cake, step by step</p>
            <h2 className="display-2 max-w-[760px] text-balance">
              Begin with a feeling. Build every delicious detail.
            </h2>
          </div>
          <p className="lede max-w-[520px] lg:justify-self-end">
            Seven clear choices, a live estimate, and space for the references
            you have been saving.
          </p>
        </Reveal>

        <CakeBuilder
          catalog={catalog}
          slots={slots.map((slot) => ({
            label: slot.label,
            startTime: slot.startTime,
            surcharge: slot.surcharge,
          }))}
          blockedDates={settings.delivery.blockedDates}
          maxDaysAhead={settings.delivery.maxDaysAhead}
          brandName={brand.name}
          whatsappNumber={brand.whatsapp}
          referenceTime={new Date().toISOString()}
        />
      </section>

      <section
        id="inspiration"
        className="bg-cream scroll-mt-24 py-16 sm:py-24"
      >
        <div className="wrap">
          <Reveal className="mb-9 grid gap-5 lg:grid-cols-[1fr_.65fr] lg:items-end">
            <div>
              <p className="eyebrow mb-4">The cake compass</p>
              <h2 className="display-2 text-balance">
                Start with a feeling, not a reference.
              </h2>
            </div>
            <p className="lede lg:justify-self-end">
              Pick the reaction you want at the table. We&rsquo;ll translate it
              into colour, finish, flavour, and form.
            </p>
          </Reveal>
          <InspirationGallery />
        </div>
      </section>

      <section className="wrap section-y">
        <Reveal className="mb-10 max-w-[760px]">
          <p className="eyebrow mb-4">How it works</p>
          <h2 className="display-2 text-balance">
            From your idea to the table.
          </h2>
        </Reveal>
        <ProcessSteps steps={processSteps} columns={3} />
      </section>

      <section
        className={pageStyles.founderSection}
        style={{ backgroundColor: "#2f1b18", color: "#ffffff" }}
      >
        <div className={pageStyles.founderInner}>
          <div className={pageStyles.founderPortrait}>
            <Image
              src="/brand/founder/mishika-dawra-floral-cake.jpeg"
              alt="Mishika Daawra, founder of Bake Baba'z, with a floral custom cake"
              fill
              sizes="(max-width: 1024px) 100vw, 55vw"
              className={pageStyles.founderPhoto}
            />
          </div>
          <Reveal className={pageStyles.founderCopy} y={12}>
            <p className="text-xs font-bold tracking-[0.14em] text-[#f3a8a2] uppercase">
              Meet the founder
            </p>
            <h2 className="font-display mt-5 text-4xl leading-tight text-balance sm:text-6xl">
              Made by hands. Remembered by hearts.
            </h2>
            <p className="mt-6 text-base leading-8 text-white/72">
              Mishika Daawra founded Bake Baba&rsquo;z around a simple belief:
              celebration cakes should feel personal before they feel
              impressive. Every custom request begins with listening, then moves
              through flavour, proportion, colour, and the small details that
              make the finished cake belong to one particular moment.
            </p>
            <blockquote className="font-display mt-8 border-l-2 border-[#ef665f] pl-5 text-2xl leading-snug text-white/95">
              &ldquo;Every bake should feel like it was made for someone, not
              just ordered by someone.&rdquo;
              <footer className="mt-3 font-sans text-xs font-bold tracking-[0.12em] text-white/55 uppercase">
                Mishika Daawra, Founder
              </footer>
            </blockquote>
          </Reveal>
        </div>
      </section>

      {faqs.length > 0 ? (
        <section className="wrap section-y">
          <div className="grid gap-10 lg:grid-cols-[.75fr_1.25fr] lg:gap-[10%]">
            <Reveal className="lg:sticky lg:top-32 lg:self-start">
              <p className="eyebrow mb-4">Good to know</p>
              <h2 className="display-2 text-balance">
                Before we start baking.
              </h2>
              <p className="lede mt-4 max-w-[430px]">
                Questions about timing, design, or what is possible? We are
                happy to talk it through.
              </p>
            </Reveal>
            <Accordion
              items={faqs.map((faq) => ({
                question: faq.question,
                answer: faq.answer,
              }))}
            />
          </div>
        </section>
      ) : null}

      <section className="bg-coral text-white">
        <div className="wrap flex flex-col items-start justify-between gap-7 py-14 sm:flex-row sm:items-center sm:py-16">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold tracking-[0.13em] uppercase opacity-80">
              <Sparkles className="size-4" />
              Your celebration starts here
            </p>
            <h2 className="font-display mt-3 text-4xl leading-tight text-balance sm:text-5xl">
              Ready to make it yours?
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="#studio" variant="light" size="lg">
              <Heart className="size-4" />
              Start designing
            </ButtonLink>
            <ButtonLink
              href={whatsappLink(
                brand.whatsapp,
                whatsappMessages.customCakeIdea(brand.name),
              )}
              variant="ghost"
              size="lg"
              className="hover:text-cocoa border-white text-white hover:bg-white"
            >
              <MessageCircle className="size-4" />
              Talk to us
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
