import "server-only";

import { readJsonFile, writeJsonFile } from "@/lib/server-data";
import type { User } from "@/lib/auth";
import {
  GIFT_CARD_AMOUNTS,
  isValidGiftCardAmount,
  type CreditPurchase,
  type CreditPurchaseStatus,
  type CreditTransaction,
  type CreditTransactionType,
  type GiftCardAmount,
} from "@/lib/credits-types";

export {
  GIFT_CARD_AMOUNTS,
  isValidGiftCardAmount,
  type CreditPurchase,
  type CreditPurchaseStatus,
  type CreditTransaction,
  type CreditTransactionType,
  type GiftCardAmount,
} from "@/lib/credits-types";

const PURCHASES_FILE = "credit-purchases.json";
const TRANSACTIONS_FILE = "credit-transactions.json";
const USERS_FILE = "users.json";

type StoredUser = User & { adminNotes?: string };

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function getUserCredits(user: StoredUser): number {
  if (typeof user.novraCredits === "number") return user.novraCredits;
  return user.loyalty?.points ?? 0;
}

function setUserCredits(user: StoredUser, credits: number): StoredUser {
  const safeCredits = Math.max(0, Math.round(credits));
  return {
    ...user,
    novraCredits: safeCredits,
    loyalty: { ...user.loyalty, points: safeCredits, discount: user.loyalty?.discount ?? "0%" },
  };
}

export async function readCreditPurchases(): Promise<CreditPurchase[]> {
  return readJsonFile<CreditPurchase[]>(PURCHASES_FILE, []);
}

export async function writeCreditPurchases(purchases: CreditPurchase[]): Promise<void> {
  await writeJsonFile(PURCHASES_FILE, purchases);
}

export async function readCreditTransactions(): Promise<CreditTransaction[]> {
  return readJsonFile<CreditTransaction[]>(TRANSACTIONS_FILE, []);
}

export async function writeCreditTransactions(transactions: CreditTransaction[]): Promise<void> {
  await writeJsonFile(TRANSACTIONS_FILE, transactions);
}

export async function getCreditPurchasesForUser(userEmail: string): Promise<CreditPurchase[]> {
  const email = normalizeEmail(userEmail);
  const purchases = await readCreditPurchases();
  return purchases
    .filter((p) => normalizeEmail(p.userEmail) === email)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getCreditTransactionsForUser(userEmail: string): Promise<CreditTransaction[]> {
  const email = normalizeEmail(userEmail);
  const transactions = await readCreditTransactions();
  return transactions
    .filter((t) => normalizeEmail(t.userEmail) === email)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function createCreditPurchase(input: {
  userId: string;
  userEmail: string;
  amount: GiftCardAmount;
  stripeSessionId?: string;
}): Promise<CreditPurchase> {
  const now = new Date().toISOString();
  const purchase: CreditPurchase = {
    id: `cp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    userId: input.userId,
    userEmail: normalizeEmail(input.userEmail),
    amount: input.amount,
    stripeSessionId: input.stripeSessionId,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };

  const purchases = await readCreditPurchases();
  purchases.unshift(purchase);
  await writeCreditPurchases(purchases);
  return purchase;
}

export async function findCreditPurchaseById(purchaseId: string): Promise<CreditPurchase | null> {
  const purchases = await readCreditPurchases();
  return purchases.find((p) => p.id === purchaseId) ?? null;
}

export async function findCreditPurchaseByStripeSession(
  stripeSessionId: string
): Promise<CreditPurchase | null> {
  const purchases = await readCreditPurchases();
  return purchases.find((p) => p.stripeSessionId === stripeSessionId) ?? null;
}

async function appendTransaction(input: {
  userId: string;
  userEmail: string;
  type: CreditTransactionType;
  amount: number;
  balanceAfter: number;
  description: string;
  referenceId?: string;
}): Promise<CreditTransaction> {
  const transaction: CreditTransaction = {
    id: `ct-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    userId: input.userId,
    userEmail: normalizeEmail(input.userEmail),
    type: input.type,
    amount: input.amount,
    balanceAfter: input.balanceAfter,
    description: input.description,
    referenceId: input.referenceId,
    createdAt: new Date().toISOString(),
  };

  const transactions = await readCreditTransactions();
  transactions.unshift(transaction);
  await writeCreditTransactions(transactions.slice(0, 5000));
  return transaction;
}

async function updateUserCreditsInternal(
  userEmail: string,
  delta: number,
  type: CreditTransactionType,
  description: string,
  referenceId?: string
): Promise<{ ok: true; user: StoredUser; transaction: CreditTransaction } | { ok: false; message: string }> {
  const email = normalizeEmail(userEmail);
  const users = await readJsonFile<StoredUser[]>(USERS_FILE, []);
  const index = users.findIndex((u) => normalizeEmail(u.email) === email);
  if (index === -1) {
    return { ok: false, message: "Utilizatorul nu a fost găsit." };
  }

  const current = users[index];
  const currentCredits = getUserCredits(current);
  const newCredits = Math.max(0, currentCredits + delta);
  const updated = setUserCredits(current, newCredits);
  users[index] = updated;
  await writeJsonFile(USERS_FILE, users);

  const transaction = await appendTransaction({
    userId: updated.id,
    userEmail: email,
    type,
    amount: delta,
    balanceAfter: newCredits,
    description,
    referenceId,
  });

  return { ok: true, user: updated, transaction };
}

export async function fulfillCreditPurchase(
  purchaseId: string,
  stripeSessionId: string
): Promise<
  | { ok: true; purchase: CreditPurchase; alreadyCredited: boolean; user?: StoredUser }
  | { ok: false; message: string }
> {
  const purchases = await readCreditPurchases();
  const index = purchases.findIndex((p) => p.id === purchaseId);
  if (index === -1) {
    return { ok: false, message: "Achiziția nu a fost găsită." };
  }

  const purchase = purchases[index];

  if (purchase.status === "credited") {
    return { ok: true, purchase, alreadyCredited: true };
  }

  if (purchase.status === "revoked") {
    return { ok: false, message: "Achiziția a fost revocată." };
  }

  const now = new Date().toISOString();
  purchases[index] = {
    ...purchase,
    stripeSessionId,
    status: "paid",
    updatedAt: now,
  };

  const creditResult = await updateUserCreditsInternal(
    purchase.userEmail,
    purchase.amount,
    "purchase",
    `Achiziție Gift Card ${purchase.amount} Lei`,
    purchase.id
  );

  if (!creditResult.ok) {
    purchases[index] = { ...purchases[index], status: "failed", updatedAt: now };
    await writeCreditPurchases(purchases);
    return { ok: false, message: creditResult.message };
  }

  purchases[index] = {
    ...purchases[index],
    status: "credited",
    creditedAt: now,
    updatedAt: now,
  };
  await writeCreditPurchases(purchases);

  return {
    ok: true,
    purchase: purchases[index],
    alreadyCredited: false,
    user: creditResult.user,
  };
}

export async function spendCredits(
  userEmail: string,
  amount: number,
  orderId: string
): Promise<{ ok: true; user: StoredUser; transaction: CreditTransaction } | { ok: false; message: string }> {
  const spendAmount = Math.round(amount);
  if (spendAmount <= 0) {
    return { ok: false, message: "Suma de credite invalidă." };
  }

  const email = normalizeEmail(userEmail);
  const users = await readJsonFile<StoredUser[]>(USERS_FILE, []);
  const index = users.findIndex((u) => normalizeEmail(u.email) === email);
  if (index === -1) {
    return { ok: false, message: "Utilizatorul nu a fost găsit." };
  }

  const currentCredits = getUserCredits(users[index]);
  if (currentCredits < spendAmount) {
    return { ok: false, message: "Sold insuficient de NovraCredits." };
  }

  return updateUserCreditsInternal(
    email,
    -spendAmount,
    "spend",
    `Plată comandă (${spendAmount} NovraCredits)`,
    orderId
  );
}

export async function adminAdjustCredits(
  userEmail: string,
  delta: number,
  reason?: string
): Promise<{ ok: true; user: StoredUser; transaction: CreditTransaction } | { ok: false; message: string }> {
  const type: CreditTransactionType = delta < 0 ? "revoke" : "admin_adjust";
  const description = reason?.trim()
    ? `Ajustare admin: ${reason.trim()}`
    : delta < 0
      ? "Revocare credite (admin)"
      : "Adăugare credite (admin)";

  return updateUserCreditsInternal(userEmail, delta, type, description);
}

export async function adminRevokeCreditPurchase(
  purchaseId: string,
  reason?: string
): Promise<{ ok: true; purchase: CreditPurchase } | { ok: false; message: string }> {
  const purchases = await readCreditPurchases();
  const index = purchases.findIndex((p) => p.id === purchaseId);
  if (index === -1) {
    return { ok: false, message: "Achiziția nu a fost găsită." };
  }

  const purchase = purchases[index];
  const now = new Date().toISOString();

  if (purchase.status === "credited") {
    const revokeResult = await adminAdjustCredits(
      purchase.userEmail,
      -purchase.amount,
      reason ?? `Revocare achiziție ${purchase.id}`
    );
    if (!revokeResult.ok) {
      return { ok: false, message: revokeResult.message };
    }
  }

  purchases[index] = {
    ...purchase,
    status: "revoked",
    adminNote: reason?.trim() || purchase.adminNote,
    updatedAt: now,
  };
  await writeCreditPurchases(purchases);

  return { ok: true, purchase: purchases[index] };
}

export async function adminManualCreditPurchase(
  purchaseId: string,
  reason?: string
): Promise<{ ok: true; purchase: CreditPurchase } | { ok: false; message: string }> {
  const purchases = await readCreditPurchases();
  const index = purchases.findIndex((p) => p.id === purchaseId);
  if (index === -1) {
    return { ok: false, message: "Achiziția nu a fost găsită." };
  }

  const purchase = purchases[index];
  if (purchase.status === "credited") {
    return { ok: false, message: "Creditele au fost deja încărcate." };
  }

  const creditResult = await updateUserCreditsInternal(
    purchase.userEmail,
    purchase.amount,
    "purchase",
    reason?.trim() ? `Credit manual: ${reason.trim()}` : `Credit manual achiziție ${purchase.amount} Lei`,
    purchase.id
  );

  if (!creditResult.ok) {
    return { ok: false, message: creditResult.message };
  }

  const now = new Date().toISOString();
  purchases[index] = {
    ...purchase,
    status: "credited",
    creditedAt: now,
    updatedAt: now,
    adminNote: reason?.trim() || purchase.adminNote,
  };
  await writeCreditPurchases(purchases);

  return { ok: true, purchase: purchases[index] };
}

export async function updateCreditPurchaseSession(
  purchaseId: string,
  stripeSessionId: string
): Promise<CreditPurchase | null> {
  const purchases = await readCreditPurchases();
  const index = purchases.findIndex((p) => p.id === purchaseId);
  if (index === -1) return null;

  purchases[index] = {
    ...purchases[index],
    stripeSessionId,
    updatedAt: new Date().toISOString(),
  };
  await writeCreditPurchases(purchases);
  return purchases[index];
}
