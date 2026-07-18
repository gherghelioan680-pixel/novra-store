"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { getNovraCredits, updateCurrentUserProfile, type User } from "@/lib/auth";

type MyProfileViewProps = {
  user: User;
  onSave: (user: User, message: string) => void;
  onCancel: () => void;
};

export default function MyProfileView({ user, onSave, onCancel }: MyProfileViewProps) {
  const t = useTranslations("accountProfile");
  const tc = useTranslations("common");
  const [form, setForm] = useState({
    email: user.email,
    firstName: user.firstName || user.name.split(/\s+/)[0] || "",
    lastName: user.lastName || user.name.split(/\s+/).slice(1).join(" ") || "",
    dateOfBirth: user.dateOfBirth || "",
    phone: user.phone || "",
    country: user.country || "Romania",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const beforeCredits = getNovraCredits(user);
    const result = updateCurrentUserProfile({
      firstName: form.firstName,
      lastName: form.lastName,
      dateOfBirth: form.dateOfBirth,
      phone: form.phone,
      country: form.country,
    });

    if (result.success && result.user) {
      const earnedCredits = getNovraCredits(result.user) - beforeCredits;
      const message =
        earnedCredits > 0
          ? t("profileSavedWithCredits", { credits: earnedCredits })
          : t("profileSaved");
      onSave(result.user, message);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-white">{t("title")}</h2>
      <p className="mt-1 text-sm text-gray-400">{t("subtitle")}</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div>
          <label className="mb-2 block text-sm text-gray-400">{t("email")}</label>
          <input
            type="email"
            value={form.email}
            disabled
            className="w-full rounded-xl border border-white/10 bg-novra-bg/40 px-4 py-3 text-sm text-gray-500 outline-none"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm text-gray-400">{t("firstName")}</label>
            <input
              value={form.firstName}
              onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
              className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm outline-none focus:border-purple-500/50"
              placeholder={t("firstNamePlaceholder")}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-gray-400">{t("lastName")}</label>
            <input
              value={form.lastName}
              onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
              className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm outline-none focus:border-purple-500/50"
              placeholder={t("lastNamePlaceholder")}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm text-gray-400">{t("dateOfBirth")}</label>
            <input
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
              className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm outline-none focus:border-purple-500/50"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-gray-400">{t("phone")}</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm outline-none focus:border-purple-500/50"
              placeholder={t("phonePlaceholder")}
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm text-gray-400">{t("country")}</label>
          <select
            value={form.country}
            onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
            className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm outline-none focus:border-purple-500/50"
          >
            <option value="Romania">{t("romania")}</option>
          </select>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-white/10 px-6 py-2.5 text-sm font-medium text-gray-300 transition hover:border-white/20 hover:text-white"
          >
            {tc("cancel")}
          </button>
          <button
            type="submit"
            className="rounded-xl bg-purple-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-700"
          >
            {tc("save")}
          </button>
        </div>
      </form>
    </div>
  );
}
