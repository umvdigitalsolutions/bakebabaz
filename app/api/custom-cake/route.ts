import { assertSameOrigin, fail, handleRouteError, ok } from "@/lib/api";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { customCakeRequestSchema } from "@/lib/validation/custom-cake";
import { getPricingCatalog } from "@/lib/pricing/catalog";
import { calculateCustomCakePrice } from "@/lib/pricing/engine";
import { getStoreSettings } from "@/lib/data/settings";
import { validateDeliveryWindow } from "@/lib/delivery/validate";
import { connectToDatabase } from "@/lib/db/mongoose";
import { AddOn } from "@/models/AddOn";
import { CustomCakeRequest } from "@/models/CustomCakeRequest";
import { generateRequestNumber } from "@/lib/orders/numbering";
import { notify } from "@/lib/notifications/service";

/**
 * Approval-mode submissions. The estimate stored here is computed server-side
 * from the live catalog — the browser's number is never persisted.
 */
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const limit = rateLimit(clientKey(request, "custom-cake"), 8, 600);
    if (!limit.allowed) {
      return fail(
        "You've sent several requests already. Please give us a little time to reply.",
        429,
      );
    }

    const body = customCakeRequestSchema.parse(await request.json());
    await connectToDatabase();

    const [catalog, settings] = await Promise.all([
      getPricingCatalog(),
      getStoreSettings(),
    ]);

    const quote = calculateCustomCakePrice(catalog, {
      ...body.config,
      addOns: body.config.addOns,
    });

    if (quote.warnings.length) return fail(quote.warnings[0]);

    if (body.config.deliverySlot) {
      const check = await validateDeliveryWindow({
        date: body.config.requiredDate,
        slot: body.config.deliverySlot,
        requiredLeadHours: quote.prepTimeHours,
      });
      if (!check.ok) return fail(check.error);
    }

    const addOnDocs = body.config.addOns.length
      ? await AddOn.find({
          _id: { $in: body.config.addOns },
          active: true,
        }).lean()
      : [];

    const requestNumber = await generateRequestNumber();

    const created = await CustomCakeRequest.create({
      requestNumber,
      contact: {
        name: body.contact.name,
        phone: body.contact.phone,
        email: body.contact.email || undefined,
      },
      celebration: {
        occasion: body.config.occasion,
        requiredDate: body.config.requiredDate,
        deliverySlot: body.config.deliverySlot,
        servings: body.config.servings,
      },
      cake: {
        style: body.config.style,
        flavour: body.config.flavour,
        filling: body.config.filling,
        shape: body.config.shape,
        weightKg: body.config.weightKg,
        eggPreference: body.config.eggPreference,
        tiers: body.config.tiers,
        colourTheme: body.config.colourTheme,
        message: body.config.message,
        addOns: addOnDocs.map((doc) => ({
          id: String(doc._id),
          name: doc.name,
          price: doc.price,
        })),
      },
      referenceImages: body.config.referenceImages,
      notes: body.config.notes,
      estimate: { lineItems: quote.lineItems, total: quote.total },
      status: "NEW",
      statusHistory: [{ status: "NEW", at: new Date(), by: "customer" }],
    });

    const notification = {
      requestNumber,
      customerName: body.contact.name,
      customerEmail: body.contact.email,
      estimate: quote.total,
      requiredDate: body.config.requiredDate,
      brandName: settings.brand.name,
    };
    await Promise.all([
      notify("custom_cake_received", notification),
      notify("custom_cake_request", notification),
    ]);

    return ok({ requestNumber: created.requestNumber, estimate: quote.total });
  } catch (error) {
    return handleRouteError(error, "custom-cake:create");
  }
}
