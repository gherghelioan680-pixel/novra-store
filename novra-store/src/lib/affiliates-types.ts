export const AFFILIATE_STORAGE_FILES = {
  affiliates: "affiliates.json",
  applications: "affiliate-applications.json",
  referrals: "affiliate-referrals.json",
  payouts: "affiliate-payouts.json",
} as const;

/** Suma minimă pentru o cerere de retragere comision afiliat (RON). */
export const MIN_AFFILIATE_PAYOUT_AMOUNT = 50;

export const AFFILIATE_REF_COOKIE = "novra-affiliate-ref";
export const AFFILIATE_REF_STORAGE_KEY = "novra-affiliate-ref";
export const AFFILIATE_REF_TIMESTAMP_KEY = "novra-affiliate-ref-ts";
export const AFFILIATE_ATTRIBUTION_DAYS = 30;
export const SITE_URL = "https://www.novra.ro";

/**
 * Comision implicit: 8% din subtotalul produselor (total comandă minus transport).
 * Rată echilibrată pentru e-commerce de cabluri/accesorii — competitivă pentru
 * influenceri, păstrând marja pe produsele NOVRA. Adminul poate seta rată personalizată
 * sau comision fix în RON per comandă pentru fiecare afiliat.
 */
export const DEFAULT_AFFILIATE_COMMISSION_RATE = 8;

export type AffiliateStatus = "active" | "inactive";
export type AffiliateApplicationStatus = "pending" | "approved" | "rejected";
export type AffiliateReferralStatus = "pending" | "paid";
export type AffiliatePayoutStatus = "pending" | "paid" | "rejected";

export type AffiliateRequirementKey =
  | "hasAccount"
  | "agreedToTerms"
  | "minimumAge"
  | "socialMediaPresence"
  | "romanianResident";

export type AffiliateRequirements = Record<AffiliateRequirementKey, boolean>;

export type Affiliate = {
  id: string;
  userId: string;
  userEmail: string;
  name: string;
  code: string;
  status: AffiliateStatus;
  /** Procent din subtotal produse (opțional, altfel DEFAULT_AFFILIATE_COMMISSION_RATE). */
  commissionRate?: number;
  /** Comision fix în RON per comandă (are prioritate față de commissionRate). */
  fixedCommission?: number;
  totalClicks: number;
  totalOrders: number;
  totalCommission: number;
  paidCommission: number;
  pendingCommission: number;
  createdAt: string;
  approvedAt?: string;
  adminNote?: string;
};

export type AffiliateApplication = {
  id: string;
  userId: string;
  userEmail: string;
  name: string;
  requirements: AffiliateRequirements;
  status: AffiliateApplicationStatus;
  adminNote?: string;
  createdAt: string;
  reviewedAt?: string;
};

export type AffiliateReferral = {
  id: string;
  affiliateId: string;
  affiliateCode: string;
  orderId: string;
  orderPurchaseCode?: string;
  orderTotal: number;
  commission: number;
  status: AffiliateReferralStatus;
  createdAt: string;
  paidAt?: string;
  adminNote?: string;
};

export type AffiliatePayout = {
  id: string;
  affiliateId: string;
  affiliateName: string;
  affiliateEmail: string;
  beneficiaryName: string;
  iban?: string;
  cardNumber?: string;
  bankName?: string;
  amount: number;
  status: AffiliatePayoutStatus;
  createdAt: string;
  processedAt?: string;
  adminNote?: string;
};

export const AFFILIATE_REQUIREMENT_LABELS: Record<AffiliateRequirementKey, string> = {
  hasAccount: "Am un cont activ pe NOVRA Store",
  agreedToTerms: "Accept termenii și condițiile programului de afiliere",
  minimumAge: "Am cel puțin 18 ani",
  socialMediaPresence: "Am prezență pe rețele sociale sau un canal de promovare (blog, YouTube, TikTok etc.)",
  romanianResident: "Sunt rezident în România",
};

export const AFFILIATE_REQUIREMENT_KEYS: AffiliateRequirementKey[] = [
  "hasAccount",
  "agreedToTerms",
  "minimumAge",
  "socialMediaPresence",
  "romanianResident",
];

export function buildAffiliateLink(code: string): string {
  return `${SITE_URL}/?ref=${encodeURIComponent(code)}`;
}

export function normalizeAffiliateCode(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "")
    .slice(0, 32);
}

export function formatCommissionLabel(affiliate: Pick<Affiliate, "commissionRate" | "fixedCommission">): string {
  if (affiliate.fixedCommission !== undefined && affiliate.fixedCommission > 0) {
    return `${affiliate.fixedCommission} RON / comandă`;
  }
  const rate = affiliate.commissionRate ?? DEFAULT_AFFILIATE_COMMISSION_RATE;
  return `${rate}% din produse`;
}

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateAffiliateCodeSuffix(length = 6): string {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return result;
}

export function generateAffiliateCode(existingCodes: string[] = [], name?: string): string {
  const existingSet = new Set(existingCodes.map((c) => c.toUpperCase()));

  if (name?.trim()) {
    const slug = normalizeAffiliateCode(
      name
        .trim()
        .toUpperCase()
        .replace(/\s+/g, "-")
        .replace(/[^A-Z0-9_-]/g, "")
        .slice(0, 20)
    );
    if (slug && !existingSet.has(slug)) return slug;
  }

  for (let attempt = 0; attempt < 100; attempt++) {
    const code = `NOVRA-${generateAffiliateCodeSuffix()}`;
    if (!existingSet.has(code)) return code;
  }

  return `NOVRA-${generateAffiliateCodeSuffix(8)}`;
}
