"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { extractInviteFromSearchParams, storeInviteRef } from "@/lib/referral-attribution";

export default function InviteRefTracker() {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  useEffect(() => {
    const invite = searchParams.get("invite");
    if (!invite) return;

    const normalized = extractInviteFromSearchParams(`?invite=${invite}`);
    if (!normalized) return;

    storeInviteRef(normalized);
  }, [searchParams, pathname]);

  return null;
}
