import { fail, handleRouteError, ok } from "@/lib/api";
import { getVerifiedAdmin } from "@/lib/auth/guards";
import { connectToDatabase, serialize } from "@/lib/db/mongoose";
import { CustomCakeRequest } from "@/models/CustomCakeRequest";
import type { QueryFilter } from "mongoose";
import type { ICustomCakeRequest } from "@/models/CustomCakeRequest";

export async function GET(request: Request) {
  try {
    const admin = await getVerifiedAdmin();
    if (!admin) return fail("Not authorised.", 401);

    await connectToDatabase();
    const url = new URL(request.url);
    const q = url.searchParams.get("q")?.trim();
    const status = url.searchParams.get("status");

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (q) {
      const safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").slice(0, 60);
      const pattern = new RegExp(safe, "i");
      filter.$or = [
        { requestNumber: pattern },
        { "contact.name": pattern },
        { "contact.phone": pattern },
      ];
    }

    const requests = await CustomCakeRequest.find(
      filter as QueryFilter<ICustomCakeRequest>,
    )
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    return ok(serialize(requests));
  } catch (error) {
    return handleRouteError(error, "admin:custom-orders:list");
  }
}
