import "server-only";

import { randomBytes } from "crypto";
import { readJsonFile, writeJsonFile } from "./server-data";

const FILE = "password-reset-tokens.json";
const TOKEN_TTL_MS = 60 * 60 * 1000;

type ResetToken = {
  token: string;
  email: string;
  expiresAt: string;
};

async function readTokens(): Promise<ResetToken[]> {
  return readJsonFile<ResetToken[]>(FILE, []);
}

export async function createPasswordResetToken(email: string): Promise<string> {
  const tokens = await readTokens();
  const now = Date.now();
  const filtered = tokens.filter(
    (item) => item.email !== email && new Date(item.expiresAt).getTime() > now
  );
  const token = randomBytes(32).toString("hex");
  filtered.push({
    token,
    email,
    expiresAt: new Date(now + TOKEN_TTL_MS).toISOString(),
  });
  await writeJsonFile(FILE, filtered);
  return token;
}

export async function consumePasswordResetToken(
  token: string
): Promise<string | null> {
  const tokens = await readTokens();
  const now = Date.now();
  const match = tokens.find(
    (item) => item.token === token && new Date(item.expiresAt).getTime() > now
  );
  if (!match) return null;

  const remaining = tokens.filter((item) => item.token !== token);
  await writeJsonFile(FILE, remaining);
  return match.email;
}

export function isPasswordResetConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}
