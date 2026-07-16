import "server-only";

const ACTIVE_KEY = "novra:visitors:active";
const UNIQUE_PREFIX = "novra:visitors:unique:";
export const VISITOR_SESSION_TTL_SECONDS = 300;

const memoryActive = new Map<string, number>();
const memoryDaily = new Map<string, Set<string>>();

async function getRedisClient() {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  const { Redis } = await import("@upstash/redis");
  return new Redis({ url, token });
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function pruneMemoryActive(now: number): void {
  for (const [sessionId, expiry] of memoryActive) {
    if (expiry <= now) memoryActive.delete(sessionId);
  }
}

export async function recordVisitorHeartbeat(sessionId: string): Promise<void> {
  const trimmed = sessionId.trim();
  if (!trimmed || trimmed.length > 128) return;

  const expiry = Date.now() + VISITOR_SESSION_TTL_SECONDS * 1000;
  const date = todayKey();
  const redis = await getRedisClient();

  if (!redis) {
    memoryActive.set(trimmed, expiry);
    pruneMemoryActive(Date.now());
    if (!memoryDaily.has(date)) memoryDaily.set(date, new Set());
    memoryDaily.get(date)!.add(trimmed);
    return;
  }

  await redis.zadd(ACTIVE_KEY, { score: expiry, member: trimmed });

  const uniqueKey = `${UNIQUE_PREFIX}${date}`;
  await redis.sadd(uniqueKey, trimmed);
  await redis.expire(uniqueKey, 48 * 3600);
}

export async function getLiveVisitorCount(): Promise<number> {
  const now = Date.now();
  const redis = await getRedisClient();

  if (!redis) {
    pruneMemoryActive(now);
    return memoryActive.size;
  }

  await redis.zremrangebyscore(ACTIVE_KEY, 0, now);
  return redis.zcard(ACTIVE_KEY);
}

export async function getUniqueVisitorsToday(): Promise<number> {
  const date = todayKey();
  const redis = await getRedisClient();

  if (!redis) {
    return memoryDaily.get(date)?.size ?? 0;
  }

  return redis.scard(`${UNIQUE_PREFIX}${date}`);
}
