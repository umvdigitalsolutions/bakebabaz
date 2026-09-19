"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { X } from "lucide-react";
import { Logo } from "./Logo";
import { primaryNav } from "./nav-links";
import { ButtonLink } from "@/components/ui/Button";

export function MobileNav({
  open,
  onClose,
  brandName,
  location,
}: {
  open: boolean;
  onClose: () => void;
  brandName: string;
  location: string;
}) {
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-paper fixed inset-0 z-[210] flex flex-col xl:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
        >
          <div className="wrap flex h-[74px] flex-none items-center justify-between">
            <Logo brandName={brandName} location={location} />
            <button
              type="button"
              onClick={onClose}
              aria-label="Close menu"
              className="border-line text-cocoa grid size-10 place-items-center rounded-full border"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="wrap flex-1 overflow-y-auto pb-10">
            <nav aria-label="Mobile" className="border-line mt-4 border-t">
              {primaryNav.map((link, index) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.04 * index, duration: 0.32 }}
                  className="border-line border-b"
                >
                  <Link
                    href={link.href}
                    onClick={onClose}
                    className="font-display flex items-center justify-between py-5 text-[30px] tracking-[-0.03em]"
                  >
                    {link.label}
                    <span className="text-coral text-lg" aria-hidden>
                      →
                    </span>
                  </Link>
                </motion.div>
              ))}
            </nav>

            <ButtonLink
              href="/shop"
              variant="coral"
              fullWidth
              className="mt-6"
              onClick={onClose}
            >
              Order now →
            </ButtonLink>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
