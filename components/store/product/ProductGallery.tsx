"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function ProductGallery({
  images,
  productName,
}: {
  images: { url: string; alt?: string }[];
  productName: string;
}) {
  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");

  if (!images.length) {
    return (
      <div className="bg-cream grid aspect-square place-items-center rounded-[26px] text-6xl">
        <span aria-hidden>🎂</span>
      </div>
    );
  }

  const current = images[Math.min(active, images.length - 1)];

  return (
    <div className="flex flex-col gap-4 lg:flex-row-reverse lg:gap-5">
      <div
        className="bg-cream relative aspect-[4/5] flex-1 overflow-hidden rounded-[26px]"
        onMouseMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          const x = ((event.clientX - rect.left) / rect.width) * 100;
          const y = ((event.clientY - rect.top) / rect.height) * 100;
          setOrigin(`${x}% ${y}%`);
        }}
        onMouseEnter={() => setZoomed(true)}
        onMouseLeave={() => setZoomed(false)}
      >
        <Image
          key={current.url}
          src={current.url}
          alt={current.alt ?? productName}
          fill
          preload
          sizes="(max-width: 1024px) 100vw, 45vw"
          style={{ transformOrigin: origin }}
          className={cn(
            "object-cover transition-transform duration-300 ease-out",
            zoomed && "scale-[1.6]",
          )}
        />
      </div>

      {images.length > 1 ? (
        <div
          className="no-scrollbar flex gap-3 overflow-x-auto lg:w-[92px] lg:flex-col lg:overflow-visible"
          role="tablist"
          aria-label={`${productName} images`}
        >
          {images.map((image, index) => (
            <button
              key={image.url}
              type="button"
              role="tab"
              aria-selected={index === active}
              aria-label={`View image ${index + 1} of ${images.length}`}
              onClick={() => setActive(index)}
              className={cn(
                "bg-cream relative aspect-square w-[76px] flex-none overflow-hidden rounded-2xl border-2 transition-colors lg:w-full",
                index === active
                  ? "border-coral"
                  : "hover:border-line-strong border-transparent",
              )}
            >
              <Image
                src={image.url}
                alt=""
                fill
                sizes="92px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
