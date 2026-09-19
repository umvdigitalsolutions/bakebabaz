import { assertSameOrigin, fail, handleRouteError, ok } from "@/lib/api";
import { getVerifiedAdmin, canManage } from "@/lib/auth/guards";
import { connectToDatabase, serialize } from "@/lib/db/mongoose";
import { Product } from "@/models/Product";
import { isValidObjectId, slugify } from "@/lib/utils";

/** Copies a product as a draft so the original stays untouched while editing. */
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const admin = await getVerifiedAdmin();
    if (!admin) return fail("Not authorised.", 401);
    if (!canManage(admin, "manager")) {
      return fail("Your role can't make this change.", 403);
    }

    const { id } = (await request.json()) as { id?: string };
    if (!id || !isValidObjectId(id)) return fail("Invalid product.", 400);

    await connectToDatabase();
    const source = await Product.findById(id).lean();
    if (!source) return fail("Product not found.", 404);

    const { _id, createdAt, updatedAt, rating, salesCount, ...rest } = source;
    void _id;
    void createdAt;
    void updatedAt;
    void rating;
    void salesCount;

    // Find a free slug: "belgian-cake-copy", then "-copy-2", and so on.
    const base = slugify(`${source.name} copy`);
    let slug = base;
    let suffix = 2;
    while (await Product.exists({ slug })) {
      slug = `${base}-${suffix}`;
      suffix += 1;
    }

    const duplicate = await Product.create({
      ...rest,
      name: `${source.name} (copy)`,
      slug,
      sku: source.sku ? `${source.sku}-COPY` : undefined,
      status: "draft",
      featured: false,
      bestseller: false,
      rating: { average: 0, count: 0 },
      salesCount: 0,
    });

    return ok(serialize(duplicate.toObject()));
  } catch (error) {
    return handleRouteError(error, "admin:product:duplicate");
  }
}
