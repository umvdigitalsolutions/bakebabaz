"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[300] grid place-items-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="bg-cocoa/40 absolute inset-0 backdrop-blur-[2px]"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "border-line relative w-full max-w-lg rounded-2xl border bg-white p-6 shadow-[0_24px_60px_rgba(76,43,34,.2)]",
              className,
            )}
          >
            {title ? (
              <h2 className="font-display text-2xl tracking-[-0.02em]">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className="text-muted mt-2 text-sm">{description}</p>
            ) : null}
            {children}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

/** Guards every destructive admin action. */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Delete",
  loading,
  variant = "danger",
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  loading?: boolean;
  variant?: "danger" | "default";
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
    >
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" size="sm" onClick={onClose} type="button">
          Cancel
        </Button>
        <Button
          size="sm"
          type="button"
          loading={loading}
          onClick={onConfirm}
          className={
            variant === "danger"
              ? "border-[#b3261e] bg-[#b3261e] text-white hover:bg-[#8f1d17]"
              : undefined
          }
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
