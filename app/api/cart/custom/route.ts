import { assertSameOrigin, fail, handleRouteError, ok } from "@/lib/api";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import {
  ensureCartToken,
  loadCartDocument,
  priceCart,
} from "@/lib/cart/service";
import { addCustomCakeToCartSchema } from "@/lib/validation/cart";
import { getPricingCatalog } from "@/lib/pricing/catalog";
import { calculateCustomCakePrice } from "@/lib/pricing/engine";
import { getStoreSettings } from "@/lib/data/settings";
import { validateDeliveryWindow } from "@/lib/delivery/validate";
import { connectToDatabase } from "@/lib/db/mongoose";
import { AddOn } from "@/models/AddOn";
import { nanoid } from "@/lib/utils";

/**
 * Adds a configured custom cake to the cart. Only reachable when the store is
 * in `instant` mode — approval mode routes through /api/custom-cake instead.
 */
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const limit = rateLimit(clientKey(request, "cart-custom"), 30, 60);
    if (!limit.allowed)
      return fail("Too many requests. Please wait a moment.", 429);

    const body = addCustomCakeToCartSchema.parse(await request.json());
    await connectToDatabase();

    const [settings, catalog] = await Promise.all([
      getStoreSettings(),
      getPricingCatalog(),
    ]);

    if (settings.customCake.mode !== "instant") {
      return fail(
        "Custom cakes are reviewed by our team before checkout. Please submit your design for a quote.",
        409,
      );
    }

    const weightKg = (body.config.weightGrams ?? 1000) / 1000;
    const quote = calculateCustomCakePrice(catalog, {
      flavour: body.config.flavour,
      filling: body.config.filling,
      shape: body.config.shape,
      style: body.config.style,
      weightKg,
      eggPreference: body.config.eggPreference,
      tiers: body.config.tiers,
      message: body.config.message,
      addOns: (body.config.addOns ?? []).map((addOn) => addOn.id ?? ""),
      requiredDate: body.requiredDate,
    });

    if (quote.warnings.length) {
      return fail(quote.warnings[0]);
    }

    if (body.deliverySlot) {
      const check = await validateDeliveryWindow({
        date: body.requiredDate,
        slot: body.deliverySlot,
        requiredLeadHours: quote.prepTimeHours,
      });
      if (!check.ok) return fail(check.error);
    }

    // Re-price add-ons from the database; the browser's numbers are ignored.
    const addOnIds = (body.config.addOns ?? [])
      .map((addOn) => addOn.id)
      .filter((id): id is string => Boolean(id));
    const addOnDocs = addOnIds.length
      ? await AddOn.find({ _id: { $in: addOnIds }, active: true }).lean()
      : [];

    const token = await ensureCartToken();
    const cart = await loadCartDocument(token, true);
    if (!cart) return fail("Could not open your cart. Please try again.", 500);

    cart.items.push({
      key: `c_${nanoid(12)}`,
      kind: "custom",
      name: buildCustomCakeName(
        catalog,
        body.config.flavour,
        body.config.style,
      ),
      categoryName: "Custom Cakes",
      image: body.config.referenceImages?.[0],
      config: {
        ...body.config,
        addOns: addOnDocs.map((doc) => ({
          id: String(doc._id),
          name: doc.name,
          price: doc.price,
        })),
      },
      quantity: body.quantity,
      requiredDate: body.requiredDate,
      deliverySlot: body.deliverySlot,
      savedForLater: false,
    });

    await cart.save();
    return ok(await priceCart(cart));
  } catch (error) {
    return handleRouteError(error, "cart:custom");
  }
}

/**
 * Names the line the way a customer would read it — "Custom Belgian Chocolate
 * Fondant Cake", not the slugs the configuration is stored under.
 */
function buildCustomCakeName(
  catalog: Awaited<ReturnType<typeof getPricingCatalog>>,
  flavour?: string,
  style?: string,
) {
  const label = (type: string, value?: string) =>
    value
      ? (catalog.options.find(
          (option) => option.type === type && option.value === value,
        )?.label ?? undefined)
      : undefined;

  const parts = [label("flavour", flavour), label("style", style)].filter(
    Boolean,
  );

  return parts.length
    ? `Custom ${parts.join(" ")} Cake`
    : "Custom Designed Cake";
}
