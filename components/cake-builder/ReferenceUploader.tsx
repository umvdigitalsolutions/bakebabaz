"use client";

import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import { ImagePlus, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { ImageRef } from "@/types";

type Pending = { id: string; name: string; preview: string; progress: number };

/**
 * Drag-and-drop on desktop, a large tap target on mobile. Files upload one at a
 * time to Cloudinary; the server re-validates every byte regardless of what the
 * browser reports.
 */
export function ReferenceUploader({
  images,
  onChange,
  maxImages,
  maxSizeMb,
  disabled,
}: {
  images: ImageRef[];
  onChange: (images: ImageRef[]) => void;
  maxImages: number;
  maxSizeMb: number;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Pending[]>([]);
  const [dragging, setDragging] = useState(false);

  const remaining = maxImages - images.length - pending.length;

  const uploadFiles = useCallback(
    async (files: File[]) => {
      const accepted = files.slice(0, Math.max(remaining, 0));
      if (files.length > accepted.length) {
        toast.error(`You can attach up to ${maxImages} reference images.`);
      }

      for (const file of accepted) {
        if (file.size > maxSizeMb * 1024 * 1024) {
          toast.error(`"${file.name}" is larger than ${maxSizeMb} MB.`);
          continue;
        }

        const id = `${file.name}-${Date.now()}-${Math.random()}`;
        const preview = URL.createObjectURL(file);
        setPending((current) => [
          ...current,
          { id, name: file.name, preview, progress: 12 },
        ]);

        // XHR rather than fetch: it reports real upload progress.
        try {
          const uploaded = await new Promise<ImageRef>((resolve, reject) => {
            const body = new FormData();
            body.append("file", file);

            const xhr = new XMLHttpRequest();
            xhr.open("POST", "/api/upload?folder=references");
            xhr.upload.onprogress = (event) => {
              if (!event.lengthComputable) return;
              const progress = Math.round((event.loaded / event.total) * 90);
              setPending((current) =>
                current.map((item) =>
                  item.id === id ? { ...item, progress } : item,
                ),
              );
            };
            xhr.onload = () => {
              try {
                const payload = JSON.parse(xhr.responseText);
                if (xhr.status >= 200 && xhr.status < 300 && payload?.ok) {
                  resolve(payload.data as ImageRef);
                } else {
                  reject(new Error(payload?.error ?? "Upload failed."));
                }
              } catch {
                reject(new Error("Upload failed."));
              }
            };
            xhr.onerror = () =>
              reject(new Error("Network error — check your connection."));
            xhr.send(body);
          });

          onChange([...images, uploaded]);
        } catch (error) {
          toast.error(
            error instanceof Error ? error.message : "Upload failed.",
          );
        } finally {
          URL.revokeObjectURL(preview);
          setPending((current) => current.filter((item) => item.id !== id));
        }
      }
    },
    [images, maxImages, maxSizeMb, onChange, remaining],
  );

  return (
    <div>
      <div
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (disabled) return;
          void uploadFiles(Array.from(event.dataTransfer.files));
        }}
        className={cn(
          "rounded-2xl border border-dashed p-6 text-center transition-colors",
          dragging
            ? "border-coral bg-coral-soft/40"
            : "border-line-strong/60 bg-paper",
          disabled && "opacity-50",
        )}
      >
        <div className="bg-cream text-coral mx-auto grid size-12 place-items-center rounded-full">
          <ImagePlus className="size-5" />
        </div>
        <p className="mt-4 text-sm font-semibold">
          Drag images here, or{" "}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled || remaining <= 0}
            className="text-coral-dark underline underline-offset-4 disabled:no-underline disabled:opacity-50"
          >
            browse your device
          </button>
        </p>
        <p className="text-muted mt-1.5 text-xs">
          JPG, PNG or WebP · up to {maxSizeMb} MB each · {maxImages} images max
          {remaining > 0 ? ` · ${remaining} remaining` : " · limit reached"}
        </p>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="sr-only"
          disabled={disabled}
          onChange={(event) => {
            void uploadFiles(Array.from(event.target.files ?? []));
            event.target.value = "";
          }}
        />

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || remaining <= 0}
          className="border-line hover:border-coral mt-4 inline-flex min-h-11 items-center gap-2 rounded-full border bg-white px-5 text-sm font-semibold transition-colors disabled:opacity-50 sm:hidden"
        >
          <Upload className="size-4" />
          Choose images
        </button>
      </div>

      {(images.length > 0 || pending.length > 0) && (
        <ul className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {images.map((image, index) => (
            <li
              key={image.publicId ?? image.url}
              className="group border-line bg-cream relative aspect-square overflow-hidden rounded-2xl border"
            >
              <Image
                src={image.url}
                alt={`Reference image ${index + 1}`}
                fill
                sizes="140px"
                className="object-cover"
              />
              <button
                type="button"
                onClick={() => onChange(images.filter((_, i) => i !== index))}
                aria-label={`Remove reference image ${index + 1}`}
                className="bg-cocoa/85 absolute top-1.5 right-1.5 grid size-7 place-items-center rounded-full text-white opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}

          {pending.map((item) => (
            <li
              key={item.id}
              className="border-line bg-cream relative aspect-square overflow-hidden rounded-2xl border"
            >
              {/* A local object URL for the in-flight file — there is nothing
                  for next/image to optimise, and it cannot load blob: sources. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.preview}
                alt=""
                className="size-full object-cover opacity-50"
              />
              <div className="bg-paper/60 absolute inset-0 grid place-items-center">
                <Loader2 className="text-coral size-5 animate-spin" />
              </div>
              <div className="bg-line absolute inset-x-0 bottom-0 h-1">
                <div
                  className="bg-coral h-full transition-[width] duration-200"
                  style={{ width: `${item.progress}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
