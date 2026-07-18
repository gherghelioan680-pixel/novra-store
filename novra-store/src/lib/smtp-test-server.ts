import "server-only";

import { readJsonFile, writeJsonFile } from "@/lib/server-data";
import { isSmtpConfigured } from "@/lib/email";
import { isEmailsEnabled } from "@/lib/emails-enabled";
import { getEmailLogs } from "@/lib/email-log-server";

export type SmtpTestResult = {
  ok: boolean;
  testedAt: string;
  message: string;
  error?: string;
};

export type SmtpConfigCheck = {
  host: boolean;
  port: boolean;
  user: boolean;
  pass: boolean;
  from: boolean;
  emailsEnabled: boolean;
  allPresent: boolean;
};

export type SmtpTestState = {
  lastTest: SmtpTestResult | null;
  lastError: string | null;
  lastEmailSent: { to: string; subject: string; sentAt: string } | null;
  configCheck: SmtpConfigCheck;
};

const FILE = "smtp-test-results.json";

function buildConfigCheck(): SmtpConfigCheck {
  const host = Boolean(process.env.SMTP_HOST?.trim());
  const port = Boolean(process.env.SMTP_PORT?.trim() || true);
  const user = Boolean(process.env.SMTP_USER?.trim());
  const pass = Boolean(process.env.SMTP_PASS);
  const from = Boolean(process.env.SMTP_FROM?.trim());
  const emailsEnabled = isEmailsEnabled();
  const allPresent = host && user && pass && from && emailsEnabled;

  return { host, port, user, pass, from, emailsEnabled, allPresent };
}

export async function recordSmtpTest(result: Omit<SmtpTestResult, "testedAt"> & { testedAt?: string }): Promise<void> {
  const stored = await readJsonFile<{ lastTest?: SmtpTestResult; lastError?: string | null }>(FILE, {});
  const entry: SmtpTestResult = {
    ok: result.ok,
    message: result.message,
    error: result.error,
    testedAt: result.testedAt ?? new Date().toISOString(),
  };
  stored.lastTest = entry;
  if (!result.ok && result.error) {
    stored.lastError = result.error;
  } else if (result.ok) {
    stored.lastError = null;
  }
  await writeJsonFile(FILE, stored);
}

export async function getSmtpTestState(): Promise<SmtpTestState> {
  const stored = await readJsonFile<{ lastTest?: SmtpTestResult; lastError?: string | null }>(FILE, {});
  const logs = await getEmailLogs(20);
  const lastSent =
    logs.find((log) => log.status === "sent") ??
    null;

  return {
    lastTest: stored.lastTest ?? null,
    lastError: stored.lastError ?? (stored.lastTest && !stored.lastTest.ok ? stored.lastTest.error ?? stored.lastTest.message : null),
    lastEmailSent: lastSent
      ? { to: lastSent.to, subject: lastSent.subject, sentAt: lastSent.sentAt }
      : null,
    configCheck: buildConfigCheck(),
  };
}

export function getRequiredSmtpEnvVars(): string[] {
  return [
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_USER",
    "SMTP_PASS",
    "SMTP_FROM",
    "EMAILS_ENABLED",
    "SMTP_CONTACT_EMAIL",
    "SMTP_NEWSLETTER_EMAIL",
    "SMTP_NOREPLY_EMAIL",
    "SMTP_ORDERS_EMAIL",
    "SMTP_SUPPORT_EMAIL",
  ];
}

export function isSmtpFullyConfigured(): boolean {
  return isSmtpConfigured() && isEmailsEnabled();
}
