export type EmailAutomationKey =
  | "welcome"
  | "orderConfirmation"
  | "orderProcessing"
  | "orderShipped"
  | "orderDelivered"
  | "orderCancelled"
  | "adminNewOrder"
  | "adminOrderCancelled"
  | "passwordReset"
  | "newsletter"
  | "reviewRequest"
  | "reviewApproved"
  | "contactConfirmation"
  | "contactAdmin"
  | "giftCard"
  | "storeCredit"
  | "returnApproved"
  | "refund"
  | "returnRequestAdmin"
  | "accountConfirmation"
  | "emailVerification"
  | "subscriptionConfirmation";

export type EmailAutomationMeta = {
  enabled: boolean;
  delayMinutes: number;
  lastRunAt: string | null;
  sentCount: number;
};

export type EmailAutomations = Record<EmailAutomationKey, EmailAutomationMeta>;

/** @deprecated Use EmailAutomationMeta.enabled — kept for gradual migration */
export type EmailAutomationsLegacy = Record<EmailAutomationKey, boolean>;
