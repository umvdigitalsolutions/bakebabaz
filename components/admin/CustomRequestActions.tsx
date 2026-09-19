"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AdminButton, AdminCard } from "./AdminShell";
import { REQUEST_STATUS_LABELS } from "@/lib/custom-request-status";
import { CUSTOM_REQUEST_STATUSES, type CustomRequestStatus } from "@/types";
import { formatINR } from "@/lib/utils";

/**
 * Approve, decline, re-price and message a custom cake request. Everything
 * funnels through one PATCH endpoint that records who did what and when.
 */
export function CustomRequestActions({
  requestId,
  status,
  estimate,
  quotedAmount,
}: {
  requestId: string;
  status: CustomRequestStatus;
  estimate: number;
  quotedAmount?: number;
}) {
  const router = useRouter();
  const [nextStatus, setNextStatus] = useState<CustomRequestStatus>(status);
  const [amount, setAmount] = useState(String(quotedAmount ?? estimate));
  const [quoteNote, setQuoteNote] = useState("");
  const [customerNote, setCustomerNote] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const call = async (body: Record<string, unknown>, key: string) => {
    setBusy(key);
    try {
      const response = await fetch(`/api/admin/custom-orders/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error ?? "Update failed.");
      }
      toast.success("Request updated");
      router.refresh();
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed.");
      return false;
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <AdminCard title="Quote">
        <div className="space-y-3">
          <div>
            <label className="admin-label" htmlFor="quote-amount">
              Final price (₹)
            </label>
            <input
              id="quote-amount"
              type="number"
              min={0}
              className="admin-field"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
            <p className="mt-1.5 text-[11.5px] text-[#94a3b8]">
              Our engine estimated {formatINR(estimate)}. Adjust if the design
              needs more work than the configuration suggests.
            </p>
          </div>
          <textarea
            rows={2}
            className="admin-field resize-y"
            placeholder="Note shown with the quote (optional)"
            aria-label="Quote note"
            value={quoteNote}
            onChange={(event) => setQuoteNote(event.target.value)}
          />
          <AdminButton
            type="button"
            className="w-full"
            disabled={busy === "quote" || !amount}
            onClick={async () => {
              const done = await call(
                {
                  quoteAmount: Number(amount),
                  quoteNote: quoteNote || undefined,
                },
                "quote",
              );
              if (done) setQuoteNote("");
            }}
          >
            {busy === "quote" ? "Sending…" : "Send quote"}
          </AdminButton>
        </div>
      </AdminCard>

      <AdminCard title="Status">
        <div className="space-y-3">
          <select
            value={nextStatus}
            onChange={(event) =>
              setNextStatus(event.target.value as CustomRequestStatus)
            }
            aria-label="Request status"
            className="admin-field"
          >
            {CUSTOM_REQUEST_STATUSES.map((value) => (
              <option key={value} value={value}>
                {REQUEST_STATUS_LABELS[value]}
              </option>
            ))}
          </select>
          <AdminButton
            type="button"
            className="w-full"
            variant="secondary"
            disabled={busy === "status" || nextStatus === status}
            onClick={() => void call({ status: nextStatus }, "status")}
          >
            {busy === "status" ? "Updating…" : "Update status"}
          </AdminButton>

          <div className="grid grid-cols-2 gap-2">
            <AdminButton
              type="button"
              size="sm"
              disabled={busy === "approve"}
              onClick={() => void call({ status: "APPROVED" }, "approve")}
            >
              Approve
            </AdminButton>
            <AdminButton
              type="button"
              size="sm"
              variant="danger"
              disabled={busy === "reject"}
              onClick={() => void call({ status: "REJECTED" }, "reject")}
            >
              Decline
            </AdminButton>
          </div>
        </div>
      </AdminCard>

      <AdminCard title="Message the customer">
        <div className="space-y-3">
          <textarea
            rows={3}
            className="admin-field resize-y"
            placeholder="This appears on their request page."
            aria-label="Customer note"
            value={customerNote}
            onChange={(event) => setCustomerNote(event.target.value)}
          />
          <AdminButton
            type="button"
            variant="secondary"
            className="w-full"
            disabled={busy === "customer" || !customerNote.trim()}
            onClick={async () => {
              const done = await call(
                { customerNote, status: "NEEDS_CLARIFICATION" },
                "customer",
              );
              if (done) setCustomerNote("");
            }}
          >
            {busy === "customer" ? "Sending…" : "Send message"}
          </AdminButton>
        </div>
      </AdminCard>

      <AdminCard title="Internal note">
        <div className="space-y-3">
          <textarea
            rows={3}
            className="admin-field resize-y"
            placeholder="Only your team sees this."
            aria-label="Internal note"
            value={internalNote}
            onChange={(event) => setInternalNote(event.target.value)}
          />
          <AdminButton
            type="button"
            variant="secondary"
            className="w-full"
            disabled={busy === "internal" || !internalNote.trim()}
            onClick={async () => {
              const done = await call({ internalNote }, "internal");
              if (done) setInternalNote("");
            }}
          >
            {busy === "internal" ? "Saving…" : "Add note"}
          </AdminButton>
        </div>
      </AdminCard>
    </div>
  );
}
