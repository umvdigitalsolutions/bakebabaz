import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getProductBySlug,
  getProductReviews,
  getRelatedProducts,
} from "@/lib/data/catalog";
import { getStoreSettings } from "@/lib/data/settings";
import { getActiveSlots } from "@/lib/delivery/validate";
import { startingPrice } from "@/lib/pricing/product";
import { pageTitle } from "@/lib/utils";
import { ProductGallery } from "@/components/store/product/ProductGallery";
import {
  ProductPurchasePanel,
  type PurchaseProduct,
} from "@/components/store/product/ProductPurchasePanel";
import { ProductDetails } from "@/components/store/product/ProductDetails";
import { ReviewsSection } from "@/components/store/product/ReviewsSection";
import { ProductGrid } from "@/components/store/ProductGrid";
import { SectionHead } from "@/components/store/SectionHead";
import { BreadcrumbJsonLd, ProductJsonLd } from "@/components/shared/JsonLd";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { slug } = await props.params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };

  const title = product.seo?.title || product.name;
  const description =
    product.seo?.description ||
    product.shortDescription ||
    `Order ${product.name} online from Bake Baba'z, Bikaner.`;

  return {
    title: pageTitle(title),
    description,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      type: "website",
      title,
      description,
      images: product.images?.map((image) => image.url).slice(0, 3),
    },
  };
}

export default async function ProductPage(props: Props) {
  const { slug } = await props.params;
  const product = await getProductBySlug(slug);
  if (!product || product.status !== "active") notFound();

  const category = product.category as unknown as {
    _id: string;
    name: string;
    slug: string;
    prepTimeHours: number;
  };

  const [settings, slots, reviews, related] = await Promise.all([
    getStoreSettings(),
    getActiveSlots(),
    getProductReviews(String(product._id)),
    getRelatedProducts(String(category._id), String(product._id), 4),
  ]);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const purchaseProduct: PurchaseProduct = {
    id: String(product._id),
    name: product.name,
    slug: product.slug,
    basePrice: product.basePrice,
    salePrice: product.salePrice,
    weights: product.weights ?? [],
    flavours: product.flavours ?? [],
    fillings: product.fillings ?? [],
    shapes: product.shapes ?? [],
    eggOptions: product.eggOptions ?? ["eggless"],
    addOns: (
      product.addOns as unknown as {
        _id: string;
        name: string;
        price: number;
        group: string;
        description?: string;
        active: boolean;
      }[]
    )
      .filter((addOn) => addOn.active)
      .map((addOn) => ({
        id: String(addOn._id),
        name: addOn.name,
        price: addOn.price,
        group: addOn.group,
        description: addOn.description,
      })),
    allowMessage: product.allowMessage,
    customisable: product.customisable,
    prepTimeHours: Math.max(
      product.prepTimeHours ?? 6,
      category.prepTimeHours ?? 0,
    ),
    unlimitedStock: product.unlimitedStock,
    stock: product.stock,
    rating: product.rating ?? { average: 0, count: 0 },
    status: product.status,
  };

  return (
    <>
      <ProductJsonLd
        url={`${appUrl}/product/${product.slug}`}
        product={{
          name: product.name,
          description: product.shortDescription || product.description,
          images: product.images,
          price: startingPrice(product),
          inStock: product.unlimitedStock || product.stock > 0,
          rating: product.rating,
          sku: product.sku,
          categoryName: category.name,
        }}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Shop", href: "/shop" },
          { name: category.name, href: `/shop/${category.slug}` },
          { name: product.name, href: `/product/${product.slug}` },
        ]}
      />

      <div className="wrap pt-8 pb-24 sm:pb-28">
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
            <li>
              <Link
                href={`/shop/${category.slug}`}
                className="hover:text-coral-dark"
              >
                {category.name}
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li className="text-cocoa">{product.name}</li>
          </ol>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,480px)] lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <ProductGallery
              images={product.images ?? []}
              productName={product.name}
            />
          </div>

          <div>
            <p className="text-muted text-[11px] font-bold tracking-[0.14em] uppercase">
              {category.name}
            </p>
            <h1 className="display-2 mt-3 text-balance">{product.name}</h1>
            {product.shortDescription ? (
              <p className="lede mt-4">{product.shortDescription}</p>
            ) : null}

            <div className="mt-8">
              <ProductPurchasePanel
                product={purchaseProduct}
                slots={slots.map((slot) => ({
                  label: slot.label,
                  startTime: slot.startTime,
                  surcharge: slot.surcharge,
                }))}
                blockedDates={settings.delivery.blockedDates}
                maxDaysAhead={settings.delivery.maxDaysAhead}
                brandName={settings.brand.name}
                whatsappNumber={settings.brand.whatsapp}
                referenceTime={new Date().toISOString()}
              />
            </div>
          </div>
        </div>

        <div className="mt-20 max-w-[860px]">
          <ProductDetails
            tabs={[
              {
                id: "description",
                label: "Description",
                content: product.description,
              },
              {
                id: "ingredients",
                label: "Ingredients",
                content: product.ingredients,
              },
              {
                id: "storage",
                label: "Storage",
                content: product.storageInstructions,
              },
              {
                id: "allergens",
                label: "Allergens",
                content: product.allergens,
              },
              {
                id: "delivery",
                label: "Delivery",
                content: product.deliveryInfo,
              },
              {
                id: "customisation",
                label: "Customisation",
                content: product.customisable
                  ? "This bake can be personalised — choose your flavour, filling, shape and message above. For a design that’s entirely your own, open Customize in the menu and our cake builder will price it live as you build."
                  : "This item is made to a fixed recipe and isn’t customisable. For a bespoke design, open Customize in the menu to use our cake builder.",
              },
            ]}
          />
        </div>

        <div className="mt-20">
          <ReviewsSection
            reviews={reviews as never}
            summary={product.rating ?? { average: 0, count: 0 }}
          />
        </div>

        {related.length > 0 ? (
          <section className="mt-24">
            <SectionHead
              eyebrow="You might also like"
              title={`More from ${category.name}`}
            />
            <ProductGrid products={related} priorityCount={0} />
          </section>
        ) : null}
      </div>
    </>
  );
}
