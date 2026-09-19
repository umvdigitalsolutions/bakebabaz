import { cn } from "@/lib/utils";

export function AdminPage({
  title,
  description,
  actions,
  children,
  className,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[1400px] px-4 py-6 lg:px-8",
        className,
      )}
    >
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4 pl-12 lg:pl-0">
        <div>
          <h1 className="text-[22px] font-semibold">{title}</h1>
          {description ? (
            <p className="mt-1 text-[13.5px] text-[#64748b]">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </header>
      {children}
    </div>
  );
}

export function AdminCard({
  title,
  description,
  actions,
  children,
  className,
  padded = true,
}: {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section className={cn("admin-card", className)}>
      {title ? (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e3e8ef] px-5 py-4">
          <div>
            <h2 className="text-[15px] font-semibold">{title}</h2>
            {description ? (
              <p className="mt-0.5 text-[12.5px] text-[#64748b]">
                {description}
              </p>
            ) : null}
          </div>
          {actions}
        </header>
      ) : null}
      <div className={padded ? "p-5" : undefined}>{children}</div>
    </section>
  );
}

export function AdminButton({
  variant = "primary",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md";
}) {
  const variants = {
    primary: "bg-[#16324f] text-white hover:bg-[#0f2439] border-[#16324f]",
    secondary: "bg-white text-[#131a24] hover:bg-[#f1f5f9] border-[#e3e8ef]",
    danger: "bg-[#b3261e] text-white hover:bg-[#8f1d17] border-[#b3261e]",
    ghost:
      "bg-transparent text-[#475569] hover:bg-[#eef2f6] border-transparent",
  } as const;

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg border font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-55",
        size === "sm" ? "h-8 px-3 text-[12.5px]" : "h-10 px-4 text-[13.5px]",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}

const STATUS_STYLES: Record<string, string> = {
  ORDER_PLACED: "bg-[#eef2f6] text-[#475569]",
  PAYMENT_CONFIRMED: "bg-[#e0f2fe] text-[#075985]",
  CONFIRMED: "bg-[#e0f2fe] text-[#075985]",
  BAKING: "bg-[#fef3c7] text-[#92400e]",
  DECORATING: "bg-[#fce7f3] text-[#9d174d]",
  READY: "bg-[#ede9fe] text-[#5b21b6]",
  READY_FOR_PICKUP: "bg-[#ede9fe] text-[#5b21b6]",
  OUT_FOR_DELIVERY: "bg-[#dbeafe] text-[#1e40af]",
  DELIVERED: "bg-[#dcfce7] text-[#166534]",
  CANCELLED: "bg-[#fee2e2] text-[#991b1b]",
  PAID: "bg-[#dcfce7] text-[#166534]",
  PENDING: "bg-[#fef3c7] text-[#92400e]",
  COD_PENDING: "bg-[#eef2f6] text-[#475569]",
  FAILED: "bg-[#fee2e2] text-[#991b1b]",
  REFUNDED: "bg-[#f1f5f9] text-[#475569]",
  NEW: "bg-[#e0f2fe] text-[#075985]",
  UNDER_REVIEW: "bg-[#fef3c7] text-[#92400e]",
  NEEDS_CLARIFICATION: "bg-[#ffedd5] text-[#9a3412]",
  QUOTED: "bg-[#ede9fe] text-[#5b21b6]",
  APPROVED: "bg-[#dcfce7] text-[#166534]",
  PAYMENT_PENDING: "bg-[#fef3c7] text-[#92400e]",
  IN_PRODUCTION: "bg-[#fce7f3] text-[#9d174d]",
  COMPLETED: "bg-[#dcfce7] text-[#166534]",
  REJECTED: "bg-[#fee2e2] text-[#991b1b]",
};

export function StatusBadge({
  status,
  label,
}: {
  status: string;
  label?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap",
        STATUS_STYLES[status] ?? "bg-[#eef2f6] text-[#475569]",
      )}
    >
      {label ?? status.replace(/_/g, " ").toLowerCase()}
    </span>
  );
}

export function AdminEmpty({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-dashed border-[#cbd5e1] bg-[#f8fafc] px-6 py-12 text-center">
      <p className="font-semibold">{title}</p>
      {description ? (
        <p className="mx-auto mt-1.5 max-w-md text-[13.5px] text-[#64748b]">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
