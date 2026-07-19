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
  Menu,
  X,
  Link2,
  ShoppingCart,
  Home,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCart } from "@/context/CartContext";
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
  const tNav = useTranslations("nav");
  const { totalItems } = useCart();

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

  const mobileQuickLinks = (
    <div className="mt-4 space-y-2">
      <Link
        href="/"
        onClick={onMobileClose}
        className="flex items-center gap-3 rounded-xl border border-purple-500/40 bg-gradient-to-r from-purple-600/25 to-purple-900/20 px-4 py-3 text-sm font-medium text-white transition hover:border-purple-400/60 hover:from-purple-600/35"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-600/30 text-purple-200">
          <Home size={18} />
        </span>
        <span className="flex flex-col items-start leading-tight">
          <span>{tNav("home")}</span>
          <span className="text-[11px] font-normal text-purple-300/80">{t("shopSubtitle")}</span>
        </span>
      </Link>
      <Link
        href="/cos"
        onClick={onMobileClose}
        className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-200 transition hover:border-purple-500/30 hover:bg-purple-600/10 hover:text-white"
      >
        <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 text-purple-300">
          <ShoppingCart size={18} />
          {totalItems > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-purple-600 px-1 text-[10px] font-bold text-white">
              {totalItems > 9 ? "9+" : totalItems}
            </span>
          )}
        </span>
        <span className="flex-1">{t("myCart")}</span>
      </Link>
    </div>
  );

  const renderNav = () => (
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

  const desktopSidebar = (
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
  );

  const mobileDrawer = (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/10 p-5">
        <div className="flex items-start justify-between gap-3">
          <AccountLogo compact showBackLink={false} />
          <button
            type="button"
            onClick={onMobileClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 text-gray-400 transition hover:bg-white/5 hover:text-white"
            aria-label={tNav("closeMenu")}
          >
            <X size={18} />
          </button>
        </div>
        {mobileQuickLinks}
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
  );

  return (
    <>
      <aside className="hidden w-64 shrink-0 border-r border-white/10 bg-novra-bg-alt md:block">
        {desktopSidebar}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 hidden max-md:block">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onMobileClose} />
          <aside className="absolute left-0 top-0 h-full w-72 max-w-[85vw] border-r border-white/10 bg-novra-bg-alt shadow-2xl">
            {mobileDrawer}
          </aside>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-30 hidden max-md:flex border-t border-purple-500/20 bg-novra-bg-alt/95 backdrop-blur-md pb-[env(safe-area-inset-bottom,0px)]">
        <Link
          href="/"
          className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] text-gray-500 transition hover:text-purple-400"
        >
          <Home size={20} />
          {tNav("home")}
        </Link>
        <Link
          href="/cos"
          className="relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] text-gray-500 transition hover:text-purple-400"
        >
          <ShoppingCart size={20} />
          {tNav("cart")}
          {totalItems > 0 && (
            <span className="absolute right-[calc(50%-1.25rem)] top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-purple-600 px-1 text-[9px] font-bold text-white">
              {totalItems > 9 ? "9+" : totalItems}
            </span>
          )}
        </Link>
        <button
          type="button"
          onClick={onMobileToggle}
          className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] transition ${
            mobileOpen ? "text-purple-400" : "text-gray-500 hover:text-purple-400"
          }`}
          aria-label={t("menuAria")}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          {t("accountTab")}
        </button>
      </nav>
    </>
  );
}
