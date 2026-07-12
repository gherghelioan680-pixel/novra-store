import { apiFetch, getApiHeaders } from "./api-client";
import { dispatchStoreUpdate, STORAGE_KEYS } from "./store";

export type NewsletterSubscriber = {
  email: string;
  name?: string;
  subscribedAt: string;
  source: "homepage" | "account" | "other";
  discountCode?: string;
};

function isBrowser() {
  return typeof window !== "undefined";
}

function cacheNewsletterSubscribers(subscribers: NewsletterSubscriber[]): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEYS.newsletter, JSON.stringify(subscribers));
  } catch {
    /* ignore */
  }
}

export function getNewsletterSubscribers(): NewsletterSubscriber[] {
  if (!isBrowser()) return [];

  try {
    const stored = window.localStorage.getItem(STORAGE_KEYS.newsletter);
    if (!stored) return [];
    return JSON.parse(stored) as NewsletterSubscriber[];
  } catch {
    return [];
  }
}

export async function loadNewsletterSubscribers(): Promise<NewsletterSubscriber[]> {
  const fromApi = await apiFetch<{ subscribers: NewsletterSubscriber[] }>("/api/store/newsletter");
  if (fromApi?.subscribers) {
    cacheNewsletterSubscribers(fromApi.subscribers);
    return fromApi.subscribers;
  }
  return getNewsletterSubscribers();
}

export async function saveNewsletterSubscribers(subscribers: NewsletterSubscriber[]): Promise<boolean> {
  if (!isBrowser()) return false;

  cacheNewsletterSubscribers(subscribers);
  dispatchStoreUpdate({ scope: "newsletter" });
  return true;
}

export async function addNewsletterSubscriber(
  email: string,
  options?: { name?: string; source?: NewsletterSubscriber["source"] }
): Promise<
  | { ok: true; alreadySubscribed: boolean; discountCode?: string; discountMessage?: string }
  | { ok: false; message: string }
> {
  if (!isBrowser()) {
    return { ok: false, message: "Acțiunea nu poate fi efectuată în acest moment." };
  }

  const trimmed = email.trim().toLowerCase();
  if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return { ok: false, message: "Introdu o adresă de email validă." };
  }

  const subscribers = getNewsletterSubscribers();
  const existing = subscribers.find((subscriber) => subscriber.email === trimmed);
  if (existing) {
    return {
      ok: true,
      alreadySubscribed: true,
      discountCode: existing.discountCode,
      discountMessage: existing.discountCode
        ? `Codul tău: ${existing.discountCode} — 10% reducere la prima comandă!`
        : undefined,
    };
  }

  try {
    const response = await fetch("/api/store/newsletter", {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify({
        email: trimmed,
        name: options?.name?.trim() || undefined,
        source: options?.source ?? "other",
      }),
    });

    if (!response.ok) {
      return { ok: false, message: "Nu s-a putut salva abonarea pe server." };
    }

    const data = (await response.json()) as {
      subscriber?: NewsletterSubscriber;
      alreadySubscribed?: boolean;
      discountCode?: string;
      discountMessage?: string;
    };

    if (data.alreadySubscribed) {
      return {
        ok: true,
        alreadySubscribed: true,
        discountCode: data.discountCode,
        discountMessage: data.discountMessage,
      };
    }

    if (data.subscriber) {
      subscribers.unshift(data.subscriber);
      cacheNewsletterSubscribers(subscribers);
      dispatchStoreUpdate({ scope: "newsletter" });
    }

    return {
      ok: true,
      alreadySubscribed: false,
      discountCode: data.discountCode,
      discountMessage: data.discountMessage,
    };
  } catch {
    return { ok: false, message: "Nu s-a putut salva abonarea." };
  }
}
