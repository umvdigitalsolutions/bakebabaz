import type { Metadata } from "next";
import Image from "next/image";
import { getStoreSettings } from "@/lib/data/settings";
import { SectionHead } from "@/components/store/SectionHead";
import { PhilosophyBlock } from "@/components/store/home/PhilosophyBlock";
import { OrderBanner } from "@/components/store/home/OrderBanner";
import { Reveal } from "@/components/ui/Reveal";
import { ButtonLink } from "@/components/ui/Button";
import { BreadcrumbJsonLd } from "@/components/shared/JsonLd";
import { StoryAtmosphere } from "./StoryAtmosphere";
import { OvenJourney } from "./OvenJourney";
import styles from "./story-hero.module.css";

export const metadata: Metadata = {
  title: "Our story",
  description:
    "How Bake Baba'z started in Bikaner, what we believe about baking, and the people behind every order.",
  alternates: { canonical: "/our-story" },
};

const values = [
  {
    title: "Small batches, always",
    body: "Nothing is baked ahead and stored. Every order goes into the oven for its own date, which is why we ask for a little notice.",
  },
  {
    title: "Ingredients you’d recognise",
    body: "Real butter, real cream, couverture chocolate. We’d rather charge honestly than cut a corner you’d taste.",
  },
  {
    title: "A conversation, not a transaction",
    body: "Especially for custom work. We’ll tell you when a design won’t hold in Bikaner heat, and suggest something that will.",
  },
];

const founderQuote =
  "Every bake should feel like it was made for someone, not just ordered by someone.";

const founderStories = [
  {
    id: "at-the-bakery",
    focus: "50% 50%",
    eyebrow: "Inside the bakery",
    title: "A founder-led bakery, built around personal orders.",
    body: "Bake Baba’z is guided by Mishika Daawra’s eye for warmth, finish and small details. A birthday cake, a thank-you hamper, a box of cookies or breads: every order starts with the person it is being made for.",
    detail:
      "From the first conversation to the final packed box, the focus stays on freshness, honest flavours and presentation that feels considered. The bakery keeps things approachable, but never careless.",
    notes: [
      "Made-to-order cakes, breads, cookies and hampers",
      "Fresh batches planned around your date",
      "Guidance on flavours, portions and gifting",
    ],
  },
  {
    id: "made-for-celebrations",
    focus: "50% 46%",
    eyebrow: "Made for a celebration",
    title: "Custom cakes that carry the mood of the moment.",
    body: "Mishika treats celebration cakes as personal pieces: colour palettes, favourite characters, floral finishes, names, messages and the kind of sweetness the family actually enjoys.",
    detail:
      "The design is talked through before it is made, so the cake feels beautiful and practical for the occasion. Whether the brief is playful, elegant, minimal or fully themed, the final cake should belong to that celebration.",
    notes: [
      "Theme-led birthday and anniversary cakes",
      "Balanced design, size and flavour suggestions",
      "Soft finishes, florals, colours and name details",
    ],
  },
  {
    id: "in-the-kitchen",
    focus: "50% 48%",
    eyebrow: "From the kitchen",
    title: "The work behind the sweetness matters.",
    body: "Behind every finished piece is time spent testing textures, balancing flavours and giving the food a handmade finish. The kitchen is where the Bake Baba’z personality comes through most clearly.",
    detail:
      "That is why the brand feels intimate: it is not only about decoration, but about food that arrives fresh, tastes generous and brings people together around the table.",
    notes: [
      "Careful flavour balance and handmade finishing",
      "Fresh food for everyday treats and special tables",
      "A warm, personal approach from kitchen to customer",
    ],
  },
];

export default async function OurStoryPage() {
  const settings = await getStoreSettings();
  const heroImage = settings.story?.heroImage;
  const storyImages = [
    settings.story?.bakeryImage,
    settings.story?.celebrationImage,
    settings.story?.kitchenImage,
  ];

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Our story", href: "/our-story" },
        ]}
      />

      <section
        className={`${styles.hero} ${!heroImage?.url ? styles.heroWithoutImage : ""}`}
        aria-labelledby="founder-heading"
      >
        <StoryAtmosphere />
        {heroImage?.url ? (
          <div className={styles.portrait}>
            <Image
              src={heroImage.url}
              alt={heroImage.alt ?? "Mishika Daawra, Founder of Bake Baba'z"}
              fill
              preload
              sizes="100vw"
              className={styles.photo}
            />
          </div>
        ) : null}
        <div className={`wrap ${styles.content}`}>
          <Reveal className={styles.copy}>
            <p className="eyebrow mb-4">Founder story</p>
            <h1 id="founder-heading" className={styles.title}>
              Meet Mishika Daawra
            </h1>
            <p className={styles.heroLine}>Founder of Bake Baba&rsquo;z</p>
            <p className={styles.heroText}>
              The person behind the flavour, finish and feeling of Bake
              Baba&rsquo;z. Mishika brings a founder&rsquo;s care to custom
              cakes, celebration gifting, breads and little treats made here in
              Bikaner.
            </p>
            <blockquote className={styles.quote}>
              &ldquo;{founderQuote}&rdquo;
            </blockquote>
            <div className={styles.heroMeta} aria-label="Founder highlights">
              <span>Founder-led bakery</span>
              <span>Bikaner</span>
              <span>Custom cakes &amp; gifts</span>
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <ButtonLink href="/shop" variant="primary">
                Browse our bakes
              </ButtonLink>
              <ButtonLink href="/contact" variant="ghost">
                Come say hello
              </ButtonLink>
            </div>
          </Reveal>
        </div>
      </section>

      <OvenJourney />

      {founderStories.map((story, index) => {
        const isReverse = index % 2 === 1;
        const storyImage = storyImages[index];

        return (
          <section
            key={story.id}
            className={`${styles.storySection} ${isReverse ? styles.storySectionReverse : ""} ${!storyImage?.url ? styles.storySectionWithoutImage : ""}`}
            aria-labelledby={story.id}
            data-chapter={String(index + 1).padStart(2, "0")}
          >
            {storyImage?.url ? (
              <div className={styles.storyMedia}>
                <Image
                  src={storyImage.url}
                  alt={storyImage.alt ?? story.title}
                  fill
                  sizes="(max-width: 767px) 100vw, (max-width: 1200px) 56vw, 690px"
                  className={styles.storyImage}
                  style={{ objectPosition: story.focus }}
                />
              </div>
            ) : null}
            <div className={`wrap ${styles.storyInner}`}>
              <Reveal
                delay={0.1}
                className={`${styles.storyCopy} ${isReverse ? styles.storyCopyReverse : ""}`}
              >
                <div className={styles.chapterLabel} aria-hidden="true">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <i />
                  <span>Our story</span>
                </div>
                <p className="eyebrow mb-4">{story.eyebrow}</p>
                <h2
                  id={story.id}
                  className="text-[30px] leading-[1.15] tracking-normal text-balance sm:text-[38px]"
                >
                  {story.title}
                </h2>
                <p className="text-cocoa-soft mt-6 text-[17px] leading-relaxed">
                  {story.body}
                </p>
                <p className="text-muted mt-4 text-[15px] leading-relaxed">
                  {story.detail}
                </p>
                <div className={styles.detailList} aria-label="Story details">
                  {story.notes.map((note) => (
                    <p key={note} className={styles.detailItem}>
                      {note}
                    </p>
                  ))}
                </div>
              </Reveal>
            </div>
          </section>
        );
      })}

      <section className={`wrap section-y ${styles.valuesSection}`}>
        <SectionHead
          eyebrow="What we believe"
          title="Three things we don’t compromise on"
        />
        <div className="grid gap-10 md:grid-cols-3 md:gap-8">
          {values.map((value, index) => (
            <Reveal key={value.title} delay={index * 0.08} as="article">
              <span className="font-display text-coral text-[15px] font-bold tracking-[0.18em]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span
                aria-hidden
                className="mt-5 block h-px w-full bg-[color:var(--color-line)]"
              />
              <h3 className="font-display mt-8 text-[26px] leading-tight tracking-[-0.025em]">
                {value.title}
              </h3>
              <p className="text-muted mt-3 text-[15px] leading-relaxed">
                {value.body}
              </p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="bg-cream section-y">
        <div className="wrap">
          <PhilosophyBlock
            eyebrow="Baked with intention"
            heading={settings.homepage.philosophyHeading}
            quote={settings.homepage.philosophyQuote}
            body={settings.homepage.philosophyBody}
          />
        </div>
      </section>

      <div className="py-20 sm:py-28">
        <OrderBanner
          brandName={settings.brand.name}
          whatsapp={settings.brand.whatsapp}
          image={settings.homepage.orderBannerImage ?? undefined}
        />
      </div>
    </>
  );
}
