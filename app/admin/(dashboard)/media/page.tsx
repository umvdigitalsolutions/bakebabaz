import type { Metadata } from "next";
import { connectToDatabase, serialize } from "@/lib/db/mongoose";
import { Media } from "@/models/Media";
import { isCloudinaryConfigured } from "@/lib/cloudinary/client";
import { AdminCard, AdminPage } from "@/components/admin/AdminShell";
import { MediaLibrary } from "@/components/admin/MediaLibrary";

export const metadata: Metadata = { title: "Media" };

export default async function AdminMediaPage() {
  await connectToDatabase();
  const media = await Media.find().sort({ createdAt: -1 }).limit(300).lean();

  return (
    <AdminPage
      title="Media"
      description="Images stored on Cloudinary. Files are re-encoded on upload and checked before delete."
    >
      {!isCloudinaryConfigured() ? (
        <AdminCard className="mb-4">
          <p className="text-[13.5px] leading-relaxed text-[#b3261e]">
            <span className="font-semibold">
              Cloudinary isn&rsquo;t configured.
            </span>{" "}
            Add <code className="font-mono">CLOUDINARY_CLOUD_NAME</code>,{" "}
            <code className="font-mono">CLOUDINARY_API_KEY</code> and{" "}
            <code className="font-mono">CLOUDINARY_API_SECRET</code> to your
            environment file to enable image uploads across the admin panel and
            the customer cake builder.
          </p>
        </AdminCard>
      ) : null}

      <MediaLibrary initial={serialize(media) as never} />
    </AdminPage>
  );
}
