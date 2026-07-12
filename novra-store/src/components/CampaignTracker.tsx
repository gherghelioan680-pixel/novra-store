"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { extractCampaignFromSearchParams, storeCampaignRef } from "@/lib/campaign-attribution";

export default function CampaignTracker() {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  useEffect(() => {
    const campaign = searchParams.get("campaign");
    if (!campaign) return;

    const normalized = extractCampaignFromSearchParams(`?campaign=${campaign}`);
    if (!normalized) return;

    storeCampaignRef(normalized);
  }, [searchParams, pathname]);

  return null;
}
