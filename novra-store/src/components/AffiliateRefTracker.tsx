"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { extractRefFromSearchParams, storeAffiliateRef } from "@/lib/affiliate-attribution";
import { hasAffiliateConsent } from "@/lib/cookie-consent";
import { trackAffiliateClick } from "@/lib/affiliates";

export default function AffiliateRefTracker() {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (!ref) return;
    if (!hasAffiliateConsent()) return;

    const normalized = extractRefFromSearchParams(`?ref=${ref}`);
    if (!normalized) return;

    storeAffiliateRef(normalized);
    void trackAffiliateClick(normalized);
  }, [searchParams, pathname]);

  return null;
}
