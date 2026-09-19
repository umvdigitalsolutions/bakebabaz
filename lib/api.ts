import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

export function fail(
  error: string,
  status = 400,
  extra?: Record<string, unknown>,
) {
  return NextResponse.json({ ok: false, error, ...extra }, { status });
}

/**
 * Never leaks stack traces or database internals to the client; the detail goes
 * to the server log instead.
 */
export function handleRouteError(error: unknown, context: string) {
  if (error instanceof ZodError) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of error.issues) {
      const key = issue.path.join(".") || "form";
      fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message];
    }
    return NextResponse.json(
      { ok: false, error: "Please check the highlighted fields.", fieldErrors },
      { status: 422 },
    );
  }

  // A deliberate 4xx is a business rule doing its job — "that slot is too soon",
  // "this item just sold out". Surface it to the caller without filling the
  // server log with things that aren't faults.
  if (error instanceof Error && "statusCode" in error) {
    const status = Number((error as { statusCode: unknown }).statusCode);
    if (status >= 400 && status < 500) {
      return fail(error.message, status);
    }
  }

  console.error(`[api:${context}]`, error);
  return fail("Something went wrong on our end. Please try again.", 500);
}

export class HttpError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

/**
 * Blocks cross-site form posts. Combined with SameSite cookies this gives
 * CSRF protection without a token round-trip.
 */
export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return; // same-origin fetches from the app omit Origin on GET
  const host = request.headers.get("host");
  const allowed = new Set<string>();
  if (host) {
    allowed.add(`http://${host}`);
    allowed.add(`https://${host}`);
  }
  if (process.env.NEXT_PUBLIC_APP_URL) {
    allowed.add(process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, ""));
  }
  if (!allowed.has(origin)) {
    throw new HttpError("Request blocked: cross-origin write rejected.", 403);
  }
}
