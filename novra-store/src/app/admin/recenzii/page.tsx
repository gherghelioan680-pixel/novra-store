"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Save } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import { requireAdmin } from "@/lib/auth";
import {
  loadReviews,
  addReview,
  updateReview,
  deleteReview,
  type Review,
} from "@/lib/reviews";
import { subscribeToStoreUpdates } from "@/lib/store";

export default function AdminRecenziiPage() {
  const admin = requireAdmin();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [newReview, setNewReview] = useState({
    name: "",
    location: "",
    rating: 5,
    comment: "",
    date: new Date().toLocaleDateString("ro-RO", { month: "long", year: "numeric" }),
  });

  const reloadReviews = async () => {
    const data = await loadReviews();
    setReviews(data);
  };

  useEffect(() => {
    let cancelled = false;
    void loadReviews().then((data) => {
      if (cancelled) return;
      setReviews(data);
    });
    const unsubscribe = subscribeToStoreUpdates(() => {
      void loadReviews().then(setReviews);
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  if (!admin) return null;

  const handleAdd = async () => {
    if (!newReview.name.trim() || !newReview.comment.trim()) {
      setMessage("Completează numele și comentariul.");
      return;
    }
    await addReview({
      name: newReview.name.trim(),
      location: newReview.location.trim() || "România",
      rating: newReview.rating,
      comment: newReview.comment.trim(),
      date: newReview.date,
    });
    await reloadReviews();
    setNewReview({
      name: "",
      location: "",
      rating: 5,
      comment: "",
      date: new Date().toLocaleDateString("ro-RO", { month: "long", year: "numeric" }),
    });
    setShowForm(false);
    setMessage("Recenzie adăugată.");
    setTimeout(() => setMessage(""), 3000);
  };

  const handleDelete = async (id: number) => {
    await deleteReview(id);
    await reloadReviews();
    setMessage("Recenzie ștearsă.");
    setTimeout(() => setMessage(""), 3000);
  };

  const handleUpdate = async (id: number, field: keyof Review, value: string | number) => {
    await updateReview(id, { [field]: value });
    await reloadReviews();
  };

  return (
    <div>
      <AdminHeader
        user={admin}
        title="Recenzii"
        subtitle="Gestionează recenziile afișate pe site"
      />

      {message && (
        <div className="mb-6 rounded-xl border border-purple-500/30 bg-purple-600/10 px-4 py-3 text-sm text-purple-200">
          {message}
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-700"
        >
          <Plus size={16} />
          Adaugă recenzie
        </button>
      </div>

      {showForm && (
        <div className="mb-6 rounded-2xl border border-white/10 bg-novra-card/30 p-5 sm:p-6">
          <h3 className="mb-4 font-semibold text-white">Recenzie nouă</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <input
              placeholder="Nume"
              value={newReview.name}
              onChange={(e) => setNewReview({ ...newReview, name: e.target.value })}
              className="rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm outline-none focus:border-purple-500/50"
            />
            <input
              placeholder="Locație (ex: București, RO)"
              value={newReview.location}
              onChange={(e) => setNewReview({ ...newReview, location: e.target.value })}
              className="rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm outline-none focus:border-purple-500/50"
            />
            <select
              value={newReview.rating}
              onChange={(e) => setNewReview({ ...newReview, rating: Number(e.target.value) })}
              className="rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm outline-none focus:border-purple-500/50"
            >
              {[5, 4, 3, 2, 1].map((r) => (
                <option key={r} value={r}>
                  {r} stele
                </option>
              ))}
            </select>
            <input
              placeholder="Data (ex: Iulie 2026)"
              value={newReview.date}
              onChange={(e) => setNewReview({ ...newReview, date: e.target.value })}
              className="rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm outline-none focus:border-purple-500/50"
            />
            <textarea
              placeholder="Comentariu"
              rows={3}
              value={newReview.comment}
              onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
              className="sm:col-span-2 rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm outline-none focus:border-purple-500/50 resize-none"
            />
          </div>
          <button
            type="button"
            onClick={handleAdd}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-700"
          >
            <Save size={16} />
            Salvează recenzia
          </button>
        </div>
      )}

      <div className="space-y-4">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="rounded-2xl border border-white/10 bg-novra-card/30 p-5 sm:p-6"
          >
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1 space-y-2">
                <input
                  value={review.name}
                  onChange={(e) => handleUpdate(review.id, "name", e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-novra-bg/50 px-3 py-2 text-sm font-medium text-white outline-none focus:border-purple-500/50"
                />
                <input
                  value={review.location}
                  onChange={(e) => handleUpdate(review.id, "location", e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-novra-bg/50 px-3 py-2 text-xs text-gray-400 outline-none focus:border-purple-500/50"
                />
              </div>
              <button
                type="button"
                onClick={() => handleDelete(review.id)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300 transition hover:bg-red-500/20"
              >
                <Trash2 size={14} />
                Șterge
              </button>
            </div>
            <textarea
              value={review.comment}
              onChange={(e) => handleUpdate(review.id, "comment", e.target.value)}
              rows={3}
              className="mb-3 w-full rounded-lg border border-white/10 bg-novra-bg/50 px-3 py-2 text-sm text-gray-300 outline-none focus:border-purple-500/50 resize-none"
            />
            <div className="flex flex-wrap gap-3 text-xs text-gray-500">
              <select
                value={review.rating}
                onChange={(e) => handleUpdate(review.id, "rating", Number(e.target.value))}
                className="rounded-lg border border-white/10 bg-novra-bg/50 px-2 py-1 text-white outline-none"
              >
                {[5, 4, 3, 2, 1].map((r) => (
                  <option key={r} value={r}>
                    {r} ★
                  </option>
                ))}
              </select>
              <input
                value={review.date}
                onChange={(e) => handleUpdate(review.id, "date", e.target.value)}
                className="rounded-lg border border-white/10 bg-novra-bg/50 px-2 py-1 text-white outline-none"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
