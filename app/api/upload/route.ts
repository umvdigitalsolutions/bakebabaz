import { assertSameOrigin, fail, handleRouteError, ok } from "@/lib/api";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { getStoreSettings } from "@/lib/data/settings";
import {
  isCloudinaryConfigured,
  uploadImageBuffer,
  validateImageFile,
} from "@/lib/cloudinary/client";
import { getVerifiedAdmin } from "@/lib/auth/guards";
import { connectToDatabase } from "@/lib/db/mongoose";
import { Media } from "@/models/Media";

const ADMIN_FOLDERS = new Set(["products", "categories", "banners", "media"]);
const PUBLIC_FOLDERS = new Set(["references"]);

/**
 * Single upload endpoint for reference images (public) and catalogue imagery
 * (admin only). Every file is size-checked, magic-number sniffed and
 * re-encoded by Cloudinary before it is stored.
 */
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);

    const url = new URL(request.url);
    const folder = url.searchParams.get("folder") ?? "references";

    if (!ADMIN_FOLDERS.has(folder) && !PUBLIC_FOLDERS.has(folder)) {
      return fail("Unknown upload destination.", 400);
    }

    const admin = ADMIN_FOLDERS.has(folder) ? await getVerifiedAdmin() : null;
    if (ADMIN_FOLDERS.has(folder) && !admin) {
      return fail("Not authorised.", 403);
    }

    const limit = rateLimit(
      clientKey(request, `upload-${folder}`),
      admin ? 120 : 20,
      300,
    );
    if (!limit.allowed) {
      return fail(
        `Too many uploads. Try again in ${Math.ceil(limit.retryAfterSeconds / 60)} minutes.`,
        429,
      );
    }

    if (!isCloudinaryConfigured()) {
      return fail(
        "Image uploads aren't configured yet. Add your Cloudinary credentials to .env.local.",
        503,
      );
    }

    const settings = await getStoreSettings();
    const maxSizeMb = admin ? 10 : settings.customCake.maxImageSizeMb;

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return fail("No file was received.", 400);
    }

    const validated = await validateImageFile(file, maxSizeMb);
    if (!validated.ok) return fail(validated.error, 400);

    const uploaded = await uploadImageBuffer(validated.buffer, folder);

    // Catalogue uploads are catalogued so the admin media library can list them.
    if (admin) {
      await connectToDatabase();
      await Media.findOneAndUpdate(
        { publicId: uploaded.publicId },
        {
          $set: {
            url: uploaded.url,
            format: uploaded.format,
            width: uploaded.width,
            height: uploaded.height,
            bytes: uploaded.bytes,
            folder,
            uploadedBy: admin.email,
          },
        },
        { upsert: true },
      );
    }

    return ok({
      url: uploaded.url,
      publicId: uploaded.publicId,
      width: uploaded.width,
      height: uploaded.height,
    });
  } catch (error) {
    return handleRouteError(error, "upload");
  }
}
