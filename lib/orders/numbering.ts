import "server-only";
import { connectToDatabase } from "@/lib/db/mongoose";
import { Order } from "@/models/Order";
import { CustomCakeRequest } from "@/models/CustomCakeRequest";

/**
 * Human-friendly, non-sequential-looking references. The random suffix means a
 * customer can't enumerate other people's orders by guessing.
 */
function suffix(length = 4) {
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let out = "";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < length; i += 1)
    out += alphabet[bytes[i] % alphabet.length];
  return out;
}

export async function generateOrderNumber() {
  await connectToDatabase();
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const candidate = `BB${suffix(6)}`;
    const exists = await Order.exists({ orderNumber: candidate });
    if (!exists) return candidate;
  }
  return `BB${Date.now().toString(36).toUpperCase()}`;
}

export async function generateRequestNumber() {
  await connectToDatabase();
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const candidate = `CC${suffix(6)}`;
    const exists = await CustomCakeRequest.exists({ requestNumber: candidate });
    if (!exists) return candidate;
  }
  return `CC${Date.now().toString(36).toUpperCase()}`;
}
