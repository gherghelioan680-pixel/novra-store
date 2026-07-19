import type { LucideIcon } from "lucide-react";
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
  Link2,
} from "lucide-react";
import type { AccountSection } from "./types";

export type AccountNavItem = {
  id: AccountSection;
  labelKey: string;
  icon?: LucideIcon;
  badgeKey?: string;
};

export type AccountNavGroup = {
  titleKey?: string;
  items: AccountNavItem[];
};

export const ACCOUNT_NAV_GROUPS: AccountNavGroup[] = [
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

export const ACCOUNT_NAV_ITEMS: AccountNavItem[] = ACCOUNT_NAV_GROUPS.flatMap((group) => group.items);
