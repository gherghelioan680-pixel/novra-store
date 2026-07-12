export type ReferralRewardType = "credits" | "coupon_percent";

export type ReferralSettings = {
  enabled: boolean;
  rewardType: ReferralRewardType;
  /** Recompensă pentru cel care recomandă (RON credite sau % cupon) */
  referrerReward: number;
  /** Recompensă pentru prietenul invitat */
  refereeReward: number;
};

export type FriendReferral = {
  id: string;
  referrerUserId: string;
  referrerEmail: string;
  referralCode: string;
  refereeUserId?: string;
  refereeEmail?: string;
  registeredAt?: string;
  firstOrderId?: string;
  firstOrderAt?: string;
  referrerRewarded: boolean;
  refereeRewarded: boolean;
  createdAt: string;
};

export const REFERRAL_STORAGE_FILE = "referrals.json";
export const REFERRAL_SETTINGS_FILE = "referral-settings.json";

export const INVITE_COOKIE = "novra_invite";
export const INVITE_STORAGE_KEY = "novra-invite-code";
export const INVITE_TIMESTAMP_KEY = "novra-invite-ts";
export const INVITE_ATTRIBUTION_DAYS = 90;

export const DEFAULT_REFERRAL_SETTINGS: ReferralSettings = {
  enabled: true,
  rewardType: "credits",
  referrerReward: 10,
  refereeReward: 10,
};

export function normalizeReferralCode(code: string): string {
  return code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function generateReferralCode(existing: string[]): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let attempt = 0;
  while (attempt < 50) {
    let code = "NV";
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    if (!existing.includes(code)) return code;
    attempt++;
  }
  return `NV${Date.now().toString(36).toUpperCase().slice(-6)}`;
}

export function buildInviteLink(code: string, origin = "https://novra.ro"): string {
  const base = origin.replace(/\/$/, "");
  return `${base}/?invite=${encodeURIComponent(code)}`;
}
