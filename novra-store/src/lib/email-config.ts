import "server-only";

/** Role-based mailbox addresses for NOVRA Store SMTP flows. */
export type EmailRole = "contact" | "newsletter" | "noreply" | "orders" | "support";

const ROLE_DEFAULTS: Record<EmailRole, string> = {
  contact: "contact@novra.ro",
  newsletter: "newsletter@novra.ro",
  noreply: "noreply@novra.ro",
  orders: "orders@novra.ro",
  support: "support@novra.ro",
};

const ROLE_ENV: Record<EmailRole, string> = {
  contact: "SMTP_CONTACT_EMAIL",
  newsletter: "SMTP_NEWSLETTER_EMAIL",
  noreply: "SMTP_NOREPLY_EMAIL",
  orders: "SMTP_ORDERS_EMAIL",
  support: "SMTP_SUPPORT_EMAIL",
};

function normalizeEmail(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim().toLowerCase();
  return trimmed || fallback;
}

/** Raw email address for a role (env override with default). */
export function getRoleEmail(role: EmailRole): string {
  const envKey = ROLE_ENV[role];
  return normalizeEmail(process.env[envKey], ROLE_DEFAULTS[role]);
}

/** Display From header: `NOVRA <role@novra.ro>` */
export function formatFromAddress(role: EmailRole): string {
  return `NOVRA <${getRoleEmail(role)}>`;
}

/** Fallback SMTP_FROM when no role is specified. */
export function getFallbackFromAddress(): string | null {
  const from = process.env.SMTP_FROM?.trim();
  if (from) return from;
  return formatFromAddress("noreply");
}

/** Resolve From address for a send — role takes precedence over SMTP_FROM fallback. */
export function resolveFromAddress(role?: EmailRole): string | null {
  if (role) return formatFromAddress(role);
  return getFallbackFromAddress();
}

/** Admin login email — separate from notification roles. */
export function getAdminLoginEmail(): string | null {
  return process.env.ADMIN_EMAIL?.trim().toLowerCase() || null;
}

/** New order + order status admin notifications. */
export function getOrdersNotificationEmail(): string {
  const fromEnv = process.env.SMTP_ORDERS_EMAIL?.trim().toLowerCase();
  if (fromEnv) return fromEnv;
  const admin = getAdminLoginEmail();
  if (admin) return admin;
  return ROLE_DEFAULTS.orders;
}

/** Contact form + review admin notifications. */
export function getContactNotificationEmail(): string {
  return getRoleEmail("contact");
}

/** Returns, warranty, help, support requests. */
export function getSupportNotificationEmail(): string {
  return getRoleEmail("support");
}

/** Map log type / template to the appropriate From role. */
export function resolveFromRole(input: {
  logType?: string;
  templateId?: string;
  fromRole?: EmailRole;
}): EmailRole {
  if (input.fromRole) return input.fromRole;

  const key = input.templateId ?? input.logType ?? "";

  if (
    key === "welcome" ||
    key === "newsletter" ||
    key === "subscription_confirmation"
  ) {
    return "newsletter";
  }

  if (key === "contact_confirmation") {
    return "contact";
  }

  if (
    key === "contact_admin" ||
    key === "admin_new_order" ||
    key === "admin_order_cancelled" ||
    key === "return_request_admin"
  ) {
    return "noreply";
  }

  return "noreply";
}

/** All role env vars for documentation / admin diagnostics. */
export function getRoleEmailEnvVars(): Record<EmailRole, { env: string; value: string; default: string }> {
  return (Object.keys(ROLE_DEFAULTS) as EmailRole[]).reduce(
    (acc, role) => {
      acc[role] = {
        env: ROLE_ENV[role],
        value: getRoleEmail(role),
        default: ROLE_DEFAULTS[role],
      };
      return acc;
    },
    {} as Record<EmailRole, { env: string; value: string; default: string }>
  );
}
