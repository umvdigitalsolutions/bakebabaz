import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Page not found",
};

/**
 * Unmatched URLs would otherwise fall through to Next's bare default 404.
 * Routing them here renders the branded not-found page inside the store
 * layout, with a real 404 status.
 */
export default function MissingPage() {
  notFound();
}
