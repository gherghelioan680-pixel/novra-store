import "server-only";

import webpush from "web-push";
import { readJsonFile, writeJsonFile } from "@/lib/server-data";
import {
  PUSH_NOTIFICATIONS_FILE,
  PUSH_SUBSCRIPTIONS_FILE,
  type PushNotificationRecord,
  type PushSubscriptionRecord,
} from "@/lib/push-types";

function nowIso(): string {
  return new Date().toISOString();
}

function buildId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getVapidPublicKey(): string | null {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? process.env.VAPID_PUBLIC_KEY ?? null;
}

function configureWebPush(): boolean {
  const publicKey = process.env.VAPID_PUBLIC_KEY ?? process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:contact@novra.ro";

  if (!publicKey || !privateKey) return false;

  webpush.setVapidDetails(subject, publicKey, privateKey);
  return true;
}

export async function readPushSubscriptions(): Promise<PushSubscriptionRecord[]> {
  return readJsonFile<PushSubscriptionRecord[]>(PUSH_SUBSCRIPTIONS_FILE, []);
}

export async function writePushSubscriptions(subs: PushSubscriptionRecord[]): Promise<void> {
  await writeJsonFile(PUSH_SUBSCRIPTIONS_FILE, subs);
}

export async function readPushNotifications(): Promise<PushNotificationRecord[]> {
  return readJsonFile<PushNotificationRecord[]>(PUSH_NOTIFICATIONS_FILE, []);
}

export async function writePushNotifications(records: PushNotificationRecord[]): Promise<void> {
  await writeJsonFile(PUSH_NOTIFICATIONS_FILE, records);
}

export async function upsertPushSubscription(input: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  userAgent?: string;
}): Promise<PushSubscriptionRecord> {
  const subs = await readPushSubscriptions();
  const ts = nowIso();
  const existingIndex = subs.findIndex((s) => s.endpoint === input.endpoint);

  if (existingIndex !== -1) {
    subs[existingIndex] = {
      ...subs[existingIndex],
      keys: input.keys,
      userAgent: input.userAgent,
      lastSeenAt: ts,
    };
    await writePushSubscriptions(subs);
    return subs[existingIndex];
  }

  const record: PushSubscriptionRecord = {
    id: buildId("psub"),
    endpoint: input.endpoint,
    keys: input.keys,
    userAgent: input.userAgent,
    createdAt: ts,
    lastSeenAt: ts,
  };

  subs.unshift(record);
  await writePushSubscriptions(subs.slice(0, 5000));
  return record;
}

export async function removePushSubscription(endpoint: string): Promise<void> {
  const subs = await readPushSubscriptions();
  await writePushSubscriptions(subs.filter((s) => s.endpoint !== endpoint));
}

export async function sendPushToAll(input: {
  title: string;
  body: string;
  link: string;
  scheduledAt?: string;
}): Promise<
  | { ok: true; notification: PushNotificationRecord; successCount: number; failureCount: number }
  | { ok: false; message: string }
> {
  const title = input.title.trim();
  const body = input.body.trim();
  const link = input.link.trim() || "/";

  if (!title || !body) {
    return { ok: false, message: "Titlul și mesajul sunt obligatorii." };
  }

  const ts = nowIso();
  const scheduledAt = input.scheduledAt;

  if (scheduledAt && new Date(scheduledAt).getTime() > Date.now()) {
    const records = await readPushNotifications();
    const notification: PushNotificationRecord = {
      id: buildId("pnotif"),
      title,
      body,
      link,
      status: "scheduled",
      scheduledAt,
      createdAt: ts,
    };
    records.unshift(notification);
    await writePushNotifications(records.slice(0, 200));
    return { ok: true, notification, successCount: 0, failureCount: 0 };
  }

  if (!configureWebPush()) {
    return {
      ok: false,
      message: "Push nu este configurat. Adaugă VAPID_PUBLIC_KEY și VAPID_PRIVATE_KEY.",
    };
  }

  const subs = await readPushSubscriptions();
  let successCount = 0;
  let failureCount = 0;
  const staleEndpoints: string[] = [];

  const payload = JSON.stringify({ title, body, link, icon: "/logo.png" });

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: sub.keys,
        },
        payload
      );
      successCount++;
    } catch (err) {
      failureCount++;
      const statusCode = (err as { statusCode?: number }).statusCode;
      if (statusCode === 404 || statusCode === 410) {
        staleEndpoints.push(sub.endpoint);
      }
    }
  }

  if (staleEndpoints.length) {
    const fresh = subs.filter((s) => !staleEndpoints.includes(s.endpoint));
    await writePushSubscriptions(fresh);
  }

  const records = await readPushNotifications();
  const notification: PushNotificationRecord = {
    id: buildId("pnotif"),
    title,
    body,
    link,
    status: successCount > 0 ? "sent" : "failed",
    sentAt: ts,
    recipientCount: subs.length,
    successCount,
    failureCount,
    createdAt: ts,
  };
  records.unshift(notification);
  await writePushNotifications(records.slice(0, 200));

  return { ok: true, notification, successCount, failureCount };
}

export async function processScheduledPushNotifications(): Promise<{
  processed: number;
  sent: number;
}> {
  const records = await readPushNotifications();
  const now = Date.now();
  let processed = 0;
  let sent = 0;

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    if (record.status !== "scheduled" || !record.scheduledAt) continue;
    if (new Date(record.scheduledAt).getTime() > now) continue;

    processed++;
    const result = await sendPushToAll({
      title: record.title,
      body: record.body,
      link: record.link,
    });

    if (result.ok && result.notification.status === "sent") {
      records[i] = { ...record, ...result.notification, sentAt: nowIso() };
      sent++;
    } else {
      records[i] = { ...record, status: "failed", sentAt: nowIso() };
    }
  }

  if (processed > 0) {
    await writePushNotifications(records);
  }

  return { processed, sent };
}

export async function updatePushNotification(
  id: string,
  updates: Partial<Pick<PushNotificationRecord, "title" | "body" | "link" | "scheduledAt">>
): Promise<{ ok: true; notification: PushNotificationRecord } | { ok: false; message: string }> {
  const records = await readPushNotifications();
  const index = records.findIndex((r) => r.id === id);
  if (index === -1) {
    return { ok: false, message: "Notificarea nu a fost găsită." };
  }

  const current = records[index];
  if (current.status === "sent") {
    return { ok: false, message: "Notificările trimise nu pot fi editate." };
  }

  records[index] = {
    ...current,
    ...(updates.title !== undefined ? { title: updates.title.trim() } : {}),
    ...(updates.body !== undefined ? { body: updates.body.trim() } : {}),
    ...(updates.link !== undefined ? { link: updates.link.trim() || "/" } : {}),
    ...(updates.scheduledAt !== undefined ? { scheduledAt: updates.scheduledAt || undefined } : {}),
  };
  await writePushNotifications(records);
  return { ok: true, notification: records[index] };
}

export async function deletePushNotification(
  id: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  const records = await readPushNotifications();
  const filtered = records.filter((r) => r.id !== id);
  if (filtered.length === records.length) {
    return { ok: false, message: "Notificarea nu a fost găsită." };
  }
  await writePushNotifications(filtered);
  return { ok: true };
}
