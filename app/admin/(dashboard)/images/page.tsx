import type { Metadata } from "next";
import { AlertTriangle } from "lucide-react";
import { AdminPage } from "@/components/admin/AdminShell";
import { WebsiteImagesEditor } from "@/components/admin/WebsiteImagesEditor";
import { isCloudinaryConfigured } from "@/lib/cloudinary/client";
import { getStoreSettings } from "@/lib/data/settings";

export const metadata: Metadata = { title: "Website images" };

export default async function AdminWebsiteImagesPage() {
  const settings = await getStoreSettings();
  const hasOrderBannerSetting =
    settings.homepage.orderBannerImage !== undefined;

  return (
    <AdminPage
      title="Website images"
      description="Upload, replace, remove and arrange the photography used across the storefront."
    >
      {!isCloudinaryConfigured() ? (
        <div className="mb-5 flex items-start gap-3 border border-[#f1d89a] bg-[#fff9e8] px-4 py-3 text-[#78590a]">
          <AlertTriangle className="mt-0.5 size-4 flex-none" />
          <p className="text-[12.5px] leading-relaxed">
            Uploads need Cloudinary configuration. Existing images can still be
            reordered or removed.
          </p>
        </div>
      ) : null}

      <WebsiteImagesEditor
        initial={{
          heroImage: settings.hero.images?.[0] ?? null,
          orderBannerImage: hasOrderBannerSetting
            ? (settings.homepage.orderBannerImage ?? null)
            : (settings.hero.images?.[1] ?? settings.hero.images?.[0] ?? null),
          gallery: settings.homepage.gallery,
          customCakeHeroImage: settings.customCake.heroImage ?? null,
          storyHeroImage: settings.story?.heroImage ?? null,
          storyBakeryImage: settings.story?.bakeryImage ?? null,
          storyCelebrationImage: settings.story?.celebrationImage ?? null,
          storyKitchenImage: settings.story?.kitchenImage ?? null,
          socialImage: settings.seo.ogImage ?? null,
        }}
      />
    </AdminPage>
  );
}
