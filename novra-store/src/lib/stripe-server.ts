import "server-only";

import Stripe from "stripe";

const PRODUCTION_SITE_ORIGIN = "https://www.novra.ro";

export function getStripeSecretKey(): string | undefined {
  return process.env.STRIPE_SECRET_KEY;
}

export function getStripePublishableKey(): string | undefined {
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
}

export function isStripeConfigured(): boolean {
  return Boolean(getStripeSecretKey() && getStripePublishableKey());
}

export function getStripeClient(): Stripe | null {
  const secretKey = getStripeSecretKey();
  if (!secretKey) return null;
  return new Stripe(secretKey);
}

/** Canonical site origin for Stripe redirect URLs (success/cancel). */
export function getStripeCheckoutOrigin(requestOrigin?: string | null): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, "");
  }

  if (process.env.VERCEL_ENV === "production") {
    return PRODUCTION_SITE_ORIGIN;
  }

  const fallback = requestOrigin?.trim();
  if (fallback) {
    return fallback.replace(/\/$/, "");
  }

  return PRODUCTION_SITE_ORIGIN;
}

/** Convert RON (lei) to Stripe's smallest unit (bani). */
export function ronToStripeAmount(ron: number): number {
  return Math.round(Number(ron.toFixed(2)) * 100);
}
