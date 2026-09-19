import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";

export function Gallery({
  items,
}: {
  items: {
    image?: { url: string; alt?: string };
    caption: string;
    link?: string;
  }[];
}) {
  const visible = items.filter((item) => item.image?.url);
  if (!visible.length) return null;

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {visible.map((item, index) => {
        const content = (
          <>
            <div className="bg-cream relative aspect-square overflow-hidden rounded-[22px]">
              <Image
                src={item.image!.url}
                alt={item.image!.alt ?? item.caption}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="object-cover transition-transform duration-[700ms] ease-out group-hover:scale-[1.05]"
              />
            </div>
            <p className="mt-4 text-[15px] font-medium">{item.caption}</p>
          </>
        );

        return (
          <Reveal
            key={item.caption}
            delay={index * 0.06}
            as="article"
            className="group"
          >
            {item.link ? (
              <Link href={item.link} className="block">
                {content}
              </Link>
            ) : (
              content
            )}
          </Reveal>
        );
      })}
    </div>
  );
}
