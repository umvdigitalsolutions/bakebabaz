import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStoreSettings } from "@/lib/data/settings";
import { BreadcrumbJsonLd } from "@/components/shared/JsonLd";

const POLICIES = {
  privacy: { key: "privacy", title: "Privacy Policy" },
  terms: { key: "terms", title: "Terms of Service" },
  shipping: { key: "shipping", title: "Shipping & Delivery" },
  cancellation: { key: "cancellation", title: "Cancellation Policy" },
  refund: { key: "refund", title: "Refund Policy" },
} as const;

type Slug = keyof typeof POLICIES;

// An own-property check, so "constructor" or "toString" can't resolve to
// something inherited from Object.prototype.
function findPolicy(slug: string) {
  return Object.hasOwn(POLICIES, slug) ? POLICIES[slug as Slug] : undefined;
}

export function generateStaticParams() {
  return Object.keys(POLICIES).map((slug) => ({ slug }));
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const policy = findPolicy(slug);
  if (!policy) return { title: "Policy not found" };
  return {
    title: policy.title,
    description: `${policy.title} for Bake Baba'z, Bikaner.`,
    alternates: { canonical: `/policies/${slug}` },
  };
}

export default async function PolicyPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const policy = findPolicy(slug);
  if (!policy) notFound();

  const settings = await getStoreSettings();
  const body = settings.policies[policy.key];

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: policy.title, href: `/policies/${slug}` },
        ]}
      />

      <div className="wrap max-w-[760px] pt-14 pb-24 sm:pt-20">
        <p className="eyebrow mb-4">Policies</p>
        <h1 className="display-2">{policy.title}</h1>

        <div className="prose-warm mt-8 text-[16.5px] whitespace-pre-line">
          {body?.trim() ? (
            body
          ) : (
            <p>
              This policy is being finalised. In the meantime, message us on
              WhatsApp at {settings.brand.phone} or email {settings.brand.email}{" "}
              and we&rsquo;ll answer any question directly.
            </p>
          )}
        </div>

        <p className="border-line text-muted mt-12 border-t pt-6 text-sm">
          Questions about this policy? Write to{" "}
          <a
            href={`mailto:${settings.brand.email}`}
            className="text-coral-dark font-semibold underline underline-offset-4"
          >
            {settings.brand.email}
          </a>
          .
        </p>
      </div>
    </>
  );
}
