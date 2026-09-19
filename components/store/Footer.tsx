import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { InstagramIcon, WhatsAppIcon } from "@/components/ui/icons";
import { Logo } from "./Logo";
import { footerNav, policyNav } from "./nav-links";
import type { StoreSettingsData } from "@/lib/data/settings";
import { whatsappLink, whatsappMessages } from "@/lib/whatsapp";

export function Footer({ settings }: { settings: StoreSettingsData }) {
  const { brand } = settings;
  const year = new Date().getFullYear();

  return (
    <footer className="border-line bg-cream mt-auto border-t">
      <div className="wrap section-y-sm">
        <div className="border-line flex flex-col gap-9 border-b pb-9 md:flex-row md:items-center md:justify-between">
          <div>
            <Logo brandName={brand.name} location={brand.location} />
            <p className="font-display text-cocoa mt-4 max-w-sm text-[22px] leading-snug tracking-[-0.02em]">
              {brand.tagline}
            </p>
          </div>
          <nav
            aria-label="Footer"
            className="text-muted flex flex-wrap gap-x-7 gap-y-3 text-sm font-semibold"
          >
            {footerNav.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="hover:text-coral-dark transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <a
              href={brand.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-coral-dark transition-colors"
            >
              Instagram ↗
            </a>
          </nav>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-8 py-9 lg:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <h3 className="text-muted text-[11px] font-bold tracking-[0.14em] uppercase">
              Visit us
            </h3>
            <p className="mt-3 flex items-start gap-2.5 text-sm leading-relaxed">
              <MapPin className="text-coral mt-0.5 size-4 flex-none" />
              <span>
                {brand.addressLines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </span>
            </p>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <h3 className="text-muted text-[11px] font-bold tracking-[0.14em] uppercase">
              Talk to us
            </h3>
            <ul className="mt-3 space-y-2.5 text-sm">
              <li>
                <a
                  href={`tel:${brand.phone.replace(/\s/g, "")}`}
                  className="hover:text-coral-dark flex items-center gap-2.5 transition-colors"
                >
                  <Phone className="text-coral size-4 flex-none" />
                  {brand.phone}
                </a>
              </li>
              <li>
                <a
                  href={whatsappLink(
                    brand.whatsapp,
                    whatsappMessages.general(brand.name),
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-coral-dark flex items-center gap-2.5 transition-colors"
                >
                  <WhatsAppIcon className="text-coral size-4 flex-none" />
                  WhatsApp
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${brand.email}`}
                  className="hover:text-coral-dark flex items-center gap-2.5 transition-colors"
                >
                  <Mail className="text-coral size-4 flex-none" />
                  {brand.email}
                </a>
              </li>
              <li>
                <a
                  href={brand.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-coral-dark flex items-center gap-2.5 transition-colors"
                >
                  <InstagramIcon className="text-coral size-4 flex-none" />
                  {brand.instagramHandle}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-muted text-[11px] font-bold tracking-[0.14em] uppercase">
              Policies
            </h3>
            <ul className="mt-3 space-y-2.5 text-sm">
              {policyNav.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="hover:text-coral-dark transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-muted text-[11px] font-bold tracking-[0.14em] uppercase">
              Order &amp; help
            </h3>
            <ul className="mt-3 space-y-2.5 text-sm">
              <li>
                <Link
                  href="/shop"
                  className="hover:text-coral-dark transition-colors"
                >
                  Browse bakes
                </Link>
              </li>
              <li>
                <a
                  href={whatsappLink(
                    brand.whatsapp,
                    whatsappMessages.general(brand.name),
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-coral-dark transition-colors"
                >
                  Order on WhatsApp
                </a>
              </li>
              <li>
                <Link
                  href="/customize-your-cake"
                  className="hover:text-coral-dark transition-colors"
                >
                  Design a cake
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="hover:text-coral-dark transition-colors"
                >
                  Help & contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-line text-muted border-t pt-6 text-xs">
          <p>
            © {year} {brand.name}. Made with love in {brand.location}.
          </p>
        </div>
      </div>
    </footer>
  );
}
