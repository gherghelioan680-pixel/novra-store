"use client";

import { ArrowLeft, LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ACCOUNT_NAV_ITEMS } from "./accountNav";
import type { AccountSection } from "./types";

type AccountMobileSectionNavProps = {
  activeSection: AccountSection;
  onNavigate: (section: AccountSection) => void;
  onLogout: () => void;
};

export default function AccountMobileSectionNav({
  activeSection,
  onNavigate,
  onLogout,
}: AccountMobileSectionNavProps) {
  const t = useTranslations("account");

  return (
    <div className="mb-5 md:hidden">
      <Link
        href="/"
        className="mb-3 inline-flex min-h-11 items-center gap-2 rounded-lg px-1 text-sm font-medium text-purple-400 transition hover:text-purple-300 active:text-purple-200 touch-manipulation [-webkit-tap-highlight-color:transparent]"
      >
        <ArrowLeft size={18} aria-hidden />
        {t("backToSite")}
      </Link>

      <div
        className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="tablist"
        aria-label={t("menuAria")}
      >
        {ACCOUNT_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;

          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onNavigate(item.id)}
              className={`flex shrink-0 snap-start items-center gap-1.5 rounded-full border px-3.5 py-2.5 min-h-11 text-sm font-medium touch-manipulation transition [-webkit-tap-highlight-color:transparent] ${
                isActive
                  ? "border-purple-500/60 bg-purple-600/25 text-white"
                  : "border-white/10 bg-white/5 text-gray-300 hover:border-purple-500/30 hover:bg-purple-600/10 hover:text-white"
              }`}
            >
              {Icon && <Icon size={16} className={isActive ? "text-purple-300" : "text-gray-400"} />}
              <span className="whitespace-nowrap">{t(item.labelKey)}</span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onLogout}
        className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg px-1 text-sm text-gray-400 transition hover:text-white active:text-gray-200 touch-manipulation [-webkit-tap-highlight-color:transparent]"
      >
        <LogOut size={16} aria-hidden />
        {t("signOut")}
      </button>
    </div>
  );
}
