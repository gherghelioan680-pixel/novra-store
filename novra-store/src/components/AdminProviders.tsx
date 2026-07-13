"use client";

import { SiteSettingsProvider } from "@/context/SiteSettingsContext";
import SessionCookieSync from "@/components/SessionCookieSync";

export default function AdminProviders({ children }: { children: React.ReactNode }) {
  return (
    <SiteSettingsProvider>
      <SessionCookieSync />
      {children}
    </SiteSettingsProvider>
  );
}
