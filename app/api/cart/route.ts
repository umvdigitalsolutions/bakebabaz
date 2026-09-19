import { getPricedCart } from "@/lib/cart/service";
import { handleRouteError, ok } from "@/lib/api";

export async function GET() {
  try {
    const cart = await getPricedCart();
    return ok(cart);
  } catch (error) {
    return handleRouteError(error, "cart:get");
  }
}
