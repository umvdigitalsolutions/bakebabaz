import "server-only";
import { v2 as cloudinary } from "cloudinary";

let configured = false;

export function getCloudinary() {
  if (!configured) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
    configured = true;
  }
  return cloudinary;
}

export function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET,
  );
}

export const CLOUDINARY_FOLDER = process.env.CLOUDINARY_FOLDER || "bakebabaz";

export type UploadedImage = {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
};

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

/**
 * Magic-number check. The browser's `type` field is attacker-controlled, so we
 * confirm the bytes really are the image format they claim to be.
 */
function sniffImageType(bytes: Uint8Array): string | null {
  if (bytes.length < 12) return null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "image/png";
  }
  const riff = String.fromCharCode(...bytes.slice(0, 4));
  const webp = String.fromCharCode(...bytes.slice(8, 12));
  if (riff === "RIFF" && webp === "WEBP") return "image/webp";
  return null;
}

export async function validateImageFile(
  file: File,
  maxSizeMb: number,
): Promise<{ ok: true; buffer: Buffer } | { ok: false; error: string }> {
  if (!ALLOWED_MIME.has(file.type)) {
    return { ok: false, error: "Only JPG, PNG and WebP images are accepted." };
  }
  const maxBytes = maxSizeMb * 1024 * 1024;
  if (file.size > maxBytes) {
    return { ok: false, error: `Images must be under ${maxSizeMb} MB.` };
  }
  if (file.size === 0) {
    return { ok: false, error: "That file appears to be empty." };
  }

  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  const sniffed = sniffImageType(bytes);
  if (!sniffed) {
    return {
      ok: false,
      error: "That file isn't a valid JPG, PNG or WebP image.",
    };
  }

  return { ok: true, buffer: Buffer.from(arrayBuffer) };
}

export async function uploadImageBuffer(
  buffer: Buffer,
  folder: string,
): Promise<UploadedImage> {
  const client = getCloudinary();
  return new Promise((resolve, reject) => {
    const stream = client.uploader.upload_stream(
      {
        folder: `${CLOUDINARY_FOLDER}/${folder}`,
        resource_type: "image",
        // Re-encode server-side; this strips any smuggled payload.
        transformation: [{ quality: "auto:good", fetch_format: "auto" }],
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed."));
          return;
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
        });
      },
    );
    stream.end(buffer);
  });
}

export async function deleteImage(publicId: string) {
  if (!publicId || !isCloudinaryConfigured()) return;
  try {
    await getCloudinary().uploader.destroy(publicId);
  } catch (error) {
    console.error("[cloudinary] delete failed", publicId, error);
  }
}
