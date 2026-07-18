import "server-only";

import { readJsonFile, writeJsonFile } from "@/lib/server-data";
import { DEFAULT_SETTINGS, mergeSettings } from "@/lib/site-settings";
import { getServerSiteSettings } from "@/lib/site-settings-server";
import type { EmailAutomationKey, EmailAutomationMeta, EmailAutomations } from "@/lib/email-automations";

export type { EmailAutomationKey, EmailAutomationMeta, EmailAutomations };

const FILE = "email-automations.json";
const SETTINGS_FILE = "settings.json";

const DEFAULT_META: EmailAutomationMeta = {
  enabled: false,
  delayMinutes: 0,
  lastRunAt: null,
  sentCount: 0,
};

const ORDER_EMAIL_KEYS: EmailAutomationKey[] = [
  "orderConfirmation",
  "orderProcessing",
  "orderShipped",
  "orderDelivered",
  "orderCancelled",
  "adminNewOrder",
  "adminOrderCancelled",
];

const DEFAULT_AUTOMATIONS: EmailAutomations = {
  welcome: { ...DEFAULT_META, enabled: true },
  orderConfirmation: { ...DEFAULT_META, enabled: false },
  orderProcessing: { ...DEFAULT_META, enabled: false },
  orderShipped: { ...DEFAULT_META, enabled: false },
  orderDelivered: { ...DEFAULT_META, enabled: false },
  orderCancelled: { ...DEFAULT_META, enabled: false },
  adminNewOrder: { ...DEFAULT_META, enabled: false },
  passwordReset: { ...DEFAULT_META, enabled: true },
  newsletter: { ...DEFAULT_META, enabled: true },
  reviewRequest: { ...DEFAULT_META, enabled: false, delayMinutes: 1440 },
  contactConfirmation: { ...DEFAULT_META, enabled: true },
  contactAdmin: { ...DEFAULT_META, enabled: true },
  giftCard: { ...DEFAULT_META, enabled: true },
  storeCredit: { ...DEFAULT_META, enabled: true },
  adminOrderCancelled: { ...DEFAULT_META, enabled: false },
  returnApproved: { ...DEFAULT_META, enabled: true },
  refund: { ...DEFAULT_META, enabled: true },
  returnRequestAdmin: { ...DEFAULT_META, enabled: true },
  accountConfirmation: { ...DEFAULT_META, enabled: true },
  emailVerification: { ...DEFAULT_META, enabled: true },
  subscriptionConfirmation: { ...DEFAULT_META, enabled: true },
};

type StoredAutomation = Partial<EmailAutomationMeta> & { enabled?: boolean };

function isOrderEmailKey(key: EmailAutomationKey): boolean {
  return ORDER_EMAIL_KEYS.includes(key);
}

function normalizeMeta(
  key: EmailAutomationKey,
  stored: StoredAutomation | boolean | undefined,
  orderEmailsEnabled: boolean
): EmailAutomationMeta {
  const defaults = DEFAULT_AUTOMATIONS[key];

  if (typeof stored === "boolean") {
    return {
      ...defaults,
      enabled: stored,
    };
  }

  if (stored && typeof stored === "object") {
    return {
      enabled: typeof stored.enabled === "boolean" ? stored.enabled : defaults.enabled,
      delayMinutes:
        typeof stored.delayMinutes === "number" && stored.delayMinutes >= 0
          ? stored.delayMinutes
          : defaults.delayMinutes,
      lastRunAt: typeof stored.lastRunAt === "string" ? stored.lastRunAt : stored.lastRunAt ?? null,
      sentCount: typeof stored.sentCount === "number" ? stored.sentCount : 0,
    };
  }

  if (isOrderEmailKey(key)) {
    return { ...defaults, enabled: orderEmailsEnabled };
  }

  return defaults;
}

export async function getEmailAutomations(): Promise<EmailAutomations> {
  const stored = await readJsonFile<Partial<Record<EmailAutomationKey, StoredAutomation | boolean>>>(FILE, {});
  const siteSettings = await getServerSiteSettings();

  const result = {} as EmailAutomations;
  for (const key of Object.keys(DEFAULT_AUTOMATIONS) as EmailAutomationKey[]) {
    result[key] = normalizeMeta(key, stored[key], siteSettings.orderEmailsEnabled);
  }

  result.orderConfirmation.enabled = siteSettings.orderEmailsEnabled;
  if (stored.orderShipped === undefined && typeof stored.orderConfirmation !== "object") {
    result.orderShipped.enabled = siteSettings.orderEmailsEnabled;
  }
  if (stored.orderProcessing === undefined) {
    result.orderProcessing.enabled = siteSettings.orderEmailsEnabled;
  }
  if (stored.orderDelivered === undefined) {
    result.orderDelivered.enabled = siteSettings.orderEmailsEnabled;
  }
  if (stored.orderCancelled === undefined) {
    result.orderCancelled.enabled = siteSettings.orderEmailsEnabled;
  }
  if (stored.adminNewOrder === undefined) {
    result.adminNewOrder.enabled = siteSettings.orderEmailsEnabled;
  }
  if (stored.adminOrderCancelled === undefined) {
    result.adminOrderCancelled.enabled = siteSettings.orderEmailsEnabled;
  }

  return result;
}

export async function isAutomationEnabled(key: EmailAutomationKey): Promise<boolean> {
  const automations = await getEmailAutomations();
  return automations[key].enabled;
}

export async function getAutomationMeta(key: EmailAutomationKey): Promise<EmailAutomationMeta> {
  const automations = await getEmailAutomations();
  return automations[key];
}

export async function recordAutomationRun(key: EmailAutomationKey): Promise<void> {
  const stored = await readJsonFile<Partial<Record<EmailAutomationKey, StoredAutomation>>>(FILE, {});
  const current = normalizeMeta(key, stored[key], (await getServerSiteSettings()).orderEmailsEnabled);
  stored[key] = {
    ...current,
    lastRunAt: new Date().toISOString(),
    sentCount: current.sentCount + 1,
  };
  await writeJsonFile(FILE, stored);
}

export async function saveEmailAutomations(
  updates: Partial<Record<EmailAutomationKey, Partial<EmailAutomationMeta> | boolean>>
): Promise<EmailAutomations> {
  const stored = await readJsonFile<Partial<Record<EmailAutomationKey, StoredAutomation>>>(FILE, {});
  const siteSettings = await getServerSiteSettings();

  for (const [rawKey, value] of Object.entries(updates)) {
    const key = rawKey as EmailAutomationKey;
    if (!(key in DEFAULT_AUTOMATIONS)) continue;

    const current = normalizeMeta(key, stored[key], siteSettings.orderEmailsEnabled);

    if (typeof value === "boolean") {
      stored[key] = { ...current, enabled: value };
    } else if (value && typeof value === "object") {
      stored[key] = {
        enabled: typeof value.enabled === "boolean" ? value.enabled : current.enabled,
        delayMinutes:
          typeof value.delayMinutes === "number" && value.delayMinutes >= 0
            ? value.delayMinutes
            : current.delayMinutes,
        lastRunAt: current.lastRunAt,
        sentCount: current.sentCount,
      };
    }
  }

  const orderToggleUpdated = ORDER_EMAIL_KEYS.some((key) => key in updates);
  if (orderToggleUpdated) {
    const currentSettings = await readJsonFile<Partial<typeof DEFAULT_SETTINGS>>(
      SETTINGS_FILE,
      DEFAULT_SETTINGS
    );

    let orderEmailsEnabled = mergeSettings(currentSettings).orderEmailsEnabled;

    for (const key of ORDER_EMAIL_KEYS) {
      const value = updates[key];
      if (typeof value === "boolean") {
        orderEmailsEnabled = value;
        break;
      }
      if (value && typeof value === "object" && typeof value.enabled === "boolean") {
        orderEmailsEnabled = value.enabled;
        break;
      }
    }

    await writeJsonFile(
      SETTINGS_FILE,
      mergeSettings({ ...currentSettings, orderEmailsEnabled })
    );

    for (const key of ORDER_EMAIL_KEYS) {
      const meta = normalizeMeta(key, stored[key], orderEmailsEnabled);
      stored[key] = { ...meta, enabled: orderEmailsEnabled };
    }
  }

  await writeJsonFile(FILE, stored);
  return getEmailAutomations();
}
