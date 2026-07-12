"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getSiteSettings, loadSiteSettings, type SiteSettings } from "@/lib/site-settings";
import { createStoreRefreshEffect } from "@/lib/store";

const SSR_DEFAULTS = getSiteSettings();

const SiteSettingsContext = createContext<SiteSettings>(SSR_DEFAULTS);

function settingsEqual(a: SiteSettings, b: SiteSettings): boolean {
  const aComing = a.comingSoon;
  const bComing = b.comingSoon;

  return (
    a.campaignEndDate === b.campaignEndDate &&
    a.campaignActive === b.campaignActive &&
    a.campaignDiscountText === b.campaignDiscountText &&
    a.whatsappNumber === b.whatsappNumber &&
    a.freeShippingThreshold === b.freeShippingThreshold &&
    a.deliveryCost === b.deliveryCost &&
    a.marketingTickerMessages.length === b.marketingTickerMessages.length &&
    a.marketingTickerMessages.every((msg, i) => msg === b.marketingTickerMessages[i]) &&
    aComing.enabled === bComing.enabled &&
    aComing.headline === bComing.headline &&
    aComing.subtitle === bComing.subtitle &&
    aComing.countdownDate === bComing.countdownDate &&
    aComing.showNewsletter === bComing.showNewsletter &&
    a.cardPaymentEnabled === b.cardPaymentEnabled &&
    a.orderEmailsEnabled === b.orderEmailsEnabled &&
    a.newsletterDiscountPercent === b.newsletterDiscountPercent
  );
}

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(SSR_DEFAULTS);

  useEffect(() => {
    return createStoreRefreshEffect(async () => {
      const data = await loadSiteSettings();
      setSettings((prev) => (settingsEqual(prev, data) ? prev : data));
    }, { scopes: ["settings"] });
  }, []);

  return (
    <SiteSettingsContext.Provider value={settings}>{children}</SiteSettingsContext.Provider>
  );
}

export function useSiteSettings(): SiteSettings {
  return useContext(SiteSettingsContext);
}
