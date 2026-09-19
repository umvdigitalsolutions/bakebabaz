import { fail, handleRouteError, ok } from "@/lib/api";
import { getVerifiedAdmin } from "@/lib/auth/guards";
import { connectToDatabase, serialize } from "@/lib/db/mongoose";
import { Review } from "@/models/Review";

export async function GET(request: Request) {
  try {
    const admin = await getVerifiedAdmin();
    if (!admin) return fail("Not authorised.", 401);

    await connectToDatabase();
    const approved = new URL(request.url).searchParams.get("approved");
    const filter =
      approved === "true"
        ? { approved: true }
        : approved === "false"
          ? { approved: false }
          : {};

    const reviews = await Review.find(filter)
      .populate<{ product: { name: string; slug: string } }>(
        "product",
        "name slug",
      )
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    return ok(serialize(reviews));
  } catch (error) {
    return handleRouteError(error, "admin:reviews:list");
  }
}
