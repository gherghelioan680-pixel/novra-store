import "server-only";

import bcrypt from "bcryptjs";

const BCRYPT_ROUNDS = 12;

export function isPasswordHashed(password: string): boolean {
  return password.startsWith("$2a$") || password.startsWith("$2b$") || password.startsWith("$2y$");
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  if (!stored) return false;
  if (isPasswordHashed(stored)) {
    return bcrypt.compare(plain, stored);
  }
  return stored === plain;
}

/** On successful login with plain text password, rehash and return new hash. */
export async function migratePasswordIfNeeded(
  plain: string,
  stored: string
): Promise<{ matched: boolean; password: string; migrated: boolean }> {
  const matched = await verifyPassword(plain, stored);
  if (!matched) {
    return { matched: false, password: stored, migrated: false };
  }
  if (isPasswordHashed(stored)) {
    return { matched: true, password: stored, migrated: false };
  }
  const hashed = await hashPassword(plain);
  return { matched: true, password: hashed, migrated: true };
}

export function getServerAdminCredentials(): { email: string; password: string } | null {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD?.trim();
  if (!email || !password) return null;
  return { email, password };
}
