"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Banknote,
  Users,
  Package,
  ArrowRight,
  Clock,
  Shield,
  Megaphone,
  FileText,
  UserPlus,
  Bell,
} from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import StatCard from "@/components/admin/StatCard";
import { requireAdmin, loadAllUsersFromServer } from "@/lib/auth";
import { loadOrders, getOrderStats, ORDER_STATUS_LABELS, type Order } from "@/lib/orders";
import { getCatalogProducts } from "@/lib/catalog";
import { createStoreRefreshEffect } from "@/lib/store";
import { loadCampaigns } from "@/lib/campaigns";
import { loadBlogArticles } from "@/lib/blog";
import { loadReferralsAdmin } from "@/lib/referrals";
import { loadPushNotificationsAdmin } from "@/lib/push";
import { isCampaignCurrentlyActive } from "@/lib/campaigns-types";

const quickLinks = [
  { href: "/admin/setari#administratori", label: "Administratori", desc: "Adaugă conturi admin pentru echipă", icon: Shield },
  { href: "/admin/campanii", label: "Campanii active", desc: "Landing pages promoționale", icon: Megaphone },
  { href: "/admin/blog", label: "Blog & Ghiduri", desc: "Articole și conținut SEO", icon: FileText },
  { href: "/admin/recomandari", label: "Recomandări prieteni", desc: "Statistici program invitații", icon: UserPlus },
  { href: "/admin/notificari", label: "Notificări Push", desc: "Abonați și trimiteri", icon: Bell },
  { href: "/admin/produse", label: "Gestionează produse", desc: "Editează prețuri și catalog" },
  { href: "/admin/comenzi", label: "Vezi comenzi", desc: "Procesează și expediază" },
  { href: "/admin/clienti", label: "Clienți înregistrați", desc: "Utilizatori și NovraCredits" },
  { href: "/admin/coduri-reducere", label: "Coduri reducere", desc: "Gestionează codurile promoționale" },
  { href: "/admin/setari", label: "Setări site", desc: "Countdown, WhatsApp, livrare" },
];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalUsers: 0,
    totalProducts: 0,
    pendingOrders: 0,
    processingOrders: 0,
    shippedOrders: 0,
    cancelledOrders: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [marketing, setMarketing] = useState({
    activeCampaigns: 0,
    blogPosts: 0,
    referralConverted: 0,
    pushSubscribers: 0,
  });
  const admin = requireAdmin();

  useEffect(() => {
    const refresh = async () => {
      const orders = await loadOrders();
      const orderStats = getOrderStats();
      const customers = (await loadAllUsersFromServer()).filter((u) => u.role !== "admin");

      const [campaigns, articles, referralsData, pushData] = await Promise.all([
        loadCampaigns(),
        loadBlogArticles(),
        loadReferralsAdmin(),
        loadPushNotificationsAdmin(),
      ]);

      setStats({
        totalOrders: orderStats.totalOrders,
        totalRevenue: orderStats.totalRevenue,
        totalUsers: customers.length,
        totalProducts: getCatalogProducts().length,
        pendingOrders: orderStats.pendingOrders,
        processingOrders: orderStats.processingOrders,
        shippedOrders: orderStats.shippedOrders,
        cancelledOrders: orderStats.cancelledOrders,
      });
      setRecentOrders(orders.slice(0, 5));
      setMarketing({
        activeCampaigns: campaigns.filter((c) => isCampaignCurrentlyActive(c)).length,
        blogPosts: articles.filter((a) => a.published).length,
        referralConverted: referralsData?.stats.converted ?? 0,
        pushSubscribers: pushData?.subscriptions ?? 0,
      });
    };
    return createStoreRefreshEffect(refresh, { scopes: ["orders", "users", "products", "campaigns", "blog", "referrals", "push"] });
  }, []);

  if (!admin) return null;

  return (
    <div>
      <AdminHeader
        user={admin}
        title="Dashboard"
        subtitle="Prezentare generală a magazinului NOVRA"
      />

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total comenzi" value={stats.totalOrders} icon={ShoppingBag} />
        <StatCard
          label="Venituri totale"
          value={`${stats.totalRevenue.toFixed(2)} RON`}
          icon={Banknote}
          accent="text-green-400"
        />
        <StatCard label="Clienți activi" value={stats.totalUsers} icon={Users} accent="text-blue-400" />
        <StatCard label="Produse" value={stats.totalProducts} icon={Package} />
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatusPill label={ORDER_STATUS_LABELS.pending} count={stats.pendingOrders} color="text-yellow-300" />
        <StatusPill label={ORDER_STATUS_LABELS.processing} count={stats.processingOrders} color="text-blue-300" />
        <StatusPill label={ORDER_STATUS_LABELS.shipped} count={stats.shippedOrders} color="text-green-300" />
        <StatusPill label={ORDER_STATUS_LABELS.cancelled} count={stats.cancelledOrders} color="text-red-300" />
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MarketingPill label="Campanii live" count={marketing.activeCampaigns} href="/admin/campanii" />
        <MarketingPill label="Articole blog" count={marketing.blogPosts} href="/admin/blog" />
        <MarketingPill label="Recomandări convertite" count={marketing.referralConverted} href="/admin/recomandari" />
        <MarketingPill label="Abonați push" count={marketing.pushSubscribers} href="/admin/notificari" />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-novra-card/30 p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Comenzi recente</h2>
            <Link href="/admin/comenzi" className="text-sm text-purple-400 hover:text-purple-300">
              Vezi toate
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">Nicio comandă încă.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-[10px] uppercase tracking-widest text-gray-500">
                    <th className="pb-3 pr-4">ID</th>
                    <th className="pb-3 pr-4">Client</th>
                    <th className="pb-3 pr-4">Total</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="text-gray-300">
                      <td className="py-3 pr-4 font-mono text-xs text-purple-300">
                        {order.id.replace("order-", "").slice(-8)}
                      </td>
                      <td className="py-3 pr-4">{order.userName}</td>
                      <td className="py-3 pr-4 font-medium text-white">
                        {order.total.toFixed(2)} RON
                      </td>
                      <td className="py-3">
                        <span className="rounded-full bg-purple-600/15 px-2 py-0.5 text-xs text-purple-300">
                          {ORDER_STATUS_LABELS[order.status]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-white/10 bg-novra-card/30 p-5 sm:p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Acces rapid</h2>
          <div className="space-y-3">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`group flex items-center justify-between rounded-xl border p-4 transition hover:border-purple-500/30 hover:bg-novra-card/50 ${
                    link.href.includes("#administratori")
                      ? "border-purple-500/30 bg-purple-600/10"
                      : "border-white/8 bg-novra-bg/30"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {Icon ? (
                      <Icon size={18} className="mt-0.5 shrink-0 text-purple-400" />
                    ) : null}
                    <div>
                      <p className="font-medium text-white">{link.label}</p>
                      <p className="mt-0.5 text-xs text-gray-500">{link.desc}</p>
                    </div>
                  </div>
                  <ArrowRight
                    size={16}
                    className="text-gray-500 transition group-hover:translate-x-1 group-hover:text-purple-400"
                  />
                </Link>
              );
            })}
          </div>
        </section>
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-white/8 bg-novra-bg/30 px-4 py-3 text-xs text-gray-500">
        <Clock size={14} className="text-purple-400" />
        Datele magazinului sunt sincronizate pe server. Modificările din admin apar pe toate dispozitivele.
      </div>
    </div>
  );
}

function StatusPill({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-novra-card/30 px-4 py-3 text-center">
      <p className={`text-2xl font-bold ${color}`}>{count}</p>
      <p className="mt-1 text-xs text-gray-500">{label}</p>
    </div>
  );
}

function MarketingPill({ label, count, href }: { label: string; count: number; href: string }) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-purple-500/20 bg-purple-600/5 px-4 py-3 text-center transition hover:border-purple-500/40 hover:bg-purple-600/10"
    >
      <p className="text-2xl font-bold text-purple-300">{count}</p>
      <p className="mt-1 text-xs text-gray-500">{label}</p>
    </Link>
  );
}
