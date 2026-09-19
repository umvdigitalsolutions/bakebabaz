"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { ImageRef } from "@/types";

/**
 * Uploads through the same validated endpoint the storefront uses, then stores
 * both the URL and the Cloudinary public id so the media library can track
 * references and clean up safely.
 */
export function ImageField({
  value,
  onChange,
  folder = "media",
  label,
  className,
  preview = "thumbnail",
  layout = "inline",
}: {
  value?: ImageRef | null;
  onChange: (image: ImageRef | null) => void;
  folder?: "products" | "categories" | "banners" | "media";
  label?: string;
  className?: string;
  preview?: "thumbnail" | "wide" | "portrait";
  layout?: "inline" | "stacked";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch(`/api/upload?folder=${folder}`, {
        method: "POST",
        body,
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error ?? "Upload failed.");
      }
      onChange(payload.data as ImageRef);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={className}>
      {label ? <span className="admin-label">{label}</span> : null}
      <div
        className={cn(
          "flex gap-3",
          layout === "stacked"
            ? "flex-col items-start"
            : preview === "thumbnail"
              ? "items-center"
              : "flex-col items-start sm:flex-row",
        )}
      >
        <div
          className={cn(
            "relative flex-none overflow-hidden rounded-lg border border-[#e3e8ef] bg-[#f8fafc]",
            preview === "thumbnail" && "size-20",
            preview === "wide" && "aspect-[16/7] w-full max-w-[360px]",
            preview === "portrait" &&
              "aspect-[4/5] w-full max-w-[180px] md:max-w-[220px]",
          )}
        >
          {value?.url ? (
            <Image
              src={value.url}
              alt=""
              fill
              sizes="80px"
              className="object-cover"
            />
          ) : (
            <span className="grid h-full place-items-center text-[#cbd5e1]">
              <ImagePlus className="size-5" />
            </span>
          )}
          {uploading ? (
            <span className="absolute inset-0 grid place-items-center bg-white/70">
              <Loader2 className="size-4 animate-spin text-[#16324f]" />
            </span>
          ) : null}
        </div>

        <div
          className={cn(
            "flex gap-2",
            layout === "stacked" ? "flex-row" : "flex-row sm:flex-col",
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void upload(file);
              event.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="inline-flex h-8 items-center rounded-lg border border-[#e3e8ef] bg-white px-3 text-[12.5px] font-semibold hover:bg-[#f1f5f9] disabled:opacity-60"
          >
            {value?.url ? "Replace" : "Upload"}
          </button>
          {value?.url ? (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="inline-flex h-8 items-center gap-1 rounded-lg px-3 text-[12.5px] font-semibold text-[#b3261e] hover:bg-[#fee2e2]"
            >
              <X className="size-3.5" />
              Remove
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** Multi-image field with drag-to-reorder, used by the product editor. */
export function ImageListField({
  images,
  onChange,
  folder = "products",
  label,
  max = 12,
}: {
  images: ImageRef[];
  onChange: (images: ImageRef[]) => void;
  folder?: "products" | "categories" | "banners" | "media";
  label?: string;
  max?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const uploadMany = async (files: File[]) => {
    const room = max - images.length;
    if (room <= 0) {
      toast.error(`You can add up to ${max} images.`);
      return;
    }
    setUploading(true);
    const uploaded: ImageRef[] = [];
    for (const file of files.slice(0, room)) {
      try {
        const body = new FormData();
        body.append("file", file);
        const response = await fetch(`/api/upload?folder=${folder}`, {
          method: "POST",
          body,
        });
        const payload = await response.json();
        if (!response.ok || !payload?.ok) {
          throw new Error(payload?.error ?? "Upload failed.");
        }
        uploaded.push(payload.data as ImageRef);
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : `Could not upload ${file.name}.`,
        );
      }
    }
    if (uploaded.length) onChange([...images, ...uploaded]);
    setUploading(false);
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= images.length) return;
    const next = [...images];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  return (
    <div>
      {label ? <span className="admin-label">{label}</span> : null}

      <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5">
        {images.map((image, index) => (
          <li
            key={image.publicId ?? image.url}
            draggable
            onDragStart={() => setDragIndex(index)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => {
              if (dragIndex != null && dragIndex !== index)
                move(dragIndex, index);
              setDragIndex(null);
            }}
            className={cn(
              "group relative aspect-square cursor-grab overflow-hidden rounded-lg border border-[#e3e8ef] bg-[#f8fafc] active:cursor-grabbing",
              dragIndex === index && "opacity-50",
            )}
          >
            <Image
              src={image.url}
              alt=""
              fill
              sizes="140px"
              className="object-cover"
            />
            {index === 0 ? (
              <span className="absolute top-1.5 left-1.5 rounded bg-[#16324f] px-1.5 py-0.5 text-[9.5px] font-bold tracking-wide text-white uppercase">
                Main
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => onChange(images.filter((_, i) => i !== index))}
              aria-label={`Remove image ${index + 1}`}
              className="absolute top-1.5 right-1.5 grid size-6 place-items-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
            >
              <X className="size-3" />
            </button>
            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/45 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                type="button"
                onClick={() => move(index, index - 1)}
                aria-label="Move earlier"
                className="px-2 py-1 text-xs text-white"
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => move(index, index + 1)}
                aria-label="Move later"
                className="px-2 py-1 text-xs text-white"
              >
                →
              </button>
            </div>
          </li>
        ))}

        {images.length < max ? (
          <li>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="grid aspect-square w-full place-items-center rounded-lg border border-dashed border-[#cbd5e1] bg-[#f8fafc] text-[#64748b] transition-colors hover:border-[#16324f] disabled:opacity-60"
            >
              {uploading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <span className="flex flex-col items-center gap-1">
                  <ImagePlus className="size-5" />
                  <span className="text-[11px] font-semibold">Add</span>
                </span>
              )}
            </button>
          </li>
        ) : null}
      </ul>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="sr-only"
        onChange={(event) => {
          void uploadMany(Array.from(event.target.files ?? []));
          event.target.value = "";
        }}
      />

      <p className="mt-2 text-[11.5px] text-[#94a3b8]">
        Drag to reorder. The first image is used on product cards.
      </p>
    </div>
  );
}
