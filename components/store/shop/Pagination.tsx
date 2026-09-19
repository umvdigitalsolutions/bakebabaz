import Link from "next/link";
import { cn } from "@/lib/utils";

export function Pagination({
  page,
  pages,
  basePath,
  searchParams,
}: {
  page: number;
  pages: number;
  basePath: string;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  if (pages <= 1) return null;

  const href = (target: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (key === "page" || value == null) continue;
      params.set(key, Array.isArray(value) ? value[0] : value);
    }
    if (target > 1) params.set("page", String(target));
    const query = params.toString();
    return query ? `${basePath}?${query}` : basePath;
  };

  // Show a compact window around the current page rather than every number.
  const numbers = Array.from({ length: pages }, (_, i) => i + 1).filter(
    (n) => n === 1 || n === pages || Math.abs(n - page) <= 1,
  );

  return (
    <nav
      className="mt-14 flex items-center justify-center gap-2"
      aria-label="Pagination"
    >
      {page > 1 ? (
        <Link
          href={href(page - 1)}
          rel="prev"
          className="border-line hover:border-cocoa grid size-10 place-items-center rounded-full border transition-colors"
          aria-label="Previous page"
        >
          ←
        </Link>
      ) : null}

      {numbers.map((n, index) => (
        <span key={n} className="flex items-center gap-2">
          {index > 0 && n - numbers[index - 1] > 1 ? (
            <span className="text-muted">…</span>
          ) : null}
          <Link
            href={href(n)}
            aria-current={n === page ? "page" : undefined}
            className={cn(
              "grid size-10 place-items-center rounded-full border text-sm font-semibold transition-colors",
              n === page
                ? "border-cocoa bg-cocoa text-white"
                : "border-line hover:border-cocoa",
            )}
          >
            {n}
          </Link>
        </span>
      ))}

      {page < pages ? (
        <Link
          href={href(page + 1)}
          rel="next"
          className="border-line hover:border-cocoa grid size-10 place-items-center rounded-full border transition-colors"
          aria-label="Next page"
        >
          →
        </Link>
      ) : null}
    </nav>
  );
}
