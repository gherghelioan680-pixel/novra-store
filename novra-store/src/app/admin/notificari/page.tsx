"use client";

import { useEffect, useState } from "react";
import { Bell, Send, RefreshCw, Pencil, Save, Trash2, X } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import { requireAdmin } from "@/lib/auth";
import {
  deletePushNotificationAdmin,
  loadPushNotificationsAdmin,
  sendPushNotificationAdmin,
  updatePushNotificationAdmin,
} from "@/lib/push";
import { createStoreRefreshEffect } from "@/lib/store";
import type { PushNotificationRecord } from "@/lib/push-types";

const STATUS_LABELS: Record<PushNotificationRecord["status"], string> = {
  draft: "Ciornă",
  scheduled: "Programată",
  sent: "Trimisă",
  failed: "Eșuată",
};

export default function AdminNotificariPage() {
  const admin = requireAdmin();
  const [subscribers, setSubscribers] = useState(0);
  const [history, setHistory] = useState<PushNotificationRecord[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [link, setLink] = useState("/promotii");
  const [scheduledAt, setScheduledAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<PushNotificationRecord | null>(null);
  const [editForm, setEditForm] = useState({ title: "", body: "", link: "", scheduledAt: "" });

  const refresh = async () => {
    const data = await loadPushNotificationsAdmin();
    if (data) {
      setSubscribers(data.subscriptions);
      setHistory(data.notifications);
    }
    setLoading(false);
  };

  useEffect(() => {
    return createStoreRefreshEffect(refresh, { scopes: ["push"] });
  }, []);

  if (!admin) return null;

  const showMessage = (text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(""), 4000);
  };

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      setMessage("Completează titlul și mesajul.");
      return;
    }
    setSending(true);
    const result = await sendPushNotificationAdmin({
      title: title.trim(),
      body: body.trim(),
      link: link.trim() || "/",
      scheduledAt: scheduledAt || undefined,
    });
    setSending(false);
    if (result.ok) {
      showMessage(
        scheduledAt
          ? "Notificare programată."
          : `Trimis: ${result.successCount} reușite, ${result.failureCount} eșuate.`
      );
      setTitle("");
      setBody("");
      setScheduledAt("");
      await refresh();
    } else {
      showMessage(result.message);
    }
  };

  const startEdit = (item: PushNotificationRecord) => {
    setEditingItem(item);
    setEditForm({
      title: item.title,
      body: item.body,
      link: item.link,
      scheduledAt: item.scheduledAt ? item.scheduledAt.slice(0, 16) : "",
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setActionId(editingItem.id);
    const result = await updatePushNotificationAdmin(editingItem.id, {
      title: editForm.title.trim(),
      body: editForm.body.trim(),
      link: editForm.link.trim() || "/",
      scheduledAt: editForm.scheduledAt || undefined,
    });
    setActionId(null);
    if (!result.ok) {
      showMessage(result.message);
      return;
    }
    setEditingItem(null);
    await refresh();
    showMessage("Notificare actualizată.");
  };

  const handleDelete = async (item: PushNotificationRecord) => {
    if (!window.confirm(`Ștergi notificarea „${item.title}"?`)) return;
    setActionId(item.id);
    const result = await deletePushNotificationAdmin(item.id);
    setActionId(null);
    showMessage(result.ok ? "Notificare ștearsă." : result.message);
    if (result.ok) await refresh();
  };

  return (
    <div>
      <AdminHeader
        user={admin}
        title="Notificări Push"
        subtitle="Trimite oferte abonaților PWA (necesită VAPID keys)"
      />

      {message && (
        <p className="mb-4 rounded-xl border border-purple-500/30 bg-purple-600/10 px-4 py-3 text-sm text-purple-200">{message}</p>
      )}

      <div className="mb-6 rounded-xl border border-white/10 bg-novra-card/30 px-5 py-4 inline-flex items-center gap-3">
        <Bell size={20} className="text-purple-400" />
        <div>
          <p className="text-2xl font-bold text-white">{subscribers}</p>
          <p className="text-xs text-gray-500">abonați push activi</p>
        </div>
      </div>

      <section className="mb-8 rounded-2xl border border-purple-500/30 bg-novra-card/30 p-5 sm:p-6 max-w-xl">
        <h2 className="text-lg font-semibold text-white mb-4">Compune notificare</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Titlu</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-2.5 text-sm text-white" placeholder="Ofertă NOVRA" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Mesaj</label>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm text-white" placeholder="−20% la toate cablurile!" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Link (la click)</label>
            <input value={link} onChange={(e) => setLink(e.target.value)} className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-2.5 text-sm text-white" placeholder="/promotii" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Programează (opțional)</label>
            <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-2.5 text-sm text-white" />
          </div>
        </div>
        <button
          type="button"
          onClick={() => void handleSend()}
          disabled={sending}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-60"
        >
          <Send size={16} />
          {sending ? "Se trimite..." : scheduledAt ? "Programează" : "Trimite acum"}
        </button>
      </section>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Istoric</h2>
        <button type="button" onClick={() => void refresh()} className="text-sm text-purple-400 flex items-center gap-1">
          <RefreshCw size={14} /> Reîncarcă
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500 text-sm">Se încarcă...</p>
      ) : history.length === 0 ? (
        <p className="text-gray-500 text-sm">Nicio notificare trimisă.</p>
      ) : (
        <div className="space-y-2">
          {history.map((n) => (
            <div key={n.id} className="rounded-xl border border-white/10 bg-novra-card/30 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-white">{n.title}</p>
                  <p className="text-sm text-gray-400 mt-1">{n.body}</p>
                  <p className="text-xs text-gray-500 mt-2">→ {n.link}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <span className={`text-[10px] px-2 py-1 rounded-full ${
                    n.status === "sent" ? "bg-green-500/20 text-green-300" :
                    n.status === "scheduled" ? "bg-yellow-500/20 text-yellow-300" :
                    n.status === "failed" ? "bg-red-500/20 text-red-300" :
                    "bg-gray-500/20 text-gray-400"
                  }`}>
                    {STATUS_LABELS[n.status]}
                  </span>
                  <div className="flex gap-1">
                    {n.status !== "sent" && (
                      <button
                        type="button"
                        onClick={() => startEdit(n)}
                        className="rounded-lg border border-white/10 px-2 py-1 text-xs text-gray-300"
                      >
                        <Pencil size={12} className="inline" />
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={actionId === n.id}
                      onClick={() => void handleDelete(n)}
                      className="rounded-lg border border-red-500/20 px-2 py-1 text-xs text-red-300 disabled:opacity-50"
                    >
                      <Trash2 size={12} className="inline" />
                    </button>
                  </div>
                </div>
              </div>
              {n.sentAt && (
                <p className="text-xs text-gray-500 mt-2">
                  {new Date(n.sentAt).toLocaleString("ro-RO")}
                  {n.successCount !== undefined && ` · ${n.successCount}/${n.recipientCount} trimise`}
                </p>
              )}
              {n.scheduledAt && n.status === "scheduled" && (
                <p className="text-xs text-yellow-400/80 mt-1">
                  Programată: {new Date(n.scheduledAt).toLocaleString("ro-RO")}
                </p>
              )}
            </div>
          ))}
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
              <h3 className="text-lg font-semibold text-white">Editează notificare</h3>
              <button type="button" onClick={() => setEditingItem(null)} className="text-gray-400">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <input
                value={editForm.title}
                onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))}
                className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-2.5 text-sm text-white"
                placeholder="Titlu"
              />
              <textarea
                rows={3}
                value={editForm.body}
                onChange={(e) => setEditForm((p) => ({ ...p, body: e.target.value }))}
                className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm text-white"
                placeholder="Mesaj"
              />
              <input
                value={editForm.link}
                onChange={(e) => setEditForm((p) => ({ ...p, link: e.target.value }))}
                className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-2.5 text-sm text-white"
                placeholder="Link"
              />
              <input
                type="datetime-local"
                value={editForm.scheduledAt}
                onChange={(e) => setEditForm((p) => ({ ...p, scheduledAt: e.target.value }))}
                className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-2.5 text-sm text-white"
              />
            </div>
            <button
              type="submit"
              disabled={actionId === editingItem.id}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              <Save size={16} />
              Salvează
            </button>
          </form>
        </div>
      )}

      <p className="mt-8 text-xs text-gray-500">
        Configurează VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY și NEXT_PUBLIC_VAPID_PUBLIC_KEY în variabilele de mediu.
        Cron: GET /api/cron/push-notifications cu Bearer CRON_SECRET pentru notificări programate.
      </p>
    </div>
  );
}
