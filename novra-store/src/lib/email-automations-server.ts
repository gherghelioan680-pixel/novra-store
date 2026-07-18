import "server-only";

import { readJsonFile, writeJsonFile } from "@/lib/server-data";
import { DEFAULT_SETTINGS, mergeSettings } from "@/lib/site-settings";
import { getServerSiteSettings } from "@/lib/site-settings-server";
import type { EmailAutomationKey, EmailAutomationMeta, EmailAutomations } from "@/lib/email-automations";

export type { EmailAutomationKey, EmailAutomationMeta, EmailAutomations };

const FILE = "email-automations.json";
const SETTINGS_FILE = "settings.json";
const DEFAULTS_MIGRATION_VERSION = 2;

const DEFAULT_META: EmailAutomationMeta = {
  enabled: true,
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
  welcome: { ...DEFAULT_META },
  orderConfirmation: { ...DEFAULT_META },
  orderProcessing: { ...DEFAULT_META },
  orderShipped: { ...DEFAULT_META },
  orderDelivered: { ...DEFAULT_META },
  orderCancelled: { ...DEFAULT_META },
  adminNewOrder: { ...DEFAULT_META },
  passwordReset: { ...DEFAULT_META },
  newsletter: { ...DEFAULT_META },
  reviewRequest: { ...DEFAULT_META, delayMinutes: 1440 },
  contactConfirmation: { ...DEFAULT_META },
  contactAdmin: { ...DEFAULT_META },
  giftCard: { ...DEFAULT_META },
  storeCredit: { ...DEFAULT_META },
  adminOrderCancelled: { ...DEFAULT_META },
  returnApproved: { ...DEFAULT_META },
  refund: { ...DEFAULT_META },
  returnRequestAdmin: { ...DEFAULT_META },
  accountConfirmation: { ...DEFAULT_META },
  emailVerification: { ...DEFAULT_META },
  subscriptionConfirmation: { ...DEFAULT_META },
};

type StoredAutomation = Partial<EmailAutomationMeta> & { enabled?: boolean };

type StoredAutomationsFile = Partial<Record<EmailAutomationKey, StoredAutomation | boolean>> & {
  _defaultsVersion?: number;
};

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
      enabled: isOrderEmailKey(key) ? orderEmailsEnabled : stored,
    };
  }

  if (stored && typeof stored === "object") {
    const enabled =
      typeof stored.enabled === "boolean"
        ? isOrderEmailKey(key)
          ? orderEmailsEnabled
          : stored.enabled
        : isOrderEmailKey(key)
          ? orderEmailsEnabled
          : defaults.enabled;

    return {
      enabled,
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

async function ensureEmailAutomationsDefaults(): Promise<void> {
  const stored = await readJsonFile<StoredAutomationsFile>(FILE, {});

  if (stored._defaultsVersion === DEFAULTS_MIGRATION_VERSION) {
    return;
  }

  const siteSettings = await getServerSiteSettings();
  const orderEmailsEnabled = siteSettings.orderEmailsEnabled !== false;

  const next: StoredAutomationsFile = {
    ...stored,
    _defaultsVersion: DEFAULTS_MIGRATION_VERSION,
  };

  for (const key of Object.keys(DEFAULT_AUTOMATIONS) as EmailAutomationKey[]) {
    const current = normalizeMeta(key, stored[key], orderEmailsEnabled);
    next[key] = {
      ...current,
      enabled: isOrderEmailKey(key) ? orderEmailsEnabled : true,
    };
  }

  await writeJsonFile(FILE, next);

  if (!siteSettings.orderEmailsEnabled) {
    const currentSettings = await readJsonFile<Partial<typeof DEFAULT_SETTINGS>>(
      SETTINGS_FILE,
      DEFAULT_SETTINGS
    );
    await writeJsonFile(
      SETTINGS_FILE,
      mergeSettings({ ...currentSettings, orderEmailsEnabled: true })
    );
  }
}

export async function getEmailAutomations(): Promise<EmailAutomations> {
  await ensureEmailAutomationsDefaults();

  const stored = await readJsonFile<StoredAutomationsFile>(FILE, {});
  const siteSettings = await getServerSiteSettings();

  const result = {} as EmailAutomations;
  for (const key of Object.keys(DEFAULT_AUTOMATIONS) as EmailAutomationKey[]) {
    result[key] = normalizeMeta(key, stored[key], siteSettings.orderEmailsEnabled);
    if (isOrderEmailKey(key)) {
      result[key].enabled = siteSettings.orderEmailsEnabled;
    }
  }

  return result;
}

export async function isAutomationEnabled(key: EmailAutomationKey): Promise<boolean> {
  if (isOrderEmailKey(key)) {
    const siteSettings = await getServerSiteSettings();
    return siteSettings.orderEmailsEnabled;
  }

  const automations = await getEmailAutomations();
  return automations[key].enabled;
}

export async function getAutomationMeta(key: EmailAutomationKey): Promise<EmailAutomationMeta> {
  const automations = await getEmailAutomations();
  return automations[key];
}

export async function recordAutomationRun(key: EmailAutomationKey): Promise<void> {
  const stored = await readJsonFile<StoredAutomationsFile>(FILE, {});
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
  const stored = await readJsonFile<StoredAutomationsFile>(FILE, {});
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

  stored._defaultsVersion = DEFAULTS_MIGRATION_VERSION;
  await writeJsonFile(FILE, stored);
  return getEmailAutomations();
}
