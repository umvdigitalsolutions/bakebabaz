import { assertSameOrigin, fail, handleRouteError, ok } from "@/lib/api";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { adminLoginSchema } from "@/lib/validation/auth";
import { connectToDatabase } from "@/lib/db/mongoose";
import { Admin } from "@/models/Admin";
import { verifyPassword } from "@/lib/auth/password";
import { createAdminSession } from "@/lib/auth/session";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    // Tighter than the storefront: staff logins are a high-value target.
    const limit = rateLimit(clientKey(request, "admin-login"), 6, 900);
    if (!limit.allowed) {
      return fail(
        `Too many attempts. Try again in ${Math.ceil(limit.retryAfterSeconds / 60)} minutes.`,
        429,
      );
    }

    const body = adminLoginSchema.parse(await request.json());
    await connectToDatabase();

    const admin = await Admin.findOne({ email: body.email }).select(
      "+passwordHash name email role active",
    );

    const valid = admin
      ? await verifyPassword(body.password, admin.passwordHash)
      : await verifyPassword(
          body.password,
          "$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinva",
        );

    if (!admin || !valid || !admin.active) {
      return fail("Those credentials aren't valid.", 401);
    }

    admin.lastLoginAt = new Date();
    await admin.save();

    await createAdminSession({
      sub: String(admin._id),
      email: admin.email,
      name: admin.name,
      role: admin.role,
    });

    return ok({ name: admin.name, role: admin.role });
  } catch (error) {
    return handleRouteError(error, "admin:login");
  }
}
