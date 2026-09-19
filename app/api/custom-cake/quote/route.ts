import { assertSameOrigin, handleRouteError, ok } from "@/lib/api";
import { quoteRequestSchema } from "@/lib/validation/custom-cake";
import { getPricingCatalog } from "@/lib/pricing/catalog";
import { calculateCustomCakePrice } from "@/lib/pricing/engine";

/**
 * Server-authoritative price for a configuration. The builder prices locally
 * for instant feedback; this endpoint exists so any client — including a future
 * mobile app — can get the canonical number.
 */
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const { config } = quoteRequestSchema.parse(await request.json());
    const catalog = await getPricingCatalog();
    const quote = calculateCustomCakePrice(catalog, config);
    return ok(quote);
  } catch (error) {
    return handleRouteError(error, "custom-cake:quote");
  }
}
