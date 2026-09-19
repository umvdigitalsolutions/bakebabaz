"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { AdminCard, AdminEmpty, StatusBadge } from "./AdminShell";
import { STATUS_LABELS } from "@/components/shared/OrderTimeline";
import { ORDER_STATUSES } from "@/types";
import { formatDate, formatINR, toDateInputValue } from "@/lib/utils";

export type OrderRow = {
  _id: string;
  orderNumber: string;
  createdAt: string;
  contact: { name: string; phone: string; email?: string };
  items: { name: string; quantity: number }[];
  delivery: { date: string; slot: string; type: string };
  amounts: { total: number };
  payment: { method: string; status: string };
  status: string;
};

export function OrdersTable({ initial }: { initial: OrderRow[] }) {
  const [rows, setRows] = useState(initial);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [loading, setLoading] = useState(false);

  // Filters run server-side so the table can page through more than it holds.
  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (status) params.set("status", status);
      if (paymentStatus) params.set("paymentStatus", paymentStatus);
      if (deliveryDate) params.set("deliveryDate", deliveryDate);

      setLoading(true);
      try {
        const response = await fetch(`/api/admin/orders?${params}`, {
          signal: controller.signal,
        });
        const payload = await response.json();
        if (payload?.ok) setRows(payload.data);
      } catch {
        // Aborted by the next keystroke — keep showing what we have.
      } finally {
        setLoading(false);
      }
    }, 320);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query, status, paymentStatus, deliveryDate]);

  const summary = useMemo(
    () => ({
      count: rows.length,
      value: rows.reduce((sum, row) => sum + row.amounts.total, 0),
    }),
    [rows],
  );

  return (
    <AdminCard padded={false}>
      <div className="flex flex-wrap items-center gap-3 border-b border-[#e3e8ef] px-5 py-3.5">
        <label className="relative min-w-0 flex-1 sm:max-w-xs">
          {loading ? (
            <Loader2 className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 animate-spin text-[#16324f]" />
          ) : (
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#94a3b8]" />
          )}
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Order number, name, phone or email…"
            aria-label="Search orders"
            className="admin-field pl-9"
          />
        </label>

        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          aria-label="Filter by order status"
          className="admin-field w-auto min-w-[150px]"
        >
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((value) => (
            <option key={value} value={value}>
              {STATUS_LABELS[value]}
            </option>
          ))}
        </select>

        <select
          value={paymentStatus}
          onChange={(event) => setPaymentStatus(event.target.value)}
          aria-label="Filter by payment status"
          className="admin-field w-auto min-w-[140px]"
        >
          <option value="">Any payment</option>
          <option value="PAID">Paid</option>
          <option value="PENDING">Pending</option>
          <option value="COD_PENDING">Cash on delivery</option>
          <option value="FAILED">Failed</option>
          <option value="REFUNDED">Refunded</option>
        </select>

        <input
          type="date"
          value={deliveryDate}
          onChange={(event) => setDeliveryDate(event.target.value)}
          aria-label="Filter by delivery date"
          className="admin-field w-auto"
        />

        <button
          type="button"
          onClick={() => setDeliveryDate(toDateInputValue(new Date()))}
          className="h-10 rounded-lg border border-[#e3e8ef] bg-white px-3 text-[12.5px] font-semibold hover:bg-[#f1f5f9]"
        >
          Today
        </button>

        {query || status || paymentStatus || deliveryDate ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setStatus("");
              setPaymentStatus("");
              setDeliveryDate("");
            }}
            className="h-10 px-2 text-[12.5px] font-semibold text-[#64748b] underline underline-offset-4"
          >
            Clear
          </button>
        ) : null}
      </div>

      {rows.length === 0 ? (
        <div className="p-5">
          <AdminEmpty
            title="No orders found"
            description="Adjust the filters, or wait for the next order to come in."
          />
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full text-left text-[13.5px]">
              <thead className="border-b border-[#e3e8ef] bg-[#f8fafc]">
                <tr>
                  {[
                    "Order",
                    "Customer",
                    "Items",
                    "Delivery",
                    "Total",
                    "Payment",
                    "Status",
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
                {rows.map((row) => (
                  <tr key={row._id} className="hover:bg-[#f8fafc]">
                    <td className="px-5 py-3">
                      <Link
                        href={`/admin/orders/${row._id}`}
                        className="font-semibold hover:underline"
                      >
                        #{row.orderNumber}
                      </Link>
                      <p className="text-[11.5px] text-[#94a3b8]">
                        {formatDate(row.createdAt)}
                      </p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-medium">{row.contact.name}</p>
                      <p className="text-[11.5px] text-[#94a3b8]">
                        {row.contact.phone}
                      </p>
                    </td>
                    <td className="max-w-[220px] px-5 py-3 text-[#475569]">
                      <span className="line-clamp-2">
                        {row.items
                          .map((item) => `${item.quantity}× ${item.name}`)
                          .join(", ")}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <p>{formatDate(row.delivery.date)}</p>
                      <p className="text-[11.5px] text-[#94a3b8]">
                        {row.delivery.slot}
                        {row.delivery.type === "pickup" ? " · Pickup" : ""}
                      </p>
                    </td>
                    <td className="px-5 py-3 font-semibold tabular-nums">
                      {formatINR(row.amounts.total)}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge
                        status={row.payment.status}
                        label={
                          row.payment.status === "COD_PENDING"
                            ? "COD"
                            : row.payment.status.toLowerCase()
                        }
                      />
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge
                        status={row.status}
                        label={STATUS_LABELS[row.status as never]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="divide-y divide-[#e3e8ef] lg:hidden">
            {rows.map((row) => (
              <li key={row._id}>
                <Link
                  href={`/admin/orders/${row._id}`}
                  className="block px-5 py-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold">#{row.orderNumber}</p>
                      <p className="truncate text-[12.5px] text-[#64748b]">
                        {row.contact.name} · {row.contact.phone}
                      </p>
                      <p className="mt-1 text-[12px] text-[#94a3b8]">
                        {formatDate(row.delivery.date)} · {row.delivery.slot}
                      </p>
                    </div>
                    <div className="flex-none text-right">
                      <p className="font-semibold tabular-nums">
                        {formatINR(row.amounts.total)}
                      </p>
                      <div className="mt-1.5">
                        <StatusBadge
                          status={row.status}
                          label={STATUS_LABELS[row.status as never]}
                        />
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex items-center justify-between border-t border-[#e3e8ef] px-5 py-3 text-[12.5px] text-[#64748b]">
            <span>
              {summary.count} order{summary.count === 1 ? "" : "s"}
            </span>
            <span className="font-semibold text-[#131a24] tabular-nums">
              {formatINR(summary.value)}
            </span>
          </div>
        </>
      )}
    </AdminCard>
  );
}
