import "server-only";

import { isVercelRuntime, storageGet, storageSet, usesKvStorage } from "@/lib/storage";

export async function readJsonFile<T>(filename: string, defaultValue: T): Promise<T> {
  const stored = await storageGet<T>(filename);
  if (stored !== null) {
    return stored;
  }

  // Seed local dev files only — never write to disk on Vercel/serverless.
  if (!usesKvStorage() && !isVercelRuntime()) {
    await storageSet(filename, defaultValue);
  }

  return defaultValue;
}

export async function writeJsonFile<T>(filename: string, data: T): Promise<void> {
  await storageSet(filename, data);
}
