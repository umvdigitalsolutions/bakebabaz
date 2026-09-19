"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Search, X } from "lucide-react";
import { formatINR } from "@/lib/utils";

type SearchResults = {
  products: {
    id: string;
    name: string;
    slug: string;
    image: string | null;
    categoryName: string | null;
    price: number;
  }[];
  categories: { id: string; name: string; slug: string }[];
};

const suggestions = [
  "Chocolate cake",
  "Eggless",
  "Gift hamper",
  "Cheesecake",
  "Brownies",
  "Photo cake",
];

export function SearchOverlay({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => inputRef.current?.focus(), 80);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  // Debounced so typing doesn't fire a request per keystroke. Nothing is
  // cleared here — `active` below derives visibility from the current query,
  // which keeps this effect free of cascading state updates.
  useEffect(() => {
    if (query.trim().length < 2) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      // The spinner appears only once the debounce elapses and a request is
      // genuinely in flight, so it never flickers on every keystroke.
      setLoading(true);
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(query.trim())}`,
          { signal: controller.signal },
        );
        const payload = await response.json();
        if (payload?.ok) setResults(payload.data);
      } catch {
        // Aborted or offline — keep the previous results visible.
      } finally {
        setLoading(false);
      }
    }, 280);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  // Results belong to whatever the box currently holds; a query shorter than
  // two characters simply has none.
  const active = query.trim().length >= 2;
  const visibleResults = active ? results : null;
  const isLoading = active && loading;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!query.trim()) return;
    router.push(`/shop?q=${encodeURIComponent(query.trim())}`);
    onClose();
  };

  const hasResults = Boolean(
    visibleResults &&
    (visibleResults.products.length > 0 ||
      visibleResults.categories.length > 0),
  );

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[220]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="bg-cocoa/40 absolute inset-0 backdrop-blur-[3px]"
          />
          <motion.div
            initial={{ opacity: 0, y: -18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto mt-0 w-full max-w-[760px] px-4 pt-4 sm:pt-16"
            role="dialog"
            aria-modal="true"
            aria-label="Search"
          >
            <div className="border-line bg-paper overflow-hidden rounded-[24px] border shadow-[0_24px_60px_rgba(76,43,34,.2)]">
              <form
                onSubmit={submit}
                className="border-line flex items-center gap-3 border-b px-5 py-4"
              >
                {isLoading ? (
                  <Loader2 className="text-coral size-5 shrink-0 animate-spin" />
                ) : (
                  <Search className="text-muted size-5 shrink-0" />
                )}
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search cakes, hampers, flavours…"
                  aria-label="Search products"
                  className="placeholder:text-muted/70 min-w-0 flex-1 bg-transparent text-[17px] outline-none"
                />
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close search"
                  className="text-muted hover:bg-cream grid size-8 place-items-center rounded-full transition-colors"
                >
                  <X className="size-4" />
                </button>
              </form>

              <div className="max-h-[62vh] overflow-y-auto p-4">
                {!active ? (
                  // Suggestions stay up until there's enough to search on, so
                  // a single keystroke doesn't flash "No matches found".
                  <div>
                    <p className="text-muted px-1 pb-3 text-[11px] font-bold tracking-[0.14em] uppercase">
                      Popular searches
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {suggestions.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setQuery(item)}
                          className="border-line hover:border-coral hover:text-coral-dark rounded-full border bg-white px-4 py-2 text-sm transition-colors"
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : hasResults && visibleResults ? (
                  <div className="space-y-5">
                    {visibleResults.categories.length > 0 ? (
                      <div>
                        <p className="text-muted px-1 pb-2 text-[11px] font-bold tracking-[0.14em] uppercase">
                          Collections
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {visibleResults.categories.map((category) => (
                            <Link
                              key={category.id}
                              href={`/shop/${category.slug}`}
                              onClick={onClose}
                              className="border-line hover:border-coral rounded-full border bg-white px-4 py-2 text-sm"
                            >
                              {category.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {visibleResults.products.length > 0 ? (
                      <div>
                        <p className="text-muted px-1 pb-2 text-[11px] font-bold tracking-[0.14em] uppercase">
                          Products
                        </p>
                        <ul className="space-y-1">
                          {visibleResults.products.map((product) => (
                            <li key={product.id}>
                              <Link
                                href={`/product/${product.slug}`}
                                onClick={onClose}
                                className="hover:bg-cream flex items-center gap-4 rounded-2xl px-2 py-2 transition-colors"
                              >
                                <span className="bg-cream relative size-14 flex-none overflow-hidden rounded-xl">
                                  {product.image ? (
                                    <Image
                                      src={product.image}
                                      alt=""
                                      fill
                                      sizes="56px"
                                      className="object-cover"
                                    />
                                  ) : null}
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate font-medium">
                                    {product.name}
                                  </span>
                                  <span className="text-muted block text-xs">
                                    {product.categoryName}
                                  </span>
                                </span>
                                <span className="flex-none text-sm font-semibold">
                                  {formatINR(product.price)}
                                </span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    <button
                      type="button"
                      onClick={submit}
                      className="border-line bg-cream/70 hover:border-coral w-full rounded-2xl border py-3 text-sm font-semibold transition-colors"
                    >
                      See all results for “{query.trim()}”
                    </button>
                  </div>
                ) : isLoading ? (
                  <p className="text-muted py-10 text-center text-sm">
                    Searching…
                  </p>
                ) : (
                  <div className="py-10 text-center">
                    <p className="font-display text-xl">No matches found</p>
                    <p className="text-muted mt-2 text-sm">
                      Try a flavour, an occasion, or{" "}
                      <Link
                        href="/customize-your-cake"
                        onClick={onClose}
                        className="text-coral-dark font-semibold underline underline-offset-4"
                      >
                        design your own cake
                      </Link>
                      .
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
