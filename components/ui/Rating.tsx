import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function Rating({
  value,
  count,
  size = 14,
  className,
  showCount = true,
}: {
  value: number;
  count?: number;
  size?: number;
  className?: string;
  showCount?: boolean;
}) {
  const rounded = Math.round(value * 2) / 2;
  return (
    <span
      className={cn("inline-flex items-center gap-1.5", className)}
      aria-label={`Rated ${value.toFixed(1)} out of 5`}
    >
      <span className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            style={{ width: size, height: size }}
            className={cn(
              star <= rounded
                ? "fill-coral text-coral"
                : "text-line-strong fill-transparent",
            )}
            aria-hidden
          />
        ))}
      </span>
      {showCount && count != null ? (
        <span className="text-muted text-xs font-medium">
          {value.toFixed(1)} ({count})
        </span>
      ) : null}
    </span>
  );
}
