import "server-only";

import fs from "fs/promises";
import path from "path";

const IMAGE_KEY_PREFIX = "novra:image:";
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

export type StoredImage = {
  base64: string;
  contentType: string;
  updatedAt: string;
};

function normalizeImagePath(imagePath: string): string | null {
  const cleaned = imagePath
    .replace(/^\/+/, "")
    .replace(/\\/g, "/")
    .trim();

  if (!cleaned || cleaned.includes("..")) return null;
  if (!/^[a-zA-Z0-9/_\-.]+$/.test(cleaned)) return null;
  return cleaned;
}

function toRedisKey(imagePath: string): string {
  return `${IMAGE_KEY_PREFIX}${imagePath}`;
}

async function getRedisClient() {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  const { Redis } = await import("@upstash/redis");
  return new Redis({ url, token });
}

export function guessContentType(imagePath: string): string {
  const lower = imagePath.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".svg")) return "image/svg+xml";
  return "application/octet-stream";
}

export async function saveImageToStore(
  imagePath: string,
  base64: string,
  contentType: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  const normalized = normalizeImagePath(imagePath);
  if (!normalized) {
    return { ok: false, message: "Cale imagine invalidă." };
  }

  const buffer = Buffer.from(base64, "base64");
  if (buffer.length === 0) {
    return { ok: false, message: "Fișierul imagine este gol." };
  }
  if (buffer.length > MAX_IMAGE_BYTES) {
    return { ok: false, message: "Imaginea depășește limita de 2 MB." };
  }

  const redis = await getRedisClient();
  if (!redis) {
    return { ok: false, message: "Redis nu este configurat pentru upload imagini." };
  }

  const payload: StoredImage = {
    base64,
    contentType: contentType || guessContentType(normalized),
    updatedAt: new Date().toISOString(),
  };

  await redis.set(toRedisKey(normalized), payload);
  return { ok: true };
}

export async function getImageFromStore(imagePath: string): Promise<StoredImage | null> {
  const normalized = normalizeImagePath(imagePath);
  if (!normalized) return null;

  const redis = await getRedisClient();
  if (redis) {
    const stored = await redis.get<StoredImage>(toRedisKey(normalized));
    if (stored?.base64) return stored;
  }

  return null;
}

export async function readPublicImageFallback(imagePath: string): Promise<{
  buffer: Buffer;
  contentType: string;
} | null> {
  const normalized = normalizeImagePath(imagePath);
  if (!normalized) return null;

  const publicPath = path.join(process.cwd(), "public", normalized);

  try {
    const buffer = await fs.readFile(publicPath);
    return {
      buffer,
      contentType: guessContentType(normalized),
    };
  } catch {
    return null;
  }
}

export function toPublicImagePath(src: string): string {
  if (!src) return "";
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  return src.startsWith("/") ? src.slice(1) : src;
}

export function toImageApiUrl(src: string): string {
  const publicPath = toPublicImagePath(src);
  if (!publicPath) return src;
  return `/api/store/images?path=${encodeURIComponent(publicPath)}`;
}
