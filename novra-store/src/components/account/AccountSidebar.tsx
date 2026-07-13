"use client";

import {
  LayoutDashboard,
  ShoppingBag,
  RotateCcw,
  User,
  MapPin,
  Settings,
  Ticket,
  Coins,
  Gift,
  Mail,
  Headphones,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Link2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { AccountSection } from "./types";
import AccountLogo from "./AccountLogo";

type NavItem = {
  id: AccountSection;
  labelKey: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  badgeKey?: string;
};

type NavGroup = {
  titleKey?: string;
  items: NavItem[];
};

type AccountSidebarProps = {
  activeSection: AccountSection;
  onNavigate: (section: AccountSection) => void;
  onLogout: () => void;
  mobileOpen: boolean;
  onMobileToggle: () => void;
  onMobileClose: () => void;
};

export default function AccountSidebar({
  activeSection,
  onNavigate,
  onLogout,
  mobileOpen,
  onMobileToggle,
  onMobileClose,
}: AccountSidebarProps) {
  const t = useTranslations("account");

  const navGroups: NavGroup[] = [
    {
      items: [{ id: "overview", labelKey: "overview", icon: LayoutDashboard }],
    },
    {
      titleKey: "orders",
      items: [
        { id: "my-orders", labelKey: "myOrders", icon: ShoppingBag },
        { id: "my-returns", labelKey: "myReturns", icon: RotateCcw },
      ],
    },
    {
      titleKey: "account",
      items: [
        { id: "my-profile", labelKey: "myProfile", icon: User, badgeKey: "profileBadge" },
        { id: "shipping-address", labelKey: "shippingAddress", icon: MapPin },
        { id: "manage-account", labelKey: "manageAccount", icon: Settings },
      ],
    },
    {
      titleKey: "assets",
      items: [
        { id: "my-coupons", labelKey: "myCoupons", icon: Ticket },
        { id: "my-novra-credits", labelKey: "myCredits", icon: Coins },
        { id: "gift-cards", labelKey: "giftCards", icon: Gift },
        { id: "affiliate-program", labelKey: "affiliateProgram", icon: Link2 },
        { id: "refer-friend", labelKey: "referFriend", icon: Gift },
      ],
    },
    {
      titleKey: "customerService",
      items: [
        { id: "email-preferences", labelKey: "emailPreferences", icon: Mail },
        { id: "support-center", labelKey: "supportCenter", icon: Headphones },
      ],
    },
  ];

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/10 p-5">
        <AccountLogo compact />
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
        {navGroups.map((group, groupIndex) => (
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
                      onClick={() => {
                        onNavigate(item.id);
                        onMobileClose();
                      }}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                        isActive
                          ? "bg-purple-600/20 text-white border-l-2 border-purple-500"
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

      <div className="border-t border-white/10 p-3 space-y-1">
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
  );

  return (
    <>
      <button
        type="button"
        onClick={onMobileToggle}
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-novra-card lg:hidden"
        aria-label={t("menuAria")}
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside className="hidden w-64 shrink-0 border-r border-white/10 bg-novra-bg-alt lg:block">
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onMobileClose} />
          <aside className="absolute left-0 top-0 h-full w-72 max-w-[85vw] border-r border-white/10 bg-novra-bg-alt shadow-2xl">
            {sidebarContent}
          </aside>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-white/10 bg-novra-bg-alt pb-[env(safe-area-inset-bottom,0px)] lg:hidden">
        {[
          { id: "overview" as AccountSection, labelKey: "overview", icon: LayoutDashboard },
          { id: "my-orders" as AccountSection, labelKey: "orders", icon: ShoppingBag },
          { id: "my-profile" as AccountSection, labelKey: "profile", icon: User },
          { id: "my-novra-credits" as AccountSection, labelKey: "credits", icon: Coins },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] transition ${
                isActive ? "text-purple-400" : "text-gray-500"
              }`}
            >
              <Icon size={18} />
              {t(item.labelKey)}
            </button>
          );
        })}
        <button
          type="button"
          onClick={onMobileToggle}
          className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] text-gray-500"
        >
          <ChevronDown size={18} />
          {t("more")}
        </button>
      </nav>
    </>
  );
}
