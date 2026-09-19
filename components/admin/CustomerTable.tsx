"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { AdminCard, AdminEmpty } from "./AdminShell";
import { formatDate, formatINR } from "@/lib/utils";

type CustomerRow = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
  marketingOptIn: boolean;
  stats: { orderCount: number; totalSpent: number; lastOrderAt?: string };
};

export function CustomerTable({ initial }: { initial: CustomerRow[] }) {
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return initial;
    return initial.filter(
      (row) =>
        row.name.toLowerCase().includes(needle) ||
        row.email.toLowerCase().includes(needle) ||
        (row.phone ?? "").includes(needle),
    );
  }, [initial, query]);

  return (
    <AdminCard padded={false}>
      <div className="border-b border-[#e3e8ef] px-5 py-3.5">
        <label className="relative block sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#94a3b8]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, email or phone…"
            aria-label="Search customers"
            className="admin-field pl-9"
          />
        </label>
      </div>

      {rows.length === 0 ? (
        <div className="p-5">
          <AdminEmpty
            title="No matches"
            description="Try a different search."
          />
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-[13.5px]">
              <thead className="border-b border-[#e3e8ef] bg-[#f8fafc]">
                <tr>
                  {[
                    "Customer",
                    "Contact",
                    "Orders",
                    "Spent",
                    "Last order",
                    "Joined",
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
                      <p className="font-medium">{row.name}</p>
                      {row.marketingOptIn ? (
                        <p className="text-[11px] text-[#94a3b8]">
                          Subscribed to updates
                        </p>
                      ) : null}
                    </td>
                    <td className="px-5 py-3 text-[#475569]">
                      <a
                        href={`mailto:${row.email}`}
                        className="block hover:underline"
                      >
                        {row.email}
                      </a>
                      {row.phone ? (
                        <a
                          href={`tel:${row.phone}`}
                          className="block text-[12px] text-[#94a3b8] hover:underline"
                        >
                          {row.phone}
                        </a>
                      ) : null}
                    </td>
                    <td className="px-5 py-3 tabular-nums">
                      {row.stats?.orderCount ?? 0}
                    </td>
                    <td className="px-5 py-3 font-semibold tabular-nums">
                      {formatINR(row.stats?.totalSpent ?? 0)}
                    </td>
                    <td className="px-5 py-3 text-[#475569]">
                      {row.stats?.lastOrderAt
                        ? formatDate(row.stats.lastOrderAt)
                        : "—"}
                    </td>
                    <td className="px-5 py-3 text-[#475569]">
                      {formatDate(row.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="divide-y divide-[#e3e8ef] md:hidden">
            {rows.map((row) => (
              <li key={row._id} className="px-5 py-4">
                <p className="font-medium">{row.name}</p>
                <p className="text-[12.5px] text-[#64748b]">{row.email}</p>
                {row.phone ? (
                  <p className="text-[12.5px] text-[#64748b]">{row.phone}</p>
                ) : null}
                <p className="mt-1.5 text-[12px] text-[#94a3b8]">
                  {row.stats?.orderCount ?? 0} orders ·{" "}
                  {formatINR(row.stats?.totalSpent ?? 0)}
                </p>
              </li>
            ))}
          </ul>

          <div className="border-t border-[#e3e8ef] px-5 py-3 text-[12.5px] text-[#64748b]">
            <Link
              href="/admin/orders"
              className="font-semibold text-[#16324f] underline underline-offset-4"
            >
              View all orders
            </Link>{" "}
            to see individual purchase history.
          </div>
        </>
      )}
    </AdminCard>
  );
}
