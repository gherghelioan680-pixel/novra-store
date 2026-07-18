import "server-only";

/** Outbound email is opt-in only. Default: disabled (no Resend / DNS setup required). */
export function isEmailsEnabled(): boolean {
  return process.env.EMAILS_ENABLED === "true";
}
