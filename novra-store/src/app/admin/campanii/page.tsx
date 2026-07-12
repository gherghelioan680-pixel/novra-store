"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Trash2,
  Save,
  Megaphone,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import { requireAdmin } from "@/lib/auth";
import {
  deleteCampaignAdmin,
  loadCampaigns,
  saveCampaignAdmin,
} from "@/lib/campaigns";
import { createStoreRefreshEffect } from "@/lib/store";
import {
  CAMPAIGN_THEME_STYLES,
  isCampaignCurrentlyActive,
  type CampaignTheme,
  type LandingCampaign,
} from "@/lib/campaigns-types";

const THEMES = Object.keys(CAMPAIGN_THEME_STYLES) as CampaignTheme[];

const emptyForm = (): Partial<LandingCampaign> & { slug: string } => ({
  slug: "",
  title: "",
  subtitle: "",
  heroText: "",
  discountPercent: 10,
  startDate: new Date().toISOString(),
  endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  active: false,
  theme: "purple",
  ctaText: "Vezi ofertele",
  ctaLink: "/produse",
});

function toDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AdminCampaniiPage() {
  const admin = requireAdmin();
  const [campaigns, setCampaigns] = useState<LandingCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState<(Partial<LandingCampaign> & { slug: string }) | null>(null);
  const [saving, setSaving] = useState(false);

  const refresh = async () => {
    setCampaigns(await loadCampaigns());
    setLoading(false);
  };

  useEffect(() => {
    return createStoreRefreshEffect(refresh, { scopes: ["campaigns"] });
  }, []);

  if (!admin) return null;

  const handleSave = async () => {
    if (!editing?.slug || !editing.title) {
      setMessage("Completează slug-ul și titlul.");
      return;
    }
    setSaving(true);
    const result = await saveCampaignAdmin(editing);
    setSaving(false);
    if (result.ok) {
      setMessage("Campanie salvată.");
      setEditing(null);
      await refresh();
    } else {
      setMessage(result.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Ștergi această campanie?")) return;
    const result = await deleteCampaignAdmin(id);
    setMessage(result.ok ? "Campanie ștearsă." : result.message);
    if (result.ok) await refresh();
  };

  return (
    <div>
      <AdminHeader
        user={admin}
        title="Campanii"
        subtitle="Landing pages promoționale — Black Friday, Valentine's, Flash Sale"
      />

      {message && (
        <p className="mb-4 rounded-xl border border-purple-500/30 bg-purple-600/10 px-4 py-3 text-sm text-purple-200">
          {message}
        </p>
      )}

      <div className="mb-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setEditing(emptyForm())}
          className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-700"
        >
          <Plus size={16} />
          Campanie nouă
        </button>
        <button
          type="button"
          onClick={() => void refresh()}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-gray-300 hover:text-white"
        >
          <RefreshCw size={16} />
          Reîncarcă
        </button>
      </div>

      {editing && (
        <section className="mb-8 rounded-2xl border border-purple-500/30 bg-novra-card/30 p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            {editing.id ? "Editează campanie" : "Campanie nouă"}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Slug (URL)" value={editing.slug} onChange={(v) => setEditing({ ...editing, slug: v })} />
            <Field label="Titlu" value={editing.title ?? ""} onChange={(v) => setEditing({ ...editing, title: v })} />
            <Field label="Subtitlu" value={editing.subtitle ?? ""} onChange={(v) => setEditing({ ...editing, subtitle: v })} />
            <Field
              label="Reducere %"
              type="number"
              value={String(editing.discountPercent ?? 0)}
              onChange={(v) => setEditing({ ...editing, discountPercent: Number(v) })}
            />
            <div className="sm:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Text hero</label>
              <textarea
                value={editing.heroText ?? ""}
                onChange={(e) => setEditing({ ...editing, heroText: e.target.value })}
                rows={3}
                className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Data start</label>
              <input
                type="datetime-local"
                value={toDatetimeLocal(editing.startDate ?? "")}
                onChange={(e) => setEditing({ ...editing, startDate: new Date(e.target.value).toISOString() })}
                className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-2.5 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Data sfârșit</label>
              <input
                type="datetime-local"
                value={toDatetimeLocal(editing.endDate ?? "")}
                onChange={(e) => setEditing({ ...editing, endDate: new Date(e.target.value).toISOString() })}
                className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-2.5 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Temă</label>
              <select
                value={editing.theme ?? "purple"}
                onChange={(e) => setEditing({ ...editing, theme: e.target.value as CampaignTheme })}
                className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-2.5 text-sm text-white"
              >
                {THEMES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <Field label="CTA text" value={editing.ctaText ?? ""} onChange={(v) => setEditing({ ...editing, ctaText: v })} />
            <Field label="CTA link" value={editing.ctaLink ?? ""} onChange={(v) => setEditing({ ...editing, ctaLink: v })} />
            <label className="flex items-center gap-3 sm:col-span-2">
              <input
                type="checkbox"
                checked={editing.active ?? false}
                onChange={(e) => setEditing({ ...editing, active: e.target.checked })}
                className="h-4 w-4 rounded"
              />
              <span className="text-sm text-gray-300">Campanie activă</span>
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-60"
            >
              <Save size={16} />
              {saving ? "Se salvează..." : "Salvează"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="rounded-xl border border-white/10 px-5 py-2.5 text-sm text-gray-400"
            >
              Anulează
            </button>
          </div>
        </section>
      )}

      {loading ? (
        <p className="text-gray-500 text-sm">Se încarcă...</p>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => (
            <div
              key={c.id}
              className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-novra-card/30 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Megaphone size={16} className="text-purple-400 shrink-0" />
                  <p className="font-medium text-white">{c.title}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${isCampaignCurrentlyActive(c) ? "bg-green-500/20 text-green-300" : c.active ? "bg-yellow-500/20 text-yellow-300" : "bg-gray-500/20 text-gray-400"}`}>
                    {isCampaignCurrentlyActive(c) ? "Live" : c.active ? "Programată" : "Inactivă"}
                  </span>
                  <span className="text-xs text-purple-300">−{c.discountPercent}%</span>
                </div>
                <p className="mt-1 text-xs text-gray-500 font-mono">/campanii/{c.slug}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <a
                  href={`/campanii/${c.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-xs text-gray-300 hover:text-white"
                >
                  <ExternalLink size={14} />
                  Vezi
                </a>
                <button
                  type="button"
                  onClick={() => setEditing({ ...c })}
                  className="rounded-lg border border-white/10 px-3 py-2 text-xs text-gray-300 hover:text-white"
                >
                  Editează
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(c.id)}
                  className="rounded-lg border border-red-500/30 px-3 py-2 text-xs text-red-300 hover:bg-red-500/10"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-2.5 text-sm text-white"
      />
    </div>
  );
}
