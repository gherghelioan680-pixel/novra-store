import "server-only";

import { readJsonFile, writeJsonFile } from "@/lib/server-data";

export type EmailLogStatus = "sent" | "failed";

export type EmailLogEntry = {
  id: string;
  to: string;
  subject: string;
  type: string;
  status: EmailLogStatus;
  sentAt: string;
};

export type EmailLogStats = {
  sentToday: number;
  sentThisMonth: number;
  deliveryRate: number;
  lastSent: EmailLogEntry | null;
  totalSent: number;
};

const FILE = "email-logs.json";
const MAX_LOGS = 500;

function startOfDayIso(date: Date): string {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
}

function startOfMonthIso(date: Date): string {
  return new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
}

export async function appendEmailLog(
  entry: Omit<EmailLogEntry, "id"> & { id?: string }
): Promise<void> {
  try {
    const logs = await readJsonFile<EmailLogEntry[]>(FILE, []);
    const newEntry: EmailLogEntry = {
      id: entry.id ?? crypto.randomUUID(),
      to: entry.to,
      subject: entry.subject,
      type: entry.type,
      status: entry.status,
      sentAt: entry.sentAt,
    };
    logs.unshift(newEntry);
    if (logs.length > MAX_LOGS) {
      logs.length = MAX_LOGS;
    }
    await writeJsonFile(FILE, logs);
  } catch (error) {
    console.warn("[email-log] Failed to append log entry:", error);
  }
}

export async function getEmailLogs(limit = 50): Promise<EmailLogEntry[]> {
  const logs = await readJsonFile<EmailLogEntry[]>(FILE, []);
  return logs.slice(0, Math.max(1, limit));
}

export async function getEmailLogStats(): Promise<EmailLogStats> {
  const logs = await readJsonFile<EmailLogEntry[]>(FILE, []);
  const now = new Date();
  const todayStart = startOfDayIso(now);
  const monthStart = startOfMonthIso(now);

  const sentLogs = logs.filter((entry) => entry.status === "sent");
  const failedLogs = logs.filter((entry) => entry.status === "failed");
  const attempted = sentLogs.length + failedLogs.length;

  return {
    sentToday: sentLogs.filter((entry) => entry.sentAt >= todayStart).length,
    sentThisMonth: sentLogs.filter((entry) => entry.sentAt >= monthStart).length,
    deliveryRate: attempted > 0 ? Math.round((sentLogs.length / attempted) * 100) : 0,
    lastSent: sentLogs[0] ?? null,
    totalSent: sentLogs.length,
  };
}
