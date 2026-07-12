export const GIFT_CARD_AMOUNTS = [50, 100, 200, 500] as const;
export type GiftCardAmount = (typeof GIFT_CARD_AMOUNTS)[number];

export type CreditPurchaseStatus = "pending" | "paid" | "credited" | "failed" | "revoked";

export type CreditPurchase = {
  id: string;
  userId: string;
  userEmail: string;
  amount: number;
  stripeSessionId?: string;
  status: CreditPurchaseStatus;
  createdAt: string;
  updatedAt: string;
  creditedAt?: string;
  adminNote?: string;
};

export type CreditTransactionType =
  | "purchase"
  | "spend"
  | "admin_adjust"
  | "signup_bonus"
  | "profile_bonus"
  | "revoke";

export type CreditTransaction = {
  id: string;
  userId: string;
  userEmail: string;
  type: CreditTransactionType;
  amount: number;
  balanceAfter: number;
  description: string;
  referenceId?: string;
  createdAt: string;
};

export function isValidGiftCardAmount(amount: number): amount is GiftCardAmount {
  return (GIFT_CARD_AMOUNTS as readonly number[]).includes(amount);
}
