"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, Search, ShoppingBag } from "lucide-react";
import { InstagramIcon } from "@/components/ui/icons";
import { Logo } from "./Logo";
import { primaryNav } from "./nav-links";
import { MobileNav } from "./MobileNav";
import { SearchOverlay } from "./SearchOverlay";
import { useCart } from "@/components/cart/CartProvider";
import { cn } from "@/lib/utils";

export function Header({
  brandName,
  location,
}: {
  brandName: string;
  location: string;
}) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { count, openDrawer } = useCart();

  // The header starts flush with the page and only grows a rule once you scroll.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Cmd/Ctrl-K opens search, the way shoppers expect from any modern store.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const iconButton =
    "grid size-10 place-items-center rounded-full text-cocoa transition-colors hover:bg-cream";

  return (
    <>
      <header
        className={cn(
          "bg-paper/90 sticky top-0 z-[100] border-b border-transparent backdrop-blur-lg transition-[border-color,box-shadow] duration-300",
          scrolled && "border-line shadow-[0_8px_30px_rgba(61,37,33,.06)]",
        )}
      >
        <div className="wrap flex h-[74px] items-center justify-between gap-6 lg:h-[86px]">
          <Logo brandName={brandName} location={location} />

          <nav
            aria-label="Primary"
            className="hidden items-center gap-8 xl:flex"
          >
            {primaryNav.map((link) => {
              const active =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className="group text-cocoa hover:text-coral-dark relative py-2 text-sm font-medium transition-colors"
                >
                  {link.label}
                  <span
                    className={cn(
                      "bg-coral absolute inset-x-0 bottom-0.5 h-0.5 origin-left scale-x-0 transition-transform duration-200 group-hover:scale-x-100",
                      active && "scale-x-100",
                    )}
                    aria-hidden
                  />
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1">
            <a
              href="https://www.instagram.com/bake.baba/"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(iconButton, "hidden sm:grid")}
              aria-label="Follow Bake Baba'z on Instagram"
              title="Instagram"
            >
              <InstagramIcon className="size-[19px]" />
            </a>

            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className={iconButton}
              aria-label="Search products"
            >
              <Search className="size-[19px]" />
            </button>

            <button
              type="button"
              onClick={openDrawer}
              className={cn(iconButton, "relative")}
              aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`}
            >
              <ShoppingBag className="size-[19px]" />
              {count > 0 ? (
                <span className="bg-coral absolute -top-0.5 -right-0.5 grid min-w-[19px] place-items-center rounded-full px-1 text-[10.5px] leading-[19px] font-bold text-white">
                  {count > 99 ? "99+" : count}
                </span>
              ) : null}
            </button>

            <Link
              href="/shop"
              className="group border-cocoa bg-cocoa ml-2 hidden min-h-[46px] items-center gap-2 rounded-full border px-5 text-[13px] font-bold text-white transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(61,37,33,.16)] lg:inline-flex"
            >
              Order now
              <span
                aria-hidden
                className="transition-transform duration-200 group-hover:translate-x-0.5"
              >
                →
              </span>
            </Link>

            <button
              type="button"
              onClick={() => setNavOpen(true)}
              className={cn(iconButton, "xl:hidden")}
              aria-label="Open menu"
            >
              <Menu className="size-[21px]" />
            </button>
          </div>
        </div>
      </header>

      <MobileNav
        open={navOpen}
        onClose={() => setNavOpen(false)}
        brandName={brandName}
        location={location}
      />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
