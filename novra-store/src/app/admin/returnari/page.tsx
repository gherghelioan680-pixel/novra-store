"use client";

import { useEffect, useState } from "react";
import { Eye, Pencil, Save, Trash2, X } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import { requireAdmin } from "@/lib/auth";
import { getApiHeaders } from "@/lib/api-client";
import {
  LEGACY_RETURN_REASON_LABELS,
  RETURN_STATUS_LABELS,
  resolveReturnReasonKey,
  type ReturnRequest,
  type ReturnStatus,
} from "@/lib/returns-types";
import { createStoreRefreshEffect, dispatchStoreUpdate } from "@/lib/store";

const STATUS_OPTIONS: ReturnStatus[] = ["pending", "approved", "rejected", "completed"];

type EditForm = {
  status: ReturnStatus;
  adminNote: string;
  refundAmount: string;
};

export default function AdminReturnariPage() {
  const admin = requireAdmin();
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [message, setMessage] = useState("");
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [viewItem, setViewItem] = useState<ReturnRequest | null>(null);
  const [editingItem, setEditingItem] = useState<ReturnRequest | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    status: "pending",
    adminNote: "",
    refundAmount: "",
  });

  const refreshReturns = async () => {
    const response = await fetch("/api/store/returns", { headers: getApiHeaders() });
    if (!response.ok) return;
    const data = (await response.json()) as { returns?: ReturnRequest[] };
    setReturns(data.returns ?? []);
  };

  useEffect(() => {
    return createStoreRefreshEffect(refreshReturns, { scopes: ["returns"] });
  }, []);

  if (!admin) return null;

  const showMessage = (text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(""), 4000);
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString("ro-RO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const reasonLabel = (reason: string) => {
    const key = resolveReturnReasonKey(reason);
    return key ? LEGACY_RETURN_REASON_LABELS[key] : reason;
  };

  const startEdit = (item: ReturnRequest) => {
    setEditingItem(item);
    setViewItem(null);
    setEditForm({
      status: item.status,
      adminNote: item.adminNote ?? "",
      refundAmount: item.refundAmount !== undefined ? String(item.refundAmount) : "",
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setWorkingId(editingItem.id);
    const response = await fetch("/api/store/returns", {
      method: "PATCH",
      headers: getApiHeaders(),
      body: JSON.stringify({
        id: editingItem.id,
        status: editForm.status,
        adminNote: editForm.adminNote,
        refundAmount: editForm.refundAmount.trim() ? Number(editForm.refundAmount) : null,
      }),
    });
    setWorkingId(null);
    const data = (await response.json()) as { success?: boolean; message?: string };
    if (!response.ok || !data.success) {
      showMessage(data.message ?? "Actualizare eșuată.");
      return;
    }
    setEditingItem(null);
    dispatchStoreUpdate({ scope: "returns" });
    await refreshReturns();
    showMessage("Cerere actualizată.");
  };

  const handleDelete = async (item: ReturnRequest) => {
    if (!window.confirm(`Ștergi cererea de retur ${item.orderCode}?`)) return;
    setWorkingId(item.id);
    const response = await fetch("/api/store/returns", {
      method: "DELETE",
      headers: getApiHeaders(),
      body: JSON.stringify({ id: item.id }),
    });
    setWorkingId(null);
    const data = (await response.json()) as { success?: boolean; message?: string };
    if (!response.ok || !data.success) {
      showMessage(data.message ?? "Ștergere eșuată.");
      return;
    }
    if (viewItem?.id === item.id) setViewItem(null);
    if (editingItem?.id === item.id) setEditingItem(null);
    dispatchStoreUpdate({ scope: "returns" });
    await refreshReturns();
    showMessage("Cerere ștearsă.");
  };

  return (
    <div>
      <AdminHeader
        user={admin}
        title="Returnări"
        subtitle="Cereri de retur și rambursare de la clienți"
      />

      {message && (
        <div className="mb-6 rounded-xl border border-purple-500/30 bg-purple-600/10 px-4 py-3 text-sm text-purple-200">
          {message}
        </div>
      )}

      {returns.length === 0 ? (
        <p className="rounded-xl border border-white/10 bg-novra-card/30 px-5 py-10 text-sm text-gray-400">
          Nu există cereri de retur.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-novra-card/30">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-[10px] uppercase tracking-widest text-gray-500">
                <th className="px-4 py-4 sm:px-6">Comandă</th>
                <th className="px-4 py-4">Client</th>
                <th className="px-4 py-4">Motiv</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Ramburs</th>
                <th className="px-4 py-4 sm:px-6">Data</th>
                <th className="px-4 py-4">Acțiuni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {returns.map((item) => (
                <tr key={item.id} className="text-gray-300">
                  <td className="px-4 py-4 sm:px-6 font-mono text-purple-300">{item.orderCode}</td>
                  <td className="px-4 py-4">
                    <p className="font-medium text-white">{item.userName ?? item.userEmail}</p>
                    <p className="text-xs text-gray-500">{item.userEmail}</p>
                  </td>
                  <td className="px-4 py-4 text-xs">{reasonLabel(item.reason)}</td>
                  <td className="px-4 py-4">
                    <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs">
                      {RETURN_STATUS_LABELS[item.status]}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-xs">
                    {item.refundAmount !== undefined ? `${item.refundAmount} Lei` : "—"}
                  </td>
                  <td className="px-4 py-4 sm:px-6 text-xs text-gray-500">{formatDate(item.createdAt)}</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-1">
                      <button
                        type="button"
                        onClick={() => setViewItem(item)}
                        className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1 text-xs text-gray-300 hover:bg-white/5"
                      >
                        <Eye size={12} />
                        Detalii
                      </button>
                      <button
                        type="button"
                        onClick={() => startEdit(item)}
                        className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1 text-xs text-gray-300 hover:bg-white/5"
                      >
                        <Pencil size={12} />
                        Editează
                      </button>
                      <button
                        type="button"
                        disabled={workingId === item.id}
                        onClick={() => void handleDelete(item)}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-500/20 px-2 py-1 text-xs text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                      >
                        <Trash2 size={12} />
                        Șterge
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {viewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setViewItem(null)} />
          <div className="relative z-10 w-full max-w-lg rounded-2xl border border-white/10 bg-novra-bg-alt p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Detalii retur</h3>
              <button
                type="button"
                onClick={() => setViewItem(null)}
                className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-gray-400"
              >
                <X size={14} />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <p><span className="text-gray-500">Comandă:</span> <span className="font-mono text-purple-300">{viewItem.orderCode}</span></p>
              <p><span className="text-gray-500">Client:</span> {viewItem.userName ?? viewItem.userEmail}</p>
              <p><span className="text-gray-500">Email:</span> {viewItem.userEmail}</p>
              <p><span className="text-gray-500">Motiv:</span> {reasonLabel(viewItem.reason)}</p>
              <p><span className="text-gray-500">Descriere:</span> {viewItem.description}</p>
              <p><span className="text-gray-500">Status:</span> {RETURN_STATUS_LABELS[viewItem.status]}</p>
              <p><span className="text-gray-500">Notă admin:</span> {viewItem.adminNote ?? "—"}</p>
              <p><span className="text-gray-500">Ramburs:</span> {viewItem.refundAmount !== undefined ? `${viewItem.refundAmount} Lei` : "—"}</p>
              <p className="text-xs text-gray-600">Creat: {formatDate(viewItem.createdAt)}</p>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => startEdit(viewItem)}
                className="rounded-xl bg-purple-600 px-4 py-2 text-sm text-white"
              >
                Editează
              </button>
            </div>
          </div>
        </div>
      )}

      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setEditingItem(null)} />
          <form
            onSubmit={(e) => void handleSaveEdit(e)}
            className="relative z-10 w-full max-w-lg rounded-2xl border border-purple-500/20 bg-novra-bg-alt p-5 shadow-2xl"
          >
            <h3 className="mb-4 text-lg font-semibold text-white">Editează cerere retur</h3>
            <p className="mb-4 font-mono text-sm text-purple-300">{editingItem.orderCode}</p>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs text-gray-500">Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value as ReturnStatus }))}
                  className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-2.5 text-sm text-white"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {RETURN_STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">Notă admin</label>
                <input
                  type="text"
                  value={editForm.adminNote}
                  onChange={(e) => setEditForm((p) => ({ ...p, adminNote: e.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-2.5 text-sm"
                  placeholder="Mesaj pentru client"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">Sumă ramburs (Lei)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editForm.refundAmount}
                  onChange={(e) => setEditForm((p) => ({ ...p, refundAmount: e.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-2.5 text-sm"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="submit"
                disabled={workingId === editingItem.id}
                className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                <Save size={16} />
                Salvează
              </button>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-gray-400"
              >
                Anulează
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
