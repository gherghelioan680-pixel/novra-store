"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Lock, Mail, ShoppingBag, User, Check, Shield } from "lucide-react";
import { formatOrderDate } from "@/lib/date-utils";
import type { User as AuthUser } from "@/lib/auth";
import { isProfileComplete, getCurrentUser, isAdmin } from "@/lib/auth";
import {
  getOrdersForUserFromApi,
  ORDER_STATUS_COLORS,
  type Order,
  type OrderStatus,
} from "@/lib/orders";
import { createStoreRefreshEffect } from "@/lib/store";
import type { AccountSection } from "../types";
import SubscribeModal from "../SubscribeModal";
import EmptyOrdersState from "../EmptyOrdersState";

type OverviewViewProps = {
  user: AuthUser;
  onNavigate: (section: AccountSection) => void;
  onUserUpdate: (user: AuthUser) => void;
};

const STATUS_KEYS: Record<OrderStatus, "statusPending" | "statusProcessing" | "statusShipped" | "statusDelivered" | "statusCancelled"> = {
  pending: "statusPending",
  processing: "statusProcessing",
  shipped: "statusShipped",
  delivered: "statusDelivered",
  cancelled: "statusCancelled",
};


export default function OverviewView({ user, onNavigate, onUserUpdate }: OverviewViewProps) {
  const t = useTranslations("accountOverview");
  const to = useTranslations("accountOrders");
  const tc = useTranslations("common");
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const profileComplete = user.profileCreditsGranted ?? user.profileCompleted ?? isProfileComplete(user);
  const signupDone = user.registrationCreditsGranted ?? user.signupBonusClaimed ?? false;

  useEffect(() => {
    const refresh = async () => {
      const orders = await getOrdersForUserFromApi(user.email);
      setRecentOrders(orders.slice(0, 3));
    };

    const cleanup = createStoreRefreshEffect(refresh, { scopes: ["orders"] });

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void refresh();
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cleanup();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [user.email]);

  const earnItems = [
    {
      icon: Lock,
      title: t("signup"),
      description: t("signupDesc"),
      action: signupDone ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-500/20 px-3 py-1 text-xs font-medium text-green-400">
          <Check size={14} /> {t("completed")}
        </span>
      ) : null,
    },
    {
      icon: Mail,
      title: t("newsletter"),
      description: t("newsletterDesc"),
      action: user.subscribedToNewsletter ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-500/20 px-3 py-1 text-xs font-medium text-green-400">
          <Check size={14} /> {t("subscribed")}
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setSubscribeOpen(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          {t("subscribe")}
        </button>
      ),
    },
    {
      icon: ShoppingBag,
      title: t("shop"),
      description: t("shopDesc"),
      action: (
        <Link
          href="/produse"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          {tc("viewProducts")}
        </Link>
      ),
    },
    {
      icon: User,
      title: t("profile"),
      description: t("profileDesc"),
      action: profileComplete ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-500/20 px-3 py-1 text-xs font-medium text-green-400">
          <Check size={14} /> {t("completed")}
        </span>
      ) : (
        <button
          type="button"
          onClick={() => onNavigate("my-profile")}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          {t("complete")}
        </button>
      ),
    },
  ];


  return (
    <div className="space-y-8">
      {isAdmin(user) && (
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 rounded-xl border border-purple-500/25 bg-purple-600/10 px-4 py-2.5 text-sm text-purple-200 transition hover:border-purple-500/40 hover:bg-purple-600/15"
        >
          <Shield size={16} className="text-purple-400" />
          {t("adminPanel")}
        </Link>
      )}

      <section>
        <h2 className="mb-4 text-lg font-semibold text-white">{t("earnCreditsTitle")}</h2>
        <div className="space-y-3">
          {earnItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="flex flex-col gap-4 rounded-xl border border-white/10 bg-novra-card/30 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-600/20">
                    <Icon size={20} className="text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">{item.title}</h3>
                    <p className="mt-0.5 text-sm text-gray-400">{item.description}</p>
                  </div>
                </div>
                <div className="shrink-0 sm:ml-4">{item.action}</div>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">{t("recentOrders")}</h2>
          <button
            type="button"
            onClick={() => onNavigate("my-orders")}
            className="text-sm font-medium text-blue-400 transition hover:text-blue-300"
          >
            {t("viewAll")}
          </button>
        </div>
        <div className="rounded-xl border border-white/10 bg-novra-card/30">
          {recentOrders.length > 0 ? (
            <ul className="divide-y divide-white/10">
              {recentOrders.map((order) => (
                <li key={order.id} className="flex items-center justify-between gap-4 p-4">
                  <div>
                    <p className="font-mono text-xs text-purple-300">{order.id}</p>
                    <p className="text-sm text-gray-400">{formatOrderDate(order.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${ORDER_STATUS_COLORS[order.status]}`}
                    >
                      {to(STATUS_KEYS[order.status])}
                    </span>
                    <span className="text-sm font-semibold text-white">{order.total.toFixed(2)} RON</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="py-4">
              <EmptyOrdersState shopHref="/produse" />
            </div>
          )}
        </div>
      </section>

      <SubscribeModal
        isOpen={subscribeOpen}
        onClose={() => setSubscribeOpen(false)}
        defaultEmail={user.email}
        onSuccess={() => {
          const updated = getCurrentUser();
          if (updated) onUserUpdate(updated);
        }}
      />
    </div>
  );
}
