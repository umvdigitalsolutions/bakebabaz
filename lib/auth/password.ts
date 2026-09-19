import bcrypt from "bcryptjs";

const ROUNDS = 12;

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, ROUNDS);
}

export async function verifyPassword(plain: string, hash: string) {
  if (!hash) return false;
  return bcrypt.compare(plain, hash);
}

/** Rejects the passwords that show up in every credential-stuffing list. */
export function assessPasswordStrength(password: string) {
  const problems: string[] = [];
  if (password.length < 8) problems.push("Use at least 8 characters.");
  if (!/[a-zA-Z]/.test(password)) problems.push("Include at least one letter.");
  if (!/[0-9]/.test(password)) problems.push("Include at least one number.");
  return { ok: problems.length === 0, problems };
}
