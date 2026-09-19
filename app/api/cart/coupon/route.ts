import { assertSameOrigin, fail, handleRouteError, ok } from "@/lib/api";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { couponSchema } from "@/lib/validation/cart";
import {
  ensureCartToken,
  evaluateCoupon,
  loadCartDocument,
  priceCart,
} from "@/lib/cart/service";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    // Coupon codes are guessable, so the endpoint is limited aggressively.
    const limit = rateLimit(clientKey(request, "coupon"), 12, 300);
    if (!limit.allowed) {
      return fail(
        `Too many coupon attempts. Try again in ${Math.ceil(limit.retryAfterSeconds / 60)} minutes.`,
        429,
      );
    }

    const { code } = couponSchema.parse(await request.json());
    const token = await ensureCartToken();
    const cart = await loadCartDocument(token);
    if (!cart || !cart.items.length) return fail("Your cart is empty.");

    const priced = await priceCart(cart);
    const result = await evaluateCoupon({
      code,
      subtotal: priced.totals.subtotal,
      items: priced.items,
      userId: cart.user ? String(cart.user) : undefined,
    });

    if (!result.ok) return fail(result.error);

    cart.couponCode = result.code;
    await cart.save();
    return ok(await priceCart(cart));
  } catch (error) {
    return handleRouteError(error, "cart:coupon");
  }
}

export async function DELETE(request: Request) {
  try {
    assertSameOrigin(request);
    const token = await ensureCartToken();
    const cart = await loadCartDocument(token);
    if (!cart) return fail("Your cart is empty.", 404);
    cart.couponCode = undefined;
    await cart.save();
    return ok(await priceCart(cart));
  } catch (error) {
    return handleRouteError(error, "cart:coupon-remove");
  }
}
