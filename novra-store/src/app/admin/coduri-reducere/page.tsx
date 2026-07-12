"use client";

import { useEffect, useState } from "react";
import { Plus, RefreshCw, Tag, Trash2, Wand2 } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import CopyButton from "@/components/CopyButton";
import { requireAdmin } from "@/lib/auth";
import {
  createDiscountCode,
  deleteDiscountCode,
  formatDiscountOptions,
  formatDiscountValue,
  generateAdminDiscountCode,
  loadDiscountCodes,
  type DiscountCode,
  type DiscountCodeType,
} from "@/lib/discount-codes";
import { subscribeToStoreUpdates } from "@/lib/store";

type FormState = {
  code: string;
  type: DiscountCodeType;
  value: string;
  applyToProducts: boolean;
  freeShipping: boolean;
  maxUses: string;
  expiresAt: string;
  singleUsePerEmail: boolean;
  active: boolean;
};

const defaultForm = (): FormState => ({
  code: "",
  type: "percent",
  value: "",
  applyToProducts: true,
  freeShipping: false,
  maxUses: "",
  expiresAt: "",
  singleUsePerEmail: false,
  active: true,
});

export default function AdminCoduriReducerePage() {
  const admin = requireAdmin();
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [deletingCode, setDeletingCode] = useState<string | null>(null);

  const refresh = async () => {
    const loaded = await loadDiscountCodes();
    setCodes(loaded);
  };

  useEffect(() => {
    let cancelled = false;
    void refresh().then(() => {
      if (cancelled) return;
    });
    const unsubscribe = subscribeToStoreUpdates(() => {
      void refresh();
    }, { scope: "discountCodes" });
    return () => {
      cancelled = true;
      unsubscribe();
    };
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
    });

  const handleGenerateCode = () => {
    const generated = generateAdminDiscountCode(codes.map((c) => c.code));
    setForm((prev) => ({ ...prev, code: generated }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.applyToProducts && !form.freeShipping) {
      showMessage("Selectează cel puțin o opțiune: reducere la produse sau livrare gratuită.");
      return;
    }

    if (form.applyToProducts && !form.value.trim()) {
      showMessage("Introdu valoarea reducerii pentru produse.");
      return;
    }

    setLoading(true);

    const value = form.applyToProducts ? Number(form.value) : 0;
    const maxUses = form.maxUses.trim() ? Number(form.maxUses) : undefined;

    const result = await createDiscountCode({
      code: form.code,
      type: form.type,
      value,
      applyToProducts: form.applyToProducts,
      freeShipping: form.freeShipping,
      maxUses: maxUses && maxUses > 0 ? maxUses : undefined,
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
      singleUsePerEmail: form.singleUsePerEmail,
      active: form.active,
    });

    setLoading(false);

    if (!result.ok) {
      showMessage(result.message);
      return;
    }

    setForm(defaultForm());
    await refresh();
    showMessage(`Cod ${result.code.code} creat cu succes.`);
  };

  const handleDelete = async (code: string) => {
    if (!window.confirm(`Ștergi codul ${code}?`)) return;
    setDeletingCode(code);
    const result = await deleteDiscountCode(code);
    setDeletingCode(null);

    if (!result.ok) {
      showMessage(result.message);
      return;
    }

    await refresh();
    showMessage("Cod șters.");
  };

  const statusLabel = (code: DiscountCode) => {
    if (!code.active) return { text: "Inactiv", className: "bg-gray-500/15 text-gray-400" };
    if (code.expiresAt && new Date(code.expiresAt).getTime() < Date.now()) {
      return { text: "Expirat", className: "bg-amber-500/15 text-amber-300" };
    }
    if (code.maxUses !== undefined && (code.useCount ?? 0) >= code.maxUses) {
      return { text: "Epuizat", className: "bg-gray-500/15 text-gray-400" };
    }
    if (code.used) return { text: "Folosit", className: "bg-gray-500/15 text-gray-400" };
    return { text: "Activ", className: "bg-emerald-500/15 text-emerald-300" };
  };

  const sourceLabel = (source: DiscountCode["source"]) =>
    source === "newsletter" ? "Newsletter" : "Admin";

  return (
    <div>
      <AdminHeader
        user={admin}
        title="Coduri reducere"
        subtitle={`${codes.length} coduri · validare live la checkout`}
      />

      {message && (
        <div className="mb-6 rounded-xl border border-purple-500/30 bg-purple-600/10 px-4 py-3 text-sm text-purple-200">
          {message}
        </div>
      )}

      <form
        onSubmit={handleCreate}
        className="mb-8 rounded-2xl border border-white/10 bg-novra-card/30 p-4 sm:p-6"
      >
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
          <Plus size={16} className="text-purple-400" />
          Cod nou
        </h3>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="sm:col-span-2 lg:col-span-1">
            <label htmlFor="discount-code" className="mb-2 block text-xs uppercase tracking-widest text-gray-500">
              Cod
            </label>
            <div className="flex gap-2">
              <input
                id="discount-code"
                required
                type="text"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="NOVRA-XXXXXX"
                className="min-h-11 flex-1 rounded-xl border border-white/10 bg-novra-surface/70 px-4 py-2.5 font-mono text-sm uppercase focus:border-purple-500/50 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleGenerateCode}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-white/10 px-3 text-xs text-gray-300 hover:bg-white/5"
                title="Generează cod"
              >
                <Wand2 size={14} />
                Auto
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="discount-type" className="mb-2 block text-xs uppercase tracking-widest text-gray-500">
              Tip reducere
            </label>
            <select
              id="discount-type"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as DiscountCodeType })}
              className="min-h-11 w-full rounded-xl border border-white/10 bg-novra-surface/70 px-4 py-2.5 text-sm focus:border-purple-500/50 focus:outline-none"
            >
              <option value="percent">Procent (%)</option>
              <option value="fixed">Sumă fixă (RON)</option>
            </select>
          </div>

          <div>
            <label htmlFor="discount-value" className="mb-2 block text-xs uppercase tracking-widest text-gray-500">
              Valoare {form.type === "percent" ? "(%)" : "(RON)"}
              {!form.applyToProducts && (
                <span className="ml-1 normal-case text-gray-600">(opțional)</span>
              )}
            </label>
            <input
              id="discount-value"
              required={form.applyToProducts}
              type="number"
              min={0.01}
              max={form.type === "percent" ? 100 : undefined}
              step={form.type === "percent" ? 1 : 0.01}
              value={form.value}
              onChange={(e) => setForm({ ...form, value: e.target.value })}
              placeholder={form.type === "percent" ? "15" : "25"}
              disabled={!form.applyToProducts}
              className="min-h-11 w-full rounded-xl border border-white/10 bg-novra-surface/70 px-4 py-2.5 text-sm focus:border-purple-500/50 focus:outline-none disabled:opacity-50"
            />
          </div>

          <div>
            <label htmlFor="discount-max-uses" className="mb-2 block text-xs uppercase tracking-widest text-gray-500">
              Utilizări max (opțional)
            </label>
            <input
              id="discount-max-uses"
              type="number"
              min={1}
              value={form.maxUses}
              onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
              placeholder="Nelimitat"
              className="min-h-11 w-full rounded-xl border border-white/10 bg-novra-surface/70 px-4 py-2.5 text-sm focus:border-purple-500/50 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="discount-expires" className="mb-2 block text-xs uppercase tracking-widest text-gray-500">
              Expiră la (opțional)
            </label>
            <input
              id="discount-expires"
              type="date"
              value={form.expiresAt}
              onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
              className="min-h-11 w-full rounded-xl border border-white/10 bg-novra-surface/70 px-4 py-2.5 text-sm focus:border-purple-500/50 focus:outline-none"
            />
          </div>

          <div className="flex flex-col justify-end gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={form.applyToProducts}
                onChange={(e) => setForm({ ...form, applyToProducts: e.target.checked })}
                className="rounded border-white/20 bg-novra-surface"
              />
              Reducere la produse
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={form.freeShipping}
                onChange={(e) => setForm({ ...form, freeShipping: e.target.checked })}
                className="rounded border-white/20 bg-novra-surface"
              />
              Livrare gratuită (fără cost livrare)
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={form.singleUsePerEmail}
                onChange={(e) => setForm({ ...form, singleUsePerEmail: e.target.checked })}
                className="rounded border-white/20 bg-novra-surface"
              />
              O singură utilizare per email
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
                className="rounded border-white/20 bg-novra-surface"
              />
              Activ
            </label>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={loading || !form.code.trim() || (form.applyToProducts && !form.value) || (!form.applyToProducts && !form.freeShipping)}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:opacity-50"
          >
            <Plus size={16} />
            {loading ? "Se creează..." : "Creează cod"}
          </button>
          <button
            type="button"
            onClick={() => void refresh()}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5"
          >
            <RefreshCw size={16} />
            Reîmprospătează
          </button>
        </div>
      </form>

      {codes.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-novra-card/30 px-4 py-16 text-center sm:px-6">
          <Tag size={32} className="mx-auto mb-4 text-gray-600" />
          <p className="text-gray-500">Niciun cod de reducere încă.</p>
          <p className="mt-2 text-xs text-gray-600">
            Codurile newsletter apar automat; poți crea și coduri manuale mai sus.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-novra-card/30">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-[10px] uppercase tracking-widest text-gray-500">
                <th className="px-4 py-3 sm:px-6">Cod</th>
                <th className="px-4 py-3">Reducere</th>
                <th className="px-4 py-3">Aplicare</th>
                <th className="px-4 py-3">Sursă</th>
                <th className="px-4 py-3">Utilizări</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Creat</th>
                <th className="px-4 py-3 sm:px-6">Acțiuni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {codes.map((code) => {
                const status = statusLabel(code);
                return (
                  <tr key={code.code} className="text-gray-300">
                    <td className="px-4 py-3 sm:px-6">
                      <span className="inline-flex items-center gap-2 font-mono text-purple-300">
                        {code.code}
                        <CopyButton text={code.code} label="Copiază" />
                      </span>
                      {code.email && (
                        <p className="mt-1 text-xs text-gray-500">{code.email}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {code.applyToProducts !== false
                        ? formatDiscountValue(code.type, code.value)
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs">{formatDiscountOptions(code)}</td>
                    <td className="px-4 py-3 text-xs">{sourceLabel(code.source)}</td>
                    <td className="px-4 py-3 text-xs">
                      {code.useCount ?? 0}
                      {code.maxUses !== undefined ? ` / ${code.maxUses}` : ""}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${status.className}`}>
                        {status.text}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {formatDate(code.createdAt)}
                      {code.expiresAt && (
                        <p className="mt-0.5 text-amber-400/80">Exp: {formatDate(code.expiresAt)}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 sm:px-6">
                      {code.source === "admin" && (
                        <button
                          type="button"
                          onClick={() => void handleDelete(code.code)}
                          disabled={deletingCode === code.code}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/20 px-2.5 py-1.5 text-xs text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                        >
                          <Trash2 size={12} />
                          {deletingCode === code.code ? "..." : "Șterge"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
