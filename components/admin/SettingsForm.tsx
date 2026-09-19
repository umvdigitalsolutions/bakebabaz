"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AdminButton } from "./AdminShell";
import { ImageField } from "./ImageField";
import type { ImageRef } from "@/types";

export type SettingsField = {
  /** Dotted path into the settings document, e.g. `brand.name`. */
  name: string;
  label: string;
  type:
    | "text"
    | "textarea"
    | "number"
    | "price"
    | "checkbox"
    | "select"
    | "image"
    | "list";
  hint?: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  colSpan?: 1 | 2;
  rows?: number;
};

function getPath(source: unknown, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>(
      (value, key) =>
        value && typeof value === "object"
          ? (value as Record<string, unknown>)[key]
          : undefined,
      source,
    );
}

/**
 * Patches the store settings singleton one section at a time. Only the fields
 * rendered here are sent, and the API rejects any path outside its allowlist.
 */
export function SettingsForm({
  initial,
  fields,
  submitLabel = "Save changes",
}: {
  initial: Record<string, unknown>;
  fields: SettingsField[];
  submitLabel?: string;
}) {
  const [values, setValues] = useState<Record<string, unknown>>(() => {
    const start: Record<string, unknown> = {};
    for (const field of fields) {
      const value = getPath(initial, field.name);
      start[field.name] =
        field.type === "list" && Array.isArray(value)
          ? value.join("\n")
          : (value ?? (field.type === "checkbox" ? false : ""));
    }
    return start;
  });
  const [saving, setSaving] = useState(false);

  const set = (name: string, value: unknown) =>
    setValues((current) => ({ ...current, [name]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const patch: Record<string, unknown> = {};
      for (const field of fields) {
        const raw = values[field.name];
        if (field.type === "number" || field.type === "price") {
          patch[field.name] = Number(raw) || 0;
        } else if (field.type === "list") {
          patch[field.name] = String(raw ?? "")
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean);
        } else {
          patch[field.name] = raw;
        }
      }

      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error ?? "Could not save settings.");
      }
      toast.success("Settings saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => {
          const id = `setting-${field.name.replace(/\./g, "-")}`;
          const value = values[field.name];
          const wide =
            field.colSpan === 2 ||
            field.type === "textarea" ||
            field.type === "list";

          if (field.type === "checkbox") {
            return (
              <label
                key={field.name}
                className="flex items-start gap-2.5 sm:pt-6"
              >
                <input
                  id={id}
                  type="checkbox"
                  checked={Boolean(value)}
                  onChange={(event) => set(field.name, event.target.checked)}
                  className="mt-0.5 size-4 accent-[#16324f]"
                />
                <span className="text-[13.5px]">
                  {field.label}
                  {field.hint ? (
                    <span className="mt-0.5 block text-[11.5px] text-[#94a3b8]">
                      {field.hint}
                    </span>
                  ) : null}
                </span>
              </label>
            );
          }

          if (field.type === "image") {
            return (
              <div
                key={field.name}
                className={wide ? "sm:col-span-2" : undefined}
              >
                <ImageField
                  label={field.label}
                  value={value as ImageRef | null}
                  folder="media"
                  onChange={(image) => set(field.name, image)}
                />
              </div>
            );
          }

          return (
            <div
              key={field.name}
              className={wide ? "sm:col-span-2" : undefined}
            >
              <label className="admin-label" htmlFor={id}>
                {field.label}
              </label>

              {field.type === "textarea" || field.type === "list" ? (
                <textarea
                  id={id}
                  rows={field.rows ?? (field.type === "list" ? 6 : 3)}
                  className="admin-field resize-y"
                  placeholder={field.placeholder}
                  value={String(value ?? "")}
                  onChange={(event) => set(field.name, event.target.value)}
                />
              ) : field.type === "select" ? (
                <select
                  id={id}
                  className="admin-field"
                  value={String(value ?? "")}
                  onChange={(event) => set(field.name, event.target.value)}
                >
                  {field.options?.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id={id}
                  type={
                    field.type === "number" || field.type === "price"
                      ? "number"
                      : "text"
                  }
                  className="admin-field"
                  placeholder={field.placeholder}
                  value={String(value ?? "")}
                  onChange={(event) => set(field.name, event.target.value)}
                />
              )}

              {field.hint ? (
                <p className="mt-1.5 text-[11.5px] text-[#94a3b8]">
                  {field.hint}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex justify-end">
        <AdminButton type="submit" disabled={saving}>
          {saving ? "Saving…" : submitLabel}
        </AdminButton>
      </div>
    </form>
  );
}
