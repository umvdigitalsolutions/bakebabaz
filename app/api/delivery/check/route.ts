import { fail, handleRouteError, ok } from "@/lib/api";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { pincodeSchema } from "@/lib/validation/common";
import { resolveDeliveryFee } from "@/lib/delivery/validate";

/** Live delivery-fee lookup used by the checkout address form. */
export async function GET(request: Request) {
  try {
    const limit = rateLimit(clientKey(request, "pincode"), 60, 60);
    if (!limit.allowed) return fail("Too many lookups.", 429);

    const url = new URL(request.url);
    const parsed = pincodeSchema.safeParse(
      url.searchParams.get("pincode") ?? "",
    );
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? "Invalid PIN code.");
    }

    const subtotal = Number(url.searchParams.get("subtotal")) || 0;
    const result = await resolveDeliveryFee({
      type: "delivery",
      pincode: parsed.data,
      subtotal,
    });

    if (!result.ok) return fail(result.error, 200);

    return ok({
      fee: result.fee,
      zone: result.zone,
      freeAbove: result.freeAbove,
    });
  } catch (error) {
    return handleRouteError(error, "delivery:check");
  }
}
