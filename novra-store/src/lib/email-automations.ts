export type EmailAutomationKey =
  | "welcome"
  | "orderConfirmation"
  | "orderShipped"
  | "passwordReset"
  | "newsletter"
  | "reviewRequest";

export type EmailAutomationMeta = {
  enabled: boolean;
  delayMinutes: number;
  lastRunAt: string | null;
  sentCount: number;
};

export type EmailAutomations = Record<EmailAutomationKey, EmailAutomationMeta>;

/** @deprecated Use EmailAutomationMeta.enabled — kept for gradual migration */
export type EmailAutomationsLegacy = Record<EmailAutomationKey, boolean>;
