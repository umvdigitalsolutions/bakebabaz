import { assertSameOrigin, fail, handleRouteError, ok } from "@/lib/api";
import { getVerifiedAdmin } from "@/lib/auth/guards";
import { connectToDatabase, serialize } from "@/lib/db/mongoose";
import { Review } from "@/models/Review";
import { Product } from "@/models/Product";
import { reviewModerationSchema } from "@/lib/validation/admin";
import { isValidObjectId } from "@/lib/utils";

/** Recomputes a product's rating from its approved reviews only. */
async function refreshProductRating(productId: string) {
  const [summary] = await Review.aggregate<{ average: number; count: number }>([
    { $match: { product: productId, approved: true } },
    {
      $group: {
        _id: null,
        average: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
  ]);

  await Product.updateOne(
    { _id: productId },
    {
      $set: {
        "rating.average": Math.round((summary?.average ?? 0) * 10) / 10,
        "rating.count": summary?.count ?? 0,
      },
    },
  );
}

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(request);
    const admin = await getVerifiedAdmin();
    if (!admin) return fail("Not authorised.", 401);

    const { id } = await ctx.params;
    if (!isValidObjectId(id)) return fail("Invalid review.", 400);

    const body = reviewModerationSchema.parse(await request.json());
    await connectToDatabase();

    const review = await Review.findByIdAndUpdate(
      id,
      { $set: body },
      { returnDocument: "after" },
    ).lean();
    if (!review) return fail("Review not found.", 404);

    await refreshProductRating(String(review.product));

    return ok(serialize(review));
  } catch (error) {
    return handleRouteError(error, "admin:review:update");
  }
}

export async function DELETE(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(request);
    const admin = await getVerifiedAdmin();
    if (!admin) return fail("Not authorised.", 401);

    const { id } = await ctx.params;
    if (!isValidObjectId(id)) return fail("Invalid review.", 400);

    await connectToDatabase();
    const review = await Review.findByIdAndDelete(id).lean();
    if (!review) return fail("Review not found.", 404);

    await refreshProductRating(String(review.product));

    return ok({ deleted: true });
  } catch (error) {
    return handleRouteError(error, "admin:review:delete");
  }
}
