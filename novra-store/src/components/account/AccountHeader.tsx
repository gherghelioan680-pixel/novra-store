"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle } from "lucide-react";
import { getDisplayFirstName, getNovraCredits, refreshCurrentUserFromServer, type User } from "@/lib/auth";
import { createStoreRefreshEffect } from "@/lib/store";

type AccountHeaderProps = {
  user: User;
  onEditProfile: () => void;
  onUserUpdate?: (user: User) => void;
};

export default function AccountHeader({ user, onEditProfile, onUserUpdate }: AccountHeaderProps) {
  const t = useTranslations("account");
  const [refreshedUser, setRefreshedUser] = useState<User | null>(null);
  const liveUser = refreshedUser ?? user;

  useEffect(() => {
    const refresh = async () => {
      const updated = await refreshCurrentUserFromServer();
      if (updated) {
        setRefreshedUser(updated);
        onUserUpdate?.(updated);
      }
    };
    return createStoreRefreshEffect(refresh, { scopes: ["users"] });
  }, [onUserUpdate]);

  const rawFirstName = getDisplayFirstName(liveUser);
  const firstName = rawFirstName || t("guestUser");
  const credits = getNovraCredits(liveUser);

  return (
    <div className="mb-8">
      <div className="flex items-start gap-2">
        <h1 className="text-2xl font-semibold text-white sm:text-3xl">
          {t("greeting", { name: firstName })}
        </h1>
        <CheckCircle className="mt-1.5 h-5 w-5 shrink-0 text-green-500" fill="currentColor" strokeWidth={0} />
      </div>
      <p className="mt-1 text-sm text-gray-400">{t("welcome")}</p>

      <div className="mt-6 flex items-center justify-between rounded-xl border border-white/10 bg-novra-card/30 px-4 py-3">
        <div className="flex flex-wrap items-center gap-4 text-sm sm:gap-8">
          <div>
            <span className="text-gray-500">{t("myCredits")}</span>
            <p className="font-semibold text-white">{credits}</p>
          </div>
          <div className="h-8 w-px bg-white/10" />
          <div>
            <span className="text-gray-500">{t("coupons")}</span>
            <p className="font-semibold text-white">0</p>
          </div>
          <div className="h-8 w-px bg-white/10" />
          <div>
            <span className="text-gray-500">{t("giftCards")}</span>
            <p className="font-semibold text-white">0</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onEditProfile}
          className="text-sm font-medium text-blue-400 transition hover:text-blue-300"
        >
          {t("edit")}
        </button>
      </div>
    </div>
  );
}
