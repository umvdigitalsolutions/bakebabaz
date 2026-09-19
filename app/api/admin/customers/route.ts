import { fail, handleRouteError, ok } from "@/lib/api";
import { getVerifiedAdmin } from "@/lib/auth/guards";
import { connectToDatabase, serialize } from "@/lib/db/mongoose";
import { User } from "@/models/User";
import type { QueryFilter } from "mongoose";
import type { IUser } from "@/models/User";

/** Customer directory. Never exposed outside the admin session. */
export async function GET(request: Request) {
  try {
    const admin = await getVerifiedAdmin();
    if (!admin) return fail("Not authorised.", 401);

    await connectToDatabase();
    const q = new URL(request.url).searchParams.get("q")?.trim();

    const filter: Record<string, unknown> = {};
    if (q) {
      const safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").slice(0, 60);
      const pattern = new RegExp(safe, "i");
      filter.$or = [{ name: pattern }, { email: pattern }, { phone: pattern }];
    }

    const customers = await User.find(filter as QueryFilter<IUser>)
      .select("name email phone stats createdAt marketingOptIn")
      .sort({ "stats.lastOrderAt": -1, createdAt: -1 })
      .limit(300)
      .lean();

    return ok(serialize(customers));
  } catch (error) {
    return handleRouteError(error, "admin:customers:list");
  }
}
