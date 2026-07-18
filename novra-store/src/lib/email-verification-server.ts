import "server-only";

import { randomBytes } from "crypto";
import { isEmailConfigured } from "./email";
import { isEmailsEnabled } from "./emails-enabled";
import { readJsonFile, writeJsonFile } from "./server-data";

const FILE = "email-verification-tokens.json";
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

type VerificationToken = {
  token: string;
  email: string;
  expiresAt: string;
};

async function readTokens(): Promise<VerificationToken[]> {
  return readJsonFile<VerificationToken[]>(FILE, []);
}

export async function createEmailVerificationToken(email: string): Promise<string> {
  const tokens = await readTokens();
  const now = Date.now();
  const normalized = email.trim().toLowerCase();
  const filtered = tokens.filter(
    (item) => item.email !== normalized && new Date(item.expiresAt).getTime() > now
  );
  const token = randomBytes(32).toString("hex");
  filtered.push({
    token,
    email: normalized,
    expiresAt: new Date(now + TOKEN_TTL_MS).toISOString(),
  });
  await writeJsonFile(FILE, filtered);
  return token;
}

export async function consumeEmailVerificationToken(token: string): Promise<string | null> {
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

export function isEmailVerificationConfigured(): boolean {
  return isEmailsEnabled() && isEmailConfigured();
}
