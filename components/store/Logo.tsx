import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  brandName = "Bake Baba'z",
  location = "Bikaner",
  tone = "cocoa",
}: {
  className?: string;
  brandName?: string;
  location?: string;
  tone?: "cocoa" | "light";
}) {
  return (
    <Link
      href="/"
      className={cn("group inline-flex items-center gap-3", className)}
      aria-label={`${brandName}, ${location} — home`}
    >
      <span
        className={cn(
          "relative block size-11 flex-none overflow-hidden rounded-[14px] border shadow-[0_8px_18px_rgba(239,91,88,.16)] transition-colors",
          tone === "light"
            ? "border-white/40 bg-white/10"
            : "border-line bg-cream group-hover:border-coral/40",
        )}
        aria-hidden
      >
        <Image
          src="/brand/bake-babaz-logo.png"
          alt=""
          width={44}
          height={44}
          sizes="44px"
          className="h-full w-full object-cover"
        />
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-display text-[19px] tracking-[-0.03em]",
            tone === "light" ? "text-white" : "text-cocoa",
          )}
        >
          {brandName}
        </span>
        <span
          className={cn(
            "mt-1 text-[10.5px] font-semibold tracking-[0.22em] uppercase",
            tone === "light" ? "text-white/70" : "text-muted",
          )}
        >
          {location}
        </span>
      </span>
    </Link>
  );
}
