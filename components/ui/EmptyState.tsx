import { cn } from "@/lib/utils";
import { ButtonLink } from "./Button";

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  secondaryLabel,
  secondaryHref,
  children,
  className,
  titleAs: Title = "h3",
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  children?: React.ReactNode;
  className?: string;
  /** Use "h1" when the empty state is the whole page, e.g. a 404. */
  titleAs?: "h1" | "h2" | "h3";
}) {
  return (
    <div
      className={cn(
        "border-line-strong/60 bg-cream/50 flex flex-col items-center justify-center rounded-[26px] border border-dashed px-6 py-16 text-center",
        className,
      )}
    >
      {icon ? (
        <div className="text-coral mb-5 grid size-14 place-items-center rounded-full bg-white shadow-[0_10px_24px_rgba(76,43,34,.08)]">
          {icon}
        </div>
      ) : null}
      <Title className="display-3 max-w-md text-balance">{title}</Title>
      {description ? (
        <p className="lede mt-3 max-w-md text-balance">{description}</p>
      ) : null}
      {(actionHref || secondaryHref) && (
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          {actionHref && actionLabel ? (
            <ButtonLink href={actionHref} variant="coral">
              {actionLabel}
            </ButtonLink>
          ) : null}
          {secondaryHref && secondaryLabel ? (
            <ButtonLink href={secondaryHref} variant="ghost">
              {secondaryLabel}
            </ButtonLink>
          ) : null}
        </div>
      )}
      {children}
    </div>
  );
}
