import { cn } from "@/lib/utils";

/**
 * The editorial "01 / About you" section header from the reference form — a
 * coral numeral tile, a Fraunces heading, and a hairline above.
 */
export function BuilderSection({
  step,
  title,
  description,
  children,
  first,
  id,
}: {
  step: number;
  title: string;
  description?: string;
  children: React.ReactNode;
  first?: boolean;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-28",
        first ? "" : "border-line mt-14 border-t pt-11",
      )}
    >
      <header className="flex gap-5">
        <span
          aria-hidden
          className="bg-coral grid size-11 flex-none place-items-center rounded-[14px] text-xs font-bold text-white"
        >
          {String(step).padStart(2, "0")}
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-[24px] leading-tight tracking-[-0.025em] sm:text-[28px]">
            {title}
          </h2>
          {description ? (
            <p className="text-muted mt-1 text-sm">{description}</p>
          ) : null}
        </div>
      </header>
      <div className="mt-7">{children}</div>
    </section>
  );
}

export function FieldGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-5 sm:grid-cols-2", className)}>{children}</div>
  );
}

export function FullWidth({ children }: { children: React.ReactNode }) {
  return <div className="sm:col-span-2">{children}</div>;
}
