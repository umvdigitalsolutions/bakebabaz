import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

export const ADMIN_COOKIE = "bb_admin_session";
export const CART_COOKIE = "bb_cart";

const ADMIN_MAX_AGE = 60 * 60 * 12; // 12 hours — staff sessions expire same-day

export type AdminSession = {
  sub: string;
  email: string;
  name: string;
  role: "owner" | "manager" | "staff";
  kind: "admin";
};

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "AUTH_SECRET must be set to a random string of at least 32 characters. Generate one with: openssl rand -base64 48",
    );
  }
  return new TextEncoder().encode(secret);
}

async function sign(payload: Record<string, unknown>, maxAge: number) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer("bakebabaz")
    .setExpirationTime(`${maxAge}s`)
    .sign(secretKey());
}

async function verify<T>(token: string | undefined): Promise<T | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      issuer: "bakebabaz",
    });
    return payload as T;
  } catch {
    return null;
  }
}

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export async function createAdminSession(
  admin: Pick<AdminSession, "sub" | "email" | "name" | "role">,
) {
  const token = await sign({ ...admin, kind: "admin" }, ADMIN_MAX_AGE);
  const store = await cookies();
  store.set(ADMIN_COOKIE, token, {
    ...cookieOptions(ADMIN_MAX_AGE),
    // Admin cookies never ride along on cross-site navigations.
    sameSite: "strict",
  });
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const store = await cookies();
  const session = await verify<AdminSession>(store.get(ADMIN_COOKIE)?.value);
  return session?.kind === "admin" ? session : null;
}

export async function destroyAdminSession() {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
}

/** Signs short-lived tokens for custom-cake payment links. */
export async function signScopedToken(
  payload: Record<string, unknown>,
  maxAgeSeconds: number,
) {
  return sign(payload, maxAgeSeconds);
}

export async function verifyScopedToken<T>(token: string) {
  return verify<T>(token);
}
