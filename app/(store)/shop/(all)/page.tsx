import type { Metadata } from "next";
import { Suspense } from "react";
import { getCategories, getProducts, getShopFacets } from "@/lib/data/catalog";
import { parseShopParams } from "@/lib/shop-params";
import { ShopView } from "@/components/store/shop/ShopView";
import { ProductGridSkeleton } from "@/components/ui/Skeleton";
import { BreadcrumbJsonLd } from "@/components/shared/JsonLd";

export const metadata: Metadata = {
  title: "Shop all bakes",
  description:
    "Browse celebration cakes, cheesecakes, brownies, cookies, hampers and fresh breads from Bake Baba'z in Bikaner. Filter by flavour, occasion, weight and dietary preference.",
  alternates: { canonical: "/shop" },
};

export default async function ShopPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;
  const filters = parseShopParams(searchParams);

  const [{ products, total, page, pages }, categories, facets] =
    await Promise.all([
      getProducts(filters),
      getCategories({ withCounts: true }),
      getShopFacets(),
    ]);

  const query = filters.q;

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Shop", href: "/shop" },
        ]}
      />

      <div className="wrap pt-10 pb-20 sm:pt-14">
        <header className="mb-10 max-w-[690px] sm:mb-14">
          <p className="eyebrow mb-4">Our bakes</p>
          <h1 className="display-2 text-balance">
            {query
              ? `Results for “${query}”`
              : "A bake for every kind of craving"}
          </h1>
          <p className="lede mt-4">
            Celebration centrepieces, comforting cookies, thoughtful hampers and
            better everyday bakes—made fresh in Bikaner.
          </p>
        </header>

        <Suspense fallback={<ProductGridSkeleton />}>
          <ShopView
            products={products}
            total={total}
            page={page}
            pages={pages}
            categories={categories}
            facets={facets}
            basePath="/shop"
            searchParams={searchParams}
          />
        </Suspense>
      </div>
    </>
  );
}
