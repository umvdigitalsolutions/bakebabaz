"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminButton, AdminCard, AdminEmpty, StatusBadge } from "./AdminShell";
import { formatINR } from "@/lib/utils";

export type ProductRow = {
  _id: string;
  name: string;
  slug: string;
  sku?: string;
  status: string;
  basePrice: number;
  images?: { url: string }[];
  category?: { name?: string };
  weights?: { label: string; price: number }[];
  stock: number;
  unlimitedStock: boolean;
  lowStockThreshold: number;
  featured: boolean;
  bestseller: boolean;
  salesCount: number;
};

export function ProductTable({ initial }: { initial: ProductRow[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [pendingDelete, setPendingDelete] = useState<ProductRow | null>(null);
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (status && row.status !== status) return false;
      if (!needle) return true;
      return (
        row.name.toLowerCase().includes(needle) ||
        row.slug.toLowerCase().includes(needle) ||
        (row.sku ?? "").toLowerCase().includes(needle) ||
        (row.category?.name ?? "").toLowerCase().includes(needle)
      );
    });
  }, [rows, query, status]);

  const duplicate = async (row: ProductRow) => {
    setBusy(true);
    try {
      const response = await fetch("/api/admin/products/duplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: row._id }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error ?? "Could not duplicate.");
      }
      toast.success("Product duplicated as a draft");
      router.push(`/admin/products/${payload.data._id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Duplicate failed.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!pendingDelete) return;
    setBusy(true);
    try {
      const response = await fetch(
        `/api/admin/products?id=${pendingDelete._id}`,
        { method: "DELETE" },
      );
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error ?? "Could not delete.");
      }
      setRows((current) =>
        current.filter((row) => row._id !== pendingDelete._id),
      );
      toast.success("Product deleted");
      setPendingDelete(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed.");
    } finally {
      setBusy(false);
    }
  };

  const priceRange = (row: ProductRow) => {
    if (!row.weights?.length) return formatINR(row.basePrice);
    const prices = row.weights.map((weight) => weight.price);
    const low = Math.min(...prices);
    const high = Math.max(...prices);
    return low === high
      ? formatINR(low)
      : `${formatINR(low)} – ${formatINR(high)}`;
  };

  return (
    <>
      <AdminCard padded={false}>
        <div className="flex flex-wrap items-center gap-3 border-b border-[#e3e8ef] px-5 py-3.5">
          <label className="relative min-w-0 flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#94a3b8]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name, SKU or category…"
              aria-label="Search products"
              className="admin-field pl-9"
            />
          </label>

          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            aria-label="Filter by status"
            className="admin-field w-auto min-w-[140px]"
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>

          <Link href="/admin/products/new" className="ml-auto">
            <AdminButton type="button">
              <Plus className="size-4" />
              New product
            </AdminButton>
          </Link>
        </div>

        {filtered.length === 0 ? (
          <div className="p-5">
            <AdminEmpty
              title={rows.length === 0 ? "No products yet" : "No matches"}
              description={
                rows.length === 0
                  ? "Add your first product and it appears on the shop immediately — no code changes needed."
                  : "Try a different search or clear the status filter."
              }
              action={
                rows.length === 0 ? (
                  <Link href="/admin/products/new">
                    <AdminButton type="button">
                      <Plus className="size-4" />
                      Add a product
                    </AdminButton>
                  </Link>
                ) : null
              }
            />
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-left text-[13.5px]">
                <thead className="border-b border-[#e3e8ef] bg-[#f8fafc]">
                  <tr>
                    {[
                      "Product",
                      "Category",
                      "Price",
                      "Stock",
                      "Status",
                      "",
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="px-5 py-2.5 text-[11.5px] font-semibold tracking-[0.06em] text-[#64748b] uppercase"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e3e8ef]">
                  {filtered.map((row) => (
                    <tr key={row._id} className="hover:bg-[#f8fafc]">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <span className="relative size-10 flex-none overflow-hidden rounded-lg bg-[#f1f5f9]">
                            {row.images?.[0]?.url ? (
                              <Image
                                src={row.images[0].url}
                                alt=""
                                fill
                                sizes="40px"
                                className="object-cover"
                              />
                            ) : null}
                          </span>
                          <div className="min-w-0">
                            <Link
                              href={`/admin/products/${row._id}`}
                              className="block truncate font-medium hover:underline"
                            >
                              {row.name}
                            </Link>
                            <p className="truncate text-[11.5px] text-[#94a3b8]">
                              {row.sku ? `${row.sku} · ` : ""}
                              {row.salesCount} sold
                              {row.featured ? " · Featured" : ""}
                              {row.bestseller ? " · Bestseller" : ""}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-[#475569]">
                        {row.category?.name ?? "—"}
                      </td>
                      <td className="px-5 py-3 tabular-nums">
                        {priceRange(row)}
                      </td>
                      <td className="px-5 py-3">
                        {row.unlimitedStock ? (
                          <span className="text-[#64748b]">Made to order</span>
                        ) : (
                          <span
                            className={
                              row.stock <= row.lowStockThreshold
                                ? "font-semibold text-[#b3261e]"
                                : ""
                            }
                          >
                            {row.stock} left
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge
                          status={
                            row.status === "active" ? "DELIVERED" : "PENDING"
                          }
                          label={row.status}
                        />
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-1">
                          <Link
                            href={`/admin/products/${row._id}`}
                            aria-label={`Edit ${row.name}`}
                            className="grid size-8 place-items-center rounded-lg text-[#475569] hover:bg-[#eef2f6]"
                          >
                            <Pencil className="size-3.5" />
                          </Link>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void duplicate(row)}
                            aria-label={`Duplicate ${row.name}`}
                            className="grid size-8 place-items-center rounded-lg text-[#475569] hover:bg-[#eef2f6] disabled:opacity-50"
                          >
                            <Copy className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setPendingDelete(row)}
                            aria-label={`Delete ${row.name}`}
                            className="grid size-8 place-items-center rounded-lg text-[#b3261e] hover:bg-[#fee2e2]"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-[#e3e8ef] lg:hidden">
              {filtered.map((row) => (
                <li key={row._id} className="flex gap-3 px-5 py-4">
                  <span className="relative size-14 flex-none overflow-hidden rounded-lg bg-[#f1f5f9]">
                    {row.images?.[0]?.url ? (
                      <Image
                        src={row.images[0].url}
                        alt=""
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    ) : null}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/admin/products/${row._id}`}
                      className="block truncate font-medium"
                    >
                      {row.name}
                    </Link>
                    <p className="text-[12px] text-[#64748b]">
                      {row.category?.name} · {priceRange(row)}
                    </p>
                    <p className="mt-1 text-[11.5px] text-[#94a3b8] capitalize">
                      {row.status}
                      {row.unlimitedStock ? "" : ` · ${row.stock} in stock`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPendingDelete(row)}
                    aria-label={`Delete ${row.name}`}
                    className="grid size-8 flex-none place-items-center rounded-lg text-[#b3261e]"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </AdminCard>

      {pendingDelete ? (
        <div className="fixed inset-0 z-[60] grid place-items-center p-4">
          <div
            className="absolute inset-0 bg-black/35"
            onClick={() => setPendingDelete(null)}
          />
          <div className="relative w-full max-w-sm rounded-xl bg-white p-5 shadow-xl">
            <h2 className="text-[15px] font-semibold">
              Delete &ldquo;{pendingDelete.name}&rdquo;?
            </h2>
            <p className="mt-1.5 text-[13px] text-[#64748b]">
              It disappears from the shop immediately. Existing orders keep
              their own saved copy of the product, so history stays intact.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <AdminButton
                variant="secondary"
                size="sm"
                onClick={() => setPendingDelete(null)}
              >
                Cancel
              </AdminButton>
              <AdminButton
                variant="danger"
                size="sm"
                disabled={busy}
                onClick={() => void remove()}
              >
                {busy ? "Deleting…" : "Delete"}
              </AdminButton>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
