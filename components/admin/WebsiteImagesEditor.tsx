"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminButton, AdminCard } from "./AdminShell";
import { ImageField } from "./ImageField";
import type { ImageRef } from "@/types";

type GalleryItem = {
  image?: ImageRef | null;
  caption: string;
  link?: string;
};

type WebsiteImages = {
  heroImage: ImageRef | null;
  orderBannerImage: ImageRef | null;
  gallery: GalleryItem[];
  customCakeHeroImage: ImageRef | null;
  storyHeroImage: ImageRef | null;
  storyBakeryImage: ImageRef | null;
  storyCelebrationImage: ImageRef | null;
  storyKitchenImage: ImageRef | null;
  socialImage: ImageRef | null;
};

function withAlt(image: ImageRef | null, alt: string): ImageRef | null {
  return image ? { ...image, alt } : null;
}

function ImageRow({
  title,
  description,
  image,
  onChange,
  portrait = false,
}: {
  title: string;
  description: string;
  image: ImageRef | null;
  onChange: (image: ImageRef | null) => void;
  portrait?: boolean;
}) {
  return (
    <div className="grid gap-x-5 gap-y-4 py-5 first:pt-0 last:pb-0 md:grid-cols-[240px_minmax(0,1fr)] md:items-start">
      <div className="min-w-0 md:col-start-2 md:row-start-1 md:pt-1">
        <h3 className="text-[14px] font-semibold">{title}</h3>
        <p className="mt-1 max-w-xl text-[12.5px] leading-relaxed text-[#64748b]">
          {description}
        </p>
        {image?.width && image.height ? (
          <p className="mt-2 text-[11.5px] text-[#94a3b8]">
            {image.width} × {image.height}px
          </p>
        ) : null}
      </div>
      <div className="md:col-start-1 md:row-span-2 md:row-start-1">
        <ImageField
          value={image}
          onChange={onChange}
          folder="media"
          preview={portrait ? "portrait" : "wide"}
          layout="stacked"
        />
      </div>
      <label className="block max-w-2xl md:col-start-2 md:row-start-2">
        <span className="admin-label">Alt text</span>
        <input
          className="admin-field"
          type="text"
          value={image?.alt ?? ""}
          disabled={!image}
          placeholder="Briefly describe what is shown"
          onChange={(event) => onChange(withAlt(image, event.target.value))}
        />
      </label>
    </div>
  );
}

export function WebsiteImagesEditor({ initial }: { initial: WebsiteImages }) {
  const router = useRouter();
  const [images, setImages] = useState(initial);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const update = <K extends keyof WebsiteImages>(
    key: K,
    value: WebsiteImages[K],
  ) => {
    setImages((current) => ({ ...current, [key]: value }));
    setDirty(true);
  };

  const updateGallery = (index: number, patch: Partial<GalleryItem>) => {
    update(
      "gallery",
      images.gallery.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item,
      ),
    );
  };

  const moveGallery = (from: number, to: number) => {
    if (to < 0 || to >= images.gallery.length) return;
    const next = [...images.gallery];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    update("gallery", next);
  };

  const save = async () => {
    setSaving(true);
    try {
      const gallery = images.gallery
        .filter((item) => item.image?.url)
        .map((item) => ({
          image: item.image,
          caption: item.caption.trim() || item.image?.alt || "Bakery creation",
          link: item.link?.trim() || undefined,
        }));

      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          "hero.images": images.heroImage ? [images.heroImage] : [],
          "homepage.orderBannerImage": images.orderBannerImage,
          "homepage.gallery": gallery,
          "customCake.heroImage": images.customCakeHeroImage,
          "story.heroImage": images.storyHeroImage,
          "story.bakeryImage": images.storyBakeryImage,
          "story.celebrationImage": images.storyCelebrationImage,
          "story.kitchenImage": images.storyKitchenImage,
          "seo.ogImage": images.socialImage,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error ?? "Could not save website images.");
      }

      setImages((current) => ({ ...current, gallery }));
      setDirty(false);
      toast.success("Website images updated");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="sticky top-3 z-20 flex min-h-14 items-center justify-between gap-3 border border-[#d8e0e8] bg-white/95 px-4 shadow-sm backdrop-blur">
        <p className="text-[12.5px] text-[#64748b]">
          {dirty ? "Unsaved changes" : "Images are up to date"}
        </p>
        <AdminButton type="button" disabled={!dirty || saving} onClick={save}>
          <Save className="size-4" />
          {saving ? "Saving..." : "Save changes"}
        </AdminButton>
      </div>

      <AdminCard
        title="Homepage"
        description="Primary photography shown at the top and bottom of the homepage."
      >
        <div className="divide-y divide-[#e3e8ef]">
          <ImageRow
            title="Hero image"
            description="The main homepage photograph. Use a wide image so it crops well on desktop and mobile."
            image={images.heroImage}
            onChange={(image) => update("heroImage", image)}
          />
          <ImageRow
            title="Order banner"
            description="Background behind the final order call-to-action."
            image={images.orderBannerImage}
            onChange={(image) => update("orderBannerImage", image)}
          />
        </div>
      </AdminCard>

      <AdminCard
        title="Homepage gallery"
        description="Images in Fresh from our kitchen. Their order here matches the storefront."
        actions={
          <AdminButton
            type="button"
            variant="secondary"
            size="sm"
            onClick={() =>
              update("gallery", [
                ...images.gallery,
                { image: null, caption: "", link: "" },
              ])
            }
          >
            <Plus className="size-4" />
            Add
          </AdminButton>
        }
      >
        {images.gallery.length ? (
          <div className="divide-y divide-[#e3e8ef]">
            {images.gallery.map((item, index) => (
              <div
                key={`${item.image?.publicId ?? item.image?.url ?? "new"}-${index}`}
                className="grid gap-5 py-5 first:pt-0 last:pb-0 md:grid-cols-[200px_minmax(0,1fr)_36px]"
              >
                <ImageField
                  value={item.image}
                  onChange={(image) => updateGallery(index, { image })}
                  folder="media"
                  preview="wide"
                  layout="stacked"
                />
                <div className="grid min-w-0 gap-3 sm:grid-cols-2">
                  <label>
                    <span className="admin-label">Caption</span>
                    <input
                      className="admin-field"
                      type="text"
                      value={item.caption}
                      placeholder="Chocolate truffle cakes"
                      onChange={(event) =>
                        updateGallery(index, { caption: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    <span className="admin-label">Link</span>
                    <input
                      className="admin-field"
                      type="text"
                      value={item.link ?? ""}
                      placeholder="/shop/cakes"
                      onChange={(event) =>
                        updateGallery(index, { link: event.target.value })
                      }
                    />
                  </label>
                  <label className="sm:col-span-2">
                    <span className="admin-label">Alt text</span>
                    <input
                      className="admin-field"
                      type="text"
                      value={item.image?.alt ?? ""}
                      disabled={!item.image}
                      placeholder="Briefly describe what is shown"
                      onChange={(event) =>
                        updateGallery(index, {
                          image: withAlt(
                            item.image ?? null,
                            event.target.value,
                          ),
                        })
                      }
                    />
                  </label>
                </div>
                <div className="flex items-start gap-1 md:flex-col">
                  <button
                    type="button"
                    aria-label="Move image up"
                    disabled={index === 0}
                    onClick={() => moveGallery(index, index - 1)}
                    className="grid size-8 place-items-center rounded-lg text-[#64748b] hover:bg-[#eef2f6] disabled:opacity-25"
                  >
                    <ArrowUp className="size-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Move image down"
                    disabled={index === images.gallery.length - 1}
                    onClick={() => moveGallery(index, index + 1)}
                    className="grid size-8 place-items-center rounded-lg text-[#64748b] hover:bg-[#eef2f6] disabled:opacity-25"
                  >
                    <ArrowDown className="size-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Remove gallery image"
                    onClick={() =>
                      update(
                        "gallery",
                        images.gallery.filter(
                          (_, itemIndex) => itemIndex !== index,
                        ),
                      )
                    }
                    className="grid size-8 place-items-center rounded-lg text-[#b3261e] hover:bg-[#fee2e2]"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-[13.5px] font-semibold">Gallery hidden</p>
            <p className="mt-1 text-[12.5px] text-[#64748b]">
              Add an image to show this section on the homepage.
            </p>
          </div>
        )}
      </AdminCard>

      <AdminCard
        title="Our Story"
        description="Founder photography used throughout the story page."
      >
        <div className="divide-y divide-[#e3e8ef]">
          <ImageRow
            title="Founder hero"
            description="Main portrait at the top of Our Story."
            image={images.storyHeroImage}
            onChange={(image) => update("storyHeroImage", image)}
            portrait
          />
          <ImageRow
            title="Inside the bakery"
            description="Image beside the founder-led bakery story."
            image={images.storyBakeryImage}
            onChange={(image) => update("storyBakeryImage", image)}
            portrait
          />
          <ImageRow
            title="Celebrations"
            description="Image beside the custom cakes story."
            image={images.storyCelebrationImage}
            onChange={(image) => update("storyCelebrationImage", image)}
            portrait
          />
          <ImageRow
            title="From the kitchen"
            description="Image beside the kitchen and craft story."
            image={images.storyKitchenImage}
            onChange={(image) => update("storyKitchenImage", image)}
            portrait
          />
        </div>
      </AdminCard>

      <AdminCard
        title="Other pages"
        description="Images used outside the homepage and story page."
      >
        <div className="divide-y divide-[#e3e8ef]">
          <ImageRow
            title="Custom cake hero"
            description="Main image on the Design your own cake page."
            image={images.customCakeHeroImage}
            onChange={(image) => update("customCakeHeroImage", image)}
          />
          <ImageRow
            title="Social sharing image"
            description="Preview used when the website is shared in messaging and social apps."
            image={images.socialImage}
            onChange={(image) => update("socialImage", image)}
          />
        </div>
      </AdminCard>
    </div>
  );
}
