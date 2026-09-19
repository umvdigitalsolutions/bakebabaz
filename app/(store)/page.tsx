import type { Metadata } from "next";
import { getStoreSettings } from "@/lib/data/settings";
import {
  getBestsellers,
  getCategories,
  getFeaturedProducts,
} from "@/lib/data/catalog";
import { Hero } from "@/components/store/home/Hero";
import { Ticker } from "@/components/store/home/Ticker";
import { CollectionCards } from "@/components/store/home/CollectionCards";
import { Gallery } from "@/components/store/home/Gallery";
import { ProcessSteps } from "@/components/store/home/ProcessSteps";
import { PhilosophyBlock } from "@/components/store/home/PhilosophyBlock";
import { OrderBanner } from "@/components/store/home/OrderBanner";
import { SectionHead } from "@/components/store/SectionHead";
import { ProductGrid } from "@/components/store/ProductGrid";
import { ButtonLink } from "@/components/ui/Button";
import { Accordion } from "@/components/ui/Accordion";
import { Reveal } from "@/components/ui/Reveal";
import { LocalBusinessJsonLd } from "@/components/shared/JsonLd";
import { whatsappLink, whatsappMessages } from "@/lib/whatsapp";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const processSteps = [
  {
    title: "Share",
    body: "Send us the occasion, required date, servings or quantity, flavours and any inspiration you've saved.",
  },
  {
    title: "Refine",
    body: "We'll confirm availability, suggest options, and clear up the details that need a conversation.",
  },
  {
    title: "Confirm",
    body: "Finalise the design, pricing and delivery slot — then pay securely online or on delivery.",
  },
  {
    title: "Bake",
    body: "Your order is baked fresh for the date you chose, and tracked from our kitchen to your door.",
  },
];

export default async function HomePage() {
  const settings = await getStoreSettings();

  const [categories, featured, bestsellers] = await Promise.all([
    getCategories({ featuredOnly: true }),
    getFeaturedProducts(8, settings.homepage.featuredProducts),
    getBestsellers(4),
  ]);

  const collections = categories.length
    ? categories.slice(0, 4)
    : (await getCategories()).slice(0, 4);

  const faqs = settings.faqs.filter((faq) => faq.active).slice(0, 5);

  return (
    <>
      <LocalBusinessJsonLd settings={settings} />

      <Hero settings={settings} />
      <Ticker items={settings.homepage.marquee} />

      <section className="wrap pt-10 sm:pt-12">
        <div className="border-line bg-paper grid gap-6 border-y py-8 md:grid-cols-[0.82fr_1.18fr] md:items-center md:gap-10">
          <Reveal>
            <p className="eyebrow mb-4">Start here</p>
            <h2 className="display-3 text-balance">Not sure what to order?</h2>
            <p className="text-muted mt-3 max-w-[440px] text-[15px] leading-relaxed">
              Choose the path that matches your occasion. You can browse, build
              a custom cake, or ask us before deciding.
            </p>
          </Reveal>
          <div className="grid gap-3 sm:grid-cols-3">
            <Reveal as="article" delay={0.04}>
              <ButtonLink href="/shop" variant="quiet" fullWidth>
                Browse ready bakes
              </ButtonLink>
              <p className="text-muted mt-3 text-[13px] leading-relaxed">
                Cakes, cookies, breads and hampers you can order directly.
              </p>
            </Reveal>
            <Reveal as="article" delay={0.08}>
              <ButtonLink href="/customize-your-cake" variant="quiet" fullWidth>
                Design a custom cake
              </ButtonLink>
              <p className="text-muted mt-3 text-[13px] leading-relaxed">
                Share a theme, date, flavour and inspiration photos.
              </p>
            </Reveal>
            <Reveal as="article" delay={0.12}>
              <ButtonLink
                href={whatsappLink(
                  settings.brand.whatsapp,
                  whatsappMessages.general(settings.brand.name),
                )}
                variant="quiet"
                fullWidth
              >
                Ask on WhatsApp
              </ButtonLink>
              <p className="text-muted mt-3 text-[13px] leading-relaxed">
                Best when you want help with servings, flavours or timing.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {collections.length > 0 ? (
        <section className="wrap section-y">
          <SectionHead
            eyebrow="Our collections"
            title={settings.homepage.collectionsHeading}
            description={settings.homepage.collectionsSubheading}
            action={
              <ButtonLink href="/shop" variant="ghost" size="sm">
                View all bakes →
              </ButtonLink>
            }
          />
          <CollectionCards categories={collections} />
        </section>
      ) : null}

      {featured.length > 0 ? (
        <section className="wrap section-y-sm">
          <SectionHead
            eyebrow="Handpicked"
            title="Straight from the counter"
            description="The bakes our regulars order again and again — ready to personalise and send."
            action={
              <ButtonLink href="/shop" variant="ghost" size="sm">
                Shop all bakes →
              </ButtonLink>
            }
          />
          <ProductGrid products={featured} />
        </section>
      ) : null}

      <section className="bg-cream section-y-sm">
        <div className="wrap">
          <SectionHead
            eyebrow="How it works"
            title="From your idea to the first bite."
            description="A simple, conversation-led process keeps every detail clear and gives each order room to feel personal."
          />
          <ProcessSteps steps={processSteps} />
        </div>
      </section>

      {settings.homepage.gallery.length > 0 ? (
        <section className="wrap section-y">
          <SectionHead
            eyebrow={settings.homepage.gallerySubheading}
            title={settings.homepage.galleryHeading}
            action={
              <ButtonLink
                href={settings.brand.instagram}
                variant="ghost"
                size="sm"
              >
                More on Instagram ↗
              </ButtonLink>
            }
          />
          <Gallery items={settings.homepage.gallery} />
        </section>
      ) : null}

      {bestsellers.length > 0 ? (
        <section className="wrap section-y-sm">
          <SectionHead
            eyebrow="Bestselling"
            title="Ordered most this month"
            action={
              <ButtonLink
                href="/shop?sort=bestselling"
                variant="ghost"
                size="sm"
              >
                Shop bestsellers →
              </ButtonLink>
            }
          />
          <ProductGrid products={bestsellers} />
        </section>
      ) : null}

      <section className="section-y">
        <div className="wrap">
          <PhilosophyBlock
            eyebrow="Baked with intention"
            heading={settings.homepage.philosophyHeading}
            quote={settings.homepage.philosophyQuote}
            body={settings.homepage.philosophyBody}
          />
        </div>
      </section>

      {faqs.length > 0 ? (
        <section className="wrap section-y-sm">
          <div className="grid gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:gap-[10%]">
            <Reveal className="lg:sticky lg:top-32 lg:self-start">
              <p className="eyebrow mb-4">Good to know</p>
              <h2 className="display-2 text-balance">Questions, answered.</h2>
              <p className="lede mt-4 max-w-[410px]">
                Still unsure about something? Send us a message and we&rsquo;ll
                guide you through it.
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

      <div className="pb-20 sm:pb-28">
        <OrderBanner
          brandName={settings.brand.name}
          whatsapp={settings.brand.whatsapp}
          image={settings.homepage.orderBannerImage ?? undefined}
        />
      </div>
    </>
  );
}
