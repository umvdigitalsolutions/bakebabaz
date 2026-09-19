import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

/** Formats paise-free rupee amounts as ₹1,850. */
export function formatINR(amount: number) {
  return inrFormatter.format(Math.round(amount || 0));
}

export function formatINRPlain(amount: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(
    Math.round(amount || 0),
  );
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function formatWeight(grams: number) {
  if (!grams) return "";
  return grams >= 1000
    ? `${Number((grams / 1000).toFixed(2))} kg`
    : `${grams} g`;
}

export function formatDate(value: string | Date | undefined | null) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(value: string | Date | undefined | null) {
  if (!value) return "";
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** `2026-08-31` in local time — the format every date input uses. */
export function toDateInputValue(date: Date) {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function titleCase(input: string) {
  return input
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function truncate(input: string, length = 120) {
  if (!input) return "";
  return input.length > length
    ? `${input.slice(0, length - 1).trimEnd()}…`
    : input;
}

/** Stable pseudo-random id for cart lines and optimistic UI keys. */
export function nanoid(size = 16) {
  const alphabet = "0123456789abcdefghijklmnopqrstuvwxyz";
  let out = "";
  const bytes = new Uint8Array(size);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < size; i += 1)
      bytes[i] = Math.floor(Math.random() * 256);
  }
  for (let i = 0; i < size; i += 1) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isValidObjectId(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-fA-F]{24}$/.test(value);
}

/**
 * Curls straight quotes in display copy. Owner-edited CMS text usually arrives
 * with typewriter quotes, which look broken at headline sizes in Fraunces.
 */
export function smartQuotes(input: string) {
  if (!input) return "";
  return input
    .replace(/(^|[\s([{“‘—–-])"/g, "$1“")
    .replace(/"/g, "”")
    .replace(/(^|[\s([{“—–-])'/g, "$1‘")
    .replace(/'/g, "’");
}

/**
 * The root layout appends "· Bake Baba'z" to every page title. Owner-written
 * SEO titles often include the brand already, so those opt out of the template
 * instead of rendering the name twice.
 */
export function pageTitle(title: string) {
  return /bake\s*baba/i.test(title) ? { absolute: title } : title;
}
