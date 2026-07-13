import "server-only";

import { readJsonFile } from "@/lib/server-data";
import type { User } from "@/lib/auth";

const USERS_FILE = "users.json";

type StoredUser = User & { adminNotes?: string };

export async function findUserByEmail(email: string): Promise<StoredUser | null> {
  const normalized = email.trim().toLowerCase();
  const users = await readJsonFile<StoredUser[]>(USERS_FILE, []);
  return users.find((user) => user.email.toLowerCase() === normalized) ?? null;
}

export async function isEmailBanned(email: string): Promise<boolean> {
  const user = await findUserByEmail(email);
  return user?.banned === true;
}

export const BANNED_USER_MESSAGE =
  "Contul tău a fost suspendat. Contactează suport@novra.ro pentru asistență.";
