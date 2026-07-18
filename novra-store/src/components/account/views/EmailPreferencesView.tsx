"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { updateCurrentUserProfile, type User } from "@/lib/auth";

type EmailPreferencesViewProps = {
  user: User;
  onSave: (user: User) => void;
};

export default function EmailPreferencesView({ user, onSave }: EmailPreferencesViewProps) {
  const t = useTranslations("accountEmail");
  const [prefs, setPrefs] = useState({
    offers: user.preferences?.offers ?? true,
    orders: user.preferences?.orders ?? true,
    recommendations: user.preferences?.recommendations ?? false,
  });

  const handleSave = async () => {
    const result = await updateCurrentUserProfile({ preferences: prefs });
    if (result.success && result.user) {
      onSave(result.user);
    }
  };

  return (
    <div>
      <h2 className="mb-6 text-xl font-semibold text-white">{t("title")}</h2>

      <div className="space-y-4 rounded-xl border border-white/10 bg-novra-card/30 p-5">
        <label className="flex items-center justify-between gap-4">
          <span className="text-sm text-gray-300">{t("offers")}</span>
          <input
            type="checkbox"
            checked={prefs.offers}
            onChange={(e) => setPrefs((p) => ({ ...p, offers: e.target.checked }))}
            className="h-4 w-4 rounded border-white/20 bg-transparent accent-purple-600"
          />
        </label>
        <label className="flex items-center justify-between gap-4">
          <span className="text-sm text-gray-300">{t("orderStatus")}</span>
          <input
            type="checkbox"
            checked={prefs.orders}
            onChange={(e) => setPrefs((p) => ({ ...p, orders: e.target.checked }))}
            className="h-4 w-4 rounded border-white/20 bg-transparent accent-purple-600"
          />
        </label>
        <label className="flex items-center justify-between gap-4">
          <span className="text-sm text-gray-300">{t("recommendations")}</span>
          <input
            type="checkbox"
            checked={prefs.recommendations}
            onChange={(e) => setPrefs((p) => ({ ...p, recommendations: e.target.checked }))}
            className="h-4 w-4 rounded border-white/20 bg-transparent accent-purple-600"
          />
        </label>
      </div>

      <button
        type="button"
        onClick={handleSave}
        className="mt-4 rounded-xl bg-purple-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-700"
      >
        {t("savePreferences")}
      </button>
    </div>
  );
}
