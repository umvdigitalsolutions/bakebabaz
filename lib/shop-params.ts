import type { ShopFilters } from "@/lib/data/catalog";

type RawParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

/** Turns URL search params into a validated filter object for the data layer. */
export function parseShopParams(
  params: RawParams,
  categorySlug?: string,
): ShopFilters {
  const num = (key: string) => {
    const value = Number(first(params[key]));
    return Number.isFinite(value) && value >= 0 ? value : undefined;
  };

  return {
    categorySlug,
    q: first(params.q)?.slice(0, 80),
    minPrice: num("min"),
    maxPrice: num("max"),
    eggless: first(params.eggless) === "1",
    vegetarian: first(params.veg) === "1",
    flavour: first(params.flavour)?.slice(0, 60),
    occasion: first(params.occasion)?.slice(0, 60),
    weight: first(params.weight)?.slice(0, 40),
    inStock: first(params.inStock) === "1",
    sort: first(params.sort),
    page: Math.max(Number(first(params.page)) || 1, 1),
    perPage: 12,
  };
}
