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
  adminNote?: string
): Promise<ReturnRequest | null> {
  const returns = await readReturns();
  const index = returns.findIndex((item) => item.id === id);
  if (index === -1) return null;

  returns[index] = {
    ...returns[index],
    status,
    adminNote: adminNote?.trim() || returns[index].adminNote,
    updatedAt: new Date().toISOString(),
  };
  await writeReturns(returns);
  return returns[index];
}
