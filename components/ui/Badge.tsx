import { cn } from "@/lib/utils";

const tones = {
  neutral: "border-line bg-cream text-muted",
  coral: "border-coral/30 bg-coral-soft text-coral-dark",
  cocoa: "border-cocoa bg-cocoa text-white",
  leaf: "border-pistachio/40 bg-pistachio/15 text-[#5b6034]",
  outline: "border-line bg-transparent text-cocoa",
} as const;

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: keyof typeof tones;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-[0.08em] uppercase",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
