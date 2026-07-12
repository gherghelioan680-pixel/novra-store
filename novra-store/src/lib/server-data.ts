import "server-only";

import { storageGet, storageSet, usesKvStorage } from "@/lib/storage";

export async function readJsonFile<T>(filename: string, defaultValue: T): Promise<T> {
  const stored = await storageGet<T>(filename);
  if (stored !== null) {
    return stored;
  }

  if (!usesKvStorage()) {
    await storageSet(filename, defaultValue);
  }

  return defaultValue;
}

export async function writeJsonFile<T>(filename: string, data: T): Promise<void> {
  await storageSet(filename, data);
}
