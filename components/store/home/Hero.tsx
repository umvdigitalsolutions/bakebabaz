import Image from "next/image";
import { ButtonLink } from "@/components/ui/Button";
import type { StoreSettingsData } from "@/lib/data/settings";

/**
 * The reference hero: one wide photograph inside a heavily rounded card, with a
 * cream gradient washing in from the left so the type stays readable. On small
 * screens the copy is too tall to sit over the photo legibly, so the photo
 * drops below the copy instead and fades up into it.
 */
export function Hero({ settings }: { settings: StoreSettingsData }) {
  const { hero } = settings;
  const image = hero.images?.[0];

  return (
    <section className="pt-4 sm:pt-7">
      <div className="wrap-wide">
        <div className="relative flex flex-col overflow-hidden rounded-[26px] bg-[#faf1e6] shadow-[0_24px_60px_rgba(76,43,34,.12)] lg:min-h-[690px] lg:rounded-[38px]">
          {image ? (
            <div className="relative order-last h-[280px] sm:h-[380px] lg:absolute lg:inset-0 lg:order-none lg:h-auto">
              <Image
                src={image.url}
                alt={image.alt ?? "Freshly baked cakes from Bake Baba'z"}
                fill
                preload
                sizes="100vw"
                className="object-cover object-center"
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-[linear-gradient(180deg,#faf1e6_0%,rgba(250,241,230,0)_38%)] lg:bg-[linear-gradient(90deg,rgba(250,241,230,.97)_0%,rgba(250,241,230,.88)_31%,rgba(250,241,230,.22)_60%,transparent_75%)]"
              />
            </div>
          ) : null}

          <div className="relative z-10 w-full px-6 pt-12 pb-8 sm:px-10 sm:pt-16 sm:pb-10 lg:w-[56%] lg:max-w-[590px] lg:py-[100px] lg:pr-0 lg:pl-[7%]">
            <p className="eyebrow mb-5">{hero.eyebrow}</p>

            <h1 className="display-1 max-w-[580px] text-balance">
              {hero.headingLead}{" "}
              <em className="text-coral not-italic">{hero.headingEmphasis}</em>
            </h1>

            <p className="lede mt-6 mb-8 max-w-[500px] text-pretty">
              {hero.description}
            </p>

            <div className="flex flex-wrap gap-3">
              <ButtonLink href={hero.primaryCta.href} variant="coral">
                {hero.primaryCta.label}
              </ButtonLink>
              <ButtonLink href={hero.secondaryCta.href} variant="ghost">
                {hero.secondaryCta.label}
              </ButtonLink>
            </div>

            {hero.ribbon ? (
              <p className="mt-8 flex items-center gap-3.5 text-[13px] font-semibold lg:mt-10">
                <span
                  aria-hidden
                  className="border-line text-coral grid size-[38px] flex-none place-items-center rounded-full border bg-white/50"
                >
                  ♡
                </span>
                {hero.ribbon}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
