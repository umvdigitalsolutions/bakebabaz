import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getAdminSession } from "@/lib/auth/session";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false, nocache: true },
};

export default async function AdminLoginPage() {
  if (await getAdminSession()) redirect("/admin");

  return (
    <div className="grid min-h-dvh place-items-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="mx-auto grid size-11 place-items-center rounded-xl bg-[#16324f] text-lg font-semibold text-white">
            B
          </span>
          <h1 className="mt-4 text-xl font-semibold">
            Bake Baba&rsquo;z Admin
          </h1>
          <p className="mt-1 text-sm text-[#64748b]">
            Sign in to manage orders and the shop.
          </p>
        </div>

        <div className="admin-card p-6">
          <Suspense fallback={null}>
            <AdminLoginForm />
          </Suspense>
        </div>

        <p className="mt-6 text-center text-xs text-[#64748b]">
          Staff access only ·{" "}
          <Link href="/" className="underline underline-offset-2">
            Back to the shop
          </Link>
        </p>
      </div>
    </div>
  );
}
