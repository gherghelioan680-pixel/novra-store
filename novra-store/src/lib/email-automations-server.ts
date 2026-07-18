import "server-only";

import { readJsonFile, writeJsonFile } from "@/lib/server-data";
import { DEFAULT_SETTINGS, mergeSettings } from "@/lib/site-settings";
import { getServerSiteSettings } from "@/lib/site-settings-server";
import type { EmailAutomationKey, EmailAutomations } from "@/lib/email-automations";

export type { EmailAutomationKey, EmailAutomations };

const FILE = "email-automations.json";
const SETTINGS_FILE = "settings.json";

const DEFAULT_AUTOMATIONS: EmailAutomations = {
  welcome: true,
  orderConfirmation: false,
  orderShipped: false,
  passwordReset: true,
  newsletter: true,
  reviewRequest: false,
};

export async function getEmailAutomations(): Promise<EmailAutomations> {
  const stored = await readJsonFile<Partial<EmailAutomations>>(FILE, {});
  const siteSettings = await getServerSiteSettings();

  return {
    ...DEFAULT_AUTOMATIONS,
    ...stored,
    orderConfirmation: siteSettings.orderEmailsEnabled,
    orderShipped: stored.orderShipped ?? siteSettings.orderEmailsEnabled,
  };
}

export async function saveEmailAutomations(
  updates: Partial<EmailAutomations>
): Promise<EmailAutomations> {
  const stored = await readJsonFile<Partial<EmailAutomations>>(FILE, {});
  const nextStored: Partial<EmailAutomations> = { ...stored, ...updates };

  if (
    typeof updates.orderConfirmation === "boolean" ||
    typeof updates.orderShipped === "boolean"
  ) {
    const currentSettings = await readJsonFile<Partial<typeof DEFAULT_SETTINGS>>(
      SETTINGS_FILE,
      DEFAULT_SETTINGS
    );
    const orderEmailsEnabled =
      typeof updates.orderConfirmation === "boolean"
        ? updates.orderConfirmation
        : typeof updates.orderShipped === "boolean"
          ? updates.orderShipped
          : mergeSettings(currentSettings).orderEmailsEnabled;

    await writeJsonFile(
      SETTINGS_FILE,
      mergeSettings({ ...currentSettings, orderEmailsEnabled })
    );
    nextStored.orderConfirmation = orderEmailsEnabled;
    if (typeof updates.orderShipped === "boolean") {
      nextStored.orderShipped = updates.orderShipped;
    } else {
      nextStored.orderShipped = orderEmailsEnabled;
    }
  }

  await writeJsonFile(FILE, nextStored);
  return getEmailAutomations();
}
