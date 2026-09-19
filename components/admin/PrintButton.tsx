"use client";

import { Printer } from "lucide-react";

export function PrintButton({ label = "Print" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print inline-flex h-10 items-center gap-1.5 rounded-lg border border-[#16324f] bg-[#16324f] px-4 text-[13.5px] font-semibold text-white hover:bg-[#0f2439]"
    >
      <Printer className="size-4" />
      {label}
    </button>
  );
}
