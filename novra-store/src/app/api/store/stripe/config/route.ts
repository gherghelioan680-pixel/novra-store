import { getStripePublishableKey, isStripeConfigured } from "@/lib/stripe-server";
import { getServerSiteSettings } from "@/lib/site-settings-server";

export const runtime = "nodejs";

export async function GET() {
  const settings = await getServerSiteSettings();
  const configured = isStripeConfigured();
  const available = configured && settings.cardPaymentEnabled;

  return Response.json({
    available,
    configured,
    enabled: settings.cardPaymentEnabled,
    publishableKey: available ? getStripePublishableKey() : undefined,
  });
}
