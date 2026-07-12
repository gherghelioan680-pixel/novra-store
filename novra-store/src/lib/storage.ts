import "server-only";

import fs from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const KV_KEY_PREFIX = "novra:";

export class StorageUnavailableError extends Error {
  constructor(message = "Persistent storage is not configured.") {
    super(message);
    this.name = "StorageUnavailableError";
  }
}

function isKvConfigured(): boolean {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  return Boolean(url && token);
}

function isVercelRuntime(): boolean {
  return Boolean(process.env.VERCEL);
}

function toKvKey(filename: string): string {
  return `${KV_KEY_PREFIX}${filename}`;
}

function getDataFilePath(filename: string): string {
  return path.join(DATA_DIR, filename);
}

async function ensureLocalDataDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readFromFilesystem<T>(filename: string): Promise<T | null> {
  await ensureLocalDataDir();
  const filePath = getDataFilePath(filename);

  try {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content) as T;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") return null;
    throw error;
  }
}

async function writeToFilesystem<T>(filename: string, data: T): Promise<void> {
  await ensureLocalDataDir();
  const filePath = getDataFilePath(filename);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

async function getRedisClient() {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  const { Redis } = await import("@upstash/redis");
  return new Redis({ url, token });
}

async function readFromKv<T>(filename: string): Promise<T | null> {
  const redis = await getRedisClient();
  if (!redis) return null;
  return redis.get<T>(toKvKey(filename));
}

async function writeToKv<T>(filename: string, data: T): Promise<void> {
  const redis = await getRedisClient();
  if (!redis) {
    throw new StorageUnavailableError(
      "KV_REST_API_URL and KV_REST_API_TOKEN must be set on Vercel for persistent storage."
    );
  }
  await redis.set(toKvKey(filename), data);
}

function assertWritableStorage(): void {
  if (isVercelRuntime() && !isKvConfigured()) {
    throw new StorageUnavailableError(
      "KV_REST_API_URL and KV_REST_API_TOKEN must be set on Vercel for persistent storage."
    );
  }
}

export async function storageGet<T>(filename: string): Promise<T | null> {
  if (isKvConfigured()) {
    return readFromKv<T>(filename);
  }

  if (isVercelRuntime()) {
    throw new StorageUnavailableError(
      "KV_REST_API_URL and KV_REST_API_TOKEN must be set on Vercel for persistent storage."
    );
  }

  return readFromFilesystem<T>(filename);
}

export async function storageSet<T>(filename: string, data: T): Promise<void> {
  assertWritableStorage();

  if (isKvConfigured()) {
    await writeToKv(filename, data);
    return;
  }

  await writeToFilesystem(filename, data);
}

export function usesKvStorage(): boolean {
  return isKvConfigured();
}

export function isServerlessRuntime(): boolean {
  return isVercelRuntime();
}
