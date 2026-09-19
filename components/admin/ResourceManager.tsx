"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { AdminButton, AdminEmpty, AdminCard } from "./AdminShell";
import { ImageField } from "./ImageField";
import { cn, slugify } from "@/lib/utils";
import type { ImageRef } from "@/types";

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "price"
  | "select"
  | "checkbox"
  | "image"
  | "date"
  | "time"
  | "tags";

export type ResourceField = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  hint?: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  /** Auto-fills this field's slug from the named source field. */
  slugFrom?: string;
  min?: number;
  max?: number;
  step?: number;
  colSpan?: 1 | 2;
  imageFolder?: "products" | "categories" | "banners" | "media";
  defaultValue?: unknown;
};

export type ResourceColumn<T> = {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
};

type Row = Record<string, unknown> & { _id: string };

/**
 * Schema-driven CRUD screen shared by categories, cake options, add-ons,
 * coupons, banners, delivery zones and slots. Each page supplies fields and
 * columns; everything else — validation feedback, dialogs, toasts — is here.
 */
export function ResourceManager<T extends Row>({
  endpoint,
  initial,
  fields,
  columns,
  singular,
  plural,
  searchPlaceholder,
  emptyDescription,
  canCreate = true,
}: {
  endpoint: string;
  initial: T[];
  fields: ResourceField[];
  columns: ResourceColumn<T>[];
  singular: string;
  plural: string;
  searchPlaceholder?: string;
  emptyDescription?: string;
  canCreate?: boolean;
}) {
  const [rows, setRows] = useState<T[]>(initial);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<T | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<T | null>(null);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const filtered = useMemo(() => {
    if (!query.trim()) return rows;
    const needle = query.trim().toLowerCase();
    return rows.filter((row) =>
      Object.values(row).some((value) =>
        typeof value === "string"
          ? value.toLowerCase().includes(needle)
          : false,
      ),
    );
  }, [rows, query]);

  const closeForm = () => {
    setEditing(null);
    setCreating(false);
    setErrors({});
  };

  const submit = async (values: Record<string, unknown>) => {
    setBusy(true);
    setErrors({});
    try {
      const isEdit = Boolean(editing);
      const url = isEdit ? `${endpoint}?id=${editing!._id}` : endpoint;
      const response = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const payload = await response.json();

      if (!response.ok || !payload?.ok) {
        if (payload?.fieldErrors) setErrors(payload.fieldErrors);
        throw new Error(payload?.error ?? `Could not save ${singular}.`);
      }

      setRows((current) =>
        isEdit
          ? current.map((row) =>
              row._id === editing!._id ? (payload.data as T) : row,
            )
          : [payload.data as T, ...current],
      );
      toast.success(isEdit ? `${singular} updated` : `${singular} created`);
      closeForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      const response = await fetch(`${endpoint}?id=${deleting._id}`, {
        method: "DELETE",
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error ?? "Could not delete.");
      }
      setRows((current) => current.filter((row) => row._id !== deleting._id));
      toast.success(`${singular} deleted`);
      setDeleting(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed.");
    } finally {
      setBusy(false);
    }
  };

  const formOpen = creating || Boolean(editing);

  return (
    <>
      <AdminCard padded={false}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e3e8ef] px-5 py-3.5">
          <label className="relative flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#94a3b8]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={
                searchPlaceholder ?? `Search ${plural.toLowerCase()}…`
              }
              aria-label={`Search ${plural}`}
              className="admin-field pl-9"
            />
          </label>
          {canCreate ? (
            <AdminButton onClick={() => setCreating(true)}>
              <Plus className="size-4" />
              New {singular.toLowerCase()}
            </AdminButton>
          ) : null}
        </div>

        {filtered.length === 0 ? (
          <div className="p-5">
            <AdminEmpty
              title={
                rows.length === 0
                  ? `No ${plural.toLowerCase()} yet`
                  : "Nothing matches that search"
              }
              description={
                rows.length === 0
                  ? emptyDescription
                  : "Try a different term, or clear the search."
              }
              action={
                rows.length === 0 && canCreate ? (
                  <AdminButton onClick={() => setCreating(true)}>
                    <Plus className="size-4" />
                    Add your first {singular.toLowerCase()}
                  </AdminButton>
                ) : null
              }
            />
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-[13.5px]">
                <thead className="border-b border-[#e3e8ef] bg-[#f8fafc]">
                  <tr>
                    {columns.map((column) => (
                      <th
                        key={column.key}
                        className={cn(
                          "px-5 py-2.5 text-[11.5px] font-semibold tracking-[0.06em] text-[#64748b] uppercase",
                          column.className,
                        )}
                      >
                        {column.label}
                      </th>
                    ))}
                    <th className="w-24 px-5 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e3e8ef]">
                  {filtered.map((row) => (
                    <tr key={row._id} className="hover:bg-[#f8fafc]">
                      {columns.map((column) => (
                        <td
                          key={column.key}
                          className={cn(
                            "px-5 py-3 align-middle",
                            column.className,
                          )}
                        >
                          {column.render
                            ? column.render(row)
                            : String(row[column.key] ?? "—")}
                        </td>
                      ))}
                      <td className="px-5 py-3 text-right">
                        <RowActions
                          onEdit={() => setEditing(row)}
                          onDelete={() => setDeleting(row)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <ul className="divide-y divide-[#e3e8ef] md:hidden">
              {filtered.map((row) => (
                <li key={row._id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <dl className="min-w-0 flex-1 space-y-1">
                      {columns.map((column) => (
                        <div
                          key={column.key}
                          className="flex gap-2 text-[13px]"
                        >
                          <dt className="w-24 flex-none text-[#94a3b8]">
                            {column.label}
                          </dt>
                          <dd className="min-w-0 break-words">
                            {column.render
                              ? column.render(row)
                              : String(row[column.key] ?? "—")}
                          </dd>
                        </div>
                      ))}
                    </dl>
                    <RowActions
                      onEdit={() => setEditing(row)}
                      onDelete={() => setDeleting(row)}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </AdminCard>

      {formOpen ? (
        <ResourceForm
          fields={fields}
          initial={editing ?? undefined}
          title={
            editing
              ? `Edit ${singular.toLowerCase()}`
              : `New ${singular.toLowerCase()}`
          }
          busy={busy}
          errors={errors}
          onCancel={closeForm}
          onSubmit={submit}
        />
      ) : null}

      {deleting ? (
        <ConfirmDelete
          label={singular}
          busy={busy}
          onCancel={() => setDeleting(null)}
          onConfirm={() => void remove()}
        />
      ) : null}
    </>
  );
}

function RowActions({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex justify-end gap-1">
      <button
        type="button"
        onClick={onEdit}
        aria-label="Edit"
        className="grid size-8 place-items-center rounded-lg text-[#475569] transition-colors hover:bg-[#eef2f6]"
      >
        <Pencil className="size-3.5" />
      </button>
      <button
        type="button"
        onClick={onDelete}
        aria-label="Delete"
        className="grid size-8 place-items-center rounded-lg text-[#b3261e] transition-colors hover:bg-[#fee2e2]"
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  );
}

function ResourceForm({
  fields,
  initial,
  title,
  busy,
  errors,
  onCancel,
  onSubmit,
}: {
  fields: ResourceField[];
  initial?: Record<string, unknown>;
  title: string;
  busy: boolean;
  errors: Record<string, string[]>;
  onCancel: () => void;
  onSubmit: (values: Record<string, unknown>) => void;
}) {
  const [values, setValues] = useState<Record<string, unknown>>(() => {
    const start: Record<string, unknown> = {};
    for (const field of fields) {
      const existing = initial ? getPath(initial, field.name) : undefined;
      start[field.name] =
        existing ?? field.defaultValue ?? defaultForType(field.type);
    }
    return start;
  });

  const set = (name: string, value: unknown) =>
    setValues((current) => ({ ...current, [name]: value }));

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/35" onClick={onCancel} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative flex h-full w-full max-w-xl flex-col bg-white shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-[#e3e8ef] px-5 py-4">
          <h2 className="text-[15px] font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            className="grid size-8 place-items-center rounded-lg text-[#64748b] hover:bg-[#eef2f6]"
          >
            <X className="size-4" />
          </button>
        </header>

        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit(buildPayload(fields, values));
          }}
        >
          <div className="min-h-0 flex-1 overflow-y-auto p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              {fields.map((field) => (
                <div
                  key={field.name}
                  className={
                    field.colSpan === 2 || field.type === "textarea"
                      ? "sm:col-span-2"
                      : undefined
                  }
                >
                  <FieldInput
                    field={field}
                    value={values[field.name]}
                    values={values}
                    onChange={(value) => set(field.name, value)}
                    error={errors[field.name]?.[0]}
                  />
                </div>
              ))}
            </div>
          </div>

          <footer className="flex justify-end gap-2 border-t border-[#e3e8ef] px-5 py-4">
            <AdminButton type="button" variant="secondary" onClick={onCancel}>
              Cancel
            </AdminButton>
            <AdminButton type="submit" disabled={busy}>
              {busy ? "Saving…" : "Save"}
            </AdminButton>
          </footer>
        </form>
      </div>
    </div>
  );
}

function FieldInput({
  field,
  value,
  values,
  onChange,
  error,
}: {
  field: ResourceField;
  value: unknown;
  values: Record<string, unknown>;
  onChange: (value: unknown) => void;
  error?: string;
}) {
  const id = `field-${field.name}`;

  if (field.type === "checkbox") {
    return (
      <label className="flex items-start gap-2.5 pt-6">
        <input
          id={id}
          type="checkbox"
          checked={Boolean(value)}
          onChange={(event) => onChange(event.target.checked)}
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
      <ImageField
        label={field.label}
        value={value as never}
        folder={field.imageFolder ?? "media"}
        onChange={(image: ImageRef | null) => onChange(image)}
      />
    );
  }

  return (
    <div>
      <label className="admin-label" htmlFor={id}>
        {field.label}
        {field.required ? <span className="text-[#b3261e]"> *</span> : null}
      </label>

      {field.type === "textarea" ? (
        <textarea
          id={id}
          rows={3}
          className="admin-field resize-y"
          placeholder={field.placeholder}
          value={String(value ?? "")}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : field.type === "select" ? (
        <select
          id={id}
          className="admin-field"
          value={String(value ?? "")}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="">Select…</option>
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : field.type === "tags" ? (
        <input
          id={id}
          className="admin-field"
          placeholder={field.placeholder ?? "Comma separated"}
          value={Array.isArray(value) ? value.join(", ") : String(value ?? "")}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          id={id}
          type={
            field.type === "number" || field.type === "price"
              ? "number"
              : field.type === "date"
                ? "date"
                : field.type === "time"
                  ? "time"
                  : "text"
          }
          inputMode={
            field.type === "number" || field.type === "price"
              ? "decimal"
              : undefined
          }
          min={field.min}
          max={field.max}
          step={field.step ?? (field.type === "price" ? 1 : undefined)}
          className="admin-field"
          placeholder={field.placeholder}
          value={String(value ?? "")}
          onChange={(event) => onChange(event.target.value)}
          onBlur={() => {
            // Slug fields fill themselves in from their source once you move on.
            if (field.slugFrom && !String(value ?? "").trim()) {
              const source = values[field.slugFrom];
              if (typeof source === "string" && source.trim()) {
                onChange(slugify(source));
              }
            }
          }}
        />
      )}

      {error ? (
        <p className="mt-1.5 text-[11.5px] font-medium text-[#b3261e]">
          {error}
        </p>
      ) : field.hint ? (
        <p className="mt-1.5 text-[11.5px] text-[#94a3b8]">{field.hint}</p>
      ) : null}
    </div>
  );
}

function ConfirmDelete({
  label,
  busy,
  onCancel,
  onConfirm,
}: {
  label: string;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center p-4">
      <div className="absolute inset-0 bg-black/35" onClick={onCancel} />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-sm rounded-xl bg-white p-5 shadow-xl"
      >
        <h2 className="text-[15px] font-semibold">
          Delete this {label.toLowerCase()}?
        </h2>
        <p className="mt-1.5 text-[13px] text-[#64748b]">
          This can&rsquo;t be undone. Anything already ordered keeps its own
          saved copy.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <AdminButton variant="secondary" size="sm" onClick={onCancel}>
            Cancel
          </AdminButton>
          <AdminButton
            variant="danger"
            size="sm"
            disabled={busy}
            onClick={onConfirm}
          >
            {busy ? "Deleting…" : "Delete"}
          </AdminButton>
        </div>
      </div>
    </div>
  );
}

function defaultForType(type: FieldType) {
  switch (type) {
    case "checkbox":
      return false;
    case "number":
    case "price":
      return 0;
    case "image":
      return null;
    default:
      return "";
  }
}

function getPath(source: Record<string, unknown>, path: string) {
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

/** Converts form strings back into the shapes the Zod schemas expect. */
function buildPayload(
  fields: ResourceField[],
  values: Record<string, unknown>,
) {
  const payload: Record<string, unknown> = {};

  for (const field of fields) {
    const raw = values[field.name];

    let value: unknown = raw;
    if (field.type === "number" || field.type === "price") {
      value = raw === "" || raw == null ? undefined : Number(raw);
      if (Number.isNaN(value)) value = undefined;
    } else if (field.type === "tags") {
      value =
        typeof raw === "string"
          ? raw
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean)
          : Array.isArray(raw)
            ? raw
            : [];
    } else if (field.type === "text" || field.type === "textarea") {
      value = typeof raw === "string" ? raw.trim() : raw;
      if (value === "") value = undefined;
    } else if (field.type === "select" && raw === "") {
      value = undefined;
    } else if (field.type === "date" && raw === "") {
      value = undefined;
    }

    if (field.required && (value == null || value === "")) {
      // Let the server's Zod schema produce the message so wording stays in one place.
      value = raw;
    }

    // Support dotted names like `seo.title`.
    if (field.name.includes(".")) {
      const [head, ...rest] = field.name.split(".");
      const nested = (payload[head] as Record<string, unknown>) ?? {};
      let cursor = nested;
      for (let i = 0; i < rest.length - 1; i += 1) {
        cursor[rest[i]] = (cursor[rest[i]] as Record<string, unknown>) ?? {};
        cursor = cursor[rest[i]] as Record<string, unknown>;
      }
      cursor[rest[rest.length - 1]] = value;
      payload[head] = nested;
    } else {
      payload[field.name] = value;
    }
  }

  return payload;
}
