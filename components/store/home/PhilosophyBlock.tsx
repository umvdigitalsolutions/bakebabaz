import { Reveal } from "@/components/ui/Reveal";
import { smartQuotes } from "@/lib/utils";

export function PhilosophyBlock({
  eyebrow,
  heading,
  quote,
  body,
}: {
  eyebrow?: string;
  heading: string;
  quote: string;
  body?: string;
}) {
  // The CMS heading often matches the eyebrow word for word; printing the same
  // phrase twice in a row reads like a mistake.
  const showEyebrow =
    eyebrow && eyebrow.trim().toLowerCase() !== heading.trim().toLowerCase();

  return (
    <Reveal className="mx-auto max-w-[870px] text-center">
      {showEyebrow ? (
        <p className="eyebrow eyebrow-plain mb-4 justify-center">{eyebrow}</p>
      ) : null}
      <h2 className="display-2 text-balance">{smartQuotes(heading)}</h2>
      <blockquote className="font-display mt-6 text-[clamp(26px,4vw,49px)] leading-[1.25] tracking-[-0.025em] text-balance">
        “{smartQuotes(quote)}”
      </blockquote>
      {body ? (
        <p className="lede mx-auto mt-6 max-w-[600px]">{smartQuotes(body)}</p>
      ) : null}
    </Reveal>
  );
}
