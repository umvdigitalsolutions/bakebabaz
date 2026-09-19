import { assertSameOrigin, fail, handleRouteError, ok } from "@/lib/api";
import { getVerifiedAdmin, canManage } from "@/lib/auth/guards";
import { connectToDatabase, serialize } from "@/lib/db/mongoose";
import { Media } from "@/models/Media";
import { Product } from "@/models/Product";
import { Category } from "@/models/Category";
import { Banner } from "@/models/Banner";
import { StoreSettings } from "@/models/StoreSettings";
import { deleteImage } from "@/lib/cloudinary/client";

export async function GET() {
  try {
    const admin = await getVerifiedAdmin();
    if (!admin) return fail("Not authorised.", 401);

    await connectToDatabase();
    const media = await Media.find().sort({ createdAt: -1 }).limit(300).lean();
    return ok(serialize(media));
  } catch (error) {
    return handleRouteError(error, "admin:media:list");
  }
}

/**
 * Deletes from Cloudinary only when nothing else references the image —
 * removing a file still used by a live product would break the storefront.
 */
export async function DELETE(request: Request) {
  try {
    assertSameOrigin(request);
    const admin = await getVerifiedAdmin();
    if (!admin) return fail("Not authorised.", 401);
    if (!canManage(admin, "manager")) {
      return fail("Your role can't delete media.", 403);
    }

    const publicId = new URL(request.url).searchParams.get("publicId");
    if (!publicId) return fail("Missing image id.", 400);

    await connectToDatabase();

    const [productUse, categoryUse, bannerUse, websiteUse] = await Promise.all([
      Product.countDocuments({ "images.publicId": publicId }),
      Category.countDocuments({ "image.publicId": publicId }),
      Banner.countDocuments({
        $or: [
          { "desktopImage.publicId": publicId },
          { "mobileImage.publicId": publicId },
        ],
      }),
      StoreSettings.countDocuments({
        $or: [
          { "hero.images.publicId": publicId },
          { "homepage.gallery.image.publicId": publicId },
          { "homepage.orderBannerImage.publicId": publicId },
          { "customCake.heroImage.publicId": publicId },
          { "story.heroImage.publicId": publicId },
          { "story.bakeryImage.publicId": publicId },
          { "story.celebrationImage.publicId": publicId },
          { "story.kitchenImage.publicId": publicId },
          { "payments.manualQrCode.publicId": publicId },
          { "seo.ogImage.publicId": publicId },
        ],
      }),
    ]);

    const references = productUse + categoryUse + bannerUse + websiteUse;
    if (references > 0) {
      return fail(
        `This image is still used in ${references} place${references === 1 ? "" : "s"}. Remove it there first.`,
        409,
      );
    }

    await deleteImage(publicId);
    await Media.deleteOne({ publicId });

    return ok({ deleted: true });
  } catch (error) {
    return handleRouteError(error, "admin:media:delete");
  }
}
