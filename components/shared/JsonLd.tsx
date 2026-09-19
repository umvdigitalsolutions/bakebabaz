import type { StoreSettingsData } from "@/lib/data/settings";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

/** Structured-data consumers expect absolute URLs; uploads are site-relative. */
function absoluteUrl(url: string | undefined) {
  if (!url) return undefined;
  return url.startsWith("/") ? `${appUrl}${url}` : url;
}

/**
 * Structured data is emitted as a plain script tag. JSON.stringify output is
 * escaped so a `</script>` inside admin-authored copy can't break out.
 */
function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}

export function LocalBusinessJsonLd({
  settings,
}: {
  settings: StoreSettingsData;
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Bakery",
        name: settings.brand.name,
        description: settings.seo.defaultDescription,
        url: appUrl,
        telephone: settings.brand.phone,
        email: settings.brand.email,
        image: absoluteUrl(settings.hero.images?.[0]?.url),
        priceRange: "₹₹",
        servesCuisine: "Bakery, Desserts",
        address: {
          "@type": "PostalAddress",
          streetAddress: settings.brand.addressLines[0],
          addressLocality: settings.brand.location,
          addressRegion: "Rajasthan",
          addressCountry: "IN",
        },
        sameAs: [settings.brand.instagram].filter(Boolean),
      }}
    />
  );
}

export function ProductJsonLd({
  product,
  url,
}: {
  product: {
    name: string;
    description?: string;
    images?: { url: string }[];
    price: number;
    inStock: boolean;
    rating?: { average: number; count: number };
    sku?: string;
    categoryName?: string;
  };
  url: string;
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: product.description,
        image: product.images?.map((image) => absoluteUrl(image.url)),
        sku: product.sku,
        category: product.categoryName,
        brand: { "@type": "Brand", name: "Bake Baba'z" },
        offers: {
          "@type": "Offer",
          url,
          priceCurrency: "INR",
          price: product.price,
          availability: product.inStock
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
        },
        ...(product.rating && product.rating.count > 0
          ? {
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: product.rating.average,
                reviewCount: product.rating.count,
              },
            }
          : {}),
      }}
    />
  );
}

export function BreadcrumbJsonLd({
  items,
}: {
  items: { name: string; href: string }[];
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          item: `${appUrl}${item.href}`,
        })),
      }}
    />
  );
}

export function FaqJsonLd({
  faqs,
}: {
  faqs: { question: string; answer: string }[];
}) {
  if (!faqs.length) return null;
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer },
        })),
      }}
    />
  );
}
