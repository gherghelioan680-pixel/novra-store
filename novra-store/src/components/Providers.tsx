"use client";

import dynamic from "next/dynamic";
import { CartProvider } from "@/context/CartContext";
import { SiteSettingsProvider } from "@/context/SiteSettingsContext";
import CountdownFallbackScript from "@/components/CountdownFallbackScript";
import DevToolsBlocker from "@/components/DevToolsBlocker";
import SessionCookieSync from "@/components/SessionCookieSync";

const CookieConsent = dynamic(() => import("@/components/CookieConsent"), { ssr: false });
const LiveVisitors = dynamic(() => import("@/components/LiveVisitors"), { ssr: false });

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SiteSettingsProvider>
      <CartProvider>
        <SessionCookieSync />
        <DevToolsBlocker />
        {children}
        <CountdownFallbackScript />
        <CookieConsent />
        <LiveVisitors />
      </CartProvider>
    </SiteSettingsProvider>
  );
}
