"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  BadgePercent,
  CakeSlice,
  ChartNoAxesColumn,
  Image as ImageIcon,
  Images,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareQuote,
  Package,
  Settings,
  ShoppingCart,
  Sparkles,
  Star,
  Truck,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const SECTIONS = [
  {
    label: "Operations",
    links: [
      {
        href: "/admin",
        label: "Dashboard",
        icon: LayoutDashboard,
        exact: true,
      },
      { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
      { href: "/admin/custom-orders", label: "Custom cakes", icon: Sparkles },
    ],
  },
  {
    label: "Catalogue",
    links: [
      { href: "/admin/products", label: "Products", icon: Package },
      { href: "/admin/categories", label: "Categories", icon: CakeSlice },
      {
        href: "/admin/customizations",
        label: "Cake options",
        icon: ChartNoAxesColumn,
      },
      { href: "/admin/addons", label: "Add-ons", icon: Star },
    ],
  },
  {
    label: "Store",
    links: [
      { href: "/admin/customers", label: "Customers", icon: Users },
      { href: "/admin/coupons", label: "Coupons", icon: BadgePercent },
      { href: "/admin/delivery", label: "Delivery", icon: Truck },
      { href: "/admin/reviews", label: "Reviews", icon: MessageSquareQuote },
      { href: "/admin/banners", label: "Banners", icon: ImageIcon },
      { href: "/admin/images", label: "Website images", icon: Images },
      { href: "/admin/media", label: "Media", icon: ImageIcon },
      { href: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
];

export function AdminSidebar({
  admin,
}: {
  admin: { name: string; email: string; role: string };
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <span className="grid size-9 flex-none place-items-center rounded-lg bg-[#16324f] text-sm font-semibold text-white">
          B
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">Bake Baba&rsquo;z</p>
          <p className="text-[11px] tracking-[0.1em] text-[#94a3b8] uppercase">
            Admin
          </p>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
        {SECTIONS.map((section) => (
          <div key={section.label} className="mb-5">
            <p className="px-2 pb-2 text-[10.5px] font-bold tracking-[0.12em] text-[#94a3b8] uppercase">
              {section.label}
            </p>
            <ul className="space-y-0.5">
              {section.links.map((link) => {
                const active =
                  "exact" in link && link.exact
                    ? pathname === link.href
                    : pathname.startsWith(link.href);
                const Icon = link.icon;
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={() => setOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px] font-medium transition-colors",
                        active
                          ? "bg-[#16324f] text-white"
                          : "text-[#475569] hover:bg-[#eef2f6] hover:text-[#131a24]",
                      )}
                    >
                      <Icon className="size-4 flex-none" />
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-[#e3e8ef] p-3">
        <div className="mb-2 px-2">
          <p className="truncate text-[13px] font-semibold">{admin.name}</p>
          <p className="truncate text-[11px] text-[#94a3b8]">
            <span className="capitalize">{admin.role}</span> · {admin.email}
          </p>
        </div>
        <button
          type="button"
          onClick={async () => {
            await fetch("/api/admin/logout", { method: "POST" });
            toast.success("Signed out");
            router.push("/admin/login");
            router.refresh();
          }}
          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px] font-medium text-[#475569] transition-colors hover:bg-[#eef2f6]"
        >
          <LogOut className="size-4" />
          Sign out
        </button>
      </div>
    </nav>
  );

  return (
    <>
      <aside className="hidden w-[236px] flex-none border-r border-[#e3e8ef] bg-white lg:sticky lg:top-0 lg:block lg:h-dvh">
        {nav}
      </aside>

      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="fixed top-3 left-3 z-40 grid size-10 place-items-center rounded-lg border border-[#e3e8ef] bg-white lg:hidden"
      >
        <Menu className="size-5" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/35"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-[264px] bg-white shadow-xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="absolute top-4 right-3 grid size-8 place-items-center rounded-lg text-[#64748b]"
            >
              <X className="size-4" />
            </button>
            {nav}
          </div>
        </div>
      ) : null}
    </>
  );
}
