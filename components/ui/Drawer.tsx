"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

/** Slide-in panel used for the cart and mobile navigation. */
export function Drawer({
  open,
  onClose,
  title,
  side = "right",
  children,
  footer,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  side?: "right" | "left";
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
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
        <div className="fixed inset-0 z-[200]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
            className="bg-cocoa/35 absolute inset-0 backdrop-blur-[2px]"
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={typeof title === "string" ? title : "Panel"}
            initial={{ x: side === "right" ? "100%" : "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: side === "right" ? "100%" : "-100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
            className={cn(
              "bg-paper absolute inset-y-0 flex w-full max-w-[440px] flex-col shadow-[0_24px_60px_rgba(76,43,34,.2)]",
              side === "right" ? "right-0" : "left-0",
              className,
            )}
          >
            <header className="border-line flex items-center justify-between gap-4 border-b px-6 py-5">
              <div className="font-display text-xl tracking-[-0.02em]">
                {title}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="border-line text-cocoa hover:bg-cream grid size-9 place-items-center rounded-full border transition-colors"
              >
                <X className="size-4" />
              </button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
            {footer ? (
              <div className="border-line bg-paper border-t px-6 py-5">
                {footer}
              </div>
            ) : null}
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
