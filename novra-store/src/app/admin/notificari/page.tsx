"use client";

import { useEffect, useState } from "react";
import { Bell, Send, RefreshCw } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import { requireAdmin } from "@/lib/auth";
import { loadPushNotificationsAdmin, sendPushNotificationAdmin } from "@/lib/push";
import { createStoreRefreshEffect } from "@/lib/store";
import type { PushNotificationRecord } from "@/lib/push-types";

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
      setMessage(
        scheduledAt
          ? "Notificare programată."
          : `Trimis: ${result.successCount} reușite, ${result.failureCount} eșuate.`
      );
      setTitle("");
      setBody("");
      setScheduledAt("");
      await refresh();
    } else {
      setMessage(result.message);
    }
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
                <span className={`shrink-0 text-[10px] px-2 py-1 rounded-full ${
                  n.status === "sent" ? "bg-green-500/20 text-green-300" :
                  n.status === "scheduled" ? "bg-yellow-500/20 text-yellow-300" :
                  "bg-gray-500/20 text-gray-400"
                }`}>
                  {n.status}
                </span>
              </div>
              {n.sentAt && (
                <p className="text-xs text-gray-500 mt-2">
                  {new Date(n.sentAt).toLocaleString("ro-RO")}
                  {n.successCount !== undefined && ` · ${n.successCount}/${n.recipientCount} trimise`}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="mt-8 text-xs text-gray-500">
        Configurează VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY și NEXT_PUBLIC_VAPID_PUBLIC_KEY în variabilele de mediu.
        Cron: GET /api/cron/push-notifications cu Bearer CRON_SECRET pentru notificări programate.
      </p>
    </div>
  );
}
