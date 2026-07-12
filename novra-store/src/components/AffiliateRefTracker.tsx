"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { extractRefFromSearchParams, storeAffiliateRef } from "@/lib/affiliate-attribution";
import { trackAffiliateClick } from "@/lib/affiliates";

export default function AffiliateRefTracker() {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (!ref) return;

    const normalized = extractRefFromSearchParams(`?ref=${ref}`);
    if (!normalized) return;

    storeAffiliateRef(normalized);
    void trackAffiliateClick(normalized);
  }, [searchParams, pathname]);

  return null;
}
