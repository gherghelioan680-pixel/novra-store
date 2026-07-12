"use client";

import { useEffect, useState } from "react";
import {
  Check,
  Link2,
  MousePointerClick,
  Plus,
  RefreshCw,
  ShoppingBag,
  Trash2,
  Wallet,
  Wand2,
  X,
} from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import CopyButton from "@/components/CopyButton";
import { requireAdmin } from "@/lib/auth";
import {
  buildAffiliateLink,
  DEFAULT_AFFILIATE_COMMISSION_RATE,
  formatCommissionLabel,
  generateAffiliateCode,
  type Affiliate,
  type AffiliateApplication,
  type AffiliateReferral,
  type AffiliateStatus,
} from "@/lib/affiliates-types";
import {
  adjustReferralCommissionAdmin,
  createAffiliateAdmin,
  deleteAffiliateAdmin,
  loadAffiliatesAdmin,
  markReferralPaidAdmin,
  reviewApplicationAdmin,
  updateAffiliateAdmin,
} from "@/lib/affiliates";
import { createStoreRefreshEffect } from "@/lib/store";

type CreateForm = {
  userEmail: string;
  name: string;
  code: string;
  status: AffiliateStatus;
  commissionRate: string;
  fixedCommission: string;
  adminNote: string;
};

const defaultCreateForm = (): CreateForm => ({
  userEmail: "",
  name: "",
  code: "",
  status: "active",
  commissionRate: String(DEFAULT_AFFILIATE_COMMISSION_RATE),
  fixedCommission: "",
  adminNote: "",
});

export default function AdminAfiliatiPage() {
  const admin = requireAdmin();
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [applications, setApplications] = useState<AffiliateApplication[]>([]);
  const [referrals, setReferrals] = useState<AffiliateReferral[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [createForm, setCreateForm] = useState<CreateForm>(defaultCreateForm);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Affiliate>>({});
  const [actionId, setActionId] = useState<string | null>(null);
  const [selectedAffiliateId, setSelectedAffiliateId] = useState<string | null>(null);

  const refresh = async () => {
    const data = await loadAffiliatesAdmin();
    if (data) {
      setAffiliates(data.affiliates);
      setApplications(data.applications);
      setReferrals(data.referrals);
    }
    setLoading(false);
  };

  useEffect(() => {
    return createStoreRefreshEffect(refresh, { scopes: ["affiliates"] });
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

  const formatMoney = (value: number) => `${value.toFixed(2)} RON`;

  const pendingApplications = applications.filter((a) => a.status === "pending");

  const stats = {
    affiliates: affiliates.length,
    active: affiliates.filter((a) => a.status === "active").length,
    clicks: affiliates.reduce((s, a) => s + a.totalClicks, 0),
    orders: affiliates.reduce((s, a) => s + a.totalOrders, 0),
    pendingCommission: affiliates.reduce((s, a) => s + a.pendingCommission, 0),
    paidCommission: affiliates.reduce((s, a) => s + a.paidCommission, 0),
  };

  const selectedReferrals = selectedAffiliateId
    ? referrals.filter((r) => r.affiliateId === selectedAffiliateId)
    : referrals.slice(0, 20);

  const handleGenerateCode = () => {
    const code = generateAffiliateCode(
      affiliates.map((a) => a.code),
      createForm.name
    );
    setCreateForm((prev) => ({ ...prev, code }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    const result = await createAffiliateAdmin({
      userEmail: createForm.userEmail,
      name: createForm.name,
      code: createForm.code || undefined,
      status: createForm.status,
      commissionRate: createForm.commissionRate ? Number(createForm.commissionRate) : undefined,
      fixedCommission: createForm.fixedCommission ? Number(createForm.fixedCommission) : undefined,
      adminNote: createForm.adminNote || undefined,
    });
    setCreating(false);

    if (!result.ok) {
      showMessage(result.message);
      return;
    }

    setCreateForm(defaultCreateForm());
    await refresh();
    showMessage(`Afiliat ${result.affiliate.code} creat.`);
  };

  const handleApprove = async (applicationId: string) => {
    setActionId(applicationId);
    const result = await reviewApplicationAdmin({ applicationId, status: "approved" });
    setActionId(null);
    showMessage(result.ok ? "Cerere aprobată." : result.message);
    if (result.ok) await refresh();
  };

  const handleReject = async (applicationId: string) => {
    const note = window.prompt("Motiv respingere (opțional):");
    setActionId(applicationId);
    const result = await reviewApplicationAdmin({
      applicationId,
      status: "rejected",
      adminNote: note ?? undefined,
    });
    setActionId(null);
    showMessage(result.ok ? "Cerere respinsă." : result.message);
    if (result.ok) await refresh();
  };

  const startEdit = (affiliate: Affiliate) => {
    setEditingId(affiliate.id);
    setEditForm({
      name: affiliate.name,
      code: affiliate.code,
      status: affiliate.status,
      commissionRate: affiliate.commissionRate,
      fixedCommission: affiliate.fixedCommission,
      adminNote: affiliate.adminNote,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    setActionId(editingId);
    const result = await updateAffiliateAdmin(editingId, editForm);
    setActionId(null);

    if (!result.ok) {
      showMessage(result.message);
      return;
    }

    setEditingId(null);
    await refresh();
    showMessage("Afiliat actualizat.");
  };

  const handleDelete = async (affiliateId: string, code: string) => {
    if (!window.confirm(`Ștergi afiliatul ${code}?`)) return;
    setActionId(affiliateId);
    const result = await deleteAffiliateAdmin(affiliateId);
    setActionId(null);
    showMessage(result.ok ? "Afiliat șters." : result.message);
    if (result.ok) await refresh();
  };

  const handleMarkPaid = async (referral: AffiliateReferral) => {
    const adjusted = window.prompt(
      `Marchezi comisionul ca plătit (${referral.commission} RON). Ajustează suma (opțional):`,
      String(referral.commission)
    );
    if (adjusted === null) return;

    setActionId(referral.id);
    const commission = adjusted.trim() ? Number(adjusted) : undefined;
    const result = await markReferralPaidAdmin(referral.id, { commission });
    setActionId(null);
    showMessage(result.ok ? "Comision marcat ca plătit." : result.message);
    if (result.ok) await refresh();
  };

  const handleAdjustCommission = async (referral: AffiliateReferral) => {
    const value = window.prompt("Nou comision (RON):", String(referral.commission));
    if (!value) return;
    const commission = Number(value);
    if (!Number.isFinite(commission)) return;

    setActionId(referral.id);
    const result = await adjustReferralCommissionAdmin(referral.id, commission);
    setActionId(null);
    showMessage(result.ok ? "Comision ajustat." : result.message);
    if (result.ok) await refresh();
  };

  return (
    <div>
      <AdminHeader
        user={admin}
        title="Program Afiliere"
        subtitle={`Comision implicit: ${DEFAULT_AFFILIATE_COMMISSION_RATE}% din subtotal produse · Fereastră atribuire: 30 zile`}
      />

      {message && (
        <div className="mb-6 rounded-xl border border-purple-500/30 bg-purple-600/10 px-4 py-3 text-sm text-purple-200">
          {message}
        </div>
      )}

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {[
          { label: "Afiliați", value: stats.affiliates, icon: Link2 },
          { label: "Activi", value: stats.active, icon: Check },
          { label: "Click-uri", value: stats.clicks, icon: MousePointerClick },
          { label: "Comenzi", value: stats.orders, icon: ShoppingBag },
          { label: "De plătit", value: formatMoney(stats.pendingCommission), icon: Wallet },
          { label: "Plătit", value: formatMoney(stats.paidCommission), icon: Wallet },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-xl border border-white/10 bg-novra-card/40 p-4">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Icon size={14} />
                {stat.label}
              </div>
              <p className="mt-2 text-lg font-bold text-white">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {pendingApplications.length > 0 && (
        <section className="mb-8 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
          <h2 className="mb-4 text-lg font-semibold text-white">
            Cereri în așteptare ({pendingApplications.length})
          </h2>
          <div className="space-y-3">
            {pendingApplications.map((app) => (
              <div
                key={app.id}
                className="flex flex-col gap-3 rounded-xl border border-white/10 bg-black/20 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-white">{app.name}</p>
                  <p className="text-sm text-gray-400">{app.userEmail}</p>
                  <p className="text-xs text-gray-500">{formatDate(app.createdAt)}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={actionId === app.id}
                    onClick={() => handleApprove(app.id)}
                    className="rounded-lg bg-emerald-600/20 px-3 py-1.5 text-xs text-emerald-300 transition hover:bg-emerald-600/30 disabled:opacity-50"
                  >
                    Aprobă
                  </button>
                  <button
                    type="button"
                    disabled={actionId === app.id}
                    onClick={() => handleReject(app.id)}
                    className="rounded-lg bg-red-600/20 px-3 py-1.5 text-xs text-red-300 transition hover:bg-red-600/30 disabled:opacity-50"
                  >
                    Respinge
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-novra-card/30 p-5">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <Plus size={18} />
            Creează afiliat manual
          </h2>
          <form onSubmit={handleCreate} className="space-y-3">
            <input
              type="email"
              required
              placeholder="Email client"
              value={createForm.userEmail}
              onChange={(e) => setCreateForm((p) => ({ ...p, userEmail: e.target.value }))}
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-sm text-white placeholder:text-gray-500"
            />
            <input
              type="text"
              required
              placeholder="Nume afiliat"
              value={createForm.name}
              onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-sm text-white placeholder:text-gray-500"
            />
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Cod (opțional)"
                value={createForm.code}
                onChange={(e) => setCreateForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                className="flex-1 rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-sm font-mono text-white placeholder:text-gray-500"
              />
              <button
                type="button"
                onClick={handleGenerateCode}
                className="rounded-xl border border-white/10 bg-white/5 px-3 text-gray-300 hover:text-white"
                title="Generează cod"
              >
                <Wand2 size={16} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                min={0}
                max={100}
                step={0.5}
                placeholder={`Comision % (implicit ${DEFAULT_AFFILIATE_COMMISSION_RATE})`}
                value={createForm.commissionRate}
                onChange={(e) => setCreateForm((p) => ({ ...p, commissionRate: e.target.value }))}
                className="rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-sm text-white"
              />
              <input
                type="number"
                min={0}
                step={1}
                placeholder="Sau fix RON/comandă"
                value={createForm.fixedCommission}
                onChange={(e) => setCreateForm((p) => ({ ...p, fixedCommission: e.target.value }))}
                className="rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-sm text-white"
              />
            </div>
            <select
              value={createForm.status}
              onChange={(e) =>
                setCreateForm((p) => ({ ...p, status: e.target.value as AffiliateStatus }))
              }
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-sm text-white"
            >
              <option value="active">Activ</option>
              <option value="inactive">Inactiv</option>
            </select>
            <button
              type="submit"
              disabled={creating}
              className="w-full rounded-xl bg-purple-600 py-2.5 text-sm font-semibold text-white hover:bg-purple-500 disabled:opacity-50"
            >
              {creating ? "Se creează..." : "Creează afiliat"}
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-white/10 bg-novra-card/30 p-5">
          <h2 className="mb-2 text-lg font-semibold text-white">Structură comision</h2>
          <div className="space-y-2 text-sm text-gray-400">
            <p>
              <strong className="text-purple-300">Implicit:</strong> {DEFAULT_AFFILIATE_COMMISSION_RATE}% din
              subtotalul produselor (total comandă minus transport).
            </p>
            <p>
              <strong className="text-purple-300">Personalizat:</strong> rată % sau sumă fixă RON per comandă per
              afiliat.
            </p>
            <p>
              <strong className="text-purple-300">Link:</strong> https://www.novra.ro/?ref=COD
            </p>
            <p>
              <strong className="text-purple-300">Atribuire:</strong> cookie 30 zile, idempotent per orderId.
            </p>
          </div>
        </section>
      </div>

      <section className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Afiliați ({affiliates.length})</h2>
          <button
            type="button"
            onClick={() => void refresh()}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-white"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Reîmprospătează
          </button>
        </div>

        {affiliates.length === 0 ? (
          <p className="rounded-xl border border-white/10 px-4 py-8 text-center text-sm text-gray-400">
            Niciun afiliat încă.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-white/10 bg-white/5 text-xs uppercase tracking-wider text-gray-400">
                <tr>
                  <th className="px-4 py-3">Afiliat</th>
                  <th className="px-4 py-3">Cod / Link</th>
                  <th className="px-4 py-3">Comision</th>
                  <th className="px-4 py-3">Click-uri</th>
                  <th className="px-4 py-3">Comenzi</th>
                  <th className="px-4 py-3">În așteptare</th>
                  <th className="px-4 py-3">Plătit</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {affiliates.map((affiliate) => {
                  const link = buildAffiliateLink(affiliate.code);
                  const isEditing = editingId === affiliate.id;

                  return (
                    <tr
                      key={affiliate.id}
                      className={`border-b border-white/5 ${selectedAffiliateId === affiliate.id ? "bg-purple-600/5" : ""}`}
                    >
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input
                            value={editForm.name ?? ""}
                            onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                            className="w-full rounded border border-white/10 bg-black/20 px-2 py-1 text-sm"
                          />
                        ) : (
                          <>
                            <p className="font-medium text-white">{affiliate.name}</p>
                            <p className="text-xs text-gray-500">{affiliate.userEmail}</p>
                          </>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input
                            value={editForm.code ?? ""}
                            onChange={(e) =>
                              setEditForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))
                            }
                            className="w-28 rounded border border-white/10 bg-black/20 px-2 py-1 font-mono text-xs"
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <code className="text-xs text-purple-300">{affiliate.code}</code>
                            <CopyButton text={link} />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {isEditing ? (
                          <div className="flex gap-1">
                            <input
                              type="number"
                              placeholder="%"
                              value={editForm.commissionRate ?? ""}
                              onChange={(e) =>
                                setEditForm((p) => ({
                                  ...p,
                                  commissionRate: e.target.value ? Number(e.target.value) : undefined,
                                }))
                              }
                              className="w-14 rounded border border-white/10 bg-black/20 px-1 py-1 text-xs"
                            />
                            <input
                              type="number"
                              placeholder="RON"
                              value={editForm.fixedCommission ?? ""}
                              onChange={(e) =>
                                setEditForm((p) => ({
                                  ...p,
                                  fixedCommission: e.target.value ? Number(e.target.value) : undefined,
                                }))
                              }
                              className="w-14 rounded border border-white/10 bg-black/20 px-1 py-1 text-xs"
                            />
                          </div>
                        ) : (
                          formatCommissionLabel(affiliate)
                        )}
                      </td>
                      <td className="px-4 py-3">{affiliate.totalClicks}</td>
                      <td className="px-4 py-3">{affiliate.totalOrders}</td>
                      <td className="px-4 py-3 text-amber-300">{formatMoney(affiliate.pendingCommission)}</td>
                      <td className="px-4 py-3 text-emerald-300">{formatMoney(affiliate.paidCommission)}</td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <select
                            value={editForm.status ?? "active"}
                            onChange={(e) =>
                              setEditForm((p) => ({ ...p, status: e.target.value as AffiliateStatus }))
                            }
                            className="rounded border border-white/10 bg-black/20 px-2 py-1 text-xs"
                          >
                            <option value="active">Activ</option>
                            <option value="inactive">Inactiv</option>
                          </select>
                        ) : (
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs ${
                              affiliate.status === "active"
                                ? "bg-emerald-500/15 text-emerald-300"
                                : "bg-gray-500/15 text-gray-400"
                            }`}
                          >
                            {affiliate.status === "active" ? "Activ" : "Inactiv"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {isEditing ? (
                            <>
                              <button
                                type="button"
                                onClick={handleSaveEdit}
                                disabled={actionId === affiliate.id}
                                className="rounded p-1 text-emerald-400 hover:bg-white/5"
                              >
                                <Check size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingId(null)}
                                className="rounded p-1 text-gray-400 hover:bg-white/5"
                              >
                                <X size={14} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => startEdit(affiliate)}
                                className="rounded px-2 py-1 text-xs text-purple-300 hover:bg-white/5"
                              >
                                Editează
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedAffiliateId(
                                    selectedAffiliateId === affiliate.id ? null : affiliate.id
                                  )
                                }
                                className="rounded px-2 py-1 text-xs text-gray-400 hover:bg-white/5"
                              >
                                Referrals
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(affiliate.id, affiliate.code)}
                                disabled={actionId === affiliate.id}
                                className="rounded p-1 text-red-400 hover:bg-white/5 disabled:opacity-50"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-white">
          Referrals recente {selectedAffiliateId ? "(filtrat)" : ""}
        </h2>
        {selectedReferrals.length === 0 ? (
          <p className="rounded-xl border border-white/10 px-4 py-8 text-center text-sm text-gray-400">
            Niciun referral încă.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="border-b border-white/10 bg-white/5 text-xs uppercase tracking-wider text-gray-400">
                <tr>
                  <th className="px-4 py-3">Afiliat</th>
                  <th className="px-4 py-3">Comandă</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Comision</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {selectedReferrals.map((ref) => {
                  const aff = affiliates.find((a) => a.id === ref.affiliateId);
                  return (
                    <tr key={ref.id} className="border-b border-white/5">
                      <td className="px-4 py-3">
                        <span className="text-purple-300">{aff?.code ?? ref.affiliateCode}</span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
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
                      <td className="px-4 py-3 text-xs text-gray-400">{formatDate(ref.createdAt)}</td>
                      <td className="px-4 py-3">
                        {ref.status === "pending" && (
                          <div className="flex gap-1">
                            <button
                              type="button"
                              disabled={actionId === ref.id}
                              onClick={() => handleMarkPaid(ref)}
                              className="rounded px-2 py-1 text-xs text-emerald-300 hover:bg-white/5 disabled:opacity-50"
                            >
                              Plătit
                            </button>
                            <button
                              type="button"
                              disabled={actionId === ref.id}
                              onClick={() => handleAdjustCommission(ref)}
                              className="rounded px-2 py-1 text-xs text-gray-400 hover:bg-white/5 disabled:opacity-50"
                            >
                              Ajustează
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
