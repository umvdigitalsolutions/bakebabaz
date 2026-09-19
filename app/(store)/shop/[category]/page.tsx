import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  getCategories,
  getCategoryBySlug,
  getProducts,
  getShopFacets,
} from "@/lib/data/catalog";
import { parseShopParams } from "@/lib/shop-params";
import { pageTitle } from "@/lib/utils";
import { ShopView } from "@/components/store/shop/ShopView";
import { ProductGridSkeleton } from "@/components/ui/Skeleton";
import { BreadcrumbJsonLd } from "@/components/shared/JsonLd";

type SearchParams = Record<string, string | string[] | undefined>;

type Props = {
  params: Promise<{ category: string }>;
  searchParams: Promise<SearchParams>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { category: slug } = await props.params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Collection not found" };

  const title = category.seo?.title || category.name;
  return {
    title: pageTitle(title),
    description: category.seo?.description || category.description,
    alternates: { canonical: `/shop/${category.slug}` },
    openGraph: {
      title,
      description: category.seo?.description || category.description,
      images: category.image?.url ? [category.image.url] : undefined,
    },
  };
}

export default async function CategoryPage(props: Props) {
  const [{ category: slug }, searchParams] = await Promise.all([
    props.params,
    props.searchParams,
  ]);

  // Resolved before any Suspense boundary renders, so an unknown collection
  // gets a real 404 status instead of a streamed 200.
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Shop", href: "/shop" },
          { name: category.name, href: `/shop/${category.slug}` },
        ]}
      />

      <div className="wrap pt-8 pb-20 sm:pt-10">
        <nav aria-label="Breadcrumb" className="text-muted mb-8 text-sm">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/" className="hover:text-coral-dark">
                Home
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link href="/shop" className="hover:text-coral-dark">
                Shop
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li className="text-cocoa">{category.name}</li>
          </ol>
        </nav>

        <header className="bg-cream relative mb-10 overflow-hidden rounded-[26px] sm:mb-14">
          {category.image?.url ? (
            <Image
              src={category.image.url}
              alt=""
              fill
              sizes="100vw"
              className="object-cover opacity-30"
              preload
            />
          ) : null}
          <div className="relative px-6 py-12 sm:px-12 sm:py-16">
            <p className="eyebrow mb-4">Collection</p>
            <h1 className="display-2 max-w-[620px] text-balance">
              {category.name}
            </h1>
            {category.description ? (
              <p className="lede mt-4 max-w-[560px]">{category.description}</p>
            ) : null}
            {category.prepTimeHours ? (
              <p className="text-muted mt-5 text-sm font-semibold">
                Needs at least {category.prepTimeHours} hours&rsquo; notice
              </p>
            ) : null}
          </div>
        </header>

        <Suspense fallback={<ProductGridSkeleton />}>
          <CategoryListing slug={slug} searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}

async function CategoryListing({
  slug,
  searchParams,
}: {
  slug: string;
  searchParams: SearchParams;
}) {
  const filters = parseShopParams(searchParams, slug);
  const [{ products, total, page, pages }, categories, facets] =
    await Promise.all([
      getProducts(filters),
      getCategories({ withCounts: true }),
      getShopFacets(slug),
    ]);

  return (
    <ShopView
      products={products}
      total={total}
      page={page}
      pages={pages}
      categories={categories}
      facets={facets}
      activeCategorySlug={slug}
      basePath={`/shop/${slug}`}
      searchParams={searchParams}
    />
  );
}
