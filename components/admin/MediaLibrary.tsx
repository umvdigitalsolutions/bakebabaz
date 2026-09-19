"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Copy, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminButton, AdminCard, AdminEmpty } from "./AdminShell";
import { formatDate } from "@/lib/utils";

type MediaItem = {
  _id: string;
  publicId: string;
  url: string;
  format?: string;
  width?: number;
  height?: number;
  bytes?: number;
  folder?: string;
  uploadedBy?: string;
  createdAt: string;
};

function readableSize(bytes?: number) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MediaLibrary({ initial }: { initial: MediaItem[] }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState(initial);
  const [uploading, setUploading] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<MediaItem | null>(null);
  const [busy, setBusy] = useState(false);

  const upload = async (files: File[]) => {
    setUploading(true);
    for (const file of files) {
      try {
        const body = new FormData();
        body.append("file", file);
        const response = await fetch("/api/upload?folder=media", {
          method: "POST",
          body,
        });
        const payload = await response.json();
        if (!response.ok || !payload?.ok) {
          throw new Error(payload?.error ?? "Upload failed.");
        }
        setItems((current) => [
          {
            _id: payload.data.publicId,
            publicId: payload.data.publicId,
            url: payload.data.url,
            width: payload.data.width,
            height: payload.data.height,
            createdAt: new Date().toISOString(),
            folder: "media",
          },
          ...current,
        ]);
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : `Could not upload ${file.name}.`,
        );
      }
    }
    setUploading(false);
  };

  const remove = async () => {
    if (!pendingDelete) return;
    setBusy(true);
    try {
      const response = await fetch(
        `/api/admin/media?publicId=${encodeURIComponent(pendingDelete.publicId)}`,
        { method: "DELETE" },
      );
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error ?? "Delete failed.");
      }
      setItems((current) =>
        current.filter((item) => item.publicId !== pendingDelete.publicId),
      );
      toast.success("Image deleted");
      setPendingDelete(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <AdminCard
        title="Library"
        description="Images uploaded through the admin panel."
        actions={
          <AdminButton
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ImagePlus className="size-4" />
            )}
            Upload
          </AdminButton>
        }
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="sr-only"
          onChange={(event) => {
            void upload(Array.from(event.target.files ?? []));
            event.target.value = "";
          }}
        />

        {items.length === 0 ? (
          <AdminEmpty
            title="No images yet"
            description="Upload product photography here, or add images directly from a product or category."
            action={
              <AdminButton
                type="button"
                onClick={() => inputRef.current?.click()}
              >
                <ImagePlus className="size-4" />
                Upload an image
              </AdminButton>
            }
          />
        ) : (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {items.map((item) => (
              <li key={item.publicId} className="group">
                <div className="relative aspect-square overflow-hidden rounded-lg border border-[#e3e8ef] bg-[#f8fafc]">
                  <Image
                    src={item.url}
                    alt=""
                    fill
                    sizes="220px"
                    className="object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1 bg-black/45 p-1.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(item.url);
                          toast.success("URL copied");
                        } catch {
                          toast.error("Could not copy — copy it manually.");
                        }
                      }}
                      aria-label="Copy image URL"
                      className="grid size-7 place-items-center rounded text-white hover:bg-white/20"
                    >
                      <Copy className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingDelete(item)}
                      aria-label="Delete image"
                      className="grid size-7 place-items-center rounded text-white hover:bg-white/20"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
                <p className="mt-1.5 truncate text-[11.5px] text-[#64748b]">
                  {item.width && item.height
                    ? `${item.width}×${item.height} · `
                    : ""}
                  {readableSize(item.bytes)}
                </p>
                <p className="truncate text-[11px] text-[#94a3b8]">
                  {formatDate(item.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>

      {pendingDelete ? (
        <div className="fixed inset-0 z-[60] grid place-items-center p-4">
          <div
            className="absolute inset-0 bg-black/35"
            onClick={() => setPendingDelete(null)}
          />
          <div className="relative w-full max-w-sm rounded-xl bg-white p-5 shadow-xl">
            <h2 className="text-[15px] font-semibold">Delete this image?</h2>
            <p className="mt-1.5 text-[13px] text-[#64748b]">
              It&rsquo;s removed from Cloudinary permanently. If any product,
              category, banner or website section still uses it, the delete is
              refused so nothing breaks on the storefront.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <AdminButton
                variant="secondary"
                size="sm"
                onClick={() => setPendingDelete(null)}
              >
                Cancel
              </AdminButton>
              <AdminButton
                variant="danger"
                size="sm"
                disabled={busy}
                onClick={() => void remove()}
              >
                {busy ? "Deleting…" : "Delete"}
              </AdminButton>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
