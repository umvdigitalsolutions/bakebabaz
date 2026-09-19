import { NextResponse, type NextRequest } from "next/server";

const ADMIN_COOKIE = "bb_admin_session";

/**
 * Optimistic gate for the admin area.
 *
 * This only checks that a session cookie is present — it deliberately does not
 * verify it. Real authorisation happens in the layout guard and again inside
 * every admin API handler, which re-read the database. Treat this purely as a
 * redirect convenience, per the Next.js guidance on proxy-layer auth.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (!request.cookies.has(ADMIN_COOKIE)) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.search = `?next=${encodeURIComponent(pathname)}`;
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
