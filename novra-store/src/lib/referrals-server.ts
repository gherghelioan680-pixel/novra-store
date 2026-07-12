import "server-only";

import type { NextRequest } from "next/server";
import { readJsonFile, writeJsonFile } from "@/lib/server-data";
import type { Order } from "@/lib/orders";
import { normalizeOrder } from "@/lib/orders";
import type { User } from "@/lib/auth";
import { grantReferralCredits } from "@/lib/credits-server";
import { createAdminDiscountCode } from "@/lib/discount-codes-server";
import {
  DEFAULT_REFERRAL_SETTINGS,
  INVITE_COOKIE,
  REFERRAL_SETTINGS_FILE,
  REFERRAL_STORAGE_FILE,
  generateReferralCode,
  normalizeReferralCode,
  type FriendReferral,
  type ReferralSettings,
} from "@/lib/referrals-types";

type StoredUser = User & {
  adminNotes?: string;
  friendReferralCode?: string;
  referredByCode?: string;
};

const USERS_FILE = "users.json";

function nowIso(): string {
  return new Date().toISOString();
}

function buildReferralId(): string {
  return `ref-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function readReferralSettings(): Promise<ReferralSettings> {
  const stored = await readJsonFile<Partial<ReferralSettings>>(REFERRAL_SETTINGS_FILE, {});
  return { ...DEFAULT_REFERRAL_SETTINGS, ...stored };
}

export async function writeReferralSettings(settings: ReferralSettings): Promise<void> {
  await writeJsonFile(REFERRAL_SETTINGS_FILE, settings);
}

export async function readFriendReferrals(): Promise<FriendReferral[]> {
  return readJsonFile<FriendReferral[]>(REFERRAL_STORAGE_FILE, []);
}

export async function writeFriendReferrals(referrals: FriendReferral[]): Promise<void> {
  await writeJsonFile(REFERRAL_STORAGE_FILE, referrals);
}

export async function ensureUserReferralCode(user: StoredUser): Promise<string> {
  if (user.friendReferralCode) return user.friendReferralCode;

  const users = await readJsonFile<StoredUser[]>(USERS_FILE, []);
  const existingCodes = users
    .map((u) => u.friendReferralCode)
    .filter((c): c is string => Boolean(c));

  const code = generateReferralCode(existingCodes);
  const index = users.findIndex((u) => u.id === user.id);
  if (index !== -1) {
    users[index] = { ...users[index], friendReferralCode: code };
    await writeJsonFile(USERS_FILE, users);
  }
  return code;
}

export async function findReferrerByCode(code: string): Promise<StoredUser | null> {
  const normalized = normalizeReferralCode(code);
  if (!normalized) return null;

  const users = await readJsonFile<StoredUser[]>(USERS_FILE, []);
  return (
    users.find((u) => normalizeReferralCode(u.friendReferralCode ?? "") === normalized) ?? null
  );
}

export async function linkRefereeOnRegister(
  referee: StoredUser,
  inviteCode: string
): Promise<void> {
  const settings = await readReferralSettings();
  if (!settings.enabled) return;

  const normalized = normalizeReferralCode(inviteCode);
  if (!normalized) return;

  const referrer = await findReferrerByCode(normalized);
  if (!referrer || referrer.id === referee.id) return;

  const users = await readJsonFile<StoredUser[]>(USERS_FILE, []);
  const refereeIndex = users.findIndex((u) => u.id === referee.id);
  if (refereeIndex === -1) return;

  if (users[refereeIndex].referredByCode) return;

  users[refereeIndex] = { ...users[refereeIndex], referredByCode: normalized };
  await writeJsonFile(USERS_FILE, users);

  const referrals = await readFriendReferrals();
  const existing = referrals.find(
    (r) =>
      r.referralCode === normalized &&
      r.refereeEmail?.toLowerCase() === referee.email.toLowerCase()
  );

  if (existing) return;

  const entry: FriendReferral = {
    id: buildReferralId(),
    referrerUserId: referrer.id,
    referrerEmail: referrer.email,
    referralCode: normalized,
    refereeUserId: referee.id,
    refereeEmail: referee.email,
    registeredAt: nowIso(),
    referrerRewarded: false,
    refereeRewarded: false,
    createdAt: nowIso(),
  };

  referrals.unshift(entry);
  await writeFriendReferrals(referrals);
}

async function grantReferralReward(
  userEmail: string,
  amount: number,
  settings: ReferralSettings,
  description: string,
  referenceId: string
): Promise<boolean> {
  if (settings.rewardType === "credits") {
    const result = await grantReferralCredits(userEmail, amount, description, referenceId);
    return result.ok;
  }

  const code = `REF-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  try {
    await createAdminDiscountCode({
      code,
      type: "percent",
      value: amount,
      applyToProducts: true,
      freeShipping: false,
      maxUses: 1,
      singleUsePerEmail: true,
      active: true,
    });
    return true;
  } catch {
    return false;
  }
}

export async function processReferralRewardsForOrder(
  order: Order
): Promise<{ ok: true; rewarded: boolean } | { ok: false; message: string }> {
  const settings = await readReferralSettings();
  if (!settings.enabled) return { ok: true, rewarded: false };

  if (order.isGuest || order.userId.startsWith("guest-")) {
    return { ok: true, rewarded: false };
  }

  const users = await readJsonFile<StoredUser[]>(USERS_FILE, []);
  const referee = users.find(
    (u) => u.email.toLowerCase() === order.userEmail.toLowerCase()
  );
  if (!referee?.referredByCode) return { ok: true, rewarded: false };

  const normalized = normalizeReferralCode(referee.referredByCode);
  const referrals = await readFriendReferrals();
  const referralIndex = referrals.findIndex(
    (r) =>
      r.referralCode === normalized &&
      r.refereeEmail?.toLowerCase() === order.userEmail.toLowerCase()
  );

  if (referralIndex === -1) return { ok: true, rewarded: false };

  const referral = referrals[referralIndex];

  if (referral.firstOrderId) {
    return { ok: true, rewarded: false };
  }

  const priorOrdersRaw = await readJsonFile<Partial<Order>[]>("orders.json", []);
  const priorOrders = priorOrdersRaw.map(normalizeOrder);
  const refereePriorOrders = priorOrders.filter(
    (o) =>
      o.userEmail.toLowerCase() === order.userEmail.toLowerCase() &&
      o.id !== order.id &&
      o.status !== "cancelled" &&
      (o.paymentStatus === "paid" || o.paymentMethod === "ramburs" || o.paymentMethod === "credits")
  );

  if (refereePriorOrders.length > 0) {
    return { ok: true, rewarded: false };
  }

  const ts = nowIso();
  referrals[referralIndex] = {
    ...referral,
    firstOrderId: order.id,
    firstOrderAt: ts,
  };

  let rewarded = false;

  if (!referral.referrerRewarded && settings.referrerReward > 0) {
    const ok = await grantReferralReward(
      referral.referrerEmail,
      settings.referrerReward,
      settings,
      `Recompensă recomandare prieten — comandă ${order.purchaseCode}`,
      referral.id
    );
    if (ok) {
      referrals[referralIndex].referrerRewarded = true;
      rewarded = true;
    }
  }

  if (!referral.refereeRewarded && settings.refereeReward > 0) {
    const ok = await grantReferralReward(
      order.userEmail,
      settings.refereeReward,
      settings,
      `Bonus prima comandă — invitație ${referral.referralCode}`,
      referral.id
    );
    if (ok) {
      referrals[referralIndex].refereeRewarded = true;
      rewarded = true;
    }
  }

  await writeFriendReferrals(referrals);
  return { ok: true, rewarded };
}

export function getInviteRefFromRequest(request: NextRequest): string | null {
  const raw = request.cookies.get(INVITE_COOKIE)?.value;
  if (!raw) return null;
  const code = normalizeReferralCode(decodeURIComponent(raw));
  return code || null;
}

export async function getReferralStats(): Promise<{
  total: number;
  registered: number;
  converted: number;
  pendingRewards: number;
}> {
  const referrals = await readFriendReferrals();
  return {
    total: referrals.length,
    registered: referrals.filter((r) => r.registeredAt).length,
    converted: referrals.filter((r) => r.firstOrderId).length,
    pendingRewards: referrals.filter(
      (r) => r.firstOrderId && (!r.referrerRewarded || !r.refereeRewarded)
    ).length,
  };
}
