"use client";

import Link from "next/link";
import { useCallback, useSyncExternalStore } from "react";
import { X } from "lucide-react";

const STORAGE_KEY = "bb_announcement_dismissed";

/**
 * Dismissal lives in sessionStorage, which is an external store rather than
 * React state — so it's read through `useSyncExternalStore`. That keeps the
 * server render (never dismissed) and the client render consistent without a
 * setState-in-effect round trip.
 */
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function readDismissed() {
  try {
    return window.sessionStorage.getItem(STORAGE_KEY);
  } catch {
    // Private browsing can throw on access; treat it as "not dismissed".
    return null;
  }
}

function dismiss(text: string) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, text);
  } catch {
    // Storage unavailable — the bar simply reappears next navigation.
  }
  for (const listener of listeners) listener();
}

export function AnnouncementBar({
  text,
  link,
}: {
  text: string;
  link?: string;
}) {
  const dismissedValue = useSyncExternalStore(
    subscribe,
    readDismissed,
    () => null,
  );

  const onDismiss = useCallback(() => dismiss(text), [text]);

  if (dismissedValue === text) return null;

  const content = (
    <span className="text-[11.5px] font-semibold tracking-[0.02em] sm:text-[12.5px] sm:tracking-[0.03em]">
      {text}
    </span>
  );

  return (
    <div className="bg-cocoa relative text-white">
      <div className="wrap flex min-h-[42px] items-center justify-center gap-3 py-2 pr-7 text-center sm:px-10">
        {link ? (
          <Link href={link} className="underline-offset-4 hover:underline">
            {content}
          </Link>
        ) : (
          content
        )}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss announcement"
        className="absolute top-1/2 right-3 grid size-7 -translate-y-1/2 place-items-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
