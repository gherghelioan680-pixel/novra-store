import "server-only";

/** Outbound email is opt-in only. Default: disabled until EMAILS_ENABLED=true and SMTP env vars are set. */
export function isEmailsEnabled(): boolean {
  return process.env.EMAILS_ENABLED === "true";
}
