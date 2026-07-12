import type { NextRequest } from "next/server";
import { isAdminRequest, unauthorizedResponse } from "@/lib/server-auth";
import { isEmailConfigured } from "@/lib/email";
import { isStripeConfigured } from "@/lib/stripe-server";
import { getServerSiteSettings } from "@/lib/site-settings-server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorizedResponse();

  const settings = await getServerSiteSettings();
  const stripeConfigured = isStripeConfigured();
  const emailConfigured = isEmailConfigured();

  return Response.json({
    stripe: {
      configured: stripeConfigured,
      enabled: settings.cardPaymentEnabled,
      available: stripeConfigured && settings.cardPaymentEnabled,
    },
    email: {
      configured: emailConfigured,
      enabled: settings.orderEmailsEnabled,
    },
    newsletterDiscountPercent: settings.newsletterDiscountPercent,
  });
}
