"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AdminButton, AdminCard } from "./AdminShell";
import { STATUS_LABELS } from "@/components/shared/OrderTimeline";
import { ORDER_STATUSES, type OrderStatus } from "@/types";

/** Status, payment and internal-note controls on an order. */
export function OrderActions({
  orderId,
  status,
  paymentStatus,
  deliveryType,
}: {
  orderId: string;
  status: OrderStatus;
  paymentStatus: string;
  deliveryType: "delivery" | "pickup";
}) {
  const router = useRouter();
  const [nextStatus, setNextStatus] = useState<OrderStatus>(status);
  const [statusNote, setStatusNote] = useState("");
  const [payment, setPayment] = useState(paymentStatus);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const call = async (body: Record<string, unknown>, key: string) => {
    setBusy(key);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error ?? "Update failed.");
      }
      toast.success("Order updated");
      router.refresh();
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed.");
      return false;
    } finally {
      setBusy(null);
    }
  };

  // Pickup orders never go "out for delivery"; delivery orders never sit
  // "ready for pickup".
  const statuses = ORDER_STATUSES.filter((value) =>
    deliveryType === "pickup"
      ? value !== "OUT_FOR_DELIVERY"
      : value !== "READY_FOR_PICKUP",
  );

  return (
    <div className="space-y-4">
      <AdminCard title="Order status">
        <div className="space-y-3">
          <select
            value={nextStatus}
            onChange={(event) =>
              setNextStatus(event.target.value as OrderStatus)
            }
            aria-label="Order status"
            className="admin-field"
          >
            {statuses.map((value) => (
              <option key={value} value={value}>
                {STATUS_LABELS[value]}
              </option>
            ))}
          </select>
          <input
            value={statusNote}
            onChange={(event) => setStatusNote(event.target.value)}
            placeholder="Note for the timeline (optional)"
            aria-label="Status note"
            className="admin-field"
          />
          <AdminButton
            type="button"
            className="w-full"
            disabled={busy === "status" || nextStatus === status}
            onClick={async () => {
              const done = await call(
                {
                  action: "status",
                  status: nextStatus,
                  note: statusNote || undefined,
                },
                "status",
              );
              if (done) setStatusNote("");
            }}
          >
            {busy === "status" ? "Updating…" : "Update status"}
          </AdminButton>
          {nextStatus === "CANCELLED" ? (
            <p className="text-[12px] text-[#b3261e]">
              Cancelling returns any reserved stock to inventory.
            </p>
          ) : null}
        </div>
      </AdminCard>

      <AdminCard title="Payment">
        <div className="space-y-3">
          <select
            value={payment}
            onChange={(event) => setPayment(event.target.value)}
            aria-label="Payment status"
            className="admin-field"
          >
            <option value="PENDING">Pending</option>
            <option value="PAID">Paid</option>
            <option value="COD_PENDING">
              Cash on delivery — not collected
            </option>
            <option value="FAILED">Failed</option>
            <option value="REFUNDED">Refunded</option>
          </select>
          <AdminButton
            type="button"
            variant="secondary"
            className="w-full"
            disabled={busy === "payment" || payment === paymentStatus}
            onClick={() =>
              void call({ action: "payment", status: payment }, "payment")
            }
          >
            {busy === "payment" ? "Updating…" : "Update payment"}
          </AdminButton>
          <p className="text-[12px] text-[#94a3b8]">
            Online payments settle automatically once Razorpay confirms them.
            Use this for cash collected in person or a manual refund.
          </p>
        </div>
      </AdminCard>

      <AdminCard title="Internal note">
        <div className="space-y-3">
          <textarea
            rows={3}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Only your team sees this."
            aria-label="Internal note"
            className="admin-field resize-y"
          />
          <AdminButton
            type="button"
            variant="secondary"
            className="w-full"
            disabled={busy === "note" || !note.trim()}
            onClick={async () => {
              const done = await call({ action: "note", text: note }, "note");
              if (done) setNote("");
            }}
          >
            {busy === "note" ? "Saving…" : "Add note"}
          </AdminButton>
        </div>
      </AdminCard>
    </div>
  );
}
