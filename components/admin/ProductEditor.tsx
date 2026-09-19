"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminButton, AdminCard } from "./AdminShell";
import { ImageListField } from "./ImageField";
import { formatINR, slugify } from "@/lib/utils";
import type { ImageRef } from "@/types";

type Option = { name: string; surcharge: number; premium?: boolean };
type Weight = {
  label: string;
  grams: number;
  price: number;
  salePrice?: number | null;
  stock?: number | null;
  sku?: string;
  servings?: string;
};

export type ProductDraft = {
  _id?: string;
  name: string;
  slug: string;
  sku?: string;
  category: string;
  shortDescription?: string;
  description?: string;
  images: ImageRef[];
  basePrice: number;
  salePrice?: number | null;
  weights: Weight[];
  flavours: Option[];
  fillings: Option[];
  shapes: Option[];
  eggOptions: ("eggless" | "with-egg")[];
  addOns: string[];
  tags: string[];
  occasions: string[];
  stock: number;
  unlimitedStock: boolean;
  lowStockThreshold: number;
  customisable: boolean;
  allowMessage: boolean;
  featured: boolean;
  bestseller: boolean;
  isVegetarian: boolean;
  ingredients?: string;
  allergens?: string;
  storageInstructions?: string;
  deliveryInfo?: string;
  prepTimeHours: number;
  seo?: { title?: string; description?: string };
  status: "active" | "draft" | "archived";
  sortOrder: number;
};

export const emptyProduct: ProductDraft = {
  name: "",
  slug: "",
  category: "",
  images: [],
  basePrice: 0,
  weights: [],
  flavours: [],
  fillings: [],
  shapes: [],
  eggOptions: ["eggless", "with-egg"],
  addOns: [],
  tags: [],
  occasions: [],
  stock: 0,
  unlimitedStock: true,
  lowStockThreshold: 5,
  customisable: true,
  allowMessage: true,
  featured: false,
  bestseller: false,
  isVegetarian: true,
  prepTimeHours: 6,
  status: "active",
  sortOrder: 0,
};

export function ProductEditor({
  initial,
  categories,
  addOns,
}: {
  initial: ProductDraft;
  categories: { _id: string; name: string }[];
  addOns: { _id: string; name: string; price: number; group: string }[];
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<ProductDraft>(initial);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const set = <K extends keyof ProductDraft>(key: K, value: ProductDraft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const isEdit = Boolean(initial._id);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      const payload = {
        ...draft,
        slug: draft.slug || slugify(draft.name),
        salePrice: draft.salePrice || undefined,
        weights: draft.weights.map((weight) => ({
          ...weight,
          salePrice: weight.salePrice || undefined,
          stock: weight.stock ?? undefined,
        })),
      };
      delete (payload as { _id?: string })._id;

      const response = await fetch(
        isEdit
          ? `/api/admin/products?id=${initial._id}`
          : "/api/admin/products",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const result = await response.json();

      if (!response.ok || !result?.ok) {
        if (result?.fieldErrors) setErrors(result.fieldErrors);
        throw new Error(result?.error ?? "Could not save the product.");
      }

      toast.success(isEdit ? "Product updated" : "Product created");
      router.push("/admin/products");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const error = (field: string) => errors[field]?.[0];

  return (
    <form
      onSubmit={save}
      className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]"
    >
      <div className="space-y-5">
        <AdminCard title="Basics">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Product name"
              required
              error={error("name")}
              className="sm:col-span-2"
            >
              <input
                className="admin-field"
                value={draft.name}
                onChange={(event) => {
                  set("name", event.target.value);
                  if (!isEdit) set("slug", slugify(event.target.value));
                }}
                required
              />
            </Field>

            <Field
              label="URL slug"
              required
              error={error("slug")}
              hint="/product/your-slug"
            >
              <input
                className="admin-field"
                value={draft.slug}
                onChange={(event) => set("slug", event.target.value)}
                onBlur={() => !draft.slug && set("slug", slugify(draft.name))}
                required
              />
            </Field>

            <Field label="SKU" error={error("sku")}>
              <input
                className="admin-field"
                value={draft.sku ?? ""}
                onChange={(event) => set("sku", event.target.value)}
              />
            </Field>

            <Field label="Category" required error={error("category")}>
              <select
                className="admin-field"
                value={draft.category}
                onChange={(event) => set("category", event.target.value)}
                required
              >
                <option value="">Select a category…</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Status">
              <select
                className="admin-field"
                value={draft.status}
                onChange={(event) =>
                  set("status", event.target.value as ProductDraft["status"])
                }
              >
                <option value="active">Active — visible in the shop</option>
                <option value="draft">Draft — hidden</option>
                <option value="archived">Archived</option>
              </select>
            </Field>

            <Field
              label="Short description"
              className="sm:col-span-2"
              hint="One or two lines, shown under the product title."
              error={error("shortDescription")}
            >
              <textarea
                rows={2}
                className="admin-field resize-y"
                value={draft.shortDescription ?? ""}
                onChange={(event) =>
                  set("shortDescription", event.target.value)
                }
              />
            </Field>

            <Field
              label="Full description"
              className="sm:col-span-2"
              error={error("description")}
            >
              <textarea
                rows={6}
                className="admin-field resize-y"
                value={draft.description ?? ""}
                onChange={(event) => set("description", event.target.value)}
              />
            </Field>
          </div>
        </AdminCard>

        <AdminCard title="Images">
          <ImageListField
            images={draft.images}
            onChange={(images) => set("images", images)}
            folder="products"
          />
        </AdminCard>

        <AdminCard
          title="Weights & prices"
          description="Each weight carries its own price. The lowest is shown as 'starting from'."
        >
          <RepeatableRows
            rows={draft.weights}
            onChange={(weights) => set("weights", weights)}
            addLabel="Add a weight"
            makeEmpty={() => ({
              label: "",
              grams: 1000,
              price: 0,
              servings: "",
            })}
            render={(weight, update) => (
              <div className="grid gap-3 sm:grid-cols-5">
                <LabeledInput
                  label="Label"
                  value={weight.label}
                  onChange={(value) => update({ label: value })}
                  placeholder="1 kg"
                />
                <LabeledInput
                  label="Grams"
                  type="number"
                  value={weight.grams}
                  onChange={(value) => update({ grams: Number(value) || 0 })}
                />
                <LabeledInput
                  label="Price (₹)"
                  type="number"
                  value={weight.price}
                  onChange={(value) => update({ price: Number(value) || 0 })}
                />
                <LabeledInput
                  label="Sale price"
                  type="number"
                  value={weight.salePrice ?? ""}
                  onChange={(value) =>
                    update({ salePrice: value === "" ? null : Number(value) })
                  }
                />
                <LabeledInput
                  label="Servings"
                  value={weight.servings ?? ""}
                  onChange={(value) => update({ servings: value })}
                  placeholder="8–12"
                />
              </div>
            )}
          />
          {draft.weights.length === 0 ? (
            <p className="mt-3 text-[12.5px] text-[#94a3b8]">
              No weight variants — the base price below is used instead.
            </p>
          ) : null}
        </AdminCard>

        <AdminCard
          title="Options"
          description="Surcharges add to the selected weight's price."
        >
          <div className="space-y-6">
            <OptionGroup
              title="Flavours"
              options={draft.flavours}
              onChange={(flavours) => set("flavours", flavours)}
            />
            <OptionGroup
              title="Fillings"
              options={draft.fillings}
              onChange={(fillings) => set("fillings", fillings)}
            />
            <OptionGroup
              title="Shapes"
              options={draft.shapes}
              onChange={(shapes) => set("shapes", shapes)}
            />

            <div>
              <p className="admin-label">Egg options</p>
              <div className="flex flex-wrap gap-3">
                {(["eggless", "with-egg"] as const).map((option) => (
                  <label
                    key={option}
                    className="flex items-center gap-2 text-[13.5px]"
                  >
                    <input
                      type="checkbox"
                      checked={draft.eggOptions.includes(option)}
                      onChange={(event) =>
                        set(
                          "eggOptions",
                          event.target.checked
                            ? [...draft.eggOptions, option]
                            : draft.eggOptions.filter(
                                (item) => item !== option,
                              ),
                        )
                      }
                      className="size-4 accent-[#16324f]"
                    />
                    {option === "eggless" ? "Eggless" : "With egg"}
                  </label>
                ))}
              </div>
            </div>

            {addOns.length > 0 ? (
              <div>
                <p className="admin-label">Available add-ons</p>
                <div className="flex flex-wrap gap-2">
                  {addOns.map((addOn) => {
                    const selected = draft.addOns.includes(addOn._id);
                    return (
                      <button
                        key={addOn._id}
                        type="button"
                        onClick={() =>
                          set(
                            "addOns",
                            selected
                              ? draft.addOns.filter((id) => id !== addOn._id)
                              : [...draft.addOns, addOn._id],
                          )
                        }
                        className={
                          selected
                            ? "rounded-full border border-[#16324f] bg-[#16324f] px-3 py-1.5 text-[12.5px] font-semibold text-white"
                            : "rounded-full border border-[#e3e8ef] bg-white px-3 py-1.5 text-[12.5px] font-medium hover:bg-[#f1f5f9]"
                        }
                      >
                        {addOn.name} · {formatINR(addOn.price)}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </AdminCard>

        <AdminCard title="Product information">
          <div className="grid gap-4">
            <Field label="Ingredients">
              <textarea
                rows={2}
                className="admin-field resize-y"
                value={draft.ingredients ?? ""}
                onChange={(event) => set("ingredients", event.target.value)}
              />
            </Field>
            <Field label="Allergens">
              <textarea
                rows={2}
                className="admin-field resize-y"
                value={draft.allergens ?? ""}
                onChange={(event) => set("allergens", event.target.value)}
              />
            </Field>
            <Field label="Storage instructions">
              <textarea
                rows={2}
                className="admin-field resize-y"
                value={draft.storageInstructions ?? ""}
                onChange={(event) =>
                  set("storageInstructions", event.target.value)
                }
              />
            </Field>
            <Field label="Delivery information">
              <textarea
                rows={2}
                className="admin-field resize-y"
                value={draft.deliveryInfo ?? ""}
                onChange={(event) => set("deliveryInfo", event.target.value)}
              />
            </Field>
          </div>
        </AdminCard>

        <AdminCard title="SEO">
          <div className="grid gap-4">
            <Field label="SEO title">
              <input
                className="admin-field"
                value={draft.seo?.title ?? ""}
                onChange={(event) =>
                  set("seo", { ...draft.seo, title: event.target.value })
                }
              />
            </Field>
            <Field label="SEO description">
              <textarea
                rows={2}
                className="admin-field resize-y"
                value={draft.seo?.description ?? ""}
                onChange={(event) =>
                  set("seo", { ...draft.seo, description: event.target.value })
                }
              />
            </Field>
          </div>
        </AdminCard>
      </div>

      <div className="space-y-5">
        <AdminCard title="Pricing">
          <div className="grid gap-4">
            <Field
              label="Base price (₹)"
              required
              hint="Used when there are no weight variants."
              error={error("basePrice")}
            >
              <input
                type="number"
                min={0}
                className="admin-field"
                value={draft.basePrice}
                onChange={(event) =>
                  set("basePrice", Number(event.target.value) || 0)
                }
                required
              />
            </Field>
            <Field label="Sale price (₹)">
              <input
                type="number"
                min={0}
                className="admin-field"
                value={draft.salePrice ?? ""}
                onChange={(event) =>
                  set(
                    "salePrice",
                    event.target.value === ""
                      ? null
                      : Number(event.target.value),
                  )
                }
              />
            </Field>
          </div>
        </AdminCard>

        <AdminCard title="Inventory">
          <div className="grid gap-4">
            <Toggle
              label="Made to order (unlimited stock)"
              hint="Cakes are usually made to order. Turn this off for stocked items like cookies or hampers."
              checked={draft.unlimitedStock}
              onChange={(value) => set("unlimitedStock", value)}
            />
            {!draft.unlimitedStock ? (
              <>
                <Field label="Stock on hand">
                  <input
                    type="number"
                    min={0}
                    className="admin-field"
                    value={draft.stock}
                    onChange={(event) =>
                      set("stock", Number(event.target.value) || 0)
                    }
                  />
                </Field>
                <Field label="Low stock warning at">
                  <input
                    type="number"
                    min={0}
                    className="admin-field"
                    value={draft.lowStockThreshold}
                    onChange={(event) =>
                      set("lowStockThreshold", Number(event.target.value) || 0)
                    }
                  />
                </Field>
              </>
            ) : null}
          </div>
        </AdminCard>

        <AdminCard title="Fulfilment">
          <div className="grid gap-4">
            <Field
              label="Preparation time (hours)"
              hint="Delivery slots inside this window are blocked."
            >
              <input
                type="number"
                min={0}
                className="admin-field"
                value={draft.prepTimeHours}
                onChange={(event) =>
                  set("prepTimeHours", Number(event.target.value) || 0)
                }
              />
            </Field>
            <Field label="Sort order">
              <input
                type="number"
                className="admin-field"
                value={draft.sortOrder}
                onChange={(event) =>
                  set("sortOrder", Number(event.target.value) || 0)
                }
              />
            </Field>
          </div>
        </AdminCard>

        <AdminCard title="Visibility">
          <div className="space-y-3">
            <Toggle
              label="Featured"
              checked={draft.featured}
              onChange={(value) => set("featured", value)}
            />
            <Toggle
              label="Bestseller"
              checked={draft.bestseller}
              onChange={(value) => set("bestseller", value)}
            />
            <Toggle
              label="Customisable"
              hint="Shows flavour, filling and shape pickers."
              checked={draft.customisable}
              onChange={(value) => set("customisable", value)}
            />
            <Toggle
              label="Allow a message on the cake"
              checked={draft.allowMessage}
              onChange={(value) => set("allowMessage", value)}
            />
            <Toggle
              label="Vegetarian"
              checked={draft.isVegetarian}
              onChange={(value) => set("isVegetarian", value)}
            />
          </div>
        </AdminCard>

        <AdminCard title="Discovery">
          <div className="grid gap-4">
            <Field label="Tags" hint="Comma separated. Used by search.">
              <input
                className="admin-field"
                value={draft.tags.join(", ")}
                onChange={(event) =>
                  set(
                    "tags",
                    event.target.value
                      .split(",")
                      .map((tag) => tag.trim())
                      .filter(Boolean),
                  )
                }
              />
            </Field>
            <Field
              label="Occasions"
              hint="Comma separated. Used by shop filters."
            >
              <input
                className="admin-field"
                value={draft.occasions.join(", ")}
                onChange={(event) =>
                  set(
                    "occasions",
                    event.target.value
                      .split(",")
                      .map((item) => item.trim())
                      .filter(Boolean),
                  )
                }
              />
            </Field>
          </div>
        </AdminCard>

        <div className="sticky bottom-4 flex gap-2 rounded-xl border border-[#e3e8ef] bg-white p-3 shadow-lg">
          <AdminButton
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={() => router.push("/admin/products")}
          >
            Cancel
          </AdminButton>
          <AdminButton type="submit" className="flex-1" disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Create product"}
          </AdminButton>
        </div>
      </div>
    </form>
  );
}

function Field({
  label,
  required,
  hint,
  error,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <span className="admin-label">
        {label}
        {required ? <span className="text-[#b3261e]"> *</span> : null}
      </span>
      {children}
      {error ? (
        <p className="mt-1.5 text-[11.5px] font-medium text-[#b3261e]">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-[11.5px] text-[#94a3b8]">{hint}</p>
      ) : null}
    </div>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold text-[#94a3b8]">
        {label}
      </span>
      <input
        type={type}
        className="admin-field"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-2.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 size-4 accent-[#16324f]"
      />
      <span className="text-[13.5px]">
        {label}
        {hint ? (
          <span className="mt-0.5 block text-[11.5px] text-[#94a3b8]">
            {hint}
          </span>
        ) : null}
      </span>
    </label>
  );
}

function RepeatableRows<T>({
  rows,
  onChange,
  render,
  makeEmpty,
  addLabel,
}: {
  rows: T[];
  onChange: (rows: T[]) => void;
  render: (row: T, update: (patch: Partial<T>) => void) => React.ReactNode;
  makeEmpty: () => T;
  addLabel: string;
}) {
  return (
    <div>
      <ul className="space-y-3">
        {rows.map((row, index) => (
          <li
            key={index}
            className="flex items-start gap-2 rounded-lg border border-[#e3e8ef] p-3"
          >
            <div className="min-w-0 flex-1">
              {render(row, (patch) =>
                onChange(
                  rows.map((item, i) =>
                    i === index ? { ...item, ...patch } : item,
                  ),
                ),
              )}
            </div>
            <button
              type="button"
              onClick={() => onChange(rows.filter((_, i) => i !== index))}
              aria-label="Remove row"
              className="mt-5 grid size-8 flex-none place-items-center rounded-lg text-[#b3261e] hover:bg-[#fee2e2]"
            >
              <Trash2 className="size-3.5" />
            </button>
          </li>
        ))}
      </ul>
      <AdminButton
        type="button"
        variant="secondary"
        size="sm"
        className="mt-3"
        onClick={() => onChange([...rows, makeEmpty()])}
      >
        <Plus className="size-3.5" />
        {addLabel}
      </AdminButton>
    </div>
  );
}

function OptionGroup({
  title,
  options,
  onChange,
}: {
  title: string;
  options: Option[];
  onChange: (options: Option[]) => void;
}) {
  return (
    <div>
      <p className="admin-label">{title}</p>
      <RepeatableRows
        rows={options}
        onChange={onChange}
        addLabel={`Add ${title.toLowerCase().replace(/s$/, "")}`}
        makeEmpty={() => ({ name: "", surcharge: 0 })}
        render={(option, update) => (
          <div className="grid gap-3 sm:grid-cols-2">
            <LabeledInput
              label="Name"
              value={option.name}
              onChange={(value) => update({ name: value })}
            />
            <LabeledInput
              label="Surcharge (₹)"
              type="number"
              value={option.surcharge}
              onChange={(value) => update({ surcharge: Number(value) || 0 })}
            />
          </div>
        )}
      />
    </div>
  );
}
