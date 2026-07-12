"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Coins, RefreshCw, Gift, CheckCircle, Clock } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import { requireAdmin } from "@/lib/auth";
import {
  loadAllCreditPurchasesAdmin,
  adminManualCreditPurchase,
  adminRevokeCreditPurchase,
  type CreditPurchaseClient,
} from "@/lib/credits";
import { createStoreRefreshEffect } from "@/lib/store";

const STATUS_LABELS: Record<CreditPurchaseClient["status"], string> = {
  pending: "În așteptare",
  paid: "Plătit",
  credited: "Creditat",
  failed: "Eșuat",
  revoked: "Revocat",
};

const STATUS_COLORS: Record<CreditPurchaseClient["status"], string> = {
  pending: "bg-yellow-500/15 text-yellow-300",
  paid: "bg-blue-500/15 text-blue-300",
  credited: "bg-emerald-500/15 text-emerald-300",
  failed: "bg-red-500/15 text-red-300",
  revoked: "bg-gray-500/15 text-gray-400",
};

export default function AdminCreditePage() {
  const admin = requireAdmin();
  const [purchases, setPurchases] = useState<CreditPurchaseClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const refresh = async () => {
    const data = await loadAllCreditPurchasesAdmin();
    setPurchases(data);
    setLoading(false);
  };

  useEffect(() => {
    return createStoreRefreshEffect(refresh, { scopes: ["credits", "users"] });
  }, []);

  if (!admin) return null;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("ro-RO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const handleManualCredit = async (purchaseId: string) => {
    setActionId(purchaseId);
    const result = await adminManualCreditPurchase(purchaseId, "Credit manual admin");
    setActionId(null);
    setMessage(result.ok ? "Credite încărcate manual." : (result.message ?? "Eroare."));
    if (result.ok) await refresh();
  };

  const handleRevoke = async (purchaseId: string) => {
    if (!confirm("Revoci această achiziție și retragi creditele (dacă au fost încărcate)?")) return;
    setActionId(purchaseId);
    const result = await adminRevokeCreditPurchase(purchaseId, "Revocare admin");
    setActionId(null);
    setMessage(result.ok ? "Achiziție revocată." : (result.message ?? "Eroare."));
    if (result.ok) await refresh();
  };

  const stats = {
    total: purchases.length,
    credited: purchases.filter((p) => p.status === "credited").length,
    pending: purchases.filter((p) => p.status === "pending").length,
    revenue: purchases
      .filter((p) => p.status === "credited" || p.status === "paid")
      .reduce((sum, p) => sum + p.amount, 0),
  };

  return (
    <div>
      <AdminHeader
        user={admin}
        title="Gift Cards & Credite"
        subtitle="Achiziții NovraCredits și gestionare plăți Stripe"
      />

      {message && (
        <div className="mb-6 rounded-xl border border-purple-500/30 bg-purple-600/10 px-4 py-3 text-sm text-purple-200">
          {message}
        </div>
      )}

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total achiziții" value={String(stats.total)} icon={Gift} />
        <StatCard label="Creditate" value={String(stats.credited)} icon={CheckCircle} />
        <StatCard label="În așteptare" value={String(stats.pending)} icon={Clock} />
        <StatCard label="Valoare creditată" value={`${stats.revenue} Lei`} icon={Coins} />
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold text-white">Toate achizițiile</h2>
        <button
          type="button"
          onClick={() => refresh()}
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-gray-400 hover:text-white"
        >
          <RefreshCw size={14} />
          Reîmprospătează
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Se încarcă...</p>
      ) : purchases.length === 0 ? (
        <p className="rounded-xl border border-white/10 bg-novra-card/30 px-4 py-8 text-center text-sm text-gray-500">
          Nicio achiziție de credite încă.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-white/10 bg-novra-card/40 text-xs uppercase tracking-widest text-gray-500">
              <tr>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Sumă</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Stripe Session</th>
                <th className="px-4 py-3">Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((purchase) => (
                <tr key={purchase.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-gray-400">{formatDate(purchase.createdAt)}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/clienti/${encodeURIComponent(purchase.userEmail)}`}
                      className="text-purple-300 hover:underline"
                    >
                      {purchase.userEmail}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-semibold text-white">{purchase.amount} Lei</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_COLORS[purchase.status]}`}>
                      {STATUS_LABELS[purchase.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-[10px] text-gray-500">
                    {purchase.stripeSessionId?.slice(0, 20) ?? "—"}...
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {purchase.status !== "credited" && purchase.status !== "revoked" && (
                        <button
                          type="button"
                          disabled={actionId === purchase.id}
                          onClick={() => handleManualCredit(purchase.id)}
                          className="rounded-lg bg-purple-600/20 px-2 py-1 text-xs text-purple-200 hover:bg-purple-600/30 disabled:opacity-50"
                        >
                          Credit manual
                        </button>
                      )}
                      {purchase.status !== "revoked" && (
                        <button
                          type="button"
                          disabled={actionId === purchase.id}
                          onClick={() => handleRevoke(purchase.id)}
                          className="rounded-lg bg-red-500/10 px-2 py-1 text-xs text-red-300 hover:bg-red-500/20 disabled:opacity-50"
                        >
                          Revocă
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-6 text-xs text-gray-500">
        Pentru cupoane de reducere, vezi{" "}
        <Link href="/admin/coduri-reducere" className="text-purple-400 hover:underline">
          Coduri reducere
        </Link>
        .
      </p>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-novra-card/30 p-4">
      <div className="mb-2 flex items-center gap-2 text-gray-500">
        <Icon size={16} />
        <span className="text-xs uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
