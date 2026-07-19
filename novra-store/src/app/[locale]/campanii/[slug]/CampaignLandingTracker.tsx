"use client";

import { useEffect } from "react";
import { storeCampaignRef } from "@/lib/campaign-attribution";

export default function CampaignLandingTracker({
  slug,
  discountCode,
}: {
  slug: string;
  discountCode?: string;
}) {
  useEffect(() => {
    storeCampaignRef(slug, discountCode);
  }, [slug, discountCode]);

  return null;
}
