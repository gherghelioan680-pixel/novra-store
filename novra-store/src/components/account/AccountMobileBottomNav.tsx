"use client";

import { Home, LayoutGrid, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const BOTTOM_NAV_HEIGHT = "3.75rem";

function mobileBottomOffset(extra = "0px") {
  return `calc(${BOTTOM_NAV_HEIGHT}+env(safe-area-inset-bottom,0px)+${extra})`;
}

/** Mobile-only bottom offset for fixed/sticky UI above AccountMobileBottomNav. */
export function accountMobileBottomPaddingClass(extra = "0px") {
  return `max-md:pb-[${mobileBottomOffset(extra)}]`;
}

/** Mobile-only bottom position for fixed elements above AccountMobileBottomNav. */
export function accountMobileBottomOffsetClass(extra = "0px") {
  return `max-md:bottom-[${mobileBottomOffset(extra)}]`;
}

export default function AccountMobileBottomNav() {
  const tNav = useTranslations("nav");
  const tAccount = useTranslations("account");

  const items = [
    { href: "/", label: tNav("home"), icon: Home, active: false },
    { href: "/produse", label: tNav("products"), icon: LayoutGrid, active: false },
    { href: "/contul-meu", label: tAccount("accountTab"), icon: User, active: true },
  ] as const;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[200] hidden max-md:flex border-t border-purple-500/25 bg-novra-bg-alt/98 backdrop-blur-md"
      aria-label={tNav("mobileNavAria")}
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {items.map(({ href, label, icon: Icon, active }) => (
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
          <span className="flex h-6 w-6 items-center justify-center">
            <Icon size={22} strokeWidth={active ? 2.25 : 2} />
          </span>
          <span className="leading-none">{label}</span>
        </Link>
      ))}
    </nav>
  );
}
