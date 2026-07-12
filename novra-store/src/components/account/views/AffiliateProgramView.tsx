"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle,
  Clock,
  Link2,
  MousePointerClick,
  RefreshCw,
  ShoppingBag,
  Wallet,
  XCircle,
} from "lucide-react";
import type { User } from "@/lib/auth";
import {
  AFFILIATE_REQUIREMENT_KEYS,
  AFFILIATE_REQUIREMENT_LABELS,
  buildAffiliateLink,
  DEFAULT_AFFILIATE_COMMISSION_RATE,
  formatCommissionLabel,
  type AffiliateRequirements,
} from "@/lib/affiliates-types";
import {
  loadAffiliateDashboard,
  submitAffiliateApplication,
  type AffiliateDashboardData,
} from "@/lib/affiliates";
import { createStoreRefreshEffect } from "@/lib/store";
import CopyButton from "@/components/CopyButton";

type AffiliateProgramViewProps = {
  user: User;
  onToast: (message: string) => void;
};

const defaultRequirements = (): AffiliateRequirements =>
  AFFILIATE_REQUIREMENT_KEYS.reduce(
    (acc, key) => ({ ...acc, [key]: false }),
    {} as AffiliateRequirements
  );

export default function AffiliateProgramView({ user, onToast }: AffiliateProgramViewProps) {
  const [data, setData] = useState<AffiliateDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [requirements, setRequirements] = useState<AffiliateRequirements>(defaultRequirements);

  const refresh = async () => {
    const result = await loadAffiliateDashboard();
    setData(result);
    setLoading(false);
  };

  useEffect(() => {
    return createStoreRefreshEffect(refresh, { scopes: ["affiliates"] });
  }, []);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("ro-RO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const formatMoney = (value: number) => `${value.toFixed(2)} RON`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const result = await submitAffiliateApplication({
      name: user.name || user.email,
      requirements,
    });
    setSubmitting(false);

    if (!result.ok) {
      onToast(result.message);
      return;
    }

    onToast("Cererea ta a fost trimisă! Vei primi un răspuns în curând.");
    await refresh();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <RefreshCw size={20} className="mr-2 animate-spin" />
        Se încarcă...
      </div>
    );
  }

  const affiliate = data?.affiliate ?? null;
  const application = data?.application ?? null;
  const referrals = data?.referrals ?? [];

  if (affiliate) {
    const affiliateLink = buildAffiliateLink(affiliate.code);
    const conversionRate =
      affiliate.totalClicks > 0
        ? ((affiliate.totalOrders / affiliate.totalClicks) * 100).toFixed(1)
        : "0.0";

    return (
      <div className="space-y-6">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-600/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-purple-300">
            <Link2 size={12} />
            Program Afiliere
          </div>
          <h2 className="text-2xl font-bold text-white">Panoul tău de afiliat</h2>
          <p className="mt-1 text-sm text-gray-400">
            Promovează NOVRA și câștigă {formatCommissionLabel(affiliate)} pentru fiecare comandă atribuită.
          </p>
        </div>

        <div className="rounded-2xl border border-purple-500/20 bg-purple-600/5 p-5">
          <p className="text-xs uppercase tracking-widest text-purple-300">Link-ul tău de afiliat</p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
            <code className="flex-1 break-all rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-purple-200">
              {affiliateLink}
            </code>
            <CopyButton text={affiliateLink} label="Copiază link" className="shrink-0 px-4 py-2" />
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Cod: <span className="font-mono text-gray-300">{affiliate.code}</span> · Fereastră atribuire: 30 zile
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Click-uri", value: affiliate.totalClicks, icon: MousePointerClick },
            { label: "Comenzi", value: affiliate.totalOrders, icon: ShoppingBag },
            { label: "Rată conversie", value: `${conversionRate}%`, icon: CheckCircle },
            { label: "Comision total", value: formatMoney(affiliate.totalCommission), icon: Wallet },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="rounded-xl border border-white/10 bg-novra-card/40 p-4"
              >
                <div className="flex items-center gap-2 text-gray-400">
                  <Icon size={16} />
                  <span className="text-xs">{stat.label}</span>
                </div>
                <p className="mt-2 text-xl font-bold text-white">{stat.value}</p>
              </div>
            );
          })}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
            <p className="text-xs uppercase tracking-widest text-amber-300">Comision în așteptare</p>
            <p className="mt-2 text-2xl font-bold text-amber-200">
              {formatMoney(affiliate.pendingCommission)}
            </p>
          </div>
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <p className="text-xs uppercase tracking-widest text-emerald-300">Comision plătit</p>
            <p className="mt-2 text-2xl font-bold text-emerald-200">
              {formatMoney(affiliate.paidCommission)}
            </p>
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-lg font-semibold text-white">Comenzi atribuite</h3>
          {referrals.length === 0 ? (
            <p className="rounded-xl border border-white/10 bg-novra-card/30 px-4 py-8 text-center text-sm text-gray-400">
              Încă nu ai comenzi atribuite. Distribuie link-ul tău pentru a începe!
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="border-b border-white/10 bg-white/5 text-xs uppercase tracking-wider text-gray-400">
                  <tr>
                    <th className="px-4 py-3">Comandă</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Comision</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {referrals.map((ref) => (
                    <tr key={ref.id} className="border-b border-white/5">
                      <td className="px-4 py-3 font-mono text-xs text-purple-200">
                        {ref.orderPurchaseCode ?? ref.orderId}
                      </td>
                      <td className="px-4 py-3">{formatMoney(ref.orderTotal)}</td>
                      <td className="px-4 py-3 text-emerald-300">{formatMoney(ref.commission)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${
                            ref.status === "paid"
                              ? "bg-emerald-500/15 text-emerald-300"
                              : "bg-amber-500/15 text-amber-300"
                          }`}
                        >
                          {ref.status === "paid" ? "Plătit" : "În așteptare"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400">{formatDate(ref.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (application?.status === "pending") {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Program Afiliere</h2>
          <p className="mt-1 text-sm text-gray-400">Cererea ta este în curs de evaluare.</p>
        </div>
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 text-center">
          <Clock size={40} className="mx-auto text-amber-300" />
          <h3 className="mt-4 text-lg font-semibold text-white">Cerere în așteptare</h3>
          <p className="mt-2 text-sm text-gray-400">
            Am primit cererea ta din {formatDate(application.createdAt)}. Echipa NOVRA o va analiza în curând.
          </p>
        </div>
      </div>
    );
  }

  if (application?.status === "rejected") {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Program Afiliere</h2>
        </div>
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center">
          <XCircle size={40} className="mx-auto text-red-300" />
          <h3 className="mt-4 text-lg font-semibold text-white">Cerere respinsă</h3>
          <p className="mt-2 text-sm text-gray-400">
            {application.adminNote ||
              "Din păcate, cererea ta nu a fost aprobată de această dată. Contactează-ne pentru detalii."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-600/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-purple-300">
          <Link2 size={12} />
          Program Afiliere
        </div>
        <h2 className="text-2xl font-bold text-white">Devino afiliat NOVRA</h2>
        <p className="mt-1 text-sm text-gray-400">
          Câștigă {DEFAULT_AFFILIATE_COMMISSION_RATE}% din valoarea produselor pentru fiecare comandă generată prin
          link-ul tău. Plățile se procesează lunar.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-novra-card/30 p-5">
        <h3 className="font-semibold text-white">Cum funcționează</h3>
        <ol className="mt-3 space-y-2 text-sm text-gray-400">
          <li>1. Aplici și aștepți aprobarea echipei NOVRA</li>
          <li>2. Primești un link unic de afiliat (ex: novra.ro/?ref=CODUL_TAU)</li>
          <li>3. Distribui link-ul — vizitatorii au 30 zile pentru a cumpăra</li>
          <li>4. Primești comision pentru fiecare comandă finalizată</li>
        </ol>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-white/10 bg-novra-card/30 p-5">
        <h3 className="font-semibold text-white">Cerințe de eligibilitate</h3>
        <p className="text-sm text-gray-400">Confirmă că îndeplinești toate condițiile:</p>

        <div className="space-y-3">
          {AFFILIATE_REQUIREMENT_KEYS.map((key) => (
            <label
              key={key}
              className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 transition hover:border-purple-500/30"
            >
              <input
                type="checkbox"
                checked={requirements[key]}
                onChange={(e) =>
                  setRequirements((prev) => ({ ...prev, [key]: e.target.checked }))
                }
                className="mt-0.5 h-4 w-4 rounded border-white/20 bg-transparent text-purple-500 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-300">{AFFILIATE_REQUIREMENT_LABELS[key]}</span>
            </label>
          ))}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-500 disabled:opacity-50"
        >
          {submitting ? "Se trimite..." : "Trimite cererea"}
        </button>
      </form>
    </div>
  );
}
