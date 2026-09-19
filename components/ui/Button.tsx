import Link from "next/link";
import { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "coral" | "ghost" | "outline" | "quiet" | "light";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2.5 rounded-full font-semibold transition-[transform,background-color,color,box-shadow,border-color] duration-200 disabled:pointer-events-none disabled:opacity-55 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral";

const variants: Record<Variant, string> = {
  primary:
    "border border-cocoa bg-cocoa text-white hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(61,37,33,.16)]",
  coral:
    "border border-coral bg-coral text-white hover:-translate-y-0.5 hover:border-coral-dark hover:bg-coral-dark hover:shadow-[0_12px_24px_rgba(207,79,73,.24)]",
  ghost:
    "border border-cocoa bg-transparent text-cocoa hover:bg-cocoa hover:text-white",
  outline:
    "border border-line bg-transparent text-cocoa hover:border-cocoa hover:bg-cream",
  quiet: "border border-transparent bg-cream text-cocoa hover:bg-cream-deep",
  light:
    "border border-white bg-white text-cocoa hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(0,0,0,.14)]",
};

const sizes: Record<Size, string> = {
  sm: "min-h-9 px-4 text-[13px]",
  md: "min-h-[50px] px-6 text-sm",
  lg: "min-h-[56px] px-8 text-[15px]",
};

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      className,
      variant = "primary",
      size = "md",
      loading,
      fullWidth,
      children,
      disabled,
      ...props
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          base,
          variants[variant],
          sizes[size],
          fullWidth && "w-full",
          className,
        )}
        {...props}
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : null}
        {children}
      </button>
    );
  },
);

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  fullWidth,
  className,
  children,
  prefetch,
  ...props
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  className?: string;
  children: React.ReactNode;
  prefetch?: boolean;
} & Omit<React.ComponentPropsWithoutRef<"a">, "href">) {
  const isExternal = /^(https?:|mailto:|tel:)/.test(href);
  const classes = cn(
    base,
    variants[variant],
    sizes[size],
    fullWidth && "w-full",
    className,
  );

  if (isExternal) {
    return (
      <a
        href={href}
        className={classes}
        rel="noopener noreferrer"
        target={href.startsWith("http") ? "_blank" : undefined}
        {...props}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={classes} prefetch={prefetch} {...props}>
      {children}
    </Link>
  );
}
