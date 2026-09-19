import { PackageSearch } from "lucide-react";
import { ProductGrid } from "@/components/store/ProductGrid";
import { EmptyState } from "@/components/ui/EmptyState";
import { ShopFilters, type Facets } from "./ShopFilters";
import { SortSelect } from "./SortSelect";
import { Pagination } from "./Pagination";
import type { CategoryData, ProductCardData } from "@/lib/data/catalog";

export function ShopView({
  products,
  total,
  page,
  pages,
  categories,
  facets,
  activeCategorySlug,
  basePath,
  searchParams,
}: {
  products: ProductCardData[];
  total: number;
  page: number;
  pages: number;
  categories: CategoryData[];
  facets: Facets;
  activeCategorySlug?: string;
  basePath: string;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const hasFilters = Object.entries(searchParams).some(
    ([key, value]) => key !== "page" && key !== "sort" && value,
  );

  return (
    <div className="grid gap-10 lg:grid-cols-[248px_1fr] lg:gap-14">
      <div>
        <ShopFilters
          categories={categories}
          facets={facets}
          activeCategorySlug={activeCategorySlug}
          totalResults={total}
        />
      </div>

      <div className="min-w-0">
        <div className="border-line mb-8 hidden items-center justify-between gap-4 border-b pb-5 lg:flex">
          <p className="text-muted text-sm">
            {total} {total === 1 ? "product" : "products"}
          </p>
          <SortSelect />
        </div>

        <p className="text-muted mb-5 text-sm lg:hidden">
          {total} {total === 1 ? "product" : "products"}
        </p>

        {products.length > 0 ? (
          <>
            <ProductGrid products={products} priorityCount={4} />
            <Pagination
              page={page}
              pages={pages}
              basePath={basePath}
              searchParams={searchParams}
            />
          </>
        ) : (
          <EmptyState
            icon={<PackageSearch className="size-6" />}
            title={
              hasFilters
                ? "Nothing matches those filters"
                : "Fresh bakes are on their way"
            }
            description={
              hasFilters
                ? "Try widening your price range or clearing a filter — or tell us what you’re picturing and we’ll bake it to order."
                : "Nothing is listed here just yet. Tell us what you’re picturing and we’ll bake it to order."
            }
            actionLabel="Design your own cake"
            actionHref="/customize-your-cake"
            secondaryLabel={hasFilters ? "Clear filters" : "Contact us"}
            secondaryHref={hasFilters ? basePath : "/contact"}
          />
        )}
      </div>
    </div>
  );
}
