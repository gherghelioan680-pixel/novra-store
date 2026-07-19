"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { CartProvider } from "@/context/CartContext";
import { CurrencyProvider } from "@/context/CurrencyContext";
import { SiteSettingsProvider } from "@/context/SiteSettingsContext";
import CountdownFallbackScript from "@/components/CountdownFallbackScript";
import SessionCookieSync from "@/components/SessionCookieSync";
import type { DisplayCurrency } from "@/lib/currency";

const CookieConsent = dynamic(() => import("@/components/CookieConsent"), { ssr: false });
const AffiliateRefTracker = dynamic(() => import("@/components/AffiliateRefTracker"), { ssr: false });
const CampaignTracker = dynamic(() => import("@/components/CampaignTracker"), { ssr: false });
const InviteRefTracker = dynamic(() => import("@/components/InviteRefTracker"), { ssr: false });
const PushNotificationPrompt = dynamic(() => import("@/components/PushNotificationPrompt"), { ssr: false });
const PwaInstallPrompt = dynamic(() => import("@/components/PwaInstallPrompt"), { ssr: false });
const PwaServiceWorkerRegister = dynamic(() => import("@/components/PwaServiceWorkerRegister"), { ssr: false });
const VisitorTracker = dynamic(() => import("@/components/VisitorTracker"), { ssr: false });
const GoogleAnalytics = dynamic(() => import("@/components/GoogleAnalytics"), { ssr: false });

export default function Providers({
  children,
  initialCurrency = "RON",
}: {
  children: React.ReactNode;
  initialCurrency?: DisplayCurrency;
}) {
  return (
    <SiteSettingsProvider>
      <CurrencyProvider initialCurrency={initialCurrency}>
        <CartProvider>
          <SessionCookieSync />
          <PwaServiceWorkerRegister />
          <Suspense fallback={null}>
            <AffiliateRefTracker />
          </Suspense>
          <Suspense fallback={null}>
            <CampaignTracker />
          </Suspense>
          <Suspense fallback={null}>
            <InviteRefTracker />
          </Suspense>
          <VisitorTracker />
          {children}
          <CountdownFallbackScript />
          <CookieConsent />
          <GoogleAnalytics />
          <PushNotificationPrompt />
          <PwaInstallPrompt />
        </CartProvider>
      </CurrencyProvider>
    </SiteSettingsProvider>
  );
}
