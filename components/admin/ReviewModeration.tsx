"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { AdminButton, AdminCard, AdminEmpty } from "./AdminShell";
import { Rating } from "@/components/ui/Rating";
import { formatDate } from "@/lib/utils";

type ReviewRow = {
  _id: string;
  rating: number;
  title?: string;
  comment: string;
  customerName: string;
  verifiedPurchase: boolean;
  approved: boolean;
  adminReply?: string;
  createdAt: string;
  product?: { name: string; slug: string };
};

export function ReviewModeration({ initial }: { initial: ReviewRow[] }) {
  const [rows, setRows] = useState(initial);
  const [filter, setFilter] = useState<"pending" | "approved" | "all">(
    "pending",
  );
  const [busy, setBusy] = useState<string | null>(null);
  const [replyFor, setReplyFor] = useState<string | null>(null);
  const [reply, setReply] = useState("");

  const visible = rows.filter((row) =>
    filter === "all"
      ? true
      : filter === "approved"
        ? row.approved
        : !row.approved,
  );

  const patch = async (id: string, body: Record<string, unknown>) => {
    setBusy(id);
    try {
      const response = await fetch(`/api/admin/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error ?? "Update failed.");
      }
      setRows((current) =>
        current.map((row) =>
          row._id === id ? { ...row, ...(body as Partial<ReviewRow>) } : row,
        ),
      );
      toast.success("Review updated");
      setReplyFor(null);
      setReply("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed.");
    } finally {
      setBusy(null);
    }
  };

  const remove = async (id: string) => {
    setBusy(id);
    try {
      const response = await fetch(`/api/admin/reviews/${id}`, {
        method: "DELETE",
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error ?? "Delete failed.");
      }
      setRows((current) => current.filter((row) => row._id !== id));
      toast.success("Review deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed.");
    } finally {
      setBusy(null);
    }
  };

  const pendingCount = rows.filter((row) => !row.approved).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(
          [
            [
              "pending",
              `Awaiting review${pendingCount ? ` (${pendingCount})` : ""}`,
            ],
            ["approved", "Published"],
            ["all", "All"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={
              filter === value
                ? "h-9 rounded-lg border border-[#16324f] bg-[#16324f] px-3.5 text-[12.5px] font-semibold text-white"
                : "h-9 rounded-lg border border-[#e3e8ef] bg-white px-3.5 text-[12.5px] font-semibold hover:bg-[#f1f5f9]"
            }
          >
            {label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <AdminCard>
          <AdminEmpty
            title={
              filter === "pending"
                ? "Nothing waiting for moderation"
                : "No reviews here"
            }
            description="Reviews arrive from customers whose orders have been delivered. Nothing is published until you approve it."
          />
        </AdminCard>
      ) : (
        <ul className="space-y-3">
          {visible.map((row) => (
            <li key={row._id} className="admin-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <Rating value={row.rating} showCount={false} />
                  {row.title ? (
                    <p className="mt-1.5 font-semibold">{row.title}</p>
                  ) : null}
                  <p className="mt-1 text-[13.5px] text-[#475569]">
                    {row.comment}
                  </p>
                  <p className="mt-2 text-[12px] text-[#94a3b8]">
                    {row.customerName}
                    {row.verifiedPurchase ? " · Verified purchase" : ""} ·{" "}
                    {formatDate(row.createdAt)}
                    {row.product ? (
                      <>
                        {" · "}
                        <Link
                          href={`/product/${row.product.slug}`}
                          target="_blank"
                          className="underline underline-offset-2"
                        >
                          {row.product.name}
                        </Link>
                      </>
                    ) : null}
                  </p>
                </div>

                <span
                  className={
                    row.approved
                      ? "rounded-full bg-[#dcfce7] px-2.5 py-1 text-[11px] font-semibold text-[#166534]"
                      : "rounded-full bg-[#fef3c7] px-2.5 py-1 text-[11px] font-semibold text-[#92400e]"
                  }
                >
                  {row.approved ? "Published" : "Pending"}
                </span>
              </div>

              {row.adminReply ? (
                <div className="mt-3 rounded-lg bg-[#f8fafc] p-3">
                  <p className="text-[10.5px] font-semibold tracking-[0.08em] text-[#94a3b8] uppercase">
                    Your reply
                  </p>
                  <p className="mt-1 text-[13px]">{row.adminReply}</p>
                </div>
              ) : null}

              {replyFor === row._id ? (
                <div className="mt-3 space-y-2">
                  <textarea
                    rows={2}
                    className="admin-field resize-y"
                    placeholder="Your public reply"
                    aria-label="Reply"
                    value={reply}
                    onChange={(event) => setReply(event.target.value)}
                  />
                  <div className="flex gap-2">
                    <AdminButton
                      size="sm"
                      disabled={busy === row._id || !reply.trim()}
                      onClick={() => void patch(row._id, { adminReply: reply })}
                    >
                      Save reply
                    </AdminButton>
                    <AdminButton
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setReplyFor(null);
                        setReply("");
                      }}
                    >
                      Cancel
                    </AdminButton>
                  </div>
                </div>
              ) : (
                <div className="mt-4 flex flex-wrap gap-2">
                  {row.approved ? (
                    <AdminButton
                      size="sm"
                      variant="secondary"
                      disabled={busy === row._id}
                      onClick={() => void patch(row._id, { approved: false })}
                    >
                      <X className="size-3.5" />
                      Unpublish
                    </AdminButton>
                  ) : (
                    <AdminButton
                      size="sm"
                      disabled={busy === row._id}
                      onClick={() => void patch(row._id, { approved: true })}
                    >
                      <Check className="size-3.5" />
                      Approve
                    </AdminButton>
                  )}
                  <AdminButton
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setReplyFor(row._id);
                      setReply(row.adminReply ?? "");
                    }}
                  >
                    {row.adminReply ? "Edit reply" : "Reply"}
                  </AdminButton>
                  <AdminButton
                    size="sm"
                    variant="danger"
                    disabled={busy === row._id}
                    onClick={() => void remove(row._id)}
                  >
                    <Trash2 className="size-3.5" />
                    Delete
                  </AdminButton>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
