import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import type { CategoryData } from "@/lib/data/catalog";

export function CollectionCards({
  categories,
}: {
  categories: CategoryData[];
}) {
  if (!categories.length) return null;

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 sm:gap-y-12 lg:grid-cols-4">
      {categories.map((category, index) => (
        <Reveal
          key={category.id}
          delay={index * 0.07}
          as="article"
          className="group"
        >
          <Link href={`/shop/${category.slug}`} className="block">
            <div className="bg-cream relative aspect-[3/4] overflow-hidden rounded-[24px]">
              {category.image ? (
                <Image
                  src={category.image.url}
                  alt={category.image.alt ?? category.name}
                  fill
                  sizes="(max-width: 1024px) 50vw, 25vw"
                  className="object-cover transition-transform duration-[700ms] ease-out group-hover:scale-[1.05]"
                />
              ) : (
                <span
                  className="grid h-full place-items-center text-5xl"
                  aria-hidden
                >
                  {category.icon ?? "🎂"}
                </span>
              )}
              {category.icon ? (
                <span
                  aria-hidden
                  className="bg-paper/95 absolute top-3 left-3 grid size-9 place-items-center rounded-full text-base shadow-[0_6px_16px_rgba(61,37,33,.1)] sm:top-4 sm:left-4 sm:size-11 sm:text-xl"
                >
                  {category.icon}
                </span>
              ) : null}
            </div>

            <h3 className="font-display mt-5 text-[21px] leading-tight tracking-[-0.025em] sm:mt-8 sm:text-[27px]">
              {category.name}
            </h3>
            {category.description ? (
              <p className="text-muted mt-2 text-[13.5px] leading-relaxed sm:mt-2.5 sm:text-[15px]">
                {category.description}
              </p>
            ) : null}
            <span className="text-coral-dark mt-3 inline-flex items-center gap-2 text-[12px] font-bold tracking-[0.1em] uppercase sm:mt-4 sm:text-[13px]">
              Explore
              <span
                aria-hidden
                className="transition-transform duration-200 group-hover:translate-x-1"
              >
                →
              </span>
            </span>
          </Link>
        </Reveal>
      ))}
    </div>
  );
}
