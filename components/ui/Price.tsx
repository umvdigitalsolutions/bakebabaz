import { cn } from "@/lib/utils";
import { formatINR } from "@/lib/utils";

export function Price({
  value,
  compareAt,
  className,
  size = "md",
  prefix,
}: {
  value: number;
  compareAt?: number;
  className?: string;
  size?: "sm" | "md" | "lg";
  prefix?: string;
}) {
  const sizes = {
    sm: "text-sm",
    md: "text-[17px]",
    lg: "text-2xl",
  } as const;

  return (
    <span className={cn("inline-flex items-baseline gap-2", className)}>
      {prefix ? (
        <span className="text-muted text-xs font-medium tracking-[0.08em] uppercase">
          {prefix}
        </span>
      ) : null}
      <span className={cn("text-cocoa font-semibold", sizes[size])}>
        {formatINR(value)}
      </span>
      {compareAt && compareAt > value ? (
        <span className="text-muted text-sm line-through">
          {formatINR(compareAt)}
        </span>
      ) : null}
    </span>
  );
}
