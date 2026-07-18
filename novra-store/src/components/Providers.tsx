"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { CartProvider } from "@/context/CartContext";
import { SiteSettingsProvider } from "@/context/SiteSettingsContext";
import CountdownFallbackScript from "@/components/CountdownFallbackScript";
import SessionCookieSync from "@/components/SessionCookieSync";

const CookieConsent = dynamic(() => import("@/components/CookieConsent"), { ssr: false });
const AffiliateRefTracker = dynamic(() => import("@/components/AffiliateRefTracker"), { ssr: false });
const CampaignTracker = dynamic(() => import("@/components/CampaignTracker"), { ssr: false });
const InviteRefTracker = dynamic(() => import("@/components/InviteRefTracker"), { ssr: false });
const PushNotificationPrompt = dynamic(() => import("@/components/PushNotificationPrompt"), { ssr: false });
const VisitorTracker = dynamic(() => import("@/components/VisitorTracker"), { ssr: false });
const GoogleAnalytics = dynamic(() => import("@/components/GoogleAnalytics"), { ssr: false });

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SiteSettingsProvider>
      <CartProvider>
        <SessionCookieSync />
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
      </CartProvider>
    </SiteSettingsProvider>
  );
}
