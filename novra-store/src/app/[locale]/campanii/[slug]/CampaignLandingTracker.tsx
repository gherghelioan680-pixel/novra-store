"use client";

import { useEffect } from "react";
import { storeCampaignRef } from "@/lib/campaign-attribution";

export default function CampaignLandingTracker({ slug }: { slug: string }) {
  useEffect(() => {
    storeCampaignRef(slug);
  }, [slug]);

  return null;
}
