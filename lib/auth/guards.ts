import "server-only";
import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/db/mongoose";
import { Admin } from "@/models/Admin";
import { getAdminSession, type AdminSession } from "./session";

export async function requireAdmin(returnTo = "/admin") {
  const session = await getAdminSession();
  if (!session) {
    redirect(`/admin/login?next=${encodeURIComponent(returnTo)}`);
  }
  return session;
}

/**
 * API-layer guards. These re-check the database rather than trusting the JWT
 * alone, so a deactivated staff account loses access immediately.
 */
export async function getVerifiedAdmin(): Promise<AdminSession | null> {
  const session = await getAdminSession();
  if (!session) return null;
  await connectToDatabase();
  const admin = await Admin.findById(session.sub).select("active role").lean();
  if (!admin || !admin.active) return null;
  return { ...session, role: admin.role };
}

export function canManage(
  session: AdminSession | null,
  minimum: "owner" | "manager" | "staff" = "staff",
) {
  if (!session) return false;
  const rank = { staff: 1, manager: 2, owner: 3 };
  return rank[session.role] >= rank[minimum];
}
