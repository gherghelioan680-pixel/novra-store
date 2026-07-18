"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Coins, Gift, CheckCircle, Clock, Pencil, RefreshCw, Save, Trash2 } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import { requireAdmin } from "@/lib/auth";
import {
  adminAdjustUserCredits,
  adminDeleteCreditPurchase,
  adminDeleteCreditTransaction,
  adminManualCreditPurchase,
  adminRevokeCreditPurchase,
  adminUpdateCreditPurchase,
  adminUpdateCreditTransaction,
  CREDIT_TRANSACTION_LABELS,
  loadAllCreditPurchasesAdmin,
  loadAllCreditTransactionsAdmin,
  type CreditPurchaseClient,
  type CreditTransactionClient,
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

type AdminTab = "purchases" | "transactions" | "adjust";

export default function AdminCreditePage() {
  const admin = requireAdmin();
  const [activeTab, setActiveTab] = useState<AdminTab>("purchases");
  const [purchases, setPurchases] = useState<CreditPurchaseClient[]>([]);
  const [transactions, setTransactions] = useState<CreditTransactionClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [editingPurchaseId, setEditingPurchaseId] = useState<string | null>(null);
  const [purchaseNote, setPurchaseNote] = useState("");
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  const [transactionDesc, setTransactionDesc] = useState("");
  const [adjustEmail, setAdjustEmail] = useState("");
  const [adjustDelta, setAdjustDelta] = useState("");
  const [adjustReason, setAdjustReason] = useState("");

  const refresh = async () => {
    const [purchaseData, transactionData] = await Promise.all([
      loadAllCreditPurchasesAdmin(),
      loadAllCreditTransactionsAdmin(),
    ]);
    setPurchases(purchaseData);
    setTransactions(transactionData);
    setLoading(false);
  };

  useEffect(() => {
    return createStoreRefreshEffect(refresh, { scopes: ["credits", "users"] });
  }, []);

  if (!admin) return null;

  const showMessage = (text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(""), 4000);
  };

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
    showMessage(result.ok ? "Credite încărcate manual." : (result.message ?? "Eroare."));
    if (result.ok) await refresh();
  };

  const handleRevoke = async (purchaseId: string) => {
    if (!confirm("Revoci această achiziție și retragi creditele (dacă au fost încărcate)?")) return;
    setActionId(purchaseId);
    const result = await adminRevokeCreditPurchase(purchaseId, "Revocare admin");
    setActionId(null);
    showMessage(result.ok ? "Achiziție revocată." : (result.message ?? "Eroare."));
    if (result.ok) await refresh();
  };

  const handleDeletePurchase = async (purchaseId: string) => {
    if (!confirm("Ștergi această achiziție?")) return;
    setActionId(purchaseId);
    const result = await adminDeleteCreditPurchase(purchaseId);
    setActionId(null);
    showMessage(result.ok ? "Achiziție ștearsă." : (result.message ?? "Eroare."));
    if (result.ok) await refresh();
  };

  const handleSavePurchaseNote = async (purchaseId: string) => {
    setActionId(purchaseId);
    const result = await adminUpdateCreditPurchase(purchaseId, { adminNote: purchaseNote });
    setActionId(null);
    if (!result.ok) {
      showMessage(result.message ?? "Eroare.");
      return;
    }
    setEditingPurchaseId(null);
    await refresh();
    showMessage("Achiziție actualizată.");
  };

  const handleSaveTransaction = async (transactionId: string) => {
    setActionId(transactionId);
    const result = await adminUpdateCreditTransaction(transactionId, transactionDesc);
    setActionId(null);
    if (!result.ok) {
      showMessage(result.message ?? "Eroare.");
      return;
    }
    setEditingTransactionId(null);
    await refresh();
    showMessage("Tranzacție actualizată.");
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    if (!confirm("Ștergi această tranzacție din istoric?")) return;
    setActionId(transactionId);
    const result = await adminDeleteCreditTransaction(transactionId);
    setActionId(null);
    showMessage(result.ok ? "Tranzacție ștearsă." : (result.message ?? "Eroare."));
    if (result.ok) await refresh();
  };

  const handleAdjustCredits = async (e: React.FormEvent) => {
    e.preventDefault();
    const delta = Number(adjustDelta);
    if (!adjustEmail.trim() || !Number.isFinite(delta) || delta === 0) {
      showMessage("Introdu email valid și o sumă diferită de 0.");
      return;
    }
    setActionId("adjust");
    const result = await adminAdjustUserCredits(adjustEmail.trim(), delta, adjustReason.trim() || undefined);
    setActionId(null);
    showMessage(result.ok ? "Credite ajustate." : (result.message ?? "Eroare."));
    if (result.ok) {
      setAdjustDelta("");
      setAdjustReason("");
      await refresh();
    }
  };

  const stats = {
    total: purchases.length,
    credited: purchases.filter((p) => p.status === "credited").length,
    pending: purchases.filter((p) => p.status === "pending").length,
    revenue: purchases
      .filter((p) => p.status === "credited" || p.status === "paid")
      .reduce((sum, p) => sum + p.amount, 0),
  };

  const tabs: { id: AdminTab; label: string }[] = [
    { id: "purchases", label: "Achiziții Gift Card" },
    { id: "transactions", label: "Tranzacții" },
    { id: "adjust", label: "Ajustare credite" },
  ];

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

      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-xl px-4 py-2.5 text-sm font-medium transition ${
              activeTab === tab.id
                ? "bg-purple-600 text-white"
                : "border border-white/10 bg-novra-card/30 text-gray-400 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => void refresh()}
          className="ml-auto inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-gray-400 hover:text-white"
        >
          <RefreshCw size={14} />
          Reîmprospătează
        </button>
      </div>

      {activeTab === "purchases" && (
        <>
          {loading ? (
            <p className="text-sm text-gray-500">Se încarcă...</p>
          ) : purchases.length === 0 ? (
            <p className="rounded-xl border border-white/10 bg-novra-card/30 px-4 py-8 text-center text-sm text-gray-500">
              Nicio achiziție de credite încă.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead className="border-b border-white/10 bg-novra-card/40 text-xs uppercase tracking-widest text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Data</th>
                    <th className="px-4 py-3">Client</th>
                    <th className="px-4 py-3">Sumă</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Notă admin</th>
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
                      <td className="px-4 py-3 text-xs text-gray-500 max-w-[160px]">
                        {editingPurchaseId === purchase.id ? (
                          <input
                            value={purchaseNote}
                            onChange={(e) => setPurchaseNote(e.target.value)}
                            className="w-full rounded border border-white/10 bg-novra-bg/50 px-2 py-1 text-xs"
                          />
                        ) : (
                          purchase.adminNote ?? "—"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {editingPurchaseId === purchase.id ? (
                            <>
                              <button
                                type="button"
                                disabled={actionId === purchase.id}
                                onClick={() => void handleSavePurchaseNote(purchase.id)}
                                className="rounded-lg bg-purple-600 px-2 py-1 text-xs text-white"
                              >
                                <Save size={12} className="inline" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingPurchaseId(null)}
                                className="rounded-lg border border-white/10 px-2 py-1 text-xs text-gray-400"
                              >
                                Anulează
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingPurchaseId(purchase.id);
                                  setPurchaseNote(purchase.adminNote ?? "");
                                }}
                                className="rounded-lg border border-white/10 px-2 py-1 text-xs text-gray-300"
                              >
                                <Pencil size={12} className="inline" />
                              </button>
                              {purchase.status !== "credited" && purchase.status !== "revoked" && (
                                <button
                                  type="button"
                                  disabled={actionId === purchase.id}
                                  onClick={() => void handleManualCredit(purchase.id)}
                                  className="rounded-lg bg-purple-600/20 px-2 py-1 text-xs text-purple-200 disabled:opacity-50"
                                >
                                  Credit manual
                                </button>
                              )}
                              {purchase.status !== "revoked" && (
                                <button
                                  type="button"
                                  disabled={actionId === purchase.id}
                                  onClick={() => void handleRevoke(purchase.id)}
                                  className="rounded-lg bg-red-500/10 px-2 py-1 text-xs text-red-300 disabled:opacity-50"
                                >
                                  Revocă
                                </button>
                              )}
                              <button
                                type="button"
                                disabled={actionId === purchase.id}
                                onClick={() => void handleDeletePurchase(purchase.id)}
                                className="rounded-lg border border-red-500/20 px-2 py-1 text-xs text-red-300 disabled:opacity-50"
                              >
                                <Trash2 size={12} className="inline" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {activeTab === "transactions" && (
        <>
          {loading ? (
            <p className="text-sm text-gray-500">Se încarcă...</p>
          ) : transactions.length === 0 ? (
            <p className="rounded-xl border border-white/10 bg-novra-card/30 px-4 py-8 text-center text-sm text-gray-500">
              Nicio tranzacție încă.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead className="border-b border-white/10 bg-novra-card/40 text-xs uppercase tracking-widest text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Data</th>
                    <th className="px-4 py-3">Client</th>
                    <th className="px-4 py-3">Tip</th>
                    <th className="px-4 py-3">Sumă</th>
                    <th className="px-4 py-3">Sold după</th>
                    <th className="px-4 py-3">Descriere</th>
                    <th className="px-4 py-3">Acțiuni</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-white/5">
                      <td className="px-4 py-3 text-xs text-gray-500">{formatDate(tx.createdAt)}</td>
                      <td className="px-4 py-3 text-purple-300">{tx.userEmail}</td>
                      <td className="px-4 py-3 text-xs">{CREDIT_TRANSACTION_LABELS[tx.type]}</td>
                      <td className={`px-4 py-3 font-semibold ${tx.amount >= 0 ? "text-emerald-300" : "text-red-300"}`}>
                        {tx.amount >= 0 ? "+" : ""}{tx.amount}
                      </td>
                      <td className="px-4 py-3">{tx.balanceAfter}</td>
                      <td className="px-4 py-3 text-xs text-gray-400 max-w-[200px]">
                        {editingTransactionId === tx.id ? (
                          <input
                            value={transactionDesc}
                            onChange={(e) => setTransactionDesc(e.target.value)}
                            className="w-full rounded border border-white/10 bg-novra-bg/50 px-2 py-1 text-xs"
                          />
                        ) : (
                          tx.description
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {editingTransactionId === tx.id ? (
                            <>
                              <button
                                type="button"
                                disabled={actionId === tx.id}
                                onClick={() => void handleSaveTransaction(tx.id)}
                                className="rounded-lg bg-purple-600 px-2 py-1 text-xs text-white"
                              >
                                Salvează
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingTransactionId(null)}
                                className="rounded-lg border border-white/10 px-2 py-1 text-xs text-gray-400"
                              >
                                Anulează
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingTransactionId(tx.id);
                                  setTransactionDesc(tx.description);
                                }}
                                className="rounded-lg border border-white/10 px-2 py-1 text-xs text-gray-300"
                              >
                                <Pencil size={12} className="inline" />
                              </button>
                              <button
                                type="button"
                                disabled={actionId === tx.id}
                                onClick={() => void handleDeleteTransaction(tx.id)}
                                className="rounded-lg border border-red-500/20 px-2 py-1 text-xs text-red-300"
                              >
                                <Trash2 size={12} className="inline" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {activeTab === "adjust" && (
        <form
          onSubmit={(e) => void handleAdjustCredits(e)}
          className="max-w-xl rounded-2xl border border-purple-500/20 bg-novra-card/40 p-5 sm:p-6"
        >
          <h3 className="mb-4 text-lg font-semibold text-white">Ajustare manuală credite</h3>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs text-gray-500">Email client</label>
              <input
                type="email"
                required
                value={adjustEmail}
                onChange={(e) => setAdjustEmail(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-2.5 text-sm text-white"
                placeholder="client@example.com"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">Sumă (+ adaugă, − retrage)</label>
              <input
                type="number"
                required
                value={adjustDelta}
                onChange={(e) => setAdjustDelta(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-2.5 text-sm text-white"
                placeholder="10 sau -5"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">Motiv (opțional)</label>
              <input
                type="text"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-2.5 text-sm text-white"
                placeholder="Compensare, bonus manual..."
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={actionId === "adjust"}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            <Save size={16} />
            Aplică ajustare
          </button>
        </form>
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
