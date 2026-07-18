"use client";

import { useEffect } from "react";
import { hasAnalyticsConsent } from "@/lib/cookie-consent";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

function loadGaScript(measurementId: string): void {
  if (document.querySelector(`script[data-ga-id="${measurementId}"]`)) return;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  script.dataset.gaId = measurementId;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer ?? [];
  function gtag(...args: unknown[]) {
    window.dataLayer!.push(args);
  }
  window.gtag = gtag;
  gtag("js", new Date());
  gtag("config", measurementId, { anonymize_ip: true });
}

export default function GoogleAnalytics() {
  useEffect(() => {
    if (!GA_ID) return;

    const maybeLoad = () => {
      if (hasAnalyticsConsent()) {
        loadGaScript(GA_ID);
      }
    };

    maybeLoad();
    window.addEventListener("novra-cookie-consent-updated", maybeLoad);
    return () => window.removeEventListener("novra-cookie-consent-updated", maybeLoad);
  }, []);

  return null;
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}
