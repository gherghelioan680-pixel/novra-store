"use client";

import { LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import type { AccountSection } from "./types";
import AccountLogo from "./AccountLogo";
import { ACCOUNT_NAV_GROUPS } from "./accountNav";

type AccountSidebarProps = {
  activeSection: AccountSection;
  onNavigate: (section: AccountSection) => void;
  onLogout: () => void;
};

export default function AccountSidebar({
  activeSection,
  onNavigate,
  onLogout,
}: AccountSidebarProps) {
  const t = useTranslations("account");

  const renderNav = () => (
    <nav className="flex-1 overflow-y-auto p-3">
      {ACCOUNT_NAV_GROUPS.map((group, groupIndex) => (
        <div key={group.titleKey ?? `group-${groupIndex}`} className="mb-4">
          {group.titleKey && (
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">
              {t(group.titleKey)}
            </p>
          )}
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;

              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onNavigate(item.id)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                      isActive
                        ? "border-l-2 border-purple-500 bg-purple-600/20 text-white"
                        : "text-gray-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {Icon && <Icon size={18} className={isActive ? "text-purple-400" : ""} />}
                    <span className="flex-1">{t(item.labelKey)}</span>
                    {item.badgeKey && (
                      <span className="rounded-full bg-purple-600/30 px-2 py-0.5 text-[10px] font-medium text-purple-300">
                        {t(item.badgeKey)}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <aside className="hidden w-64 shrink-0 border-r border-white/10 bg-novra-bg-alt md:block">
      <div className="flex h-full flex-col">
        <div className="border-b border-white/10 p-5">
          <AccountLogo compact />
        </div>
        {renderNav()}
        <div className="space-y-1 border-t border-white/10 p-3">
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-400 transition hover:bg-white/5 hover:text-white"
          >
            <LogOut size={18} />
            {t("signOut")}
          </button>
        </div>
      </div>
    </aside>
  );
}
