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
  messageId?: string;
  error?: string;
};

export type EmailLogStats = {
  sentToday: number;
  sentThisMonth: number;
  deliveryRate: number;
  lastSent: EmailLogEntry | null;
  totalSent: number;
  totalFailed: number;
  delivered: number;
};

export type EmailLogFilters = {
  type?: string;
  status?: EmailLogStatus;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
};

export type EmailChartDay = {
  date: string;
  sent: number;
  failed: number;
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
): Promise<EmailLogEntry> {
  const newEntry: EmailLogEntry = {
    id: entry.id ?? crypto.randomUUID(),
    to: entry.to,
    subject: entry.subject,
    type: entry.type,
    status: entry.status,
    sentAt: entry.sentAt,
    messageId: entry.messageId,
    error: entry.error,
  };

  try {
    const logs = await readJsonFile<EmailLogEntry[]>(FILE, []);
    logs.unshift(newEntry);
    if (logs.length > MAX_LOGS) {
      logs.length = MAX_LOGS;
    }
    await writeJsonFile(FILE, logs);
  } catch (error) {
    console.warn("[email-log] Failed to append log entry:", error);
  }

  return newEntry;
}

function matchesFilters(entry: EmailLogEntry, filters: EmailLogFilters): boolean {
  if (filters.type && filters.type !== "all" && entry.type !== filters.type) return false;
  if (filters.status && entry.status !== filters.status) return false;
  if (filters.dateFrom && entry.sentAt < filters.dateFrom) return false;
  if (filters.dateTo && entry.sentAt > filters.dateTo) return false;
  if (filters.search) {
    const q = filters.search.trim().toLowerCase();
    if (!q) return true;
    const haystack = `${entry.to} ${entry.subject} ${entry.type} ${entry.messageId ?? ""}`.toLowerCase();
    if (!haystack.includes(q)) return false;
  }
  return true;
}

export async function getEmailLogs(limit = 50): Promise<EmailLogEntry[]> {
  const logs = await readJsonFile<EmailLogEntry[]>(FILE, []);
  return logs.slice(0, Math.max(1, limit));
}

export async function getEmailLogsFiltered(filters: EmailLogFilters = {}): Promise<EmailLogEntry[]> {
  const logs = await readJsonFile<EmailLogEntry[]>(FILE, []);
  const limit = filters.limit ?? 100;
  return logs.filter((entry) => matchesFilters(entry, filters)).slice(0, Math.max(1, limit));
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
    totalFailed: failedLogs.length,
    delivered: sentLogs.length,
  };
}

export async function getEmailChartData(days = 30): Promise<EmailChartDay[]> {
  const logs = await readJsonFile<EmailLogEntry[]>(FILE, []);
  const now = new Date();
  const result: EmailChartDay[] = [];

  for (let i = days - 1; i >= 0; i -= 1) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const dayStart = startOfDayIso(day);
    const nextDay = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1);
    const dayEnd = nextDay.toISOString();

    const dayLogs = logs.filter((entry) => entry.sentAt >= dayStart && entry.sentAt < dayEnd);
    result.push({
      date: day.toISOString().slice(0, 10),
      sent: dayLogs.filter((e) => e.status === "sent").length,
      failed: dayLogs.filter((e) => e.status === "failed").length,
    });
  }

  return result;
}

export async function deleteEmailLog(id: string): Promise<boolean> {
  const deleted = await deleteEmailLogs([id]);
  return deleted > 0;
}

export async function deleteEmailLogs(ids: string[]): Promise<number> {
  const uniqueIds = [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
  if (uniqueIds.length === 0) return 0;

  const logs = await readJsonFile<EmailLogEntry[]>(FILE, []);
  const idSet = new Set(uniqueIds);
  const filtered = logs.filter((entry) => !idSet.has(entry.id));
  const deletedCount = logs.length - filtered.length;
  if (deletedCount === 0) return 0;

  await writeJsonFile(FILE, filtered);
  return deletedCount;
}

export async function deleteAllEmailLogs(): Promise<number> {
  const logs = await readJsonFile<EmailLogEntry[]>(FILE, []);
  const count = logs.length;
  if (count === 0) return 0;

  await writeJsonFile(FILE, []);
  return count;
}

export async function updateEmailLog(
  id: string,
  updates: Partial<Pick<EmailLogEntry, "to" | "subject" | "type" | "status" | "error">>
): Promise<EmailLogEntry | null> {
  const logs = await readJsonFile<EmailLogEntry[]>(FILE, []);
  const index = logs.findIndex((entry) => entry.id === id);
  if (index === -1) return null;

  logs[index] = {
    ...logs[index],
    ...(updates.to !== undefined ? { to: updates.to.trim() } : {}),
    ...(updates.subject !== undefined ? { subject: updates.subject.trim() } : {}),
    ...(updates.type !== undefined ? { type: updates.type.trim() } : {}),
    ...(updates.status !== undefined ? { status: updates.status } : {}),
    ...(updates.error !== undefined ? { error: updates.error.trim() || undefined } : {}),
  };
  await writeJsonFile(FILE, logs);
  return logs[index];
}
