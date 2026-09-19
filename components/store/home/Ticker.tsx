/**
 * The scrolling category ribbon under the hero. Duplicated once so the
 * translate(-50%) loop is seamless; pauses entirely under reduced motion.
 */
export function Ticker({ items }: { items: string[] }) {
  if (!items.length) return null;
  const loop = [...items, ...items];

  return (
    <div
      className="border-line bg-cream mt-8 overflow-hidden border-y"
      aria-label="Our specialities"
    >
      <div className="ticker-track text-muted py-[17px] text-[13px] font-bold tracking-[0.11em] uppercase">
        {loop.map((item, index) => (
          <span
            key={`${item}-${index}`}
            // The second copy only exists to make the loop seamless.
            aria-hidden={index >= items.length || undefined}
            className="flex items-center gap-7"
          >
            {item}
            <span aria-hidden className="text-coral">
              ✦
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
