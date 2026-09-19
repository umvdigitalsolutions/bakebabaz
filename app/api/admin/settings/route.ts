import { assertSameOrigin, fail, handleRouteError, ok } from "@/lib/api";
import { getVerifiedAdmin, canManage } from "@/lib/auth/guards";
import { getStoreSettings, updateStoreSettings } from "@/lib/data/settings";
import { z } from "zod";

/**
 * Settings arrive as dotted paths (`brand.name`, `customCake.mode`) so the UI
 * can patch one field without sending the whole document. Only paths on this
 * allowlist are writable — a crafted key can't reach anything else.
 */
const WRITABLE_PREFIXES = [
  "brand.",
  "announcement.",
  "hero.",
  "homepage.",
  "story.",
  "customCake.",
  "payments.",
  "delivery.",
  "policies.",
  "seo.",
  "faqs",
];

const patchSchema = z.record(z.string(), z.unknown());

export async function GET() {
  try {
    const admin = await getVerifiedAdmin();
    if (!admin) return fail("Not authorised.", 401);
    return ok(await getStoreSettings());
  } catch (error) {
    return handleRouteError(error, "admin:settings:get");
  }
}

export async function PATCH(request: Request) {
  try {
    assertSameOrigin(request);
    const admin = await getVerifiedAdmin();
    if (!admin) return fail("Not authorised.", 401);
    if (!canManage(admin, "manager")) {
      return fail("Your role can't change store settings.", 403);
    }

    const body = patchSchema.parse(await request.json());
    const patch: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(body)) {
      const allowed = WRITABLE_PREFIXES.some(
        (prefix) => key === prefix || key.startsWith(prefix),
      );
      if (!allowed) {
        return fail(`"${key}" is not an editable setting.`, 400);
      }
      // Reject prototype-pollution style keys outright.
      if (key.includes("__proto__") || key.includes("constructor")) {
        return fail("Invalid setting key.", 400);
      }
      patch[key] = value;
    }

    if (Object.keys(patch).length === 0) {
      return fail("Nothing to update.", 400);
    }

    return ok(await updateStoreSettings(patch));
  } catch (error) {
    return handleRouteError(error, "admin:settings:update");
  }
}
