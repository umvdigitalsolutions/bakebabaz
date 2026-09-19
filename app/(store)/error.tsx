"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";

export default function StoreError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[store]", error);
  }, [error]);

  return (
    <div className="wrap max-w-xl py-24 text-center sm:py-32">
      <span
        aria-hidden
        className="bg-coral-soft text-coral-dark mx-auto grid size-14 place-items-center rounded-full"
      >
        <AlertTriangle className="size-6" />
      </span>
      <h1 className="display-2 mt-6 text-balance">Something went wrong</h1>
      <p className="lede mt-4">
        That&rsquo;s on us, not you. Try again — and if it keeps happening,
        message us and we&rsquo;ll sort it out.
      </p>
      {error.digest ? (
        <p className="text-muted mt-3 text-xs">Reference: {error.digest}</p>
      ) : null}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button variant="coral" onClick={reset}>
          Try again
        </Button>
        <ButtonLink href="/" variant="ghost">
          Back home
        </ButtonLink>
      </div>
    </div>
  );
}
