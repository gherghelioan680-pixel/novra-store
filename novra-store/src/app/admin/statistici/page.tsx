"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  Banknote,
  Package,
  ShoppingBag,
  Link2,
  RefreshCw,
} from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import StatCard from "@/components/admin/StatCard";
import { requireAdmin } from "@/lib/auth";
import { getApiHeaders } from "@/lib/api-client";

type StatsResponse = {
  rangeDays: number;
  totalOrders: number;
  totalRevenue: number;
  ordersPerDay: Array<{ date: string; label: string; orders: number; revenue: number }>;
  topProducts: Array<{ title: string; quantity: number }>;
  affiliate: { referrals: number; commissionTotal: number };
  statusBreakdown: Array<{ status: string; label: string; count: number }>;
};

export default function AdminStatisticiPage() {
  const admin = requireAdmin();
  const [range, setRange] = useState<7 | 30>(7);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = async (days: 7 | 30) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/store/stats?range=${days}`, {
        headers: getApiHeaders(),
        cache: "no-store",
      });
      if (!response.ok) return;
      const data = (await response.json()) as StatsResponse;
      setStats(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadStats(range);
  }, [range]);

  if (!admin) return null;

  const maxOrders = Math.max(...(stats?.ordersPerDay.map((day) => day.orders) ?? [1]), 1);
  const maxProductQty = Math.max(...(stats?.topProducts.map((p) => p.quantity) ?? [1]), 1);

  return (
    <div>
      <AdminHeader
        user={admin}
        title="Statistici vânzări"
        subtitle="Analiză comenzi, venituri și performanță afiliere"
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-xl border border-white/10 bg-novra-card/30 p-1">
          <button
            type="button"
            onClick={() => setRange(7)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              range === 7 ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            Ultimele 7 zile
          </button>
          <button
            type="button"
            onClick={() => setRange(30)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              range === 30 ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            Ultimele 30 zile
          </button>
        </div>
        <button
          type="button"
          onClick={() => void loadStats(range)}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-gray-300 hover:text-white"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Reîncarcă
        </button>
      </div>

      {stats && (
        <>
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total comenzi" value={stats.totalOrders} icon={ShoppingBag} />
            <StatCard
              label="Venituri totale"
              value={`${stats.totalRevenue.toFixed(2)} RON`}
              icon={Banknote}
              accent="text-green-400"
            />
            <StatCard
              label="Comisioane afiliere"
              value={`${stats.affiliate.commissionTotal.toFixed(2)} RON`}
              icon={Link2}
              accent="text-purple-300"
            />
            <StatCard
              label="Referințe afiliate"
              value={stats.affiliate.referrals}
              icon={BarChart3}
              accent="text-blue-300"
            />
          </div>

          <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
            <section className="rounded-2xl border border-white/10 bg-novra-card/30 p-5 sm:p-6">
              <h2 className="mb-4 text-lg font-semibold text-white">Comenzi pe zi</h2>
              <div className="space-y-3">
                {stats.ordersPerDay.map((day) => (
                  <div key={day.date}>
                    <div className="mb-1 flex items-center justify-between text-xs text-gray-400">
                      <span>{day.label}</span>
                      <span>
                        {day.orders} comenzi · {day.revenue.toFixed(0)} RON
                      </span>
                    </div>
                    <div className="h-3 rounded-full bg-novra-bg/60 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-500 transition-all"
                        style={{ width: `${(day.orders / maxOrders) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-novra-card/30 p-5 sm:p-6">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                <Package size={18} className="text-purple-400" />
                Top produse (cantitate)
              </h2>
              {stats.topProducts.length === 0 ? (
                <p className="text-sm text-gray-500">Nu există date încă.</p>
              ) : (
                <div className="space-y-3">
                  {stats.topProducts.map((product) => (
                    <div key={product.title}>
                      <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                        <span className="truncate text-gray-300">{product.title}</span>
                        <span className="shrink-0 text-purple-300">{product.quantity} buc.</span>
                      </div>
                      <div className="h-2.5 rounded-full bg-novra-bg/60 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-purple-500/80"
                          style={{ width: `${(product.quantity / maxProductQty) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <section className="rounded-2xl border border-white/10 bg-novra-card/30 p-5 sm:p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">Distribuție status comenzi</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {stats.statusBreakdown.map((entry) => (
                <div
                  key={entry.status}
                  className="rounded-xl border border-white/8 bg-novra-bg/30 px-4 py-3 text-center"
                >
                  <p className="text-2xl font-bold text-purple-300">{entry.count}</p>
                  <p className="mt-1 text-xs text-gray-500">{entry.label}</p>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
