"use client";

import { Home, LayoutGrid, ShoppingCart, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCart } from "@/context/CartContext";

const BOTTOM_NAV_HEIGHT = "3.75rem";

export function accountMobileBottomPadding(extra = "0px") {
  return `calc(${BOTTOM_NAV_HEIGHT} + env(safe-area-inset-bottom, 0px) + ${extra})`;
}

export default function AccountMobileBottomNav() {
  const tNav = useTranslations("nav");
  const tAccount = useTranslations("account");
  const { totalItems } = useCart();

  const items = [
    { href: "/", label: tNav("home"), icon: Home, active: false },
    { href: "/produse", label: tNav("products"), icon: LayoutGrid, active: false },
    { href: "/cos", label: tNav("cart"), icon: ShoppingCart, active: false, showBadge: true },
    { href: "/contul-meu", label: tAccount("accountTab"), icon: User, active: true },
  ] as const;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[200] flex border-t border-purple-500/25 bg-novra-bg-alt/98 backdrop-blur-md md:hidden"
      aria-label={tNav("mobileNavAria")}
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {items.map((item) => {
        const { href, label, icon: Icon, active } = item;
        const showBadge = "showBadge" in item && item.showBadge;

        return (
        <Link
          key={href}
          href={href}
          aria-current={active ? "page" : undefined}
          className={`relative flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[11px] font-medium touch-manipulation transition-colors [-webkit-tap-highlight-color:transparent] ${
            active
              ? "text-purple-400"
              : "text-gray-400 hover:text-purple-300 active:text-purple-200"
          }`}
        >
          <span className="relative flex h-6 w-6 items-center justify-center">
            <Icon size={22} strokeWidth={active ? 2.25 : 2} />
            {showBadge && totalItems > 0 && (
              <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-purple-600 px-1 text-[9px] font-bold leading-none text-white">
                {totalItems > 9 ? "9+" : totalItems}
              </span>
            )}
          </span>
          <span className="leading-none">{label}</span>
        </Link>
        );
      })}
    </nav>
  );
}
