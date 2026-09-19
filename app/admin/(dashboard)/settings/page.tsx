import type { Metadata } from "next";
import { getStoreSettings } from "@/lib/data/settings";
import { AdminCard, AdminPage } from "@/components/admin/AdminShell";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { FaqEditor } from "@/components/admin/FaqEditor";

export const metadata: Metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  const settings = await getStoreSettings();
  const initial = settings as unknown as Record<string, unknown>;

  return (
    <AdminPage
      title="Store settings"
      description="Homepage copy, contact details, payments and the custom cake engine — all editable without touching code."
    >
      <div className="space-y-6">
        <AdminCard title="Brand & contact">
          <SettingsForm
            initial={initial}
            fields={[
              { name: "brand.name", label: "Business name", type: "text" },
              { name: "brand.location", label: "City", type: "text" },
              {
                name: "brand.tagline",
                label: "Tagline",
                type: "text",
                colSpan: 2,
              },
              { name: "brand.phone", label: "Phone", type: "text" },
              {
                name: "brand.whatsapp",
                label: "WhatsApp number",
                type: "text",
                hint: "Digits only, with country code. e.g. 918562848811",
              },
              { name: "brand.email", label: "Email", type: "text" },
              { name: "brand.instagram", label: "Instagram URL", type: "text" },
              {
                name: "brand.instagramHandle",
                label: "Instagram handle",
                type: "text",
              },
              {
                name: "brand.addressLines",
                label: "Address",
                type: "list",
                hint: "One line per row.",
                rows: 3,
              },
            ]}
          />
        </AdminCard>

        <AdminCard
          title="Announcement bar"
          description="The strip above the header."
        >
          <SettingsForm
            initial={initial}
            fields={[
              {
                name: "announcement.enabled",
                label: "Show the announcement bar",
                type: "checkbox",
              },
              {
                name: "announcement.text",
                label: "Message",
                type: "text",
                colSpan: 2,
              },
              {
                name: "announcement.link",
                label: "Link (optional)",
                type: "text",
                colSpan: 2,
                placeholder: "/shop",
              },
            ]}
          />
        </AdminCard>

        <AdminCard title="Homepage hero">
          <SettingsForm
            initial={initial}
            fields={[
              { name: "hero.eyebrow", label: "Eyebrow", type: "text" },
              { name: "hero.ribbon", label: "Ribbon line", type: "text" },
              {
                name: "hero.headingLead",
                label: "Heading",
                type: "text",
                hint: 'The plain part, e.g. "Every bite has"',
              },
              {
                name: "hero.headingEmphasis",
                label: "Heading emphasis",
                type: "text",
                hint: 'Shown in coral, e.g. "a story."',
              },
              {
                name: "hero.description",
                label: "Description",
                type: "textarea",
              },
              {
                name: "hero.primaryCta.label",
                label: "Primary button label",
                type: "text",
              },
              {
                name: "hero.primaryCta.href",
                label: "Primary button link",
                type: "text",
              },
              {
                name: "hero.secondaryCta.label",
                label: "Secondary button label",
                type: "text",
              },
              {
                name: "hero.secondaryCta.href",
                label: "Secondary button link",
                type: "text",
              },
            ]}
          />
        </AdminCard>

        <AdminCard
          title="Homepage sections"
          description="Section headings and the scrolling ribbon."
        >
          <SettingsForm
            initial={initial}
            fields={[
              {
                name: "homepage.marquee",
                label: "Scrolling ribbon items",
                type: "list",
                hint: "One per row.",
                rows: 6,
              },
              {
                name: "homepage.collectionsHeading",
                label: "Collections heading",
                type: "text",
              },
              {
                name: "homepage.collectionsSubheading",
                label: "Collections subheading",
                type: "textarea",
              },
              {
                name: "homepage.galleryHeading",
                label: "Gallery heading",
                type: "text",
              },
              {
                name: "homepage.gallerySubheading",
                label: "Gallery subheading",
                type: "text",
              },
              {
                name: "homepage.philosophyHeading",
                label: "Philosophy heading",
                type: "text",
              },
              {
                name: "homepage.philosophyQuote",
                label: "Philosophy quote",
                type: "textarea",
              },
              {
                name: "homepage.philosophyBody",
                label: "Philosophy body",
                type: "textarea",
              },
            ]}
          />
        </AdminCard>

        <AdminCard
          title="Custom cake engine"
          description="How the cake builder prices and behaves."
        >
          <SettingsForm
            initial={initial}
            fields={[
              {
                name: "customCake.mode",
                label: "Order mode",
                type: "select",
                colSpan: 2,
                options: [
                  {
                    value: "instant",
                    label: "Instant checkout — customers add to cart and pay",
                  },
                  {
                    value: "approval",
                    label: "Approval required — you review and quote first",
                  },
                ],
                hint: "Instant mode sells straight from the builder. Approval mode collects the design and sends it to Custom cakes for a quote.",
              },
              {
                name: "customCake.basePricePerKg",
                label: "Base price per kg (₹)",
                type: "price",
              },
              {
                name: "customCake.minLeadHours",
                label: "Minimum lead time (hours)",
                type: "number",
              },
              {
                name: "customCake.minWeightKg",
                label: "Minimum weight (kg)",
                type: "number",
              },
              {
                name: "customCake.maxWeightKg",
                label: "Maximum weight (kg)",
                type: "number",
              },
              {
                name: "customCake.rushWindowHours",
                label: "Rush window (hours)",
                type: "number",
                hint: "Orders inside this window get the rush pricing rule.",
              },
              {
                name: "customCake.maxReferenceImages",
                label: "Max reference images",
                type: "number",
              },
              {
                name: "customCake.maxImageSizeMb",
                label: "Max image size (MB)",
                type: "number",
              },
              {
                name: "customCake.heroEyebrow",
                label: "Builder page eyebrow",
                type: "text",
              },
              {
                name: "customCake.heroHeading",
                label: "Builder page heading",
                type: "text",
              },
              {
                name: "customCake.heroDescription",
                label: "Builder page description",
                type: "textarea",
              },
              {
                name: "customCake.checklist",
                label: "Checklist items",
                type: "list",
                rows: 6,
              },
            ]}
          />
        </AdminCard>

        <AdminCard title="Payments">
          <SettingsForm
            initial={initial}
            fields={[
              {
                name: "payments.manualEnabled",
                label: "Accept manual QR payments",
                type: "checkbox",
              },
              {
                name: "payments.manualQrCode",
                label: "Payment QR code",
                type: "image",
              },
              {
                name: "payments.manualInstructions",
                label: "QR payment instructions",
                type: "textarea",
                rows: 3,
              },
              {
                name: "payments.razorpayEnabled",
                label: "Accept online payment (Razorpay)",
                type: "checkbox",
              },
              {
                name: "payments.codEnabled",
                label: "Accept cash on delivery",
                type: "checkbox",
              },
              {
                name: "payments.codMaxAmount",
                label: "Cash on delivery limit (₹)",
                type: "price",
                hint: "Orders above this must be paid online. 0 removes the limit.",
              },
            ]}
          />
        </AdminCard>

        <AdminCard title="SEO">
          <SettingsForm
            initial={initial}
            fields={[
              {
                name: "seo.defaultTitle",
                label: "Default title",
                type: "text",
                colSpan: 2,
              },
              {
                name: "seo.defaultDescription",
                label: "Default description",
                type: "textarea",
              },
              {
                name: "seo.ogImage",
                label: "Social share image",
                type: "image",
              },
            ]}
          />
        </AdminCard>

        <AdminCard
          title="Policies"
          description="Shown at /policies/… and linked from the footer."
        >
          <SettingsForm
            initial={initial}
            fields={[
              {
                name: "policies.privacy",
                label: "Privacy policy",
                type: "textarea",
                rows: 6,
              },
              {
                name: "policies.terms",
                label: "Terms",
                type: "textarea",
                rows: 6,
              },
              {
                name: "policies.shipping",
                label: "Shipping & delivery",
                type: "textarea",
                rows: 6,
              },
              {
                name: "policies.cancellation",
                label: "Cancellation",
                type: "textarea",
                rows: 6,
              },
              {
                name: "policies.refund",
                label: "Refunds",
                type: "textarea",
                rows: 6,
              },
            ]}
          />
        </AdminCard>

        <AdminCard
          title="Frequently asked questions"
          description="Drag to reorder. Shown on the homepage, cake builder and contact page."
        >
          <FaqEditor initial={settings.faqs} />
        </AdminCard>
      </div>
    </AdminPage>
  );
}
