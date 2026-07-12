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

function kvEnv(): { url: string | undefined; token: string | undefined } {
  return {
    url: process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN,
  };
}

function isKvConfigured(): boolean {
  const { url, token } = kvEnv();
  return Boolean(url && token);
}

function isServerlessRuntime(): boolean {
  return (
    process.env.VERCEL === "1" ||
    Boolean(process.env.VERCEL_ENV) ||
    Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME) ||
    process.cwd().startsWith("/var/task")
  );
}

function requireKvOnServerless(): void {
  if (isServerlessRuntime() && !isKvConfigured()) {
    const { url, token } = kvEnv();
    const missing: string[] = [];
    if (!url) missing.push("KV_REST_API_URL or UPSTASH_REDIS_REST_URL");
    if (!token) missing.push("KV_REST_API_TOKEN or UPSTASH_REDIS_REST_TOKEN");
    throw new StorageUnavailableError(
      `Persistent storage requires Upstash Redis on Vercel. Missing: ${missing.join(", ")}.`
    );
  }
}

function assertNotServerlessFilesystem(): void {
  if (isServerlessRuntime()) {
    throw new StorageUnavailableError(
      "Filesystem storage is not available on Vercel. Configure Upstash Redis (KV_REST_API_URL + KV_REST_API_TOKEN)."
    );
  }
}

function toKvKey(filename: string): string {
  return `${KV_KEY_PREFIX}${filename}`;
}

function getDataFilePath(filename: string): string {
  return path.join(DATA_DIR, filename);
}

async function ensureLocalDataDir(): Promise<void> {
  assertNotServerlessFilesystem();
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readFromFilesystem<T>(filename: string): Promise<T | null> {
  assertNotServerlessFilesystem();
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
  assertNotServerlessFilesystem();
  await ensureLocalDataDir();
  const filePath = getDataFilePath(filename);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

async function getRedisClient() {
  const { url, token } = kvEnv();
  if (!url || !token) return null;

  const { Redis } = await import("@upstash/redis");
  return new Redis({ url, token });
}

async function readFromKv<T>(filename: string): Promise<T | null> {
  const redis = await getRedisClient();
  if (!redis) {
    throw new StorageUnavailableError(
      "Upstash Redis client could not be initialized. Check KV_REST_API_URL and KV_REST_API_TOKEN."
    );
  }
  return redis.get<T>(toKvKey(filename));
}

async function writeToKv<T>(filename: string, data: T): Promise<void> {
  const redis = await getRedisClient();
  if (!redis) {
    throw new StorageUnavailableError(
      "Upstash Redis client could not be initialized. Check KV_REST_API_URL and KV_REST_API_TOKEN."
    );
  }
  await redis.set(toKvKey(filename), data);
}

export async function storageGet<T>(filename: string): Promise<T | null> {
  requireKvOnServerless();

  if (isKvConfigured()) {
    return readFromKv<T>(filename);
  }

  return readFromFilesystem<T>(filename);
}

export async function storageSet<T>(filename: string, data: T): Promise<void> {
  requireKvOnServerless();

  if (isKvConfigured()) {
    await writeToKv(filename, data);
    return;
  }

  await writeToFilesystem(filename, data);
}

export function usesKvStorage(): boolean {
  return isKvConfigured();
}

export function isVercelRuntime(): boolean {
  return isServerlessRuntime();
}
