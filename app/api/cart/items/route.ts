import { NextResponse } from "next/server";
import { assertSameOrigin, fail, handleRouteError, ok } from "@/lib/api";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import {
  ensureCartToken,
  loadCartDocument,
  priceCart,
} from "@/lib/cart/service";
import { productCartKey } from "@/lib/cart/key";
import {
  addProductToCartSchema,
  updateCartItemSchema,
} from "@/lib/validation/cart";
import { connectToDatabase } from "@/lib/db/mongoose";
import { Product } from "@/models/Product";
import { AddOn } from "@/models/AddOn";
import type { CartItemConfig } from "@/types";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const limit = rateLimit(clientKey(request, "cart-add"), 60, 60);
    if (!limit.allowed)
      return fail("Too many requests. Slow down a moment.", 429);

    const body = addProductToCartSchema.parse(await request.json());
    await connectToDatabase();

    const product = await Product.findById(body.productId)
      .populate<{ category: { name: string } }>("category", "name")
      .lean();

    if (!product || product.status !== "active") {
      return fail("That product is no longer available.", 404);
    }

    // Every option is re-validated against the product document.
    const config: CartItemConfig = { ...(body.config ?? {}) };

    if (product.weights?.length) {
      const variant =
        product.weights.find((weight) => weight.label === config.weightLabel) ??
        product.weights[0];
      config.weightLabel = variant.label;
      config.weightGrams = variant.grams;
    }

    if (
      config.flavour &&
      !product.flavours?.some((f) => f.name === config.flavour)
    ) {
      return fail(`"${config.flavour}" isn't available for this product.`);
    }
    if (
      config.filling &&
      !product.fillings?.some((f) => f.name === config.filling)
    ) {
      return fail(`"${config.filling}" isn't available for this product.`);
    }
    if (config.shape && !product.shapes?.some((s) => s.name === config.shape)) {
      return fail(`"${config.shape}" isn't available for this product.`);
    }
    if (
      config.eggPreference &&
      !product.eggOptions?.includes(config.eggPreference)
    ) {
      return fail("That egg preference isn't available for this product.");
    }
    if (!product.allowMessage) delete config.message;

    if (config.addOns?.length) {
      const ids = config.addOns
        .map((addOn) => addOn.id)
        .filter((id): id is string => Boolean(id));
      const docs = await AddOn.find({ _id: { $in: ids }, active: true }).lean();
      config.addOns = docs.map((doc) => ({
        id: String(doc._id),
        name: doc.name,
        price: doc.price,
      }));
    }

    if (!product.unlimitedStock && product.stock < body.quantity) {
      return fail(
        product.stock > 0
          ? `Only ${product.stock} left in stock.`
          : "This item is out of stock.",
      );
    }

    const token = await ensureCartToken();
    const cart = await loadCartDocument(token, true);
    if (!cart) return fail("Could not open your cart. Please try again.", 500);

    const key = productCartKey(body.productId, config);
    const existing = cart.items.find((item) => item.key === key);

    if (existing) {
      existing.quantity = Math.min(existing.quantity + body.quantity, 50);
      existing.savedForLater = false;
      if (body.requiredDate) existing.requiredDate = body.requiredDate;
      if (body.deliverySlot) existing.deliverySlot = body.deliverySlot;
    } else {
      cart.items.push({
        key,
        kind: "product",
        product: product._id,
        name: product.name,
        slug: product.slug,
        categoryName: product.category?.name,
        image: product.images?.[0],
        config,
        quantity: body.quantity,
        requiredDate: body.requiredDate,
        deliverySlot: body.deliverySlot,
        savedForLater: false,
      });
    }

    await cart.save();
    return ok(await priceCart(cart));
  } catch (error) {
    return handleRouteError(error, "cart:add");
  }
}

export async function PATCH(request: Request) {
  try {
    assertSameOrigin(request);
    const body = updateCartItemSchema.parse(await request.json());
    const token = await ensureCartToken();
    const cart = await loadCartDocument(token);
    if (!cart) return fail("Your cart is empty.", 404);

    const item = cart.items.find((entry) => entry.key === body.key);
    if (!item) return fail("That item is no longer in your cart.", 404);

    if (body.quantity === 0) {
      cart.items = cart.items.filter((entry) => entry.key !== body.key);
    } else {
      if (body.quantity != null) item.quantity = body.quantity;
      if (body.savedForLater != null) item.savedForLater = body.savedForLater;
    }

    await cart.save();
    return ok(await priceCart(cart));
  } catch (error) {
    return handleRouteError(error, "cart:update");
  }
}

export async function DELETE(request: Request) {
  try {
    assertSameOrigin(request);
    const key = new URL(request.url).searchParams.get("key");
    if (!key) return fail("Missing item key.");

    const token = await ensureCartToken();
    const cart = await loadCartDocument(token);
    if (!cart) return NextResponse.json({ ok: true, data: null });

    cart.items = cart.items.filter((item) => item.key !== key);
    await cart.save();
    return ok(await priceCart(cart));
  } catch (error) {
    return handleRouteError(error, "cart:delete");
  }
}
