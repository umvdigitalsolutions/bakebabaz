import "server-only";
import { connectToDatabase } from "@/lib/db/mongoose";
import { DeliverySlot } from "@/models/DeliverySlot";
import { DeliveryZone } from "@/models/DeliveryZone";
import { getStoreSettings } from "@/lib/data/settings";
import { deliverySlots } from "@/scripts/seed-data";

export type DeliveryCheck =
  | { ok: true; fee: number; zone?: string; freeAbove?: number }
  | { ok: false; error: string };

/**
 * Confirms a delivery date/slot pair satisfies the longest lead time in the
 * cart. Runs again at checkout so a stale browser tab cannot book an
 * impossible slot.
 */
export async function validateDeliveryWindow(options: {
  date: string;
  slot: string;
  requiredLeadHours: number;
  now?: Date;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const now = options.now ?? new Date();
  await connectToDatabase();
  const settings = await getStoreSettings();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(options.date)) {
    return { ok: false, error: "Please choose a valid delivery date." };
  }

  if (settings.delivery.blockedDates.includes(options.date)) {
    return {
      ok: false,
      error: "We are closed on that date. Please pick another day.",
    };
  }

  const todayKey = indiaDateKey(now.getTime());
  const maxDateKey = addDaysToKey(todayKey, settings.delivery.maxDaysAhead);
  if (options.date > maxDateKey) {
    return {
      ok: false,
      error: `We take orders up to ${settings.delivery.maxDaysAhead} days ahead.`,
    };
  }

  const configuredSlot = await DeliverySlot.findOne({
    label: options.slot,
    active: true,
  }).lean();
  const slot =
    configuredSlot ??
    ((await DeliverySlot.countDocuments({})) === 0
      ? deliverySlots.find((item) => item.label === options.slot)
      : undefined);
  if (!slot) {
    return { ok: false, error: "That delivery slot is no longer available." };
  }

  const slotStart = new Date(`${options.date}T${slot.startTime}:00+05:30`);

  const leadHours = (slotStart.getTime() - now.getTime()) / 3_600_000;
  const required = Math.max(
    options.requiredLeadHours,
    settings.delivery.minLeadHours,
  );

  if (leadHours < required) {
    return {
      ok: false,
      error: `This order needs at least ${required} hours of preparation time. Please choose a later date or slot.`,
    };
  }

  if (options.date === todayKey && !settings.delivery.sameDayEnabled) {
    return { ok: false, error: "Same-day delivery is currently unavailable." };
  }

  return { ok: true };
}

/** Resolves the delivery fee for a pincode against the admin-defined zones. */
export async function resolveDeliveryFee(options: {
  type: "delivery" | "pickup";
  pincode?: string;
  subtotal: number;
}): Promise<DeliveryCheck> {
  await connectToDatabase();
  const settings = await getStoreSettings();

  if (options.type === "pickup") {
    if (!settings.delivery.pickupEnabled) {
      return { ok: false, error: "Store pickup is currently unavailable." };
    }
    return { ok: true, fee: 0, zone: "Store pickup" };
  }

  if (!options.pincode || !/^\d{6}$/.test(options.pincode)) {
    return { ok: false, error: "Enter a valid 6-digit PIN code." };
  }

  const zone = await DeliveryZone.findOne({
    pincode: options.pincode,
    active: true,
  }).lean();

  if (!zone) {
    return {
      ok: false,
      error: `We don't deliver to ${options.pincode} yet. Try store pickup, or message us on WhatsApp.`,
    };
  }

  if (zone.minOrder && options.subtotal < zone.minOrder) {
    return {
      ok: false,
      error: `Orders to ${zone.area} start at ₹${zone.minOrder}.`,
    };
  }

  const threshold = zone.freeAbove ?? settings.delivery.freeDeliveryThreshold;
  const fee = threshold && options.subtotal >= threshold ? 0 : zone.fee;

  return { ok: true, fee, zone: zone.area, freeAbove: threshold };
}

export async function getActiveSlots() {
  await connectToDatabase();
  const slots = await DeliverySlot.find({ active: true })
    .sort({ sortOrder: 1 })
    .lean();
  if (slots.length > 0 || (await DeliverySlot.countDocuments({})) > 0) {
    return slots;
  }
  return deliverySlots.map((slot) => ({
    ...slot,
    surcharge: "surcharge" in slot ? slot.surcharge : 0,
  }));
}

function indiaDateKey(timestamp: number) {
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
