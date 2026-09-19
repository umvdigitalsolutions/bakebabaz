import { cn } from "@/lib/utils";
import { Reveal } from "@/components/ui/Reveal";

export function SectionHead({
  eyebrow,
  title,
  description,
  action,
  align = "left",
  tone = "default",
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: string;
  action?: React.ReactNode;
  align?: "left" | "center";
  tone?: "default" | "inverse";
  className?: string;
}) {
  return (
    <Reveal
      className={cn(
        "mb-9 flex flex-col gap-6 sm:mb-13 md:flex-row md:items-end md:justify-between",
        align === "center" && "items-center text-center md:flex-col",
        className,
      )}
    >
      <div className={cn("max-w-[690px]", align === "center" && "mx-auto")}>
        {eyebrow ? (
          <p className={cn("eyebrow mb-4", tone === "inverse" && "text-rose")}>
            {eyebrow}
          </p>
        ) : null}
        <h2
          className={cn(
            "display-2 text-balance",
            tone === "inverse" && "text-white",
          )}
        >
          {title}
        </h2>
        {description ? (
          <p
            className={cn(
              "lede mt-4 max-w-[590px]",
              align === "center" && "mx-auto",
              tone === "inverse" && "text-white/65",
            )}
          >
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="flex-none">{action}</div> : null}
    </Reveal>
  );
}
