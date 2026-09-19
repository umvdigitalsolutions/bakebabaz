import { Reveal } from "@/components/ui/Reveal";

export type ProcessStep = { title: string; body: string };

/** The "01 Share / 02 Refine / 03 Confirm / 04 Bake" editorial row. */
export function ProcessSteps({
  steps,
  columns = 4,
}: {
  steps: ProcessStep[];
  columns?: 3 | 4;
}) {
  return (
    <div
      className={
        columns === 3
          ? "grid gap-10 md:grid-cols-3 md:gap-8"
          : "grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8"
      }
    >
      {steps.map((step, index) => (
        <Reveal key={step.title} delay={index * 0.07} as="article">
          <span className="font-display text-coral text-[15px] font-bold tracking-[0.18em]">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span
            aria-hidden
            className="mt-5 block h-px w-full bg-[color:var(--color-line)]"
          />
          <h3 className="font-display mt-8 text-[26px] leading-tight tracking-[-0.025em] sm:text-[29px]">
            {step.title}
          </h3>
          <p className="text-muted mt-3 text-[15px] leading-relaxed">
            {step.body}
          </p>
        </Reveal>
      ))}
    </div>
  );
}
