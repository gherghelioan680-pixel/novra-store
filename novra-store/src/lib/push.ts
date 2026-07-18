import { apiFetch, getApiHeaders } from "./api-client";
import type { PushNotificationRecord } from "./push-types";

export async function getPushConfig(): Promise<{ supported: boolean; publicKey: string | null }> {
  const data = await apiFetch<{ supported: boolean; publicKey: string | null }>(
    "/api/store/push/subscribe"
  );
  return data ?? { supported: false, publicKey: null };
}

export async function subscribeToPush(
  subscription: {
    endpoint?: string;
    keys?: { p256dh?: string; auth?: string };
  }
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const response = await fetch("/api/store/push/subscribe", {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify({ subscription }),
    });
    const data = (await response.json()) as { ok?: boolean; message?: string };
    if (!response.ok || !data.ok) {
      return { ok: false, message: data.message ?? "Nu s-a putut activa notificarea." };
    }
    return { ok: true };
  } catch {
    return { ok: false, message: "Eroare de rețea." };
  }
}

export async function loadPushNotificationsAdmin(): Promise<{
  subscriptions: number;
  notifications: PushNotificationRecord[];
} | null> {
  return apiFetch("/api/store/push/send?scope=admin");
}

export async function sendPushNotificationAdmin(input: {
  title: string;
  body: string;
  link: string;
  scheduledAt?: string;
}): Promise<
  | { ok: true; successCount: number; failureCount: number }
  | { ok: false; message: string }
> {
  try {
    const response = await fetch("/api/store/push/send", {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify(input),
    });
    const data = (await response.json()) as {
      ok?: boolean;
      message?: string;
      successCount?: number;
      failureCount?: number;
    };
    if (!response.ok || !data.ok) {
      return { ok: false, message: data.message ?? "Trimiterea a eșuat." };
    }
    return {
      ok: true,
      successCount: data.successCount ?? 0,
      failureCount: data.failureCount ?? 0,
    };
  } catch {
    return { ok: false, message: "Eroare de rețea." };
  }
}

export async function updatePushNotificationAdmin(
  id: string,
  input: { title?: string; body?: string; link?: string; scheduledAt?: string }
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const response = await fetch("/api/store/push/send", {
      method: "PATCH",
      headers: getApiHeaders(),
      body: JSON.stringify({ id, ...input }),
    });
    const data = (await response.json()) as { ok?: boolean; message?: string };
    if (!response.ok || !data.ok) {
      return { ok: false, message: data.message ?? "Actualizare eșuată." };
    }
    return { ok: true };
  } catch {
    return { ok: false, message: "Eroare de rețea." };
  }
}

export async function deletePushNotificationAdmin(
  id: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const response = await fetch("/api/store/push/send", {
      method: "DELETE",
      headers: getApiHeaders(),
      body: JSON.stringify({ id }),
    });
    const data = (await response.json()) as { ok?: boolean; message?: string };
    if (!response.ok || !data.ok) {
      return { ok: false, message: data.message ?? "Ștergere eșuată." };
    }
    return { ok: true };
  } catch {
    return { ok: false, message: "Eroare de rețea." };
  }
}

export function isPushSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isPushSupported()) return null;
  try {
    return await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  } catch {
    return null;
  }
}

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}
