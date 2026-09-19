"use client";

import { useMemo } from "react";
import { CalendarDays, Clock } from "lucide-react";
import { cn, formatINR } from "@/lib/utils";

export type SlotOption = {
  label: string;
  startTime: string;
  surcharge?: number;
};

/**
 * Enforces the kitchen's lead time in the UI: dates that can't be met are out
 * of range, and slots that start too soon are disabled with the reason shown.
 * The server re-runs the same rules at checkout — this is convenience, not
 * security.
 */
export function DeliveryDatePicker({
  slots,
  minLeadHours,
  blockedDates = [],
  maxDaysAhead = 90,
  date,
  slot,
  onDateChange,
  onSlotChange,
  dateError,
  slotError,
  className,
  label = "Delivery date",
  slotLabel = "Delivery slot",
  referenceTime,
}: {
  slots: SlotOption[];
  minLeadHours: number;
  blockedDates?: string[];
  maxDaysAhead?: number;
  date?: string;
  slot?: string;
  onDateChange: (date: string) => void;
  onSlotChange: (slot: string) => void;
  dateError?: string;
  slotError?: string;
  className?: string;
  label?: string;
  slotLabel?: string;
  referenceTime: string;
}) {
  const nowMs = Date.parse(referenceTime);
  const today = indiaDateKey(nowMs);
  // useMemo dependencies must be simple expressions, so the blocked-date list
  // is reduced to a stable string first.
  const blockedKey = blockedDates.join(",");

  // Earliest date where at least one slot still satisfies the lead time.
  const minDate = useMemo(() => {
    for (let offset = 0; offset <= maxDaysAhead; offset += 1) {
      const key = addDaysToKey(today, offset);
      if (blockedDates.includes(key)) continue;
      const hasSlot = slots.some((option) =>
        slotIsAvailable(option, key, nowMs, minLeadHours),
      );
      if (hasSlot) return key;
    }
    return addDaysToKey(today, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slots, minLeadHours, maxDaysAhead, blockedKey, nowMs, today]);

  const maxDate = addDaysToKey(today, maxDaysAhead);
  const isBlocked = date ? blockedDates.includes(date) : false;

  return (
    <div className={cn("space-y-5", className)}>
      <div>
        <label className="field-label" htmlFor="delivery-date">
          <span className="inline-flex items-center gap-2">
            <CalendarDays className="text-coral size-3.5" />
            {label}
            <span className="text-coral">*</span>
          </span>
        </label>
        <input
          id="delivery-date"
          type="date"
          value={date ?? ""}
          min={minDate}
          max={maxDate}
          onChange={(event) => onDateChange(event.target.value)}
          aria-invalid={dateError || isBlocked ? true : undefined}
          className="field"
        />
        {dateError ? (
          <p className="field-error">{dateError}</p>
        ) : isBlocked ? (
          <p className="field-error">
            We&rsquo;re closed on that date. Please pick another day.
          </p>
        ) : (
          <p className="field-hint">
            This design needs about {minLeadHours} hours of preparation, so the
            earliest date we can offer is {formatFriendly(minDate)}.
          </p>
        )}
      </div>

      <fieldset className="border-0 p-0">
        <legend className="field-label">
          <span className="inline-flex items-center gap-2">
            <Clock className="text-coral size-3.5" />
            {slotLabel}
            <span className="text-coral">*</span>
          </span>
        </legend>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {slots.map((option) => {
            const available = date
              ? slotIsAvailable(option, date, nowMs, minLeadHours)
              : true;
            return (
              <button
                key={option.label}
                type="button"
                disabled={!available || !date}
                data-selected={slot === option.label}
                // Struck-through means "too soon for this date". Before a date
                // is picked the slots are merely inactive, not unavailable.
                data-disabled={(date && !available) || undefined}
                onClick={() => onSlotChange(option.label)}
                className="choice-pill justify-between px-4 text-left text-[13.5px] disabled:cursor-not-allowed disabled:opacity-50"
                title={
                  !date
                    ? "Choose a date first"
                    : !available
                      ? "Not enough preparation time for this slot"
                      : undefined
                }
              >
                <span>{option.label}</span>
                {option.surcharge ? (
                  <span className="text-coral-dark flex-none text-[11px] font-bold">
                    +{formatINR(option.surcharge)}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
        {slotError ? <p className="field-error">{slotError}</p> : null}
        {!date ? (
          <p className="field-hint">Choose a date to see available slots.</p>
        ) : null}
      </fieldset>
    </div>
  );
}

export function slotIsAvailable(
  slot: SlotOption,
  dateKey: string,
  nowMs: number,
  minLeadHours: number,
) {
  const startMs = Date.parse(`${dateKey}T${slot.startTime}:00+05:30`);
  return (startMs - nowMs) / 3_600_000 >= minLeadHours;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function formatFriendly(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return `${WEEKDAYS[weekday]}, ${day} ${MONTHS[month - 1]}`;
}

export function indiaDateKey(timestamp: number) {
  const indiaTime = new Date(timestamp + 5.5 * 60 * 60 * 1000);
  return datePartsToKey(
    indiaTime.getUTCFullYear(),
    indiaTime.getUTCMonth() + 1,
    indiaTime.getUTCDate(),
  );
}

function addDaysToKey(dateKey: string, days: number) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const result = new Date(Date.UTC(year, month - 1, day + days));
  return datePartsToKey(
    result.getUTCFullYear(),
    result.getUTCMonth() + 1,
    result.getUTCDate(),
  );
}

function datePartsToKey(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
