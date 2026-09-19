import { connectToDatabase } from "@/lib/db/mongoose";
import { Product } from "@/models/Product";
import { Category } from "@/models/Category";
import { handleRouteError, ok } from "@/lib/api";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { startingPrice } from "@/lib/pricing/product";
import { fail } from "@/lib/api";

export async function GET(request: Request) {
  try {
    const limit = rateLimit(clientKey(request, "search"), 120, 60);
    if (!limit.allowed)
      return fail("Too many searches. Please slow down.", 429);

    const query = (new URL(request.url).searchParams.get("q") ?? "").trim();
    if (query.length < 2) {
      return ok({ products: [], categories: [] });
    }

    await connectToDatabase();
    // Escape user input before it reaches a RegExp — a stray "(" would throw,
    // and an unbounded pattern is a cheap denial of service.
    const safe = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").slice(0, 60);
    const pattern = new RegExp(safe, "i");

    const [products, categories] = await Promise.all([
      Product.find({
        status: "active",
        $or: [
          { name: pattern },
          { shortDescription: pattern },
          { tags: pattern },
          { occasions: pattern },
          { "flavours.name": pattern },
        ],
      })
        .populate<{ category: { name: string; slug: string } }>(
          "category",
          "name slug",
        )
        .select(
          "name slug images basePrice salePrice weights rating category bestseller",
        )
        .limit(8)
        .lean(),
      Category.find({ active: true, name: pattern })
        .select("name slug image")
        .limit(4)
        .lean(),
    ]);

    return ok({
      products: products.map((product) => ({
        id: String(product._id),
        name: product.name,
        slug: product.slug,
        image: product.images?.[0]?.url ?? null,
        categoryName: product.category?.name ?? null,
        price: startingPrice(product),
        rating: product.rating?.average ?? 0,
      })),
      categories: categories.map((category) => ({
        id: String(category._id),
        name: category.name,
        slug: category.slug,
        image: category.image?.url ?? null,
      })),
    });
  } catch (error) {
    return handleRouteError(error, "search");
  }
}
