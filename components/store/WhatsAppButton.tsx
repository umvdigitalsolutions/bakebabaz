"use client";

import { useEffect, useState } from "react";
import { whatsappLink } from "@/lib/whatsapp";
import { WhatsAppIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

/**
 * Support only. Checkout never routes through WhatsApp — this is for questions
 * and custom-cake clarifications.
 */
export function WhatsAppButton({
  number,
  message,
  label = "Order on WhatsApp",
}: {
  number: string;
  message: string;
  label?: string;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 260);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <a
      href={whatsappLink(number, message)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className={cn(
        "fixed right-5 bottom-5 z-[90] hidden items-center gap-2.5 rounded-full bg-[#25D366] px-4 py-3 text-sm font-bold text-white shadow-[0_14px_34px_rgba(37,211,102,.36)] transition-all duration-300 hover:-translate-y-0.5 md:right-7 md:bottom-7 md:inline-flex",
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-4 opacity-0",
      )}
    >
      <WhatsAppIcon className="size-5" />
      <span className="hidden sm:inline">{label}</span>
    </a>
  );
}
