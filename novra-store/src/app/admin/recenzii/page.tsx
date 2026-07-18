"use client";

import { useEffect, useState } from "react";
import { Check, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import { requireAdmin } from "@/lib/auth";
import { getApiHeaders } from "@/lib/api-client";
import { REVIEW_STATUS_LABELS, type Review, type ReviewStatus } from "@/lib/reviews";
import { createStoreRefreshEffect, dispatchStoreUpdate } from "@/lib/store";

const STATUS_OPTIONS: ReviewStatus[] = ["pending", "approved", "rejected"];

type EditForm = {
  name: string;
  email: string;
  location: string;
  rating: number;
  title: string;
  comment: string;
  product: string;
  date: string;
  status: ReviewStatus;
};

const emptyEditForm = (): EditForm => ({
  name: "",
  email: "",
  location: "România",
  rating: 5,
  title: "",
  comment: "",
  product: "",
  date: new Date().toLocaleDateString("ro-RO", { month: "long", year: "numeric" }),
  status: "approved",
});

function statusBadgeClass(status: ReviewStatus): string {
  if (status === "approved") return "bg-green-500/10 text-green-300 border-green-500/20";
  if (status === "rejected") return "bg-red-500/10 text-red-300 border-red-500/20";
  return "bg-yellow-500/10 text-yellow-300 border-yellow-500/20";
}

export default function AdminRecenziiPage() {
  const admin = requireAdmin();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [message, setMessage] = useState("");
  const [workingId, setWorkingId] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<Review | null>(null);
  const [editForm, setEditForm] = useState<EditForm>(emptyEditForm());
  const [showAddForm, setShowAddForm] = useState(false);

  const refreshReviews = async () => {
    const response = await fetch("/api/store/reviews", { headers: getApiHeaders() });
    if (!response.ok) return;
    const data = (await response.json()) as { reviews?: Review[] };
    setReviews(data.reviews ?? []);
  };

  useEffect(() => {
    return createStoreRefreshEffect(refreshReviews, { scopes: ["reviews"] });
  }, []);

  if (!admin) return null;

  const showMessage = (text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(""), 4000);
  };

  const formatDate = (iso?: string) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("ro-RO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const startEdit = (item: Review) => {
    setEditingItem(item);
    setShowAddForm(false);
    setEditForm({
      name: item.name,
      email: item.email ?? "",
      location: item.location,
      rating: item.rating,
      title: item.title ?? "",
      comment: item.comment,
      product: item.product ?? "",
      date: item.date,
      status: item.status,
    });
  };

  const startAdd = () => {
    setEditingItem(null);
    setShowAddForm(true);
    setEditForm(emptyEditForm());
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    if (!editForm.name.trim() || !editForm.comment.trim()) {
      showMessage("Completează numele și comentariul.");
      return;
    }

    setWorkingId(editingItem.id);
    const response = await fetch("/api/store/reviews", {
      method: "PATCH",
      headers: getApiHeaders(),
      body: JSON.stringify({
        id: editingItem.id,
        name: editForm.name,
        email: editForm.email,
        location: editForm.location,
        rating: editForm.rating,
        title: editForm.title,
        comment: editForm.comment,
        product: editForm.product,
        date: editForm.date,
        status: editForm.status,
      }),
    });
    setWorkingId(null);

    const data = (await response.json()) as { success?: boolean; message?: string };
    if (!response.ok || !data.success) {
      showMessage(data.message ?? "Actualizare eșuată.");
      return;
    }

    setEditingItem(null);
    dispatchStoreUpdate({ scope: "reviews" });
    await refreshReviews();
    showMessage("Recenzie actualizată.");
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editForm.name.trim() || !editForm.comment.trim()) {
      showMessage("Completează numele și comentariul.");
      return;
    }

    setWorkingId(-1);
    const current = await fetch("/api/store/reviews", { headers: getApiHeaders() });
    const currentData = (await current.json()) as { reviews?: Review[] };
    const existing = currentData.reviews ?? [];
    const nextId = existing.reduce((max, item) => Math.max(max, item.id), 0) + 1;
    const newReview: Review = {
      id: nextId,
      name: editForm.name.trim(),
      email: editForm.email.trim() || undefined,
      location: editForm.location.trim() || "România",
      rating: editForm.rating,
      title: editForm.title.trim() || undefined,
      comment: editForm.comment.trim(),
      product: editForm.product.trim() || undefined,
      date: editForm.date.trim(),
      status: editForm.status,
      createdAt: new Date().toISOString(),
      publishedAt: editForm.status === "approved" ? new Date().toISOString() : undefined,
    };

    const response = await fetch("/api/store/reviews", {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify({ reviews: [newReview, ...existing] }),
    });
    setWorkingId(null);

    if (!response.ok) {
      showMessage("Adăugare eșuată.");
      return;
    }

    setShowAddForm(false);
    setEditForm(emptyEditForm());
    dispatchStoreUpdate({ scope: "reviews" });
    await refreshReviews();
    showMessage("Recenzie adăugată.");
  };

  const handleApprove = async (item: Review) => {
    setWorkingId(item.id);
    const response = await fetch("/api/store/reviews", {
      method: "PATCH",
      headers: getApiHeaders(),
      body: JSON.stringify({ id: item.id, status: "approved" }),
    });
    setWorkingId(null);

    const data = (await response.json()) as { success?: boolean; message?: string };
    if (!response.ok || !data.success) {
      showMessage(data.message ?? "Aprobare eșuată.");
      return;
    }

    dispatchStoreUpdate({ scope: "reviews" });
    await refreshReviews();
    showMessage("Recenzie aprobată.");
  };

  const handleDelete = async (item: Review) => {
    if (!window.confirm(`Ștergi recenzia de la ${item.name}?`)) return;

    setWorkingId(item.id);
    const response = await fetch("/api/store/reviews", {
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

    if (editingItem?.id === item.id) setEditingItem(null);
    dispatchStoreUpdate({ scope: "reviews" });
    await refreshReviews();
    showMessage("Recenzie ștearsă.");
  };

  const pendingCount = reviews.filter((r) => r.status === "pending").length;

  return (
    <div>
      <AdminHeader
        user={admin}
        title="Recenzii"
        subtitle="Moderează recenziile trimise de clienți și publică pe site"
      />

      {message && (
        <div className="mb-6 rounded-xl border border-purple-500/30 bg-purple-600/10 px-4 py-3 text-sm text-purple-200">
          {message}
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={startAdd}
          className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-700"
        >
          <Plus size={16} />
          Adaugă recenzie
        </button>
        {pendingCount > 0 && (
          <span className="rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-xs text-yellow-200">
            {pendingCount} în așteptare
          </span>
        )}
      </div>

      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowAddForm(false)} />
          <form
            onSubmit={(e) => void handleAdd(e)}
            className="relative z-10 w-full max-w-lg rounded-2xl border border-purple-500/20 bg-novra-bg-alt p-5 shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Recenzie nouă</h3>
              <button type="button" onClick={() => setShowAddForm(false)} className="text-gray-400">
                <X size={16} />
              </button>
            </div>
            <ReviewFormFields editForm={editForm} setEditForm={setEditForm} />
            <div className="mt-4 flex gap-2">
              <button
                type="submit"
                disabled={workingId === -1}
                className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                <Save size={16} />
                Salvează
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-gray-400"
              >
                Anulează
              </button>
            </div>
          </form>
        </div>
      )}

      {reviews.length === 0 ? (
        <p className="rounded-xl border border-white/10 bg-novra-card/30 px-5 py-10 text-sm text-gray-400">
          Nu există recenzii.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-novra-card/30">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-[10px] uppercase tracking-widest text-gray-500">
                <th className="px-4 py-4 sm:px-6">Client</th>
                <th className="px-4 py-4">Rating</th>
                <th className="px-4 py-4">Recenzie</th>
                <th className="px-4 py-4">Produs</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4 sm:px-6">Data</th>
                <th className="px-4 py-4">Acțiuni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {reviews.map((item) => (
                <tr key={item.id} className="text-gray-300">
                  <td className="px-4 py-4 sm:px-6">
                    <p className="font-medium text-white">{item.name}</p>
                    {item.email && <p className="text-xs text-gray-500">{item.email}</p>}
                    <p className="text-xs text-gray-600">{item.location}</p>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-yellow-400">{item.rating} ★</span>
                  </td>
                  <td className="px-4 py-4 max-w-xs">
                    {item.title && <p className="mb-1 text-xs font-medium text-purple-300">{item.title}</p>}
                    <p className="line-clamp-3 text-xs">{item.comment}</p>
                  </td>
                  <td className="px-4 py-4 text-xs">{item.product ?? "—"}</td>
                  <td className="px-4 py-4">
                    <span className={`rounded-full border px-2 py-0.5 text-xs ${statusBadgeClass(item.status)}`}>
                      {REVIEW_STATUS_LABELS[item.status]}
                    </span>
                  </td>
                  <td className="px-4 py-4 sm:px-6 text-xs text-gray-500">
                    <p>{item.date}</p>
                    {item.createdAt && <p className="text-[10px] text-gray-600">{formatDate(item.createdAt)}</p>}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-1">
                      {item.status === "pending" && (
                        <button
                          type="button"
                          disabled={workingId === item.id}
                          onClick={() => void handleApprove(item)}
                          className="inline-flex items-center gap-1 rounded-lg border border-green-500/20 px-2 py-1 text-xs text-green-300 hover:bg-green-500/10 disabled:opacity-50"
                        >
                          <Check size={12} />
                          Aprobă
                        </button>
                      )}
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

      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setEditingItem(null)} />
          <form
            onSubmit={(e) => void handleSaveEdit(e)}
            className="relative z-10 w-full max-w-lg rounded-2xl border border-purple-500/20 bg-novra-bg-alt p-5 shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Editează recenzie</h3>
              <button type="button" onClick={() => setEditingItem(null)} className="text-gray-400">
                <X size={16} />
              </button>
            </div>
            <ReviewFormFields editForm={editForm} setEditForm={setEditForm} />
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

function ReviewFormFields({
  editForm,
  setEditForm,
}: {
  editForm: EditForm;
  setEditForm: React.Dispatch<React.SetStateAction<EditForm>>;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs text-gray-500">Nume</label>
          <input
            type="text"
            value={editForm.name}
            onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
            className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-2.5 text-sm text-white"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">Email</label>
          <input
            type="email"
            value={editForm.email}
            onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
            className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-2.5 text-sm text-white"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs text-gray-500">Locație</label>
          <input
            type="text"
            value={editForm.location}
            onChange={(e) => setEditForm((p) => ({ ...p, location: e.target.value }))}
            className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-2.5 text-sm text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">Rating</label>
          <select
            value={editForm.rating}
            onChange={(e) => setEditForm((p) => ({ ...p, rating: Number(e.target.value) }))}
            className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-2.5 text-sm text-white"
          >
            {[5, 4, 3, 2, 1].map((r) => (
              <option key={r} value={r}>
                {r} stele
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs text-gray-500">Titlu (opțional)</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))}
          className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-2.5 text-sm text-white"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-gray-500">Produs (opțional)</label>
        <input
          type="text"
          value={editForm.product}
          onChange={(e) => setEditForm((p) => ({ ...p, product: e.target.value }))}
          className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-2.5 text-sm text-white"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-gray-500">Recenzie</label>
        <textarea
          rows={4}
          value={editForm.comment}
          onChange={(e) => setEditForm((p) => ({ ...p, comment: e.target.value }))}
          className="w-full resize-none rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-2.5 text-sm text-white"
          required
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs text-gray-500">Data afișată</label>
          <input
            type="text"
            value={editForm.date}
            onChange={(e) => setEditForm((p) => ({ ...p, date: e.target.value }))}
            className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-2.5 text-sm text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">Status</label>
          <select
            value={editForm.status}
            onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value as ReviewStatus }))}
            className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-2.5 text-sm text-white"
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {REVIEW_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
