export type EmailAutomationKey =
  | "welcome"
  | "orderConfirmation"
  | "orderShipped"
  | "passwordReset"
  | "newsletter"
  | "reviewRequest";

export type EmailAutomations = Record<EmailAutomationKey, boolean>;
