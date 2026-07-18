import { apiFetch, getApiHeaders } from "./api-client";
import { getStoredUsers, saveUsers } from "./auth";
import { dispatchStoreUpdate, STORAGE_KEYS } from "./store";

export type NewsletterSubscriber = {
  email: string;
  name?: string;
  notes?: string;
  subscribedAt: string;
  source: "homepage" | "account" | "other" | "admin";
  discountCode?: string;
};

export type NewsletterCampaignStatus =
  | "draft"
  | "scheduled"
  | "sending"
  | "sent"
  | "failed";

export type NewsletterCampaign = {
  id: string;
  title: string;
  subject: string;
  body: string;
  previewText?: string;
  templateId?: string;
  recipients?: string[];
  sendToAll?: boolean;
  scheduledAt?: string;
  status: NewsletterCampaignStatus;
  createdAt: string;
  updatedAt: string;
  sentAt?: string;
  sentCount?: number;
  failedCount?: number;
  errorMessage?: string;
};

export type UpdateNewsletterSubscriberInput = {
  email?: string;
  name?: string;
  notes?: string;
  discountCode?: string | null;
};

export function formatNewsletterWelcomePreview(
  template: string,
  discountCode = "NOVRA10-EXAMPLE",
  discountPercent = 10
): string {
  return template
    .replace(/\{code\}/g, discountCode)
    .replace(/\{percent\}/g, String(discountPercent));
}

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

    const subscribers = getNewsletterSubscribers();

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

export async function deleteNewsletterSubscriber(
  email: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!isBrowser()) {
    return { ok: false, message: "Indisponibil." };
  }

  const trimmed = email.trim().toLowerCase();
  if (!trimmed) {
    return { ok: false, message: "Email invalid." };
  }

  try {
    const response = await fetch("/api/store/newsletter", {
      method: "DELETE",
      headers: getApiHeaders(),
      body: JSON.stringify({ email: trimmed }),
    });

    if (!response.ok) {
      return { ok: false, message: "Nu s-a putut șterge abonatul." };
    }

    const data = (await response.json()) as {
      subscribers?: NewsletterSubscriber[];
      unsubscribedUser?: boolean;
    };
    if (data.subscribers) {
      cacheNewsletterSubscribers(data.subscribers);
    } else {
      cacheNewsletterSubscribers(
        getNewsletterSubscribers().filter((subscriber) => subscriber.email !== trimmed)
      );
    }

    const users = getStoredUsers();
    const userIndex = users.findIndex((user) => user.email.toLowerCase() === trimmed);
    if (userIndex !== -1 && users[userIndex].subscribedToNewsletter) {
      users[userIndex] = { ...users[userIndex], subscribedToNewsletter: false };
      saveUsers(users);
      dispatchStoreUpdate({ scope: "users" });
    }

    dispatchStoreUpdate({ scope: "newsletter" });
    return { ok: true };
  } catch {
    return { ok: false, message: "Eroare de rețea." };
  }
}

export async function updateNewsletterSubscriber(
  email: string,
  updates: UpdateNewsletterSubscriberInput
): Promise<
  | { ok: true; subscriber: NewsletterSubscriber }
  | { ok: false; message: string }
> {
  if (!isBrowser()) {
    return { ok: false, message: "Indisponibil." };
  }

  const trimmed = email.trim().toLowerCase();
  if (!trimmed) {
    return { ok: false, message: "Email invalid." };
  }

  try {
    const response = await fetch("/api/store/newsletter", {
      method: "PATCH",
      headers: getApiHeaders(),
      body: JSON.stringify({ email: trimmed, updates }),
    });

    const data = (await response.json()) as {
      ok?: boolean;
      subscriber?: NewsletterSubscriber;
      subscribers?: NewsletterSubscriber[];
      message?: string;
      error?: string;
    };

    if (!response.ok || !data.ok || !data.subscriber) {
      return { ok: false, message: data.message ?? data.error ?? "Nu s-a putut actualiza abonatul." };
    }

    if (data.subscribers) {
      cacheNewsletterSubscribers(data.subscribers);
    }
    dispatchStoreUpdate({ scope: "newsletter" });
    return { ok: true, subscriber: data.subscriber };
  } catch {
    return { ok: false, message: "Eroare de rețea." };
  }
}

export async function adminAddNewsletterSubscriber(
  email: string,
  options?: {
    name?: string;
    notes?: string;
    generateCode?: boolean;
    sendWelcomeEmail?: boolean;
  }
): Promise<
  | { ok: true; subscriber: NewsletterSubscriber; discountCode?: string }
  | { ok: false; message: string }
> {
  if (!isBrowser()) {
    return { ok: false, message: "Indisponibil." };
  }

  const trimmed = email.trim().toLowerCase();
  if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return { ok: false, message: "Introdu o adresă de email validă." };
  }

  try {
    const response = await fetch("/api/store/newsletter", {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify({
        email: trimmed,
        name: options?.name?.trim() || undefined,
        notes: options?.notes?.trim() || undefined,
        source: "admin",
        admin: true,
        generateCode: options?.generateCode,
        sendWelcomeEmail: options?.sendWelcomeEmail,
      }),
    });

    const data = (await response.json()) as {
      ok?: boolean;
      subscriber?: NewsletterSubscriber;
      alreadySubscribed?: boolean;
      discountCode?: string;
      message?: string;
      error?: string;
    };

    if (!response.ok) {
      return { ok: false, message: data.message ?? data.error ?? "Nu s-a putut adăuga abonatul." };
    }

    if (data.alreadySubscribed) {
      return { ok: false, message: "Acest email este deja abonat." };
    }

    if (data.subscriber) {
      const subscribers = getNewsletterSubscribers();
      subscribers.unshift(data.subscriber);
      cacheNewsletterSubscribers(subscribers);
      dispatchStoreUpdate({ scope: "newsletter" });
    }

    return {
      ok: true,
      subscriber: data.subscriber!,
      discountCode: data.discountCode,
    };
  } catch {
    return { ok: false, message: "Eroare de rețea." };
  }
}

export function exportNewsletterSubscribersCsv(subscribers: NewsletterSubscriber[]): string {
  const header = "Email,Nume,Data abonare,Sursa,Cod reducere,Note";
  const rows = subscribers.map((sub) => {
    const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
    return [
      escape(sub.email),
      escape(sub.name ?? ""),
      escape(sub.subscribedAt),
      escape(sub.source),
      escape(sub.discountCode ?? ""),
      escape(sub.notes ?? ""),
    ].join(",");
  });
  return [header, ...rows].join("\n");
}

export async function loadNewsletterCampaigns(): Promise<NewsletterCampaign[]> {
  const fromApi = await apiFetch<{ campaigns: NewsletterCampaign[] }>("/api/store/newsletter/campaigns");
  return fromApi?.campaigns ?? [];
}

export async function saveNewsletterCampaign(
  campaign: Partial<NewsletterCampaign> & {
    title: string;
    subject: string;
    body: string;
    previewText?: string;
    templateId?: string;
    recipients?: string[];
    sendToAll?: boolean;
    scheduledAt?: string;
    saveAsDraft?: boolean;
  }
): Promise<{ ok: true; campaign: NewsletterCampaign } | { ok: false; message: string }> {
  try {
    const response = await fetch("/api/store/newsletter/campaigns", {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify({
        action: campaign.id ? "update" : "create",
        ...campaign,
        scheduledAt: campaign.scheduledAt
          ? new Date(campaign.scheduledAt).toISOString()
          : campaign.saveAsDraft
            ? null
            : undefined,
        saveAsDraft: campaign.saveAsDraft,
      }),
    });
    const data = (await response.json()) as {
      ok?: boolean;
      campaign?: NewsletterCampaign;
      message?: string;
      error?: string;
    };
    if (!response.ok || !data.ok || !data.campaign) {
      return { ok: false, message: data.message ?? data.error ?? "Nu s-a putut salva campania." };
    }
    return { ok: true, campaign: data.campaign };
  } catch {
    return { ok: false, message: "Eroare de rețea." };
  }
}

export async function deleteNewsletterCampaign(
  id: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const response = await fetch("/api/store/newsletter/campaigns", {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify({ action: "delete", id }),
    });
    const data = (await response.json()) as { ok?: boolean; message?: string; error?: string };
    if (!response.ok || !data.ok) {
      return { ok: false, message: data.message ?? data.error ?? "Nu s-a putut șterge campania." };
    }
    return { ok: true };
  } catch {
    return { ok: false, message: "Eroare de rețea." };
  }
}

export async function scheduleNewsletterCampaign(
  id: string,
  scheduledAt: string
): Promise<{ ok: true; campaign: NewsletterCampaign } | { ok: false; message: string }> {
  try {
    const response = await fetch("/api/store/newsletter/campaigns", {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify({ action: "schedule", id, scheduledAt }),
    });
    const data = (await response.json()) as {
      ok?: boolean;
      campaign?: NewsletterCampaign;
      message?: string;
      error?: string;
    };
    if (!response.ok || !data.ok || !data.campaign) {
      return { ok: false, message: data.message ?? data.error ?? "Nu s-a putut programa campania." };
    }
    return { ok: true, campaign: data.campaign };
  } catch {
    return { ok: false, message: "Eroare de rețea." };
  }
}

export async function sendNewsletterCampaign(
  id: string
): Promise<
  | { ok: true; sentCount: number; failedCount: number }
  | { ok: false; message: string }
> {
  try {
    const response = await fetch("/api/store/newsletter/campaigns", {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify({ action: "send", id }),
    });
    const data = (await response.json()) as {
      ok?: boolean;
      sentCount?: number;
      failedCount?: number;
      message?: string;
      error?: string;
    };
    if (!response.ok || !data.ok) {
      return { ok: false, message: data.message ?? data.error ?? "Nu s-a putut trimite campania." };
    }
    return {
      ok: true,
      sentCount: data.sentCount ?? 0,
      failedCount: data.failedCount ?? 0,
    };
  } catch {
    return { ok: false, message: "Eroare de rețea." };
  }
}
