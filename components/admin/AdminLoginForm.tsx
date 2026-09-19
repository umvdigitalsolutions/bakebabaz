"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Lock } from "lucide-react";
import type { z } from "zod";
import { adminLoginSchema } from "@/lib/validation/auth";

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/admin";
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof adminLoginSchema>>({
    resolver: zodResolver(adminLoginSchema),
  });

  return (
    <form
      className="space-y-4"
      onSubmit={handleSubmit(async (values) => {
        setSubmitting(true);
        try {
          const response = await fetch("/api/admin/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(values),
          });
          const payload = await response.json();
          if (!response.ok || !payload?.ok) {
            throw new Error(payload?.error ?? "Sign-in failed.");
          }
          router.push(next);
          router.refresh();
        } catch (error) {
          toast.error(
            error instanceof Error ? error.message : "Sign-in failed.",
          );
          setSubmitting(false);
        }
      })}
    >
      <div>
        <label className="admin-label" htmlFor="admin-email">
          Email
        </label>
        <input
          id="admin-email"
          type="email"
          autoComplete="username"
          className="admin-field"
          {...register("email")}
        />
        {errors.email ? (
          <p className="mt-1.5 text-xs font-medium text-[#b3261e]">
            {errors.email.message}
          </p>
        ) : null}
      </div>

      <div>
        <label className="admin-label" htmlFor="admin-password">
          Password
        </label>
        <input
          id="admin-password"
          type="password"
          autoComplete="current-password"
          className="admin-field"
          {...register("password")}
        />
        {errors.password ? (
          <p className="mt-1.5 text-xs font-medium text-[#b3261e]">
            {errors.password.message}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#16324f] text-sm font-semibold text-white transition-colors hover:bg-[#0f2439] disabled:opacity-60"
      >
        {submitting ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Lock className="size-4" />
        )}
        Sign in
      </button>
    </form>
  );
}
