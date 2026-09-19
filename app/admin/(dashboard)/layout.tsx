import { requireAdmin } from "@/lib/auth/guards";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Page-level guard. `proxy.ts` also blocks unauthenticated /admin requests
  // before they reach here, and every admin API re-checks independently.
  const admin = await requireAdmin();

  return (
    <div className="flex min-h-dvh">
      <AdminSidebar admin={admin} />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
