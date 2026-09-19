import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { getStoreSettings } from "@/lib/data/settings";
import { ContactForm } from "@/components/store/ContactForm";
import { Accordion } from "@/components/ui/Accordion";
import { Reveal } from "@/components/ui/Reveal";
import { InstagramIcon } from "@/components/ui/icons";
import {
  BreadcrumbJsonLd,
  LocalBusinessJsonLd,
} from "@/components/shared/JsonLd";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Talk to Bake Baba'z in Bikaner — WhatsApp, phone, email and our address. Questions about an order, a custom cake, or bulk gifting.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const settings = await getStoreSettings();
  const { brand } = settings;
  const faqs = settings.faqs.filter((faq) => faq.active).slice(0, 5);

  return (
    <>
      <LocalBusinessJsonLd settings={settings} />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Contact", href: "/contact" },
        ]}
      />

      <div className="wrap pt-14 pb-24 sm:pt-20">
        <Reveal className="max-w-[700px]">
          <p className="eyebrow mb-4">Say hello</p>
          <h1 className="display-1 text-balance">
            We&rsquo;re easiest to reach on WhatsApp.
          </h1>
          <p className="lede mt-6">
            Questions about an order, a design you&rsquo;re picturing, or a bulk
            gifting list — message us and a real person will reply.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-12 lg:grid-cols-[1fr_340px] lg:gap-16">
          <div>
            <ContactForm
              whatsappNumber={brand.whatsapp}
              brandName={brand.name}
            />
          </div>

          <aside className="space-y-4">
            <ContactCard
              icon={<Phone className="size-4" />}
              title="Phone & WhatsApp"
              href={`tel:${brand.phone.replace(/\s/g, "")}`}
              value={brand.phone}
            />
            <ContactCard
              icon={<Mail className="size-4" />}
              title="Email"
              href={`mailto:${brand.email}`}
              value={brand.email}
            />
            <ContactCard
              icon={<InstagramIcon className="size-4" />}
              title="Instagram"
              href={brand.instagram}
              value={brand.instagramHandle}
            />
            <div className="border-line rounded-[20px] border bg-white p-5">
              <p className="text-muted flex items-center gap-2 text-[11px] font-bold tracking-[0.12em] uppercase">
                <MapPin className="text-coral size-3.5" />
                Where to find us
              </p>
              <p className="mt-3 text-sm leading-relaxed">
                {brand.addressLines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </p>
            </div>
            <div className="border-line bg-cream rounded-[20px] border p-5">
              <p className="text-muted flex items-center gap-2 text-[11px] font-bold tracking-[0.12em] uppercase">
                <Clock className="text-coral size-3.5" />
                Ordering notice
              </p>
              <p className="text-muted mt-3 text-sm leading-relaxed">
                Most cakes need {settings.delivery.minLeadHours} hours&rsquo;
                notice; custom designs need {settings.customCake.minLeadHours}{" "}
                hours or more. The date picker only ever offers slots we can
                actually meet.
              </p>
            </div>
          </aside>
        </div>

        {faqs.length > 0 ? (
          <section className="mt-20">
            <h2 className="display-2 mb-8">Before you write…</h2>
            <Accordion
              items={faqs.map((faq) => ({
                question: faq.question,
                answer: faq.answer,
              }))}
            />
          </section>
        ) : null}
      </div>
    </>
  );
}

function ContactCard({
  icon,
  title,
  href,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  href: string;
  value: string;
}) {
  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel="noopener noreferrer"
      className="border-line hover:border-coral/40 block rounded-[20px] border bg-white p-5 transition-colors"
    >
      <p className="text-muted flex items-center gap-2 text-[11px] font-bold tracking-[0.12em] uppercase">
        <span className="text-coral">{icon}</span>
        {title}
      </p>
      <p className="mt-2 font-medium">{value}</p>
    </a>
  );
}
