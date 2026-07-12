import "server-only";

import type { NextRequest } from "next/server";
import { readJsonFile, writeJsonFile } from "@/lib/server-data";
import type { Order } from "@/lib/orders";
import {
  AFFILIATE_REQUIREMENT_KEYS,
  AFFILIATE_STORAGE_FILES,
  AFFILIATE_REF_COOKIE,
  DEFAULT_AFFILIATE_COMMISSION_RATE,
  generateAffiliateCode,
  MIN_AFFILIATE_PAYOUT_AMOUNT,
  normalizeAffiliateCode,
  type Affiliate,
  type AffiliateApplication,
  type AffiliateApplicationStatus,
  type AffiliatePayout,
  type AffiliatePayoutStatus,
  type AffiliateReferral,
  type AffiliateRequirements,
  type AffiliateStatus,
} from "@/lib/affiliates-types";

export async function readAffiliates(): Promise<Affiliate[]> {
  return readJsonFile<Affiliate[]>(AFFILIATE_STORAGE_FILES.affiliates, []);
}

export async function writeAffiliates(affiliates: Affiliate[]): Promise<void> {
  await writeJsonFile(AFFILIATE_STORAGE_FILES.affiliates, affiliates);
}

export async function readAffiliateApplications(): Promise<AffiliateApplication[]> {
  return readJsonFile<AffiliateApplication[]>(AFFILIATE_STORAGE_FILES.applications, []);
}

export async function writeAffiliateApplications(applications: AffiliateApplication[]): Promise<void> {
  await writeJsonFile(AFFILIATE_STORAGE_FILES.applications, applications);
}

export async function readAffiliateReferrals(): Promise<AffiliateReferral[]> {
  return readJsonFile<AffiliateReferral[]>(AFFILIATE_STORAGE_FILES.referrals, []);
}

export async function writeAffiliateReferrals(referrals: AffiliateReferral[]): Promise<void> {
  await writeJsonFile(AFFILIATE_STORAGE_FILES.referrals, referrals);
}

export async function readAffiliatePayouts(): Promise<AffiliatePayout[]> {
  return readJsonFile<AffiliatePayout[]>(AFFILIATE_STORAGE_FILES.payouts, []);
}

export async function writeAffiliatePayouts(payouts: AffiliatePayout[]): Promise<void> {
  await writeJsonFile(AFFILIATE_STORAGE_FILES.payouts, payouts);
}

export function normalizeIban(raw: string): string {
  return raw.replace(/\s+/g, "").toUpperCase();
}

export function maskPayoutAccount(payout: Pick<AffiliatePayout, "iban" | "cardNumber">): string {
  if (payout.iban) {
    const iban = payout.iban;
    if (iban.length <= 8) return iban;
    return `${iban.slice(0, 4)}****${iban.slice(-4)}`;
  }
  if (payout.cardNumber) {
    const card = payout.cardNumber.replace(/\s+/g, "");
    if (card.length <= 4) return card;
    return `****${card.slice(-4)}`;
  }
  return "—";
}

/** Returnează payout complet pentru admin; maschează datele sensibile pentru afiliați. */
export function serializePayoutForScope(
  payout: AffiliatePayout,
  scope: "admin" | "own"
): AffiliatePayout {
  if (scope === "admin") return payout;
  return {
    ...payout,
    iban: undefined,
    cardNumber: undefined,
    bankName: undefined,
  };
}

export function getPendingPayoutTotal(
  payouts: AffiliatePayout[],
  affiliateId: string
): number {
  return payouts
    .filter((p) => p.affiliateId === affiliateId && p.status === "pending")
    .reduce((sum, p) => sum + p.amount, 0);
}

export function getAvailablePayoutBalance(
  affiliate: Pick<Affiliate, "id" | "pendingCommission">,
  payouts: AffiliatePayout[]
): number {
  const reserved = getPendingPayoutTotal(payouts, affiliate.id);
  return Math.round(Math.max(0, affiliate.pendingCommission - reserved) * 100) / 100;
}

export async function submitAffiliatePayout(input: {
  affiliateId: string;
  beneficiaryName: string;
  iban?: string;
  cardNumber?: string;
  bankName?: string;
  amount: number;
}): Promise<{ ok: true; payout: AffiliatePayout } | { ok: false; message: string }> {
  const affiliates = await readAffiliates();
  const affiliate = affiliates.find((a) => a.id === input.affiliateId);
  if (!affiliate) return { ok: false, message: "Afiliat negăsit." };
  if (affiliate.status !== "active") {
    return { ok: false, message: "Contul tău de afiliat nu este activ." };
  }

  const beneficiaryName = input.beneficiaryName.trim();
  if (!beneficiaryName) return { ok: false, message: "Numele titularului este obligatoriu." };

  const iban = input.iban ? normalizeIban(input.iban) : undefined;
  const cardNumber = input.cardNumber?.replace(/\s+/g, "") ?? undefined;
  if (!iban && !cardNumber) {
    return { ok: false, message: "Introdu IBAN sau numărul cardului." };
  }
  if (iban && !/^RO[0-9A-Z]{2,}$/.test(iban)) {
    return { ok: false, message: "IBAN invalid." };
  }
  if (cardNumber && !/^[0-9]{13,19}$/.test(cardNumber)) {
    return { ok: false, message: "Număr card invalid." };
  }

  const amount = Math.round(Math.max(0, input.amount) * 100) / 100;
  if (amount < MIN_AFFILIATE_PAYOUT_AMOUNT) {
    return {
      ok: false,
      message: `Suma minimă de retragere este ${MIN_AFFILIATE_PAYOUT_AMOUNT} RON.`,
    };
  }

  const payouts = await readAffiliatePayouts();
  const available = getAvailablePayoutBalance(affiliate, payouts);
  if (amount > available) {
    return {
      ok: false,
      message: `Suma depășește comisionul disponibil (${available.toFixed(2)} RON).`,
    };
  }

  const payout: AffiliatePayout = {
    id: `payout-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    affiliateId: affiliate.id,
    affiliateName: affiliate.name,
    affiliateEmail: affiliate.userEmail,
    beneficiaryName,
    iban,
    cardNumber,
    bankName: input.bankName?.trim() || undefined,
    amount,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  payouts.unshift(payout);
  await writeAffiliatePayouts(payouts.slice(0, 500));
  return { ok: true, payout };
}

export async function updateAffiliatePayoutStatus(
  payoutId: string,
  status: Exclude<AffiliatePayoutStatus, "pending">,
  adminNote?: string
): Promise<{ ok: true; payout: AffiliatePayout } | { ok: false; message: string }> {
  const payouts = await readAffiliatePayouts();
  const index = payouts.findIndex((p) => p.id === payoutId);
  if (index === -1) return { ok: false, message: "Cerere negăsită." };

  const payout = payouts[index];
  if (payout.status === status) {
    return { ok: false, message: "Statusul cererii este deja setat." };
  }
  if (payout.status !== "pending") {
    return { ok: false, message: "Cererea a fost deja procesată." };
  }

  const now = new Date().toISOString();

  if (status === "paid") {
    const affiliates = await readAffiliates();
    const affIndex = affiliates.findIndex((a) => a.id === payout.affiliateId);
    if (affIndex === -1) return { ok: false, message: "Afiliat negăsit." };

    const affiliate = affiliates[affIndex];
    if (payout.amount > affiliate.pendingCommission) {
      return {
        ok: false,
        message: "Comisionul în așteptare al afiliatului este insuficient.",
      };
    }

    affiliates[affIndex] = {
      ...affiliate,
      pendingCommission: Math.round((affiliate.pendingCommission - payout.amount) * 100) / 100,
      paidCommission: Math.round((affiliate.paidCommission + payout.amount) * 100) / 100,
    };
    await writeAffiliates(affiliates);
  }

  payouts[index] = {
    ...payout,
    status,
    processedAt: now,
    adminNote: adminNote?.trim() || payout.adminNote,
  };
  await writeAffiliatePayouts(payouts);
  return { ok: true, payout: payouts[index] };
}

export function getAffiliateRefFromRequest(request: NextRequest): string | undefined {
  const cookie = request.cookies.get(AFFILIATE_REF_COOKIE)?.value;
  if (!cookie) return undefined;
  const normalized = normalizeAffiliateCode(decodeURIComponent(cookie));
  return normalized || undefined;
}

export function calculateOrderCommission(
  order: Pick<Order, "total" | "shipping">,
  affiliate: Pick<Affiliate, "commissionRate" | "fixedCommission">
): number {
  if (affiliate.fixedCommission !== undefined && affiliate.fixedCommission > 0) {
    return Math.round(affiliate.fixedCommission * 100) / 100;
  }

  const rate = affiliate.commissionRate ?? DEFAULT_AFFILIATE_COMMISSION_RATE;
  const productSubtotal = Math.max(0, order.total - (order.shipping ?? 0));
  const commission = (productSubtotal * rate) / 100;
  return Math.round(commission * 100) / 100;
}

export async function findAffiliateByCode(code: string): Promise<Affiliate | null> {
  const normalized = normalizeAffiliateCode(code);
  if (!normalized) return null;
  const affiliates = await readAffiliates();
  return affiliates.find((a) => a.code.toUpperCase() === normalized) ?? null;
}

export async function findAffiliateByUserId(userId: string): Promise<Affiliate | null> {
  const affiliates = await readAffiliates();
  return affiliates.find((a) => a.userId === userId) ?? null;
}

export async function findAffiliateByEmail(email: string): Promise<Affiliate | null> {
  const normalized = email.toLowerCase();
  const affiliates = await readAffiliates();
  return affiliates.find((a) => a.userEmail.toLowerCase() === normalized) ?? null;
}

export async function recordAffiliateClick(code: string): Promise<{ ok: boolean; message?: string }> {
  const normalized = normalizeAffiliateCode(code);
  if (!normalized) return { ok: false, message: "Cod invalid." };

  const affiliates = await readAffiliates();
  const index = affiliates.findIndex((a) => a.code.toUpperCase() === normalized);
  if (index === -1) return { ok: false, message: "Afiliat negăsit." };
  if (affiliates[index].status !== "active") return { ok: false, message: "Afiliat inactiv." };

  affiliates[index] = {
    ...affiliates[index],
    totalClicks: affiliates[index].totalClicks + 1,
  };
  await writeAffiliates(affiliates);
  return { ok: true };
}

export async function recordAffiliateConversion(
  order: Order
): Promise<{ ok: boolean; referral?: AffiliateReferral; alreadyRecorded?: boolean }> {
  const affiliateCode = order.affiliateCode?.trim();
  if (!affiliateCode) return { ok: false };

  const referrals = await readAffiliateReferrals();
  const existing = referrals.find((r) => r.orderId === order.id);
  if (existing) return { ok: true, referral: existing, alreadyRecorded: true };

  const affiliates = await readAffiliates();
  const affiliateIndex = affiliates.findIndex(
    (a) => a.code.toUpperCase() === normalizeAffiliateCode(affiliateCode)
  );
  if (affiliateIndex === -1) return { ok: false };

  const affiliate = affiliates[affiliateIndex];
  if (affiliate.status !== "active") return { ok: false };

  const orderEmail = order.userEmail.toLowerCase();
  if (affiliate.userEmail.toLowerCase() === orderEmail) return { ok: false };

  const commission = calculateOrderCommission(order, affiliate);
  if (commission <= 0) return { ok: false };

  const referral: AffiliateReferral = {
    id: `ref-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    affiliateId: affiliate.id,
    affiliateCode: affiliate.code,
    orderId: order.id,
    orderPurchaseCode: order.purchaseCode,
    orderTotal: order.total,
    commission,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  referrals.unshift(referral);
  await writeAffiliateReferrals(referrals.slice(0, 500));

  affiliates[affiliateIndex] = {
    ...affiliate,
    totalOrders: affiliate.totalOrders + 1,
    totalCommission: Math.round((affiliate.totalCommission + commission) * 100) / 100,
    pendingCommission: Math.round((affiliate.pendingCommission + commission) * 100) / 100,
  };
  await writeAffiliates(affiliates);

  return { ok: true, referral };
}

export type CreateAffiliateInput = {
  userId?: string;
  userEmail: string;
  name: string;
  code?: string;
  status?: AffiliateStatus;
  commissionRate?: number;
  fixedCommission?: number;
  adminNote?: string;
};

export async function createAffiliate(input: CreateAffiliateInput): Promise<
  { ok: true; affiliate: Affiliate } | { ok: false; message: string }
> {
  const email = input.userEmail.trim().toLowerCase();
  const name = input.name.trim();
  if (!email || !name) return { ok: false, message: "Email și nume sunt obligatorii." };

  const affiliates = await readAffiliates();
  const existingEmail = affiliates.find((a) => a.userEmail.toLowerCase() === email);
  if (existingEmail) return { ok: false, message: "Există deja un afiliat cu acest email." };

  const existingCodes = affiliates.map((a) => a.code);
  const requestedCode = input.code ? normalizeAffiliateCode(input.code) : "";
  const code = requestedCode && !existingCodes.map((c) => c.toUpperCase()).includes(requestedCode)
    ? requestedCode
    : generateAffiliateCode(existingCodes, name);

  if (existingCodes.map((c) => c.toUpperCase()).includes(code.toUpperCase())) {
    return { ok: false, message: "Codul de afiliat există deja." };
  }

  const now = new Date().toISOString();
  const affiliate: Affiliate = {
    id: `aff-${Date.now()}`,
    userId: input.userId ?? email,
    userEmail: email,
    name,
    code,
    status: input.status ?? "active",
    commissionRate: input.commissionRate,
    fixedCommission: input.fixedCommission,
    totalClicks: 0,
    totalOrders: 0,
    totalCommission: 0,
    paidCommission: 0,
    pendingCommission: 0,
    createdAt: now,
    approvedAt: now,
    adminNote: input.adminNote,
  };

  affiliates.unshift(affiliate);
  await writeAffiliates(affiliates);
  return { ok: true, affiliate };
}

export async function updateAffiliate(
  affiliateId: string,
  updates: Partial<Pick<Affiliate, "name" | "code" | "status" | "commissionRate" | "fixedCommission" | "adminNote">>
): Promise<{ ok: true; affiliate: Affiliate } | { ok: false; message: string }> {
  const affiliates = await readAffiliates();
  const index = affiliates.findIndex((a) => a.id === affiliateId);
  if (index === -1) return { ok: false, message: "Afiliat negăsit." };

  if (updates.code) {
    const normalized = normalizeAffiliateCode(updates.code);
    if (!normalized) return { ok: false, message: "Cod invalid." };
    const duplicate = affiliates.find(
      (a) => a.id !== affiliateId && a.code.toUpperCase() === normalized
    );
    if (duplicate) return { ok: false, message: "Codul există deja." };
    updates.code = normalized;
  }

  affiliates[index] = { ...affiliates[index], ...updates };
  await writeAffiliates(affiliates);
  return { ok: true, affiliate: affiliates[index] };
}

export function validateApplicationRequirements(requirements: Partial<AffiliateRequirements>): boolean {
  return AFFILIATE_REQUIREMENT_KEYS.every((key) => requirements[key] === true);
}

export async function submitAffiliateApplication(input: {
  userId: string;
  userEmail: string;
  name: string;
  requirements: Partial<AffiliateRequirements>;
}): Promise<{ ok: true; application: AffiliateApplication } | { ok: false; message: string }> {
  const email = input.userEmail.trim().toLowerCase();
  const name = input.name.trim();
  if (!email || !name) return { ok: false, message: "Date incomplete." };

  if (!validateApplicationRequirements(input.requirements)) {
    return { ok: false, message: "Trebuie să confirmi toate cerințele de eligibilitate." };
  }

  const existingAffiliate = await findAffiliateByEmail(email);
  if (existingAffiliate) {
    return { ok: false, message: "Ești deja afiliat NOVRA." };
  }

  const applications = await readAffiliateApplications();
  const pending = applications.find(
    (a) => a.userEmail.toLowerCase() === email && a.status === "pending"
  );
  if (pending) return { ok: false, message: "Ai deja o cerere în așteptare." };

  const requirements = AFFILIATE_REQUIREMENT_KEYS.reduce(
    (acc, key) => ({ ...acc, [key]: input.requirements[key] === true }),
    {} as AffiliateRequirements
  );

  const application: AffiliateApplication = {
    id: `app-${Date.now()}`,
    userId: input.userId,
    userEmail: email,
    name,
    requirements,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  applications.unshift(application);
  await writeAffiliateApplications(applications);
  return { ok: true, application };
}

export async function reviewAffiliateApplication(
  applicationId: string,
  status: Exclude<AffiliateApplicationStatus, "pending">,
  adminNote?: string,
  commissionRate?: number,
  fixedCommission?: number,
  customCode?: string
): Promise<{ ok: true; affiliate?: Affiliate; application: AffiliateApplication } | { ok: false; message: string }> {
  const applications = await readAffiliateApplications();
  const index = applications.findIndex((a) => a.id === applicationId);
  if (index === -1) return { ok: false, message: "Cerere negăsită." };

  const application = applications[index];
  if (application.status !== "pending") {
    return { ok: false, message: "Cererea a fost deja procesată." };
  }

  const now = new Date().toISOString();
  applications[index] = {
    ...application,
    status,
    adminNote: adminNote?.trim() || application.adminNote,
    reviewedAt: now,
  };
  await writeAffiliateApplications(applications);

  if (status === "rejected") {
    return { ok: true, application: applications[index] };
  }

  const createResult = await createAffiliate({
    userId: application.userId,
    userEmail: application.userEmail,
    name: application.name,
    code: customCode,
    commissionRate,
    fixedCommission,
    adminNote,
  });

  if (!createResult.ok) return { ok: false, message: createResult.message };
  return { ok: true, affiliate: createResult.affiliate, application: applications[index] };
}

export async function markReferralPaid(
  referralId: string,
  options?: { commission?: number; adminNote?: string }
): Promise<{ ok: true; referral: AffiliateReferral } | { ok: false; message: string }> {
  const referrals = await readAffiliateReferrals();
  const refIndex = referrals.findIndex((r) => r.id === referralId);
  if (refIndex === -1) return { ok: false, message: "Referral negăsit." };

  const referral = referrals[refIndex];
  if (referral.status === "paid") return { ok: false, message: "Comisionul a fost deja marcat ca plătit." };

  const affiliates = await readAffiliates();
  const affIndex = affiliates.findIndex((a) => a.id === referral.affiliateId);
  if (affIndex === -1) return { ok: false, message: "Afiliat negăsit." };

  const oldCommission = referral.commission;
  const newCommission =
    options?.commission !== undefined
      ? Math.round(Math.max(0, options.commission) * 100) / 100
      : oldCommission;
  const commissionDelta = newCommission - oldCommission;

  const affiliate = affiliates[affIndex];
  affiliates[affIndex] = {
    ...affiliate,
    totalCommission: Math.round((affiliate.totalCommission + commissionDelta) * 100) / 100,
    pendingCommission: Math.round(Math.max(0, affiliate.pendingCommission - oldCommission) * 100) / 100,
    paidCommission: Math.round((affiliate.paidCommission + newCommission) * 100) / 100,
  };

  referrals[refIndex] = {
    ...referral,
    commission: newCommission,
    status: "paid",
    paidAt: new Date().toISOString(),
    adminNote: options?.adminNote?.trim() || referral.adminNote,
  };

  await writeAffiliates(affiliates);
  await writeAffiliateReferrals(referrals);
  return { ok: true, referral: referrals[refIndex] };
}

export async function adjustReferralCommission(
  referralId: string,
  commission: number,
  adminNote?: string
): Promise<{ ok: true; referral: AffiliateReferral } | { ok: false; message: string }> {
  const referrals = await readAffiliateReferrals();
  const refIndex = referrals.findIndex((r) => r.id === referralId);
  if (refIndex === -1) return { ok: false, message: "Referral negăsit." };

  const referral = referrals[refIndex];
  if (referral.status === "paid") {
    return { ok: false, message: "Nu poți ajusta un comision deja plătit. Contactează suportul." };
  }

  const newCommission = Math.round(Math.max(0, commission) * 100) / 100;
  const delta = newCommission - referral.commission;

  const affiliates = await readAffiliates();
  const affIndex = affiliates.findIndex((a) => a.id === referral.affiliateId);
  if (affIndex === -1) return { ok: false, message: "Afiliat negăsit." };

  const affiliate = affiliates[affIndex];
  affiliates[affIndex] = {
    ...affiliate,
    totalCommission: Math.round((affiliate.totalCommission + delta) * 100) / 100,
    pendingCommission: Math.round((affiliate.pendingCommission + delta) * 100) / 100,
  };

  referrals[refIndex] = {
    ...referral,
    commission: newCommission,
    adminNote: adminNote?.trim() || referral.adminNote,
  };

  await writeAffiliates(affiliates);
  await writeAffiliateReferrals(referrals);
  return { ok: true, referral: referrals[refIndex] };
}

export async function deleteAffiliate(affiliateId: string): Promise<{ ok: boolean; message?: string }> {
  const affiliates = await readAffiliates();
  const filtered = affiliates.filter((a) => a.id !== affiliateId);
  if (filtered.length === affiliates.length) return { ok: false, message: "Afiliat negăsit." };
  await writeAffiliates(filtered);
  return { ok: true };
}
