"use client";

import { useState } from "react";
import { CalendarOff, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { AdminButton } from "./AdminShell";
import { formatDate, toDateInputValue } from "@/lib/utils";

/**
 * Holidays and closures. A blocked date is rejected by the delivery validator
 * on the server too, so a stale browser tab can't book one.
 */
export function BlockedDatesEditor({ initial }: { initial: string[] }) {
  const [dates, setDates] = useState<string[]>(initial);
  const [next, setNext] = useState("");
  const [saving, setSaving] = useState(false);

  const persist = async (value: string[]) => {
    setSaving(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ "delivery.blockedDates": value }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error ?? "Could not save.");
      }
      setDates(value);
      toast.success("Closed dates updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex-1 sm:max-w-[220px]">
          <label className="admin-label" htmlFor="blocked-date">
            Add a closed date
          </label>
          <input
            id="blocked-date"
            type="date"
            min={toDateInputValue(new Date())}
            value={next}
            onChange={(event) => setNext(event.target.value)}
            className="admin-field"
          />
        </div>
        <AdminButton
          type="button"
          disabled={!next || saving || dates.includes(next)}
          onClick={() => {
            void persist([...dates, next].sort());
            setNext("");
          }}
        >
          <Plus className="size-4" />
          Add
        </AdminButton>
      </div>

      {dates.length === 0 ? (
        <p className="mt-4 flex items-center gap-2 text-[13px] text-[#64748b]">
          <CalendarOff className="size-4" />
          No closed dates. The bakery is bookable every day.
        </p>
      ) : (
        <ul className="mt-4 flex flex-wrap gap-2">
          {dates.map((date) => (
            <li key={date}>
              <button
                type="button"
                disabled={saving}
                onClick={() => void persist(dates.filter((d) => d !== date))}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#fee2e2] px-3 py-1.5 text-[12.5px] font-semibold text-[#991b1b] transition-colors hover:bg-[#fecaca] disabled:opacity-60"
              >
                {formatDate(date)}
                <X className="size-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
