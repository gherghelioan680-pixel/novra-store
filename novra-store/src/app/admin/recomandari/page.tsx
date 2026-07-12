"use client";

import { useEffect, useState } from "react";
import { Users, Gift, Save, RefreshCw } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import { requireAdmin } from "@/lib/auth";
import { loadReferralsAdmin, saveReferralSettingsAdmin } from "@/lib/referrals";
import { createStoreRefreshEffect } from "@/lib/store";
import { DEFAULT_REFERRAL_SETTINGS, type FriendReferral, type ReferralSettings } from "@/lib/referrals-types";

export default function AdminRecomandariPage() {
  const admin = requireAdmin();
  const [referrals, setReferrals] = useState<FriendReferral[]>([]);
  const [settings, setSettings] = useState<ReferralSettings>(DEFAULT_REFERRAL_SETTINGS);
  const [stats, setStats] = useState({ total: 0, registered: 0, converted: 0, pendingRewards: 0 });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const refresh = async () => {
    const data = await loadReferralsAdmin();
    if (data) {
      setReferrals(data.referrals);
      setSettings(data.settings);
      setStats(data.stats);
    }
    setLoading(false);
  };

  useEffect(() => {
    return createStoreRefreshEffect(refresh, { scopes: ["referrals"] });
  }, []);

  if (!admin) return null;

  const handleSaveSettings = async () => {
    setSaving(true);
    const result = await saveReferralSettingsAdmin(settings);
    setSaving(false);
    setMessage(result.ok ? "Setări salvate." : result.message);
  };

  return (
    <div>
      <AdminHeader
        user={admin}
        title="Recomandări prieteni"
        subtitle="Program separat de afiliere — recompense pentru invitații"
      />

      {message && (
        <p className="mb-4 rounded-xl border border-purple-500/30 bg-purple-600/10 px-4 py-3 text-sm text-purple-200">{message}</p>
      )}

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total invitații" value={stats.total} />
        <Stat label="Înregistrați" value={stats.registered} />
        <Stat label="Prima comandă" value={stats.converted} />
        <Stat label="Recompense pending" value={stats.pendingRewards} />
      </div>

      <section className="mb-8 rounded-2xl border border-white/10 bg-novra-card/30 p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Gift size={18} className="text-purple-400" />
          Setări recompense
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 max-w-xl">
          <label className="flex items-center gap-3 sm:col-span-2">
            <input type="checkbox" checked={settings.enabled} onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })} className="h-4 w-4 rounded" />
            <span className="text-sm text-gray-300">Program activ</span>
          </label>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Tip recompensă</label>
            <select
              value={settings.rewardType}
              onChange={(e) => setSettings({ ...settings, rewardType: e.target.value as ReferralSettings["rewardType"] })}
              className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-2.5 text-sm text-white"
            >
              <option value="credits">NovraCredits (RON)</option>
              <option value="coupon_percent">Cupon % reducere</option>
            </select>
          </div>
          <div />
          <div>
            <label className="block text-xs text-gray-500 mb-1">Recompensă recomandator</label>
            <input
              type="number"
              value={settings.referrerReward}
              onChange={(e) => setSettings({ ...settings, referrerReward: Number(e.target.value) })}
              className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-2.5 text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Recompensă invitat</label>
            <input
              type="number"
              value={settings.refereeReward}
              onChange={(e) => setSettings({ ...settings, refereeReward: Number(e.target.value) })}
              className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-2.5 text-sm text-white"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={() => void handleSaveSettings()}
          disabled={saving}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          <Save size={16} />
          {saving ? "Se salvează..." : "Salvează setări"}
        </button>
      </section>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Users size={18} className="text-purple-400" />
          Referințe ({referrals.length})
        </h2>
        <button type="button" onClick={() => void refresh()} className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1">
          <RefreshCw size={14} /> Reîncarcă
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500 text-sm">Se încarcă...</p>
      ) : referrals.length === 0 ? (
        <p className="text-gray-500 text-sm py-8 text-center">Nicio recomandare încă.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-[10px] uppercase tracking-widest text-gray-500">
                <th className="p-3">Cod</th>
                <th className="p-3">Recomandator</th>
                <th className="p-3">Invitat</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {referrals.map((r) => (
                <tr key={r.id} className="text-gray-300">
                  <td className="p-3 font-mono text-xs text-purple-300">{r.referralCode}</td>
                  <td className="p-3">{r.referrerEmail}</td>
                  <td className="p-3">{r.refereeEmail ?? "—"}</td>
                  <td className="p-3">
                    {r.firstOrderId ? (
                      <span className="text-green-300 text-xs">Comandă #{r.firstOrderId.slice(-6)}</span>
                    ) : r.registeredAt ? (
                      <span className="text-yellow-300 text-xs">Înregistrat</span>
                    ) : (
                      <span className="text-gray-500 text-xs">Link accesat</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-novra-card/30 px-4 py-3 text-center">
      <p className="text-2xl font-bold text-purple-300">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}
