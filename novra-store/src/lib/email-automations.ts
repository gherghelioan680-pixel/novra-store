export type EmailAutomationKey =
  | "welcome"
  | "orderConfirmation"
  | "orderProcessing"
  | "orderShipped"
  | "orderDelivered"
  | "orderCancelled"
  | "adminNewOrder"
  | "passwordReset"
  | "newsletter"
  | "reviewRequest"
  | "contactConfirmation"
  | "contactAdmin"
  | "giftCard"
  | "storeCredit";

export type EmailAutomationMeta = {
  enabled: boolean;
  delayMinutes: number;
  lastRunAt: string | null;
  sentCount: number;
};

export type EmailAutomations = Record<EmailAutomationKey, EmailAutomationMeta>;

/** @deprecated Use EmailAutomationMeta.enabled — kept for gradual migration */
export type EmailAutomationsLegacy = Record<EmailAutomationKey, boolean>;
