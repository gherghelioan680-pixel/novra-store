"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { CartProvider } from "@/context/CartContext";
import { SiteSettingsProvider } from "@/context/SiteSettingsContext";
import CountdownFallbackScript from "@/components/CountdownFallbackScript";
import DevToolsBlocker from "@/components/DevToolsBlocker";
import SessionCookieSync from "@/components/SessionCookieSync";

const CookieConsent = dynamic(() => import("@/components/CookieConsent"), { ssr: false });
const AffiliateRefTracker = dynamic(() => import("@/components/AffiliateRefTracker"), { ssr: false });

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SiteSettingsProvider>
      <CartProvider>
        <SessionCookieSync />
        <Suspense fallback={null}>
          <AffiliateRefTracker />
        </Suspense>
        <DevToolsBlocker />
        {children}
        <CountdownFallbackScript />
        <CookieConsent />
      </CartProvider>
    </SiteSettingsProvider>
  );
}
