import "server-only";

import { readJsonFile, writeJsonFile } from "./server-data";
import type { ReturnRequest, ReturnStatus } from "./returns-types";

const FILE = "returns.json";

export async function readReturns(): Promise<ReturnRequest[]> {
  return readJsonFile<ReturnRequest[]>(FILE, []);
}

export async function writeReturns(returns: ReturnRequest[]): Promise<void> {
  await writeJsonFile(FILE, returns);
}

export async function createReturnRequest(input: {
  orderCode: string;
  userEmail: string;
  userName?: string;
  reason: string;
  description: string;
}): Promise<ReturnRequest> {
  const returns = await readReturns();
  const now = new Date().toISOString();
  const entry: ReturnRequest = {
    id: `ret-${Date.now()}`,
    orderCode: input.orderCode.trim().toUpperCase(),
    userEmail: input.userEmail.trim().toLowerCase(),
    userName: input.userName?.trim(),
    reason: input.reason.trim(),
    description: input.description.trim(),
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };
  returns.unshift(entry);
  await writeReturns(returns);
  return entry;
}

export async function updateReturnStatus(
  id: string,
  status: ReturnStatus,
  adminNote?: string,
  refundAmount?: number
): Promise<ReturnRequest | null> {
  return updateReturnRequest(id, { status, adminNote, refundAmount });
}

export async function updateReturnRequest(
  id: string,
  updates: {
    status?: ReturnStatus;
    adminNote?: string;
    refundAmount?: number | null;
  }
): Promise<ReturnRequest | null> {
  const returns = await readReturns();
  const index = returns.findIndex((item) => item.id === id);
  if (index === -1) return null;

  const current = returns[index];
  returns[index] = {
    ...current,
    ...(updates.status !== undefined ? { status: updates.status } : {}),
    ...(updates.adminNote !== undefined
      ? { adminNote: updates.adminNote.trim() || undefined }
      : {}),
    ...(updates.refundAmount !== undefined
      ? {
          refundAmount:
            updates.refundAmount === null || updates.refundAmount === undefined
              ? undefined
              : Math.max(0, Number(updates.refundAmount) || 0),
        }
      : {}),
    updatedAt: new Date().toISOString(),
  };
  await writeReturns(returns);
  return returns[index];
}

export async function deleteReturnRequest(id: string): Promise<boolean> {
  const returns = await readReturns();
  const filtered = returns.filter((item) => item.id !== id);
  if (filtered.length === returns.length) return false;
  await writeReturns(filtered);
  return true;
}
