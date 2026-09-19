"use client";

import Image from "next/image";
import { Sparkles } from "lucide-react";
import { CakePriceBreakdown } from "./CakePriceBreakdown";
import type { BuilderState } from "./types";
import type {
  CustomCakeQuote,
  PricingCatalogOption,
} from "@/lib/pricing/types";
import styles from "./CakeBuilder.module.css";

const FLAVOUR_IMAGES: Record<string, string> = {
  chocolate: "/products/chocolate-truffle-cake.jpg",
  "belgian-chocolate": "/products/chocolate-mousse-cake.jpg",
  vanilla: "/products/vanilla-cake.jpg",
  "red-velvet": "/products/strawberry-cake.jpg",
  butterscotch: "/products/butterscotch-cake.jpg",
  "black-forest": "/products/blackforest-cake.jpg",
  pineapple: "/products/pineapple-cake.jpg",
  blueberry: "/products/blueberry-cake.jpg",
  strawberry: "/products/strawberry-cake.jpg",
  "lotus-biscoff": "/products/biscoff-cheesecake-slice.jpg",
};

export function CakeStudioPreview({
  state,
  quote,
  labels,
  optionsByType,
}: {
  state: BuilderState;
  quote: CustomCakeQuote;
  labels: Record<string, string>;
  optionsByType: Record<string, PricingCatalogOption[]>;
}) {
  const selectedStyle = optionsByType.style?.find(
    (option) => option.value === state.style,
  );
  const selectedFlavour = optionsByType.flavour?.find(
    (option) => option.value === state.flavour,
  );
  const image =
    selectedStyle?.image?.url ??
    selectedFlavour?.image?.url ??
    FLAVOUR_IMAGES[state.flavour] ??
    "/brand/custom-cake-studio-preview.jpg";

  const hasDesignChoice = Boolean(state.flavour || state.style);

  const details = [
    labels[state.occasion],
    `${state.weightKg} kg`,
    labels[state.flavour],
    labels[state.style],
    state.colourTheme,
  ].filter(Boolean);

  return (
    <div className="min-w-0 overflow-hidden rounded-lg bg-[#281714] text-white shadow-[0_24px_60px_rgba(61,37,33,.18)]">
      <div className={`${styles.previewMedia} relative overflow-hidden`}>
        <Image
          src={image}
          alt={
            hasDesignChoice
              ? "Representative Bake Baba'z cake inspiration"
              : "Ivory custom cake with coral piping and botanical details"
          }
          fill
          sizes="(max-width: 1024px) 100vw, 42vw"
          className="object-cover transition-opacity duration-500"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_45%,rgba(29,15,13,.88)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
          <p className="inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.13em] uppercase opacity-80">
            <Sparkles className="size-3.5 text-[#f4bbb5]" />
            {hasDesignChoice
              ? "Representative inspiration"
              : "Studio starting point"}
          </p>
          {state.message ? (
            <p className="font-display mt-2 text-2xl leading-tight text-balance">
              &ldquo;{state.message}&rdquo;
            </p>
          ) : (
            <p className="font-display mt-2 text-2xl leading-tight">
              Your cake is taking shape.
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {details.map((detail) => (
              <span
                key={detail}
                className="border border-white/25 bg-black/20 px-2.5 py-1 text-[11px] font-semibold backdrop-blur-sm"
              >
                {detail}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 p-5 sm:p-7">
        <CakePriceBreakdown quote={quote} quantity={state.quantity} />
        <p className="mt-4 text-xs leading-relaxed text-white/60">
          The photograph is inspiration, not a digital rendering. Our team will
          confirm the final design, finish, and price with you.
        </p>
      </div>
    </div>
  );
}
