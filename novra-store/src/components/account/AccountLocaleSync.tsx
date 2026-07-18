"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";
import type { AppLocale } from "@/i18n/routing";
import { getCurrentUser, syncUserLocale } from "@/lib/auth";

export default function AccountLocaleSync() {
  const locale = useLocale() as AppLocale;

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) return;
    if (user.preferredLocale === locale) return;
    void syncUserLocale(locale);
  }, [locale]);

  return null;
}
