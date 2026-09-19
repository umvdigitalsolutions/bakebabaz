import { assertSameOrigin, handleRouteError, ok } from "@/lib/api";
import { destroyAdminSession } from "@/lib/auth/session";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await destroyAdminSession();
    return ok({ signedOut: true });
  } catch (error) {
    return handleRouteError(error, "admin:logout");
  }
}
